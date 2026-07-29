create table public.project_files (
  id uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  storage_bucket text not null default 'project-ifc',
  storage_path text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 255),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 262144000),
  upload_idempotency_key text,
  status text not null check (status in ('uploading', 'uploaded', 'failed', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (project_id, uploaded_by, upload_idempotency_key)
);

create table public.ifc_models (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_id uuid not null unique references public.project_files(id) on delete cascade,
  status text not null check (status in ('uploaded', 'failed')),
  schema_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index project_files_project_created_idx on public.project_files(project_id, created_at desc)
  where deleted_at is null;
create index ifc_models_project_created_idx on public.ifc_models(project_id, created_at desc)
  where deleted_at is null;

alter table public.project_files enable row level security;
alter table public.ifc_models enable row level security;

create function public.can_read_project(p_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.deleted_at is null
      and exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = (select auth.uid())
      )
  );
$$;

create function public.can_write_project_files(p_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    join public.project_members pm on pm.project_id = p.id
    where p.id = p_project_id and p.deleted_at is null
      and pm.user_id = (select auth.uid()) and pm.role in ('owner', 'editor')
  );
$$;

revoke all on function public.can_read_project(uuid) from public;
revoke all on function public.can_write_project_files(uuid) from public;
grant execute on function public.can_read_project(uuid) to authenticated;
grant execute on function public.can_write_project_files(uuid) to authenticated;

create policy "Members can read project files"
  on public.project_files for select to authenticated
  using (public.can_read_project(project_id));
create policy "Editors can add project files"
  on public.project_files for insert to authenticated
  with check (uploaded_by = (select auth.uid()) and public.can_write_project_files(project_id));
create policy "Editors can update project files"
  on public.project_files for update to authenticated
  using (public.can_write_project_files(project_id) or uploaded_by = (select auth.uid()))
  with check (public.can_write_project_files(project_id) or uploaded_by = (select auth.uid()));

create policy "Members can read IFC models"
  on public.ifc_models for select to authenticated
  using (public.can_read_project(project_id));
create policy "Editors can add IFC models"
  on public.ifc_models for insert to authenticated
  with check (public.can_write_project_files(project_id));
create policy "Editors can update IFC models"
  on public.ifc_models for update to authenticated
  using (
    public.can_write_project_files(project_id)
    or exists (select 1 from public.project_files pf where pf.id = file_id and pf.uploaded_by = (select auth.uid()))
  )
  with check (
    public.can_write_project_files(project_id)
    or exists (select 1 from public.project_files pf where pf.id = file_id and pf.uploaded_by = (select auth.uid()))
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-ifc', 'project-ifc', false, 262144000, array['application/octet-stream', 'application/x-step'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Project editors can upload IFC objects"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-ifc'
    and name ~ '^projects/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/source\.ifc$'
    and public.can_write_project_files(split_part(name, '/', 2)::uuid)
    and exists (
      select 1 from public.project_files pf
      where pf.storage_bucket = bucket_id and pf.storage_path = name
        and pf.status = 'uploading' and pf.deleted_at is null
        and pf.uploaded_by = (select auth.uid())
    )
  );
create policy "Project members can read IFC objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-ifc'
    and name ~ '^projects/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/source\.ifc$'
    and public.can_read_project(split_part(name, '/', 2)::uuid)
  );
create policy "Project editors can delete IFC objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-ifc'
    and name ~ '^projects/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/source\.ifc$'
    and public.can_write_project_files(split_part(name, '/', 2)::uuid)
  );
