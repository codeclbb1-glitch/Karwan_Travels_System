create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('admin', 'staff');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.service_type as enum ('hajj', 'umrah');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.payment_status as enum ('paid', 'partial', 'unpaid');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.transport_type as enum ('car', 'bus');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.package_mode as enum ('company_organized', 'form_resale_to_agent');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.office_location as enum ('office_1', 'office_2');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.expense_category as enum ('salaries', 'bills', 'rent', 'food', 'miscellaneous');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.city_location as enum ('makkah', 'madina');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.transaction_type as enum ('income', 'expense');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'System User',
  role public.user_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hajj_form_batches (
  id uuid primary key default gen_random_uuid(),
  batch_name text not null check (length(trim(batch_name)) between 1 and 150),
  quantity_purchased integer not null check (quantity_purchased > 0),
  price_per_form numeric(14,2) not null check (price_per_form >= 0),
  used integer not null default 0 check (used >= 0),
  date_purchased date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (used <= quantity_purchased)
);

create table if not exists public.hajj_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 150),
  mode public.package_mode not null default 'company_organized',
  hotel_cost numeric(14,2) not null default 0 check (hotel_cost >= 0),
  ticket_cost numeric(14,2) not null default 0 check (ticket_cost >= 0),
  visa_cost numeric(14,2) not null default 0 check (visa_cost >= 0),
  transport_cost numeric(14,2) not null default 0 check (transport_cost >= 0),
  transport_type public.transport_type not null default 'bus',
  food_cost numeric(14,2) not null default 0 check (food_cost >= 0),
  other_cost numeric(14,2) not null default 0 check (other_cost >= 0),
  selling_price numeric(14,2) not null check (selling_price >= 0),
  agent_price numeric(14,2) not null check (agent_price >= 0),
  forms_remaining integer not null default 0 check (forms_remaining >= 0),
  duration_days integer not null default 30 check (duration_days between 1 and 365),
  description text not null default '',
  inclusions jsonb not null default '[]'::jsonb check (jsonb_typeof(inclusions) = 'array'),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  total_cost numeric(14,2) generated always as (hotel_cost + ticket_cost + visa_cost + transport_cost + food_cost + other_cost) stored
);

create table if not exists public.umrah_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 150),
  airline_cost numeric(14,2) not null default 0 check (airline_cost >= 0),
  visa_cost numeric(14,2) not null default 0 check (visa_cost >= 0),
  hotel_madina_cost numeric(14,2) not null default 0 check (hotel_madina_cost >= 0),
  hotel_makkah_cost numeric(14,2) not null default 0 check (hotel_makkah_cost >= 0),
  transport_cost numeric(14,2) not null default 0 check (transport_cost >= 0),
  transport_type public.transport_type not null default 'bus',
  food_cost numeric(14,2) not null default 0 check (food_cost >= 0),
  other_cost numeric(14,2) not null default 0 check (other_cost >= 0),
  selling_price numeric(14,2) not null check (selling_price >= 0),
  agent_price numeric(14,2) not null check (agent_price >= 0),
  duration_days integer not null default 10 check (duration_days between 1 and 365),
  description text not null default '',
  inclusions jsonb not null default '[]'::jsonb check (jsonb_typeof(inclusions) = 'array'),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  total_cost numeric(14,2) generated always as (airline_cost + visa_cost + hotel_madina_cost + hotel_makkah_cost + transport_cost + food_cost + other_cost) stored
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 1 and 150),
  cnic_passport text not null unique check (length(trim(cnic_passport)) between 3 and 100),
  phone text not null check (length(trim(phone)) between 3 and 50),
  address text not null default '',
  next_of_kin text not null default '',
  next_of_kin_phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  service_type public.service_type not null,
  hajj_package_id uuid references public.hajj_packages(id) on delete set null,
  umrah_package_id uuid references public.umrah_packages(id) on delete set null,
  selected_inclusions jsonb not null default '[]'::jsonb check (jsonb_typeof(selected_inclusions) = 'array'),
  package_name_snapshot text not null,
  final_price numeric(14,2) not null check (final_price >= 0),
  payment_status public.payment_status not null default 'unpaid',
  advance_amount numeric(14,2) not null default 0 check (advance_amount >= 0),
  booking_date date not null default current_date,
  departure_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  check ((service_type = 'hajj' and hajj_package_id is not null and umrah_package_id is null) or (service_type = 'umrah' and umrah_package_id is not null and hajj_package_id is null)),
  check ((payment_status = 'paid' and advance_amount = final_price) or (payment_status = 'partial' and advance_amount > 0 and advance_amount < final_price) or (payment_status = 'unpaid' and advance_amount = 0))
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  type public.transaction_type not null,
  category text not null check (length(trim(category)) between 1 and 100),
  amount numeric(14,2) not null check (amount > 0),
  description text not null default '',
  transaction_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 150),
  ownership_percent numeric(5,2) not null check (ownership_percent between 0 and 100),
  amount_invested numeric(14,2) not null check (amount_invested >= 0),
  investment_date date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.office_expenses (
  id uuid primary key default gen_random_uuid(),
  office public.office_location not null,
  category public.expense_category not null,
  amount numeric(14,2) not null check (amount > 0),
  expense_date date not null default current_date,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.airline_inventory (
  id uuid primary key default gen_random_uuid(),
  airline_name text not null check (length(trim(airline_name)) between 1 and 150),
  route text not null check (length(trim(route)) between 2 and 150),
  quantity_purchased integer not null check (quantity_purchased > 0),
  cost_per_ticket numeric(14,2) not null check (cost_per_ticket >= 0),
  quantity_sold integer not null default 0 check (quantity_sold >= 0),
  travel_date date not null,
  return_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  check (quantity_sold <= quantity_purchased),
  check (return_date >= travel_date)
);

create table if not exists public.hotel_inventory (
  id uuid primary key default gen_random_uuid(),
  hotel_name text not null check (length(trim(hotel_name)) between 1 and 150),
  city public.city_location not null,
  room_type text not null check (length(trim(room_type)) between 1 and 100),
  quantity_blocked integer not null check (quantity_blocked > 0),
  cost_per_night numeric(14,2) not null check (cost_per_night >= 0),
  quantity_booked integer not null default 0 check (quantity_booked >= 0),
  check_in date not null,
  check_out date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  check (quantity_booked <= quantity_blocked),
  check (check_out > check_in)
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles (id, full_name) values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'System User')) on conflict (id) do nothing; return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.current_user_role() returns public.user_role language sql stable security definer set search_path = public as $$ select role from public.profiles where id = auth.uid() $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select coalesce(public.current_user_role() = 'admin', false) $$;

create or replace view public.staff_hajj_packages with (security_barrier = true) as select id, name, mode, transport_type, selling_price, forms_remaining, duration_days, description, inclusions, created_at, updated_at from public.hajj_packages where deleted_at is null;
create or replace view public.staff_umrah_packages with (security_barrier = true) as select id, name, transport_type, selling_price, duration_days, description, inclusions, created_at, updated_at from public.umrah_packages where deleted_at is null;
create or replace view public.airline_inventory_view as select id, airline_name, route, quantity_purchased as quantity, quantity_sold as sold, quantity_purchased - quantity_sold as remaining, travel_date, return_date, created_at, updated_at from public.airline_inventory;
create or replace view public.hotel_inventory_view as select id, hotel_name, city, room_type, quantity_blocked as quantity, quantity_booked as booked, quantity_blocked - quantity_booked as remaining, check_in, check_out, created_at, updated_at from public.hotel_inventory;
create or replace view public.hajj_form_batches_view as select id, batch_name, quantity_purchased as quantity, price_per_form, date_purchased, used, quantity_purchased - used as forms_remaining, created_at, updated_at from public.hajj_form_batches;
create or replace view public.financial_ledger_view as select id, type, category, amount, description, transaction_date, sum(case when type = 'income' then amount else -amount end) over (order by transaction_date, created_at, id rows unbounded preceding) as running_balance from public.financial_transactions;

create or replace function public.create_booking(p_service_type public.service_type, p_package_id uuid, p_selected_inclusions jsonb, p_customer_name text, p_cnic_passport text, p_phone text, p_address text, p_next_of_kin text, p_next_of_kin_phone text, p_payment_status public.payment_status, p_advance_amount numeric, p_departure_date date) returns public.bookings language plpgsql security definer set search_path = public as $$
declare v_customer_id uuid; v_package_name text; v_price numeric; v_booking public.bookings;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_service_type = 'hajj' then select name, selling_price into v_package_name, v_price from public.hajj_packages where id = p_package_id and deleted_at is null for share; else select name, selling_price into v_package_name, v_price from public.umrah_packages where id = p_package_id and deleted_at is null for share; end if;
  if v_package_name is null then raise exception 'Package not found'; end if;
  insert into public.customers (full_name, cnic_passport, phone, address, next_of_kin, next_of_kin_phone) values (trim(p_customer_name), trim(p_cnic_passport), trim(p_phone), trim(p_address), trim(p_next_of_kin), trim(p_next_of_kin_phone)) on conflict (cnic_passport) do update set full_name = excluded.full_name, phone = excluded.phone, address = excluded.address, next_of_kin = excluded.next_of_kin, next_of_kin_phone = excluded.next_of_kin_phone, updated_at = now() returning id into v_customer_id;
  insert into public.bookings (customer_id, service_type, hajj_package_id, umrah_package_id, selected_inclusions, package_name_snapshot, final_price, payment_status, advance_amount, departure_date, created_by) values (v_customer_id, p_service_type, case when p_service_type = 'hajj' then p_package_id end, case when p_service_type = 'umrah' then p_package_id end, coalesce(p_selected_inclusions, '[]'::jsonb), v_package_name, v_price, p_payment_status, p_advance_amount, p_departure_date, auth.uid()) returning * into v_booking;
  return v_booking;
end $$;

create or replace function public.allocate_hajj_forms(p_batch_id uuid, p_quantity integer) returns public.hajj_form_batches language plpgsql security definer set search_path = public as $$ declare v_batch public.hajj_form_batches; begin if not public.is_admin() then raise exception 'Admin access required'; end if; update public.hajj_form_batches set used = used + p_quantity where id = p_batch_id and p_quantity > 0 and quantity_purchased - used >= p_quantity returning * into v_batch; if v_batch.id is null then raise exception 'Insufficient Hajj forms'; end if; return v_batch; end $$;
create or replace function public.allocate_airline_inventory(p_inventory_id uuid, p_quantity integer) returns public.airline_inventory language plpgsql security definer set search_path = public as $$ declare v_row public.airline_inventory; begin if auth.uid() is null then raise exception 'Authentication required'; end if; update public.airline_inventory set quantity_sold = quantity_sold + p_quantity where id = p_inventory_id and p_quantity > 0 and quantity_purchased - quantity_sold >= p_quantity returning * into v_row; if v_row.id is null then raise exception 'Insufficient airline inventory'; end if; return v_row; end $$;
create or replace function public.allocate_hotel_inventory(p_inventory_id uuid, p_quantity integer) returns public.hotel_inventory language plpgsql security definer set search_path = public as $$ declare v_row public.hotel_inventory; begin if auth.uid() is null then raise exception 'Authentication required'; end if; update public.hotel_inventory set quantity_booked = quantity_booked + p_quantity where id = p_inventory_id and p_quantity > 0 and quantity_blocked - quantity_booked >= p_quantity returning * into v_row; if v_row.id is null then raise exception 'Insufficient hotel inventory'; end if; return v_row; end $$;

alter table public.profiles enable row level security;
alter table public.hajj_form_batches enable row level security;
alter table public.hajj_packages enable row level security;
alter table public.umrah_packages enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.investments enable row level security;
alter table public.office_expenses enable row level security;
alter table public.airline_inventory enable row level security;
alter table public.hotel_inventory enable row level security;

create policy profiles_select_self_or_admin on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy hajj_packages_admin_all on public.hajj_packages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy umrah_packages_admin_all on public.umrah_packages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy hajj_batches_admin_all on public.hajj_form_batches for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy customers_authenticated_all on public.customers for all to authenticated using (true) with check (true);
create policy bookings_authenticated_select on public.bookings for select to authenticated using (true);
create policy bookings_authenticated_insert on public.bookings for insert to authenticated with check (created_by = auth.uid());
create policy bookings_admin_update on public.bookings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy finance_admin_all on public.financial_transactions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy investments_admin_all on public.investments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy expenses_admin_all on public.office_expenses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy airline_admin_all on public.airline_inventory for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy hotel_admin_all on public.hotel_inventory for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant usage on schema public to authenticated;
grant select on public.staff_hajj_packages, public.staff_umrah_packages, public.airline_inventory_view, public.hotel_inventory_view to authenticated;
grant select on public.bookings, public.customers, public.profiles to authenticated;
grant execute on function public.current_user_role(), public.is_admin(), public.create_booking(public.service_type, uuid, jsonb, text, text, text, text, text, text, public.payment_status, numeric, date), public.allocate_hajj_forms(uuid, integer), public.allocate_airline_inventory(uuid, integer), public.allocate_hotel_inventory(uuid, integer) to authenticated;

create index if not exists idx_bookings_date on public.bookings (booking_date desc);
create index if not exists idx_bookings_customer on public.bookings (customer_id);
create index if not exists idx_customers_cnic on public.customers (cnic_passport);
create index if not exists idx_airline_travel on public.airline_inventory (travel_date);
create index if not exists idx_hotel_dates on public.hotel_inventory (check_in, check_out);

do $$ declare table_name text; begin foreach table_name in array array['profiles','hajj_form_batches','hajj_packages','umrah_packages','customers','bookings','financial_transactions','investments','office_expenses','airline_inventory','hotel_inventory'] loop execute format('drop trigger if exists %I_updated_at on public.%I', table_name, table_name); execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name); end loop; end $$;
