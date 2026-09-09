-- ============================================================
-- Migration 00002: Dynamic User & Role Management
-- ============================================================

-- 1. TABLES
-- ---------------------------------------------------------------

create table if not exists public.app_roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (length(trim(name)) between 1 and 80),
  description text not null default '',
  is_system   boolean not null default false,   -- true = cannot be deleted (admin/staff)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  module      text not null check (length(trim(module)) between 1 and 80),
  action      text not null check (length(trim(action)) between 1 and 80),
  description text not null default '',
  created_at  timestamptz not null default now(),
  unique (module, action)
);

create table if not exists public.role_permissions (
  role_id       uuid not null references public.app_roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  granted_at    timestamptz not null default now(),
  granted_by    uuid references auth.users(id),
  primary key (role_id, permission_id)
);

create table if not exists public.user_roles (
  user_id    uuid not null references auth.users(id) on delete cascade,
  role_id    uuid not null references public.app_roles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id),
  primary key (user_id, role_id)
);

-- 2. UPDATED_AT TRIGGERS
-- ---------------------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['app_roles', 'permissions'] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', t, t);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- 3. INDEXES
-- ---------------------------------------------------------------
create index if not exists idx_role_permissions_role on public.role_permissions (role_id);
create index if not exists idx_user_roles_user       on public.user_roles (user_id);
create index if not exists idx_user_roles_role       on public.user_roles (role_id);

-- 4. RLS
-- ---------------------------------------------------------------
alter table public.app_roles       enable row level security;
alter table public.permissions     enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles      enable row level security;

-- Everyone authenticated can read roles & permissions (needed for UI dropdowns)
create policy app_roles_select       on public.app_roles       for select to authenticated using (true);
create policy permissions_select     on public.permissions     for select to authenticated using (true);
create policy role_permissions_select on public.role_permissions for select to authenticated using (true);
create policy user_roles_select      on public.user_roles      for select to authenticated using (true);

-- Only admin can mutate
create policy app_roles_admin_write       on public.app_roles       for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy permissions_admin_write     on public.permissions     for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy role_permissions_admin_write on public.role_permissions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy user_roles_admin_write      on public.user_roles      for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5. HELPER: get all permission ids for a user (used by frontend)
-- ---------------------------------------------------------------
create or replace function public.get_user_emails(p_user_ids uuid[])
returns table(id uuid, email text)
language sql stable security definer set search_path = public, auth as $$
  select id, email from auth.users where id = any(p_user_ids);
$$;

create or replace function public.get_user_permissions(p_user_id uuid)
returns table(module text, action text)
language sql stable security definer set search_path = public as $$
  select distinct p.module, p.action
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p       on p.id = rp.permission_id
  where ur.user_id = p_user_id;
$$;

-- 6. RPC: invite_user  (admin only — creates auth user + profile + assigns role)
-- ---------------------------------------------------------------
create or replace function public.invite_user(
  p_email     text,
  p_full_name text,
  p_role_id   uuid,
  p_password  text
)
returns uuid
language plpgsql security definer set search_path = public, auth, extensions as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if not exists (select 1 from public.app_roles where id = p_role_id) then
    raise exception 'Role not found';
  end if;

  select id into v_user_id from auth.users
  where email = lower(trim(p_email))
  limit 1;

  if v_user_id is not null then
    raise exception 'A user with this email already exists';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  )
  values (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    lower(trim(p_email)),
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', trim(p_full_name)),
    now(), now(), '', '', '', ''
  )
  returning id into v_user_id;

  insert into public.profiles (id, full_name, role)
  values (v_user_id, trim(p_full_name), 'staff')
  on conflict (id) do update
    set full_name = excluded.full_name, updated_at = now();

  insert into public.user_roles (user_id, role_id, assigned_by)
  values (v_user_id, p_role_id, auth.uid())
  on conflict (user_id, role_id) do nothing;

  return v_user_id;
end $$;

-- 7. RPC: delete_user  (admin only — hard deletes auth user, cascades everywhere)
-- ---------------------------------------------------------------
create or replace function public.delete_user(p_user_id uuid)
returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Cannot delete your own account';
  end if;
  delete from auth.users where id = p_user_id;
end $$;

-- 8. RPC: update_user_profile (admin only)
-- ---------------------------------------------------------------
create or replace function public.update_user_profile(
  p_user_id   uuid,
  p_full_name text
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  update public.profiles
  set full_name = trim(p_full_name), updated_at = now()
  where id = p_user_id;
end $$;

-- 9. GRANTS
-- ---------------------------------------------------------------
grant select on public.app_roles, public.permissions, public.role_permissions, public.user_roles to authenticated;
grant execute on function
  public.get_user_emails(uuid[]),
  public.get_user_permissions(uuid),
  public.invite_user(text, text, uuid, text),
  public.delete_user(uuid),
  public.update_user_profile(uuid, text)
to authenticated;

-- 10. SEED: system roles
-- ---------------------------------------------------------------
insert into public.app_roles (name, description, is_system) values
  ('admin', 'Super Admin — full access to all modules', true),
  ('staff', 'Staff — operational access, no financials',  true)
on conflict (name) do nothing;

-- 11. SEED: permissions (module + action pairs)
-- ---------------------------------------------------------------
insert into public.permissions (module, action, description) values
  ('dashboard',       'view',   'View dashboard and summary stats'),
  ('hajj',            'view',   'View Hajj packages'),
  ('hajj',            'manage', 'Create, edit and delete Hajj packages'),
  ('umrah',           'view',   'View Umrah packages'),
  ('umrah',           'manage', 'Create, edit and delete Umrah packages'),
  ('bookings',        'view',   'View all bookings'),
  ('bookings',        'create', 'Create new bookings'),
  ('bookings',        'manage', 'Edit and delete bookings'),
  ('inventory',       'view',   'View airline and hotel inventory'),
  ('inventory',       'manage', 'Add and edit inventory'),
  ('pricing',         'view',   'View pricing calculator'),
  ('finance',         'view',   'View financial ledger'),
  ('finance',         'manage', 'Add and edit financial transactions'),
  ('investments',     'view',   'View investments'),
  ('investments',     'manage', 'Add and edit investments'),
  ('office_expenses', 'view',   'View office expenses'),
  ('office_expenses', 'manage', 'Add and edit office expenses'),
  ('users',           'manage', 'Manage users, roles and permissions')
on conflict (module, action) do nothing;

-- 12. SEED: assign all permissions to admin role, operational ones to staff
-- ---------------------------------------------------------------
do $$
declare
  v_admin_id uuid;
  v_staff_id uuid;
begin
  select id into v_admin_id from public.app_roles where name = 'admin';
  select id into v_staff_id from public.app_roles where name = 'staff';

  -- Admin gets everything
  insert into public.role_permissions (role_id, permission_id)
  select v_admin_id, id from public.permissions
  on conflict do nothing;

  -- Staff gets operational subset
  insert into public.role_permissions (role_id, permission_id)
  select v_staff_id, p.id from public.permissions p
  where (p.module, p.action) in (
    ('dashboard',  'view'),
    ('hajj',       'view'),
    ('umrah',      'view'),
    ('bookings',   'view'),
    ('bookings',   'create'),
    ('inventory',  'view')
  )
  on conflict do nothing;
end $$;
