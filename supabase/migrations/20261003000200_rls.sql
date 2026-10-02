-- =============================================================
-- Row Level Security: who can read and write what.
-- Orders are created only by the server (secret key, bypasses RLS)
-- so prices and shipping are always calculated server-side.
-- =============================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.governorates enable row level security;
alter table public.cities enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.coupons enable row level security;
alter table public.banners enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;
alter table public.notifications enable row level security;
alter table public.settings enable row level security;

-- -------------------------------------------------------------
-- Profiles: users see and edit their own; admins see all.
-- Column grants stop users from changing their own role.
-- -------------------------------------------------------------
create policy "profiles: read own or admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: admin update"
  on public.profiles for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- -------------------------------------------------------------
-- Public catalog: visitors read active rows; admins manage all.
-- -------------------------------------------------------------
create policy "categories: public read active"
  on public.categories for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "categories: admin write"
  on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products: public read active"
  on public.products for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "products: admin write"
  on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "product_images: public read"
  on public.product_images for select to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and p.is_active)
    or (select public.is_admin())
  );
create policy "product_images: admin write"
  on public.product_images for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "product_variants: public read active"
  on public.product_variants for select to anon, authenticated
  using (
    (is_active and exists (select 1 from public.products p where p.id = product_id and p.is_active))
    or (select public.is_admin())
  );
create policy "product_variants: admin write"
  on public.product_variants for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "governorates: public read active"
  on public.governorates for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "governorates: admin write"
  on public.governorates for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "cities: public read active"
  on public.cities for select to anon, authenticated
  using (
    (is_active and exists (select 1 from public.governorates g where g.id = governorate_id and g.is_active))
    or (select public.is_admin())
  );
create policy "cities: admin write"
  on public.cities for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "banners: public read active"
  on public.banners for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "banners: admin write"
  on public.banners for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- -------------------------------------------------------------
-- Customer-owned data
-- -------------------------------------------------------------
create policy "addresses: own"
  on public.addresses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "wishlist: own"
  on public.wishlist for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "reviews: public read approved"
  on public.reviews for select to anon, authenticated
  using (is_approved or user_id = (select auth.uid()) or (select public.is_admin()));
create policy "reviews: write own pending"
  on public.reviews for insert to authenticated
  with check (user_id = (select auth.uid()) and not is_approved);
create policy "reviews: admin manage"
  on public.reviews for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- -------------------------------------------------------------
-- Orders: customers read their own; admins read and update.
-- No insert policy: orders are created by the server only.
-- -------------------------------------------------------------
create policy "orders: read own or admin"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "orders: admin update"
  on public.orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "orders: admin delete"
  on public.orders for delete to authenticated
  using ((select public.is_admin()));

create policy "order_items: read own or admin"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

-- -------------------------------------------------------------
-- Admin-only data
-- -------------------------------------------------------------
create policy "coupons: admin only"
  on public.coupons for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "notifications: admin only"
  on public.notifications for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "settings: public read public keys"
  on public.settings for select to anon, authenticated
  using (is_public or (select public.is_admin()));
create policy "settings: admin write"
  on public.settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Live new-order alerts in the admin dashboard (Supabase Realtime).
alter publication supabase_realtime add table public.notifications;
