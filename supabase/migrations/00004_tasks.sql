-- ============================================================
-- Migration 00004: Task Management
-- ============================================================

do $$ begin
  create type public.task_status as enum ('pending', 'in_progress', 'completed');
  create type public.task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (length(trim(title)) between 1 and 200),
  description   text not null default '',
  assigned_to   uuid not null references auth.users(id) on delete cascade,
  assigned_by   uuid not null references auth.users(id) on delete cascade,
  assigned_to_name text not null default '',
  status        public.task_status not null default 'pending',
  priority      public.task_priority not null default 'medium',
  due_date      timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create index if not exists idx_tasks_assigned_to on public.tasks (assigned_to);
create index if not exists idx_tasks_assigned_by on public.tasks (assigned_by);
create index if not exists idx_tasks_status      on public.tasks (status);

alter table public.tasks enable row level security;

-- Each user can see tasks assigned TO them or BY them
create policy tasks_select on public.tasks for select to authenticated
  using (assigned_to = auth.uid() or assigned_by = auth.uid());

-- Anyone authenticated can create a task (assigned_by must be themselves)
create policy tasks_insert on public.tasks for insert to authenticated
  with check (assigned_by = auth.uid());

-- Assignee can update status/completed_at; assigner (or admin) can update anything
create policy tasks_update on public.tasks for update to authenticated
  using (assigned_to = auth.uid() or assigned_by = auth.uid() or public.is_admin())
  with check (assigned_to = auth.uid() or assigned_by = auth.uid() or public.is_admin());

-- Only the assigner or admin can delete
create policy tasks_delete on public.tasks for delete to authenticated
  using (assigned_by = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.tasks to authenticated;
