-- =============================================================
-- Customer accounts (phase 6).
-- Reviews: only customers who received the product may review it.
-- =============================================================

-- True when the signed-in customer has a delivered order with this product.
create or replace function public.can_review(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orders o
    join public.order_items i on i.order_id = o.id
    where o.user_id = (select auth.uid())
      and o.status = 'delivered'
      and i.product_id = p_product_id
  );
$$;

revoke all on function public.can_review(uuid) from public, anon;
grant execute on function public.can_review(uuid) to authenticated;

drop policy if exists "reviews: write own pending" on public.reviews;
create policy "reviews: write own pending"
  on public.reviews for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and not is_approved
    and public.can_review(product_id)
  );

-- A customer may withdraw their own review.
drop policy if exists "reviews: delete own" on public.reviews;
create policy "reviews: delete own"
  on public.reviews for delete to authenticated
  using (user_id = (select auth.uid()));

-- Reviewer names are shown on product pages without exposing profiles.
alter table public.reviews
  add column if not exists author_name text;

create index if not exists reviews_product_approved_idx
  on public.reviews (product_id) where is_approved;
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists addresses_user_id_idx on public.addresses (user_id);
