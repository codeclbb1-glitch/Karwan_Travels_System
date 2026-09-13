-- Migration 00007: Simplify inventory — hotels only, add booking travel fields

-- 1. Add new columns to bookings
alter table public.bookings
  add column if not exists arrival_date    date,
  add column if not exists airline_name   text not null default '',
  add column if not exists airline_cost   numeric(14,2) not null default 0,
  add column if not exists hotel_makkah_id uuid references public.hotel_inventory(id) on delete set null,
  add column if not exists hotel_madina_id uuid references public.hotel_inventory(id) on delete set null;

-- 2. Simplify hotel_inventory — add price_per_person, keep cost_per_night as alias
alter table public.hotel_inventory
  add column if not exists price_per_person numeric(14,2) not null default 0;

-- Backfill price_per_person from cost_per_night
update public.hotel_inventory set price_per_person = cost_per_night where price_per_person = 0;

-- 3. Update create_booking to accept new params
create or replace function public.create_booking(
  p_service_type        public.service_type,
  p_package_id          uuid,
  p_selected_inclusions jsonb,
  p_customer_name       text,
  p_cnic_passport       text,
  p_phone               text,
  p_address             text,
  p_next_of_kin         text,
  p_next_of_kin_phone   text,
  p_payment_status      public.payment_status,
  p_advance_amount      numeric,
  p_departure_date      date,
  p_arrival_date        date    default null,
  p_airline_name        text    default null,
  p_airline_cost        numeric default 0,
  p_hotel_makkah_id     uuid    default null,
  p_hotel_madina_id     uuid    default null,
  p_custom_package_name text    default null,
  p_custom_price        numeric default null
)
returns public.bookings
language plpgsql security definer set search_path = public
as $$
declare
  v_customer_id  uuid;
  v_package_name text;
  v_price        numeric;
  v_booking      public.bookings;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  if p_package_id is not null then
    if p_service_type = 'hajj' then
      select name, selling_price into v_package_name, v_price
        from public.hajj_packages where id = p_package_id and deleted_at is null for share;
    else
      select name, selling_price into v_package_name, v_price
        from public.umrah_packages where id = p_package_id and deleted_at is null for share;
    end if;
    if v_package_name is null then raise exception 'Package not found'; end if;
  else
    if p_custom_package_name is null or trim(p_custom_package_name) = '' then
      raise exception 'Custom package name is required for custom bookings';
    end if;
    if p_custom_price is null or p_custom_price < 0 then
      raise exception 'A valid price is required for custom bookings';
    end if;
    v_package_name := trim(p_custom_package_name);
    v_price        := p_custom_price;
  end if;

  -- Decrement Hajj forms_remaining
  if p_service_type = 'hajj' and p_package_id is not null then
    update public.hajj_packages
      set forms_remaining = forms_remaining - 1
      where id = p_package_id and forms_remaining > 0;
    if not found then raise exception 'No Hajj forms remaining for this package'; end if;
  end if;

  insert into public.customers (full_name, cnic_passport, phone, address, next_of_kin, next_of_kin_phone)
    values (trim(p_customer_name), trim(p_cnic_passport), trim(p_phone), trim(p_address), trim(p_next_of_kin), trim(p_next_of_kin_phone))
    on conflict (cnic_passport) do update set
      full_name         = excluded.full_name,
      phone             = excluded.phone,
      address           = excluded.address,
      next_of_kin       = excluded.next_of_kin,
      next_of_kin_phone = excluded.next_of_kin_phone,
      updated_at        = now()
    returning id into v_customer_id;

  insert into public.bookings (
    customer_id, service_type,
    hajj_package_id, umrah_package_id,
    selected_inclusions, package_name_snapshot,
    final_price, payment_status, advance_amount,
    departure_date, arrival_date,
    airline_name, airline_cost,
    hotel_makkah_id, hotel_madina_id,
    created_by
  ) values (
    v_customer_id, p_service_type,
    case when p_package_id is not null and p_service_type = 'hajj'  then p_package_id end,
    case when p_package_id is not null and p_service_type = 'umrah' then p_package_id end,
    coalesce(p_selected_inclusions, '[]'::jsonb),
    v_package_name,
    v_price,
    p_payment_status, p_advance_amount,
    p_departure_date, p_arrival_date,
    coalesce(trim(p_airline_name), ''),
    coalesce(p_airline_cost, 0),
    p_hotel_makkah_id, p_hotel_madina_id,
    auth.uid()
  ) returning * into v_booking;

  return v_booking;
end $$;

grant execute on function public.create_booking(
  public.service_type, uuid, jsonb, text, text, text, text, text, text,
  public.payment_status, numeric, date, date, text, numeric, uuid, uuid, text, numeric
) to authenticated;
