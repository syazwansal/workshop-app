-- TimeTec Staff Meals schema
-- Run this once in your Supabase project's SQL editor.
-- Statements are guarded so the file can be re-run safely.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.menu_categories (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 500),
  price_cents integer not null check (price_cents >= 0),
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 180),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'received'
    check (status in ('received', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  customer_phone text not null check (char_length(customer_phone) between 1 and 40),
  delivery_location text not null check (char_length(delivery_location) between 1 and 180),
  notes text check (notes is null or char_length(notes) <= 500),
  total_cents integer not null check (total_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  item_name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0 and quantity <= 99),
  line_total_cents integer not null check (line_total_cents >= 0),
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists menu_categories_sort_idx on public.menu_categories (sort_order, name);
create index if not exists menu_items_category_idx on public.menu_items (category_id, is_available);
create index if not exists delivery_locations_sort_idx on public.delivery_locations (sort_order, name);
create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;

create or replace trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace trigger menu_categories_set_updated_at
  before update on public.menu_categories
  for each row execute function public.set_updated_at();

create or replace trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

create or replace trigger delivery_locations_set_updated_at
  before update on public.delivery_locations
  for each row execute function public.set_updated_at();

create or replace trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.delivery_locations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_own_or_admin') then
    create policy profiles_select_own_or_admin on public.profiles
      for select using (auth.uid() = id or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_insert_own') then
    create policy profiles_insert_own on public.profiles
      for insert with check (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own_customer_fields') then
    create policy profiles_update_own_customer_fields on public.profiles
      for update using (auth.uid() = id) with check (auth.uid() = id and role = 'customer');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_admin_update') then
    create policy profiles_admin_update on public.profiles
      for update using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'menu_categories' and policyname = 'menu_categories_staff_select_active') then
    create policy menu_categories_staff_select_active on public.menu_categories
      for select using (auth.uid() is not null and (is_active or public.is_admin()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'menu_categories' and policyname = 'menu_categories_admin_all') then
    create policy menu_categories_admin_all on public.menu_categories
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'menu_items' and policyname = 'menu_items_staff_select_available') then
    create policy menu_items_staff_select_available on public.menu_items
      for select using (auth.uid() is not null and (is_available or public.is_admin()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'menu_items' and policyname = 'menu_items_admin_all') then
    create policy menu_items_admin_all on public.menu_items
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'delivery_locations' and policyname = 'delivery_locations_staff_select_active') then
    create policy delivery_locations_staff_select_active on public.delivery_locations
      for select using (auth.uid() is not null and (is_active or public.is_admin()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'delivery_locations' and policyname = 'delivery_locations_admin_all') then
    create policy delivery_locations_admin_all on public.delivery_locations
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_select_own_or_admin') then
    create policy orders_select_own_or_admin on public.orders
      for select using (auth.uid() = user_id or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_insert_own') then
    create policy orders_insert_own on public.orders
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_admin_update') then
    create policy orders_admin_update on public.orders
      for update using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'order_items_select_own_or_admin') then
    create policy order_items_select_own_or_admin on public.order_items
      for select using (
        exists (
          select 1 from public.orders
          where orders.id = order_items.order_id
            and (orders.user_id = auth.uid() or public.is_admin())
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'order_items_insert_own') then
    create policy order_items_insert_own on public.order_items
      for insert with check (
        exists (
          select 1 from public.orders
          where orders.id = order_items.order_id
            and orders.user_id = auth.uid()
        )
      );
  end if;
end $$;

insert into public.menu_categories (name, sort_order, is_active)
select seed.name, seed.sort_order, seed.is_active
from (
  values
    ('Breakfast', 10, true),
    ('Rice Bowls', 20, true),
    ('Noodles', 30, true),
    ('Drinks', 40, true)
) as seed(name, sort_order, is_active)
where not exists (
  select 1 from public.menu_categories existing where existing.name = seed.name
);

insert into public.delivery_locations (name, sort_order, is_active)
select seed.name, seed.sort_order, seed.is_active
from (
  values
    ('TimeTec HQ - Level 1 Pantry', 10, true),
    ('TimeTec HQ - Level 2 Office', 20, true),
    ('TimeTec HQ - Level 3 Meeting Area', 30, true)
) as seed(name, sort_order, is_active)
where not exists (
  select 1 from public.delivery_locations existing where existing.name = seed.name
);

insert into public.menu_items (category_id, name, description, price_cents, image_url, is_available)
select c.id, item.name, item.description, item.price_cents, item.image_url, true
from (
  values
    ('Breakfast', 'Kaya Toast Set', 'Toasted bread with kaya, butter, soft-boiled egg, and hot coffee.', 650, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80'),
    ('Breakfast', 'Nasi Lemak Pack', 'Coconut rice with sambal, egg, peanuts, anchovies, and cucumber.', 850, 'https://unsplash.com/photos/szQFiGZH8wU/download?force=true'),
    ('Rice Bowls', 'Teriyaki Chicken Rice', 'Grilled chicken, warm rice, greens, and teriyaki glaze.', 1290, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80'),
    ('Rice Bowls', 'Rendang Beef Bowl', 'Slow-cooked beef rendang over steamed rice with pickled cucumber.', 1590, 'https://unsplash.com/photos/bX7UPKH1vxs/download?force=true'),
    ('Noodles', 'Mee Goreng Mamak', 'Fried yellow noodles with tofu, egg, vegetables, and spicy sauce.', 990, 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=900&q=80'),
    ('Noodles', 'Chicken Curry Laksa', 'Rich coconut curry broth with noodles, chicken, tofu puff, and herbs.', 1390, 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=900&q=80'),
    ('Drinks', 'Iced Lemon Tea', 'Fresh tea with lemon over ice.', 450, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80'),
    ('Drinks', 'Hot Kopi', 'Classic office fuel, brewed strong and served hot.', 350, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80')
) as item(category_name, name, description, price_cents, image_url)
join public.menu_categories c on c.name = item.category_name
where not exists (
  select 1 from public.menu_items existing where existing.name = item.name
);

-- To make a staff account an admin after sign-up, run:
-- update public.profiles set role = 'admin' where email = 'person@timeteccloud.com';
