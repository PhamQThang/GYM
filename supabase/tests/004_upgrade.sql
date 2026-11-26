-- ONLY an empty disposable database with platform schemas already prepared.
\ir 003_upgrade.sql
\ir ../004_verified_invitations.sql
do $$ begin
  if not exists (select 1 from public.clients
    where id = '90000000-0000-4000-8000-000000000003'
      and user_id = '90000000-0000-4000-8000-000000000002') then
    raise exception 'Invitation migration changed an existing account link';
  end if;
end $$;
\ir 004_verified_invitations.sql
