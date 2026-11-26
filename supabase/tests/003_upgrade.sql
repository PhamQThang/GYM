-- Destructive-schema setup: use ONLY an empty disposable dev database.
-- Supabase platform schemas (or postgres_shim.sql on plain PostgreSQL) must exist.
\ir ../001_schema.sql
\ir ../002_migration.sql

insert into auth.users (id, email, raw_user_meta_data) values
('90000000-0000-4000-8000-000000000001', 'existing-pt@security-test.invalid', '{}'),
('90000000-0000-4000-8000-000000000002', 'existing-client@security-test.invalid', '{}');
update public.profiles set role = 'pt' where id = '90000000-0000-4000-8000-000000000001';
insert into public.clients (id, pt_id, user_id, full_name) values
('90000000-0000-4000-8000-000000000003', '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000002', 'Existing linked client');
insert into public.programs (id, pt_id, client_id, name) values
('90000000-0000-4000-8000-000000000004', '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000003', 'Existing program');
insert into public.program_days (id, program_id, name) values
('90000000-0000-4000-8000-000000000005', '90000000-0000-4000-8000-000000000004', 'Existing day');
-- Table-level REVOKE alone must not leave a previously granted role column writable.
grant update (role) on public.profiles to authenticated;

\ir ../003_security_hardening.sql

do $$ begin
  if not exists (select 1 from public.clients
    where id = '90000000-0000-4000-8000-000000000003'
      and user_id = '90000000-0000-4000-8000-000000000002'
      and full_name = 'Existing linked client') then
    raise exception 'Upgrade changed existing client linkage';
  end if;
  if not exists (select 1 from public.program_days
    where id = '90000000-0000-4000-8000-000000000005' and name = 'Existing day') then
    raise exception 'Upgrade changed existing program data';
  end if;
end $$;
\ir 003_security_hardening.sql
