-- Migration 00010: Add per-occupancy pricing to hotel_inventory

alter table public.hotel_inventory
  add column if not exists sharing_price numeric(14,2) not null default 0 check (sharing_price >= 0),
  add column if not exists quad_price    numeric(14,2) not null default 0 check (quad_price >= 0),
  add column if not exists triple_price  numeric(14,2) not null default 0 check (triple_price >= 0),
  add column if not exists double_price  numeric(14,2) not null default 0 check (double_price >= 0);

-- Must drop and recreate — cannot add columns to an existing view with CREATE OR REPLACE
drop view if exists public.hotel_inventory_view;

create view public.hotel_inventory_view as
  select id, hotel_name, city, cost_per_night,
         sharing_price, quad_price, triple_price, double_price,
         created_at, updated_at
  from public.hotel_inventory;
