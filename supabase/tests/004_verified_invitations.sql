-- Owner connection on disposable dev DB, after 001..004. All changes roll back.
begin;
create function pg_temp.denied(statement text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when insufficient_privilege then return; end;
  raise exception 'Expected permission denial: %', statement;
end $$;
create temp table invitation_tokens (label text primary key, invitation_id uuid, token text, expires_at timestamptz);
grant all on invitation_tokens to authenticated;
insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data) values
('a4000000-0000-4000-8000-000000000001', 'pt-a@invite-test.invalid', now(), '{}'),
('a4000000-0000-4000-8000-000000000002', 'pt-b@invite-test.invalid', now(), '{}'),
('a4000000-0000-4000-8000-000000000003', 'alice@invite-test.invalid', now(), '{}'),
('a4000000-0000-4000-8000-000000000004', 'wrong@invite-test.invalid', now(), '{}'),
('a4000000-0000-4000-8000-000000000005', 'unverified@invite-test.invalid', null, '{}');
update public.profiles set role = 'pt' where id in ('a4000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000002');
insert into public.clients(id, pt_id, full_name, email) values
('b4000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'Alice A', ' Alice@invite-test.invalid '),
('b4000000-0000-4000-8000-000000000002', 'a4000000-0000-4000-8000-000000000002', 'Alice B', 'alice@invite-test.invalid'),
('b4000000-0000-4000-8000-000000000003', 'a4000000-0000-4000-8000-000000000001', 'Unverified', 'unverified@invite-test.invalid'),
('b4000000-0000-4000-8000-000000000004', 'a4000000-0000-4000-8000-000000000001', 'PT role', 'pt-a@invite-test.invalid');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a4000000-0000-4000-8000-000000000001', true);
insert into invitation_tokens select 'replaced', i.* from public.issue_client_invitation('b4000000-0000-4000-8000-000000000001') i;
insert into invitation_tokens select 'valid', i.* from public.issue_client_invitation('b4000000-0000-4000-8000-000000000001') i;
insert into invitation_tokens select 'unverified', i.* from public.issue_client_invitation('b4000000-0000-4000-8000-000000000003') i;
insert into invitation_tokens select 'pt-role', i.* from public.issue_client_invitation('b4000000-0000-4000-8000-000000000004') i;
select pg_temp.denied('select token_hash from public.client_invitations');
select pg_temp.denied($q$update public.clients set user_id = 'a4000000-0000-4000-8000-000000000003' where id = 'b4000000-0000-4000-8000-000000000001'$q$);
select pg_temp.denied($q$insert into public.clients (pt_id, user_id, full_name) values ('a4000000-0000-4000-8000-000000000001','a4000000-0000-4000-8000-000000000003','Bypass')$q$);
select pg_temp.denied(format('select public.accept_client_invitation(%L)', (select token from invitation_tokens where label = 'pt-role')));

select set_config('request.jwt.claim.sub', 'a4000000-0000-4000-8000-000000000002', true);
select pg_temp.denied($q$select public.issue_client_invitation('b4000000-0000-4000-8000-000000000001')$q$);
select pg_temp.denied(format('select public.revoke_client_invitation(%L)', (select invitation_id from invitation_tokens where label = 'valid')));
insert into invitation_tokens select 'other-client', i.* from public.issue_client_invitation('b4000000-0000-4000-8000-000000000002') i;
do $$ begin
  if exists (select 1 from public.client_invitations where client_id = 'b4000000-0000-4000-8000-000000000001') then raise exception 'PT B sees PT A invitations'; end if;
end $$;

select set_config('request.jwt.claim.sub', 'a4000000-0000-4000-8000-000000000004', true);
select pg_temp.denied(format('select public.accept_client_invitation(%L)', (select token from invitation_tokens where label = 'valid')));
select set_config('request.jwt.claim.sub', 'a4000000-0000-4000-8000-000000000005', true);
select pg_temp.denied(format('select public.accept_client_invitation(%L)', (select token from invitation_tokens where label = 'unverified')));
select set_config('request.jwt.claim.sub', 'a4000000-0000-4000-8000-000000000003', true);
select pg_temp.denied(format('select public.accept_client_invitation(%L)', (select token from invitation_tokens where label = 'replaced')));
select pg_temp.denied($q$select public.accept_client_invitation('not-a-token')$q$);
select pg_temp.denied($q$select public.issue_client_invitation('b4000000-0000-4000-8000-000000000001')$q$);

reset role;
update public.clients set archived_at = now() where id = 'b4000000-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.denied(format('select public.accept_client_invitation(%L)', (select token from invitation_tokens where label = 'valid')));
select set_config('request.jwt.claim.sub', 'a4000000-0000-4000-8000-000000000001', true);
select pg_temp.denied($q$select public.issue_client_invitation('b4000000-0000-4000-8000-000000000001')$q$);
reset role;
update public.clients set archived_at = null, status = 'inactive' where id = 'b4000000-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.denied($q$select public.issue_client_invitation('b4000000-0000-4000-8000-000000000001')$q$);
select set_config('request.jwt.claim.sub', 'a4000000-0000-4000-8000-000000000003', true);
select pg_temp.denied(format('select public.accept_client_invitation(%L)', (select token from invitation_tokens where label = 'valid')));
reset role;
update public.clients set status = 'active', email = 'changed@invite-test.invalid' where id = 'b4000000-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.denied(format('select public.accept_client_invitation(%L)', (select token from invitation_tokens where label = 'valid')));
reset role;
update public.clients set email = ' Alice@invite-test.invalid ' where id = 'b4000000-0000-4000-8000-000000000001';
update public.client_invitations set created_at = now() - interval '8 days', expires_at = now() - interval '1 day'
  where id = (select invitation_id from invitation_tokens where label = 'valid');
set local role authenticated;
select pg_temp.denied(format('select public.accept_client_invitation(%L)', (select token from invitation_tokens where label = 'valid')));
select set_config('request.jwt.claim.sub', 'a4000000-0000-4000-8000-000000000001', true);
insert into invitation_tokens select 'revoked', i.* from public.issue_client_invitation('b4000000-0000-4000-8000-000000000001') i;
select public.revoke_client_invitation((select invitation_id from invitation_tokens where label = 'revoked'));
select public.revoke_client_invitation((select invitation_id from invitation_tokens where label = 'revoked'));
insert into invitation_tokens select 'final', i.* from public.issue_client_invitation('b4000000-0000-4000-8000-000000000001') i;
select set_config('request.jwt.claim.sub', 'a4000000-0000-4000-8000-000000000003', true);
select pg_temp.denied(format('select public.accept_client_invitation(%L)', (select token from invitation_tokens where label = 'revoked')));
do $$ declare linked uuid; begin
  linked := public.accept_client_invitation((select token from invitation_tokens where label = 'final'));
  if linked <> 'b4000000-0000-4000-8000-000000000001' then raise exception 'Wrong client linked'; end if;
end $$;
select pg_temp.denied(format('select public.accept_client_invitation(%L)', (select token from invitation_tokens where label = 'final')));
select pg_temp.denied(format('select public.accept_client_invitation(%L)', (select token from invitation_tokens where label = 'other-client')));
select set_config('request.jwt.claim.sub', 'a4000000-0000-4000-8000-000000000001', true);
select pg_temp.denied($q$update public.clients set user_id = null where id = 'b4000000-0000-4000-8000-000000000001'$q$);
select pg_temp.denied($q$select public.issue_client_invitation('b4000000-0000-4000-8000-000000000001')$q$);
reset role;
do $$ begin
  if (select count(*) from public.clients where user_id = 'a4000000-0000-4000-8000-000000000003') <> 1 then raise exception 'Incorrect linked row count'; end if;
  if (select count(*) from public.client_invitations where accepted_by = 'a4000000-0000-4000-8000-000000000003') <> 1 then raise exception 'Incorrect consumed invite count'; end if;
  if exists (select 1 from public.client_invitations i join invitation_tokens t on i.id = t.invitation_id
    where i.token_hash <> encode(sha256(convert_to(t.token, 'UTF8')), 'hex') or length(t.token) <> 64) then raise exception 'Token storage/generation invalid'; end if;
  if has_function_privilege('anon', 'public.accept_client_invitation(text)', 'EXECUTE')
    or has_table_privilege('authenticated', 'public.client_invitations', 'UPDATE') then raise exception 'Unsafe invite grants'; end if;
end $$;
set local role anon;
select pg_temp.denied($q$select public.accept_client_invitation(repeat('a', 64))$q$);
reset role;
rollback;
