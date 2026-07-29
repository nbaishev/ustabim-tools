create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index projects_owner_id_idx on public.projects(owner_id) where deleted_at is null;
create index project_members_user_id_idx on public.project_members(user_id);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;

create policy "Users can read accessible projects"
  on public.projects for select to authenticated
  using (
    deleted_at is null
    and (
      owner_id = (select auth.uid())
      or exists (
        select 1 from public.project_members
        where project_id = projects.id and user_id = (select auth.uid())
      )
    )
  );

create policy "Users can create their own projects"
  on public.projects for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners can update their projects"
  on public.projects for update to authenticated
  using (owner_id = (select auth.uid()) and deleted_at is null)
  with check (owner_id = (select auth.uid()));

create policy "Users can read their project memberships"
  on public.project_members for select to authenticated
  using (user_id = (select auth.uid()));

create function public.add_project_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role, invited_by)
  values (new.id, new.owner_id, 'owner', new.owner_id);
  return new;
end;
$$;

create trigger add_project_owner_membership_after_insert
  after insert on public.projects
  for each row execute function public.add_project_owner_membership();
