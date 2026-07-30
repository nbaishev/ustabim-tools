create or replace function public.invite_project_member(
  p_project_id uuid,
  p_email text,
  p_role text
)
returns table (id uuid, user_id uuid, role text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  if p_role not in ('editor', 'viewer') then
    raise exception 'Unsupported project role';
  end if;

  if not exists (
    select 1 from public.projects
    where projects.id = p_project_id
      and projects.owner_id = (select auth.uid())
      and projects.deleted_at is null
  ) then
    raise exception 'Project not found or access denied';
  end if;

  select users.id into target_user_id
  from auth.users
  where lower(coalesce(users.email, users.raw_user_meta_data ->> 'email')) = lower(btrim(p_email));

  if target_user_id is null then
    raise exception using errcode = 'P0002', message = 'Invitee is unavailable';
  end if;

  if target_user_id = (select auth.uid()) then
    raise exception using errcode = 'P0003', message = 'Project owner cannot be invited';
  end if;

  return query
  insert into public.project_members (project_id, user_id, role, invited_by)
  values (p_project_id, target_user_id, p_role, (select auth.uid()))
  on conflict on constraint project_members_project_id_user_id_key do update
    set role = excluded.role,
        invited_by = excluded.invited_by,
        updated_at = now()
  returning project_members.id, project_members.user_id, project_members.role;
end;
$$;
