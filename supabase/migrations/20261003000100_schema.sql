-- =============================================================
-- Sheko store schema: tables, constraints, indexes, triggers.
-- Row Level Security policies live in the next migration.
-- =============================================================

-- Shared trigger: keep updated_at current on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------
-- Profiles (one row per auth user) and roles
-- -------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- True when the current request belongs to an admin.
-- security definer so it can read profiles without tripping RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- -------------------------------------------------------------
-- Catalog
-- -------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  seo_title text,
  seo_description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_id is distinct from id)
);

create index categories_parent_id_idx on public.categories (parent_id);
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  sku text unique,
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  seo_title text,
  seo_description text,
  -- 'simple' config works for Arabic and English without stemming surprises.
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(short_description, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_active_featured_idx on public.products (is_active, is_featured);
create index products_search_idx on public.products using gin (search_vector);
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,                       -- e.g. "كحلي / L"
  options jsonb not null default '{}'::jsonb, -- e.g. {"اللون": "كحلي", "المقاس": "L"}
  price numeric(10, 2) check (price is null or price >= 0), -- null = product price
  stock integer not null default 0 check (stock >= 0),
  sku text unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_variants_product_id_idx on public.product_variants (product_id);
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- Shipping: governorates and their cities / centers
-- -------------------------------------------------------------
create table public.governorates (
  id integer primary key generated always as identity,
  name text not null unique,
  shipping_fee numeric(10, 2) not null default 0 check (shipping_fee >= 0),
  min_days smallint not null default 1 check (min_days > 0),
  max_days smallint not null default 3,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_days >= min_days)
);

create trigger governorates_set_updated_at
  before update on public.governorates
  for each row execute function public.set_updated_at();

create table public.cities (
  id integer primary key generated always as identity,
  governorate_id integer not null references public.governorates (id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (governorate_id, name)
);

create index cities_governorate_id_idx on public.cities (governorate_id);

-- -------------------------------------------------------------
-- Customers' saved addresses (optional accounts)
-- -------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  governorate_id integer not null references public.governorates (id),
  city_id integer references public.cities (id),
  address text not null,
  phone text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);

-- -------------------------------------------------------------
-- Orders (cash on delivery, confirmed over WhatsApp)
-- -------------------------------------------------------------
create sequence public.order_number_seq start 10001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default 'SH-' || nextval('public.order_number_seq'::regclass),
  user_id uuid references auth.users (id) on delete set null, -- null = guest
  customer_name text not null,
  phone text not null,
  governorate_id integer references public.governorates (id) on delete set null,
  city_id integer references public.cities (id) on delete set null,
  -- Name snapshots keep old orders readable if a city is renamed or removed.
  governorate_name text not null,
  city_name text,
  address text not null,
  notes text,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  shipping_fee numeric(10, 2) not null default 0 check (shipping_fee >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  total numeric(10, 2) not null check (total >= 0),
  coupon_code text,
  payment_method text not null default 'cod' check (payment_method in ('cod')),
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders (user_id);
create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_phone_idx on public.orders (phone);
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  -- Snapshots: the order keeps what the customer saw when ordering.
  product_name text not null,
  product_slug text,
  variant_name text,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10, 2) not null check (line_total >= 0)
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

-- -------------------------------------------------------------
-- Marketing
-- -------------------------------------------------------------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  type text not null check (type in ('percent', 'fixed')),
  value numeric(10, 2) not null check (value > 0),
  min_order numeric(10, 2) not null default 0,
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (type <> 'percent' or value <= 100)
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  link_url text,
  position text not null default 'hero' check (position in ('hero', 'top_bar')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index reviews_product_id_idx on public.reviews (product_id);

create table public.wishlist (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- -------------------------------------------------------------
-- Admin notifications and store settings
-- -------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'new_order',
  order_id uuid references public.orders (id) on delete cascade,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_unread_idx on public.notifications (is_read, created_at desc);

-- Every new order creates an admin notification.
create or replace function public.notify_new_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (type, order_id, title, body)
  values (
    'new_order',
    new.id,
    'طلب جديد ' || new.order_number,
    new.governorate_name || ' · ' || new.total || ' ج.م'
  );
  return new;
end;
$$;

create trigger orders_notify_new
  after insert on public.orders
  for each row execute function public.notify_new_order();

create table public.settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false, -- readable by store visitors
  updated_at timestamptz not null default now()
);

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();
