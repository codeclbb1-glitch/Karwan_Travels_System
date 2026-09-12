-- Link packages to inventory items so booking a package auto-deducts inventory

-- Hajj packages: airline ticket + hotel Makkah
alter table public.hajj_packages
  add column if not exists airline_inventory_id uuid references public.airline_inventory(id) on delete set null,
  add column if not exists hotel_makkah_id      uuid references public.hotel_inventory(id)   on delete set null;

-- Umrah packages: airline ticket + hotel Madina + hotel Makkah
alter table public.umrah_packages
  add column if not exists airline_inventory_id uuid references public.airline_inventory(id) on delete set null,
  add column if not exists hotel_madina_id      uuid references public.hotel_inventory(id)   on delete set null,
  add column if not exists hotel_makkah_id      uuid references public.hotel_inventory(id)   on delete set null;

-- Update create_booking to auto-deduct inventory when a linked package is booked
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
  p_custom_package_name text    default null,
  p_custom_price        numeric default null
)
returns public.bookings
language plpgsql security definer set search_path = public
as $$
declare
  v_customer_id        uuid;
  v_package_name       text;
  v_price              numeric;
  v_booking            public.bookings;
  v_airline_inv_id     uuid;
  v_hotel_makkah_id    uuid;
  v_hotel_madina_id    uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  if p_package_id is not null then
    if p_service_type = 'hajj' then
      select name, selling_price, airline_inventory_id, hotel_makkah_id
        into v_package_name, v_price, v_airline_inv_id, v_hotel_makkah_id
        from public.hajj_packages where id = p_package_id and deleted_at is null for share;
    else
      select name, selling_price, airline_inventory_id, hotel_madina_id, hotel_makkah_id
        into v_package_name, v_price, v_airline_inv_id, v_hotel_madina_id, v_hotel_makkah_id
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

  -- Deduct airline inventory
  if v_airline_inv_id is not null then
    update public.airline_inventory
      set quantity_sold = quantity_sold + 1
      where id = v_airline_inv_id and quantity_purchased - quantity_sold >= 1;
    if not found then raise exception 'Insufficient airline inventory'; end if;
  end if;

  -- Deduct hotel Makkah inventory
  if v_hotel_makkah_id is not null then
    update public.hotel_inventory
      set quantity_booked = quantity_booked + 1
      where id = v_hotel_makkah_id and quantity_blocked - quantity_booked >= 1;
    if not found then raise exception 'Insufficient hotel Makkah inventory'; end if;
  end if;

  -- Deduct hotel Madina inventory (Umrah only)
  if v_hotel_madina_id is not null then
    update public.hotel_inventory
      set quantity_booked = quantity_booked + 1
      where id = v_hotel_madina_id and quantity_blocked - quantity_booked >= 1;
    if not found then raise exception 'Insufficient hotel Madina inventory'; end if;
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
    departure_date, created_by
  ) values (
    v_customer_id, p_service_type,
    case when p_package_id is not null and p_service_type = 'hajj'  then p_package_id end,
    case when p_package_id is not null and p_service_type = 'umrah' then p_package_id end,
    coalesce(p_selected_inclusions, '[]'::jsonb),
    v_package_name,
    v_price,
    p_payment_status, p_advance_amount,
    p_departure_date, auth.uid()
  ) returning * into v_booking;

  return v_booking;
end $$;
