-- P0-03, first security slice. Apply after 001 and 002 on a disposable dev DB first.
-- Does not implement invitations or change existing client/account links.
begin;

-- A profile owner may edit their name, never their role or identity.
revoke all on public.profiles from public, anon, authenticated;
revoke all (id, full_name, role, created_at, updated_at) on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Harden existing helpers without changing their signatures.
create or replace function public.is_pt()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'pt');
$$;
create or replace function public.my_pt_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select pt_id from public.clients where user_id = auth.uid() limit 1;
$$;
create or replace function public.my_client_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.clients where user_id = auth.uid() limit 1;
$$;
create or replace function public.is_pt_of(p_client_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_pt() and exists (
    select 1 from public.clients where id = p_client_id and pt_id = auth.uid()
  );
$$;
create or replace function public.can_access_client(p_client_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.clients where id = p_client_id
      and (user_id = auth.uid() or (pt_id = auth.uid() and public.is_pt()))
  );
$$;
revoke execute on function public.is_pt(), public.my_pt_id(), public.my_client_id(),
  public.is_pt_of(uuid), public.can_access_client(uuid) from public, anon;
grant execute on function public.is_pt(), public.my_pt_id(), public.my_client_id(),
  public.is_pt_of(uuid), public.can_access_client(uuid) to authenticated;

-- WITH CHECK does not run for DELETE. Separate read access from PT mutations.
drop policy pday_access on public.program_days;
create policy pday_select on public.program_days for select to authenticated
  using (exists (select 1 from public.programs p where p.id = program_id));
create policy pday_pt_write on public.program_days for all to authenticated
  using (public.is_pt() and exists (
    select 1 from public.programs p where p.id = program_id and p.pt_id = auth.uid()
  ))
  with check (public.is_pt() and exists (
    select 1 from public.programs p where p.id = program_id and p.pt_id = auth.uid()
  ));

drop policy pex_access on public.program_exercises;
create policy pex_select on public.program_exercises for select to authenticated
  using (exists (select 1 from public.program_days d where d.id = program_day_id));
create policy pex_pt_write on public.program_exercises for all to authenticated
  using (public.is_pt() and exists (
    select 1 from public.program_days d join public.programs p on p.id = d.program_id
    where d.id = program_day_id and p.pt_id = auth.uid()
  ))
  with check (public.is_pt() and exists (
    select 1 from public.program_days d join public.programs p on p.id = d.program_id
    where d.id = program_day_id and p.pt_id = auth.uid()
  ));
revoke all on public.program_days, public.program_exercises from public, anon, authenticated;
grant select, insert, update, delete on public.program_days, public.program_exercises to authenticated;

-- Email alone is not proof of ownership. A later verified-invite transaction must
-- explicitly link the correct client. Existing links are intentionally preserved.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

commit;
