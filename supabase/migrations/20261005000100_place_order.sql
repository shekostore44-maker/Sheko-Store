-- =============================================================
-- Order placement (phase 5).
-- place_order() validates stock, prices the order from the database,
-- saves it and decrements stock in ONE transaction. Only the server
-- (secret key / service_role) may call it.
-- =============================================================

-- Lets a guest open their own confirmation page without an account.
alter table public.orders
  add column if not exists public_token uuid not null default gen_random_uuid();
create unique index if not exists orders_public_token_idx on public.orders (public_token);

create or replace function public.place_order(p_order jsonb)
returns table (order_id uuid, order_number text, public_token uuid, total numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gov public.governorates%rowtype;
  v_city public.cities%rowtype;
  v_item record;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_price numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_lines jsonb := '[]'::jsonb;
  v_order public.orders%rowtype;
  v_line jsonb;
begin
  -- Governorate and city must be active, and the city must belong to it.
  select * into v_gov from public.governorates
  where id = (p_order ->> 'governorate_id')::int and is_active;
  if not found then
    raise exception 'GOVERNORATE_UNAVAILABLE';
  end if;

  select * into v_city from public.cities
  where id = (p_order ->> 'city_id')::int and governorate_id = v_gov.id and is_active;
  if not found then
    raise exception 'CITY_UNAVAILABLE';
  end if;

  if jsonb_array_length(coalesce(p_order -> 'items', '[]'::jsonb)) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  -- Merge duplicate lines, then lock products in a stable order (avoids deadlocks).
  for v_item in
    select (i ->> 'product_id')::uuid as product_id,
           nullif(i ->> 'variant_id', '')::uuid as variant_id,
           sum((i ->> 'quantity')::int)::int as quantity
    from jsonb_array_elements(p_order -> 'items') as i
    group by 1, 2
    order by 1, 2
  loop
    if v_item.quantity < 1 or v_item.quantity > 50 then
      raise exception 'INVALID_QUANTITY';
    end if;

    select * into v_product from public.products
    where id = v_item.product_id and is_active
    for update;
    if not found then
      raise exception 'PRODUCT_UNAVAILABLE:%', v_item.product_id;
    end if;

    if v_item.variant_id is not null then
      select * into v_variant from public.product_variants
      where id = v_item.variant_id and product_id = v_product.id and is_active
      for update;
      if not found then
        raise exception 'PRODUCT_UNAVAILABLE:%', v_product.name;
      end if;
      if v_variant.stock < v_item.quantity then
        raise exception 'OUT_OF_STOCK:% (%)', v_product.name, v_variant.name;
      end if;
      v_price := coalesce(v_variant.price, v_product.price);
    else
      -- A product with variants must be ordered as a specific variant.
      if exists (select 1 from public.product_variants
                 where product_id = v_product.id and is_active) then
        raise exception 'VARIANT_REQUIRED:%', v_product.name;
      end if;
      if v_product.stock < v_item.quantity then
        raise exception 'OUT_OF_STOCK:%', v_product.name;
      end if;
      v_price := v_product.price;
    end if;

    v_subtotal := v_subtotal + v_price * v_item.quantity;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'variant_id', v_item.variant_id,
      'product_name', v_product.name,
      'product_slug', v_product.slug,
      'variant_name', case when v_item.variant_id is null then null else v_variant.name end,
      'unit_price', v_price,
      'quantity', v_item.quantity
    );
  end loop;

  insert into public.orders (
    user_id, customer_name, phone, governorate_id, city_id,
    governorate_name, city_name, address, notes,
    subtotal, shipping_fee, discount, total, payment_method
  ) values (
    nullif(p_order ->> 'user_id', '')::uuid,
    p_order ->> 'customer_name',
    p_order ->> 'phone',
    v_gov.id, v_city.id, v_gov.name, v_city.name,
    p_order ->> 'address',
    nullif(p_order ->> 'notes', ''),
    v_subtotal, v_gov.shipping_fee, 0, v_subtotal + v_gov.shipping_fee, 'cod'
  )
  returning * into v_order;

  for v_line in select * from jsonb_array_elements(v_lines) loop
    insert into public.order_items (
      order_id, product_id, variant_id, product_name, product_slug,
      variant_name, unit_price, quantity, line_total
    ) values (
      v_order.id,
      (v_line ->> 'product_id')::uuid,
      nullif(v_line ->> 'variant_id', '')::uuid,
      v_line ->> 'product_name',
      v_line ->> 'product_slug',
      v_line ->> 'variant_name',
      (v_line ->> 'unit_price')::numeric,
      (v_line ->> 'quantity')::int,
      (v_line ->> 'unit_price')::numeric * (v_line ->> 'quantity')::int
    );

    if v_line ->> 'variant_id' is not null then
      update public.product_variants
      set stock = stock - (v_line ->> 'quantity')::int
      where id = (v_line ->> 'variant_id')::uuid;
      -- Product stock mirrors the sum of its active variants.
      update public.products p
      set stock = (select coalesce(sum(v.stock), 0) from public.product_variants v
                   where v.product_id = p.id and v.is_active)
      where p.id = (v_line ->> 'product_id')::uuid;
    else
      update public.products
      set stock = stock - (v_line ->> 'quantity')::int
      where id = (v_line ->> 'product_id')::uuid;
    end if;
  end loop;

  return query select v_order.id, v_order.order_number, v_order.public_token, v_order.total;
end;
$$;

-- Server only: browsers (anon/authenticated) can never call it directly.
revoke all on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;

-- =============================================================
-- Order status changes (admin only). Cancelling an order returns its
-- items to stock; restoring a cancelled order takes them again.
-- =============================================================
create or replace function public.set_order_status(p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old text;
  v_line record;
  v_sign int;
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED';
  end if;
  if p_status not in ('new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') then
    raise exception 'INVALID_STATUS';
  end if;

  select status into v_old from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_old = p_status then
    return;
  end if;

  if (p_status = 'cancelled') <> (v_old = 'cancelled') then
    v_sign := case when p_status = 'cancelled' then 1 else -1 end;
    for v_line in
      select product_id, variant_id, quantity from public.order_items
      where order_id = p_order_id
        and product_id is not null
        -- Skip lines whose variant was deleted since the order.
        and not (variant_id is null and variant_name is not null)
      order by product_id, variant_id
    loop
      if v_line.variant_id is not null then
        update public.product_variants
        set stock = stock + v_sign * v_line.quantity
        where id = v_line.variant_id;
        update public.products p
        set stock = (select coalesce(sum(v.stock), 0) from public.product_variants v
                     where v.product_id = p.id and v.is_active)
        where p.id = v_line.product_id;
      else
        update public.products
        set stock = stock + v_sign * v_line.quantity
        where id = v_line.product_id;
      end if;
    end loop;
  end if;

  update public.orders set status = p_status where id = p_order_id;
end;
$$;

revoke all on function public.set_order_status(uuid, text) from public, anon;
grant execute on function public.set_order_status(uuid, text) to authenticated;
