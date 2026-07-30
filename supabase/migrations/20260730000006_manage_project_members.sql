create function public.list_project_members(p_project_id uuid)
returns table (id uuid, user_id uuid, email text, role text, created_at timestamptz)
language plpgsql security definer set search_path = public, auth
as $$
begin
  if not exists (
    select 1 from public.projects
    where projects.id = p_project_id and projects.owner_id = (select auth.uid()) and projects.deleted_at is null
  ) then raise exception 'Project not found or access denied'; end if;

  return query
  select members.id, members.user_id, users.email, members.role, members.created_at
  from public.project_members members
  join auth.users users on users.id = members.user_id
  where members.project_id = p_project_id
  order by case members.role when 'owner' then 0 else 1 end, lower(users.email);
end;
$$;

create function public.manage_project_member(
  p_project_id uuid, p_member_id uuid, p_action text, p_role text default null
)
returns table (role text)
language plpgsql security definer set search_path = public, auth
as $$
begin
  if not exists (
    select 1 from public.projects
    where projects.id = p_project_id and projects.owner_id = (select auth.uid()) and projects.deleted_at is null
  ) then raise exception 'Project not found or access denied'; end if;

  if p_action = 'update_role' then
    if p_role not in ('editor', 'viewer') then raise exception 'Unsupported project role'; end if;
    return query
    update public.project_members as members set role = p_role, updated_at = now()
    where members.id = p_member_id and members.project_id = p_project_id and members.role <> 'owner'
    returning members.role;
  elsif p_action = 'remove' then
    delete from public.project_members as members
    where members.id = p_member_id and members.project_id = p_project_id and members.role <> 'owner';
    if not found then raise exception 'Member cannot be removed'; end if;
    return query select 'removed'::text;
  else
    raise exception 'Unsupported member action';
  end if;

  if not found then raise exception 'Member cannot be changed'; end if;
end;
$$;

revoke all on function public.list_project_members(uuid) from public;
revoke all on function public.manage_project_member(uuid, uuid, text, text) from public;
grant execute on function public.list_project_members(uuid) to authenticated;
grant execute on function public.manage_project_member(uuid, uuid, text, text) to authenticated;
