-- Migration 00009: Add airline_name to hajj and umrah packages

alter table public.hajj_packages
  add column if not exists airline_name text not null default '';

alter table public.umrah_packages
  add column if not exists airline_name text not null default '';
