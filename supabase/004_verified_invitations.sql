-- Verified, client-specific invitations. No email is sent by this migration.
begin;

create table public.client_invitations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  issued_by uuid not null references public.profiles(id),
  email text not null check (email = lower(btrim(email)) and email <> ''),
  token_hash text not null unique check (length(token_hash) = 64),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),
  check (expires_at > created_at and expires_at <= created_at + interval '7 days'),
  check ((accepted_at is null) = (accepted_by is null)),
  check (accepted_at is null or revoked_at is null)
);
create unique index client_invitations_pending_unique on public.client_invitations(client_id)
  where revoked_at is null and accepted_at is null;
alter table public.client_invitations enable row level security;
revoke all on public.client_invitations from public, anon, authenticated;
grant select (id, client_id, issued_by, email, created_at, expires_at, revoked_at, accepted_at, accepted_by)
  on public.client_invitations to authenticated;
create policy invitation_pt_read on public.client_invitations for select to authenticated
  using (public.is_pt_of(client_id));

-- API callers cannot bypass verified acceptance by directly setting user_id.
-- Only the table owner (including the owner-run acceptance RPC) can change links.
create function public.guard_client_account_link()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (tg_op = 'INSERT' and new.user_id is not null)
    or (tg_op = 'UPDATE' and new.user_id is distinct from old.user_id) then
    if current_user <> pg_catalog.pg_get_userbyid(
      (select relowner from pg_catalog.pg_class where oid = 'public.clients'::regclass)
    ) then
      raise exception 'Client account links require verified invitation acceptance' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.guard_client_account_link() from public, anon, authenticated;
create trigger clients_guard_account_link before insert or update of user_id on public.clients
  for each row execute function public.guard_client_account_link();

create function public.issue_client_invitation(p_client_id uuid)
returns table(invitation_id uuid, token text, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_client public.clients%rowtype;
  v_token text;
  v_now timestamptz := clock_timestamp();
begin
  if not public.is_pt() then raise exception 'Invitation permission denied' using errcode = '42501'; end if;
  select * into v_client from public.clients where id = p_client_id for update;
  if not found or v_client.pt_id <> auth.uid() or v_client.user_id is not null
    or v_client.archived_at is not null or v_client.status <> 'active'
    or nullif(btrim(v_client.email), '') is null then
    raise exception 'Client is not eligible for invitation' using errcode = '42501';
  end if;
  update public.client_invitations set revoked_at = v_now
    where client_id = p_client_id and revoked_at is null and accepted_at is null;
  -- Two independent UUIDv4 values provide 244 random bits; only the hash persists.
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  return query insert into public.client_invitations as i
    (client_id, issued_by, email, token_hash, created_at, expires_at)
    values (p_client_id, auth.uid(), lower(btrim(v_client.email)),
      encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), v_now, v_now + interval '7 days')
    returning i.id, v_token, i.expires_at;
end $$;

create function public.revoke_client_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_client_id uuid; v_client public.clients%rowtype;
begin
  if not public.is_pt() then raise exception 'Invitation permission denied' using errcode = '42501'; end if;
  select client_id into v_client_id from public.client_invitations where id = p_invitation_id;
  select * into v_client from public.clients where id = v_client_id for update;
  if not found or v_client.pt_id <> auth.uid() then
    raise exception 'Invitation permission denied' using errcode = '42501';
  end if;
  update public.client_invitations set revoked_at = clock_timestamp()
    where id = p_invitation_id and revoked_at is null and accepted_at is null;
end $$;

create function public.accept_client_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
  v_id uuid;
  v_client_id uuid;
  v_invite public.client_invitations%rowtype;
  v_client public.clients%rowtype;
begin
  if v_uid is null or p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid invitation' using errcode = '42501';
  end if;
  -- Serializes concurrent acceptance of different invitations by one account.
  select lower(btrim(email)), email_confirmed_at into v_email, v_confirmed
    from auth.users where id = v_uid for update;
  if not found or v_confirmed is null or not exists (
    select 1 from public.profiles where id = v_uid and role = 'client'
  ) or exists (select 1 from public.clients where user_id = v_uid) then
    raise exception 'Account is not eligible for invitation' using errcode = '42501';
  end if;
  select id, client_id into v_id, v_client_id from public.client_invitations
    where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  if not found then raise exception 'Invalid invitation' using errcode = '42501'; end if;
  -- Same lock order as issue/revoke: client first, invitation second.
  select * into v_client from public.clients where id = v_client_id for update;
  select * into v_invite from public.client_invitations where id = v_id for update;
  if v_invite.accepted_at is not null or v_invite.revoked_at is not null
    or v_invite.expires_at <= clock_timestamp() or v_client.user_id is not null
    or v_client.archived_at is not null or v_client.status <> 'active'
    or v_email is distinct from v_invite.email
    or lower(btrim(v_client.email)) is distinct from v_invite.email
    or v_client.pt_id <> v_invite.issued_by
    or not exists (select 1 from public.profiles where id = v_client.pt_id and role = 'pt') then
    raise exception 'Invalid invitation' using errcode = '42501';
  end if;
  update public.clients set user_id = v_uid where id = v_client.id;
  update public.client_invitations set accepted_at = clock_timestamp(), accepted_by = v_uid where id = v_invite.id;
  return v_client.id;
end $$;
revoke execute on function public.issue_client_invitation(uuid), public.revoke_client_invitation(uuid),
  public.accept_client_invitation(text) from public, anon;
grant execute on function public.issue_client_invitation(uuid), public.revoke_client_invitation(uuid),
  public.accept_client_invitation(text) to authenticated;

commit;
