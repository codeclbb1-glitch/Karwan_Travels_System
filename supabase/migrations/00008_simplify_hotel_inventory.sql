-- Migration 00008: Simplify hotel_inventory to a plain reference list

drop view if exists public.hotel_inventory_view;

alter table public.hotel_inventory
  drop column if exists room_type,
  drop column if exists quantity_blocked,
  drop column if exists quantity_booked,
  drop column if exists check_in,
  drop column if exists check_out;

create or replace view public.hotel_inventory_view as
  select id, hotel_name, city, cost_per_night, created_at, updated_at
  from public.hotel_inventory;
