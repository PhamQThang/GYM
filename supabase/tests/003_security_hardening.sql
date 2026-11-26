-- Run as the dev database owner with psql -v ON_ERROR_STOP=1 after migrations.
-- All fixtures and mutations are rolled back, including when an assertion fails.
begin;

insert into auth.users (id, email, raw_user_meta_data) values
('a0000000-0000-4000-8000-000000000001', 'pt-a@security-test.invalid', '{}'),
('a0000000-0000-4000-8000-000000000002', 'pt-b@security-test.invalid', '{}'),
('a0000000-0000-4000-8000-000000000003', 'client-a@security-test.invalid', '{"role":"pt"}'),
('a0000000-0000-4000-8000-000000000004', 'client-b@security-test.invalid', '{}');
update public.profiles set role = 'pt' where id in
('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002');
insert into public.clients (id, pt_id, user_id, full_name, email) values
('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'Client A', 'client-a@security-test.invalid'),
('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'Client B', 'client-b@security-test.invalid'),
('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', null, 'Unlinked', 'unlinked@security-test.invalid'),
('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', null, 'Same email, other PT', 'unlinked@security-test.invalid');
insert into auth.users (id, email, raw_user_meta_data) values
('a0000000-0000-4000-8000-000000000005', 'unlinked@security-test.invalid', '{"role":"pt"}');
insert into public.programs (id, pt_id, client_id, name) values
('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Program A'),
('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'Program B');
insert into public.program_days (id, program_id, name) values
('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Day A'),
('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'Day B');
insert into public.exercises (id, name, primary_muscle) values
('e0000000-0000-4000-8000-000000000001', 'Test exercise', 'Test');
insert into public.program_exercises (id, program_day_id, exercise_id) values
('f0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001'),
('f0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000001');

do $$ begin
  if exists (select 1 from public.clients where email = 'unlinked@security-test.invalid' and user_id is not null) then
    raise exception 'Email auto-link still enabled';
  end if;
  if exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000005' and role <> 'client') then
    raise exception 'Metadata elevated role';
  end if;
  if has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE')
     or has_table_privilege('authenticated', 'public.profiles', 'INSERT')
     or has_table_privilege('authenticated', 'public.profiles', 'DELETE')
     or has_function_privilege('anon', 'public.can_access_client(uuid)', 'EXECUTE') then
    raise exception 'Unexpected privileged grant';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000003', true);
do $$ declare affected integer; begin
  if (select count(*) from public.program_days) <> 1 or (select count(*) from public.program_exercises) <> 1 then
    raise exception 'Client A read scope incorrect';
  end if;
  delete from public.program_exercises;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Client A deleted exercises'; end if;
  delete from public.program_days;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Client A deleted days'; end if;
  update public.program_days set name = 'Unauthorized';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Client A updated days'; end if;
  update public.program_exercises set planned_sets = 10;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Client A updated exercises'; end if;
  begin
    insert into public.program_days (program_id, name) values ('c0000000-0000-4000-8000-000000000001', 'Forbidden');
    raise exception 'Client A inserted day';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.program_exercises (program_day_id, exercise_id) values
      ('d0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001');
    raise exception 'Client A inserted exercise';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set role = 'pt' where id = auth.uid();
    raise exception 'Client elevated own role';
  exception when insufficient_privilege then null; end;
  update public.profiles set full_name = 'Allowed rename' where id = auth.uid();
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Client cannot rename own profile'; end if;
  update public.profiles set full_name = 'Unauthorized' where id = 'a0000000-0000-4000-8000-000000000004';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Client updated another profile'; end if;
end $$;

select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000004', true);
do $$ declare affected integer; begin
  if (select count(*) from public.program_days) <> 1 or not exists
    (select 1 from public.program_days where name = 'Day B') then raise exception 'Client B read scope incorrect'; end if;
  delete from public.program_days;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Client B deleted days'; end if;
end $$;

select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000002', true);
do $$ declare affected integer; begin
  delete from public.program_days where id = 'd0000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'PT B deleted PT A day'; end if;
  update public.program_exercises set planned_sets = 10 where id = 'f0000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'PT B edited PT A exercise'; end if;
end $$;

reset role;
do $$ begin
  if (select count(*) from public.program_days where id in ('d0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002')) <> 2
    or (select count(*) from public.program_exercises where id in ('f0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002')) <> 2 then
    raise exception 'Unauthorized mutations changed actual database rows';
  end if;
end $$;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  begin
    perform * from public.program_days;
    raise exception 'Anonymous can query private days';
  exception when insufficient_privilege then null; end;
  begin
    perform public.can_access_client('b0000000-0000-4000-8000-000000000001');
    raise exception 'Anonymous can call helper';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
do $$ declare affected integer; begin
  update public.program_exercises set planned_sets = 5 where id = 'f0000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'PT A cannot edit own exercise'; end if;
  delete from public.program_exercises where id = 'f0000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'PT A cannot delete own exercise'; end if;
  delete from public.program_days where id = 'd0000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'PT A cannot delete own day'; end if;
end $$;
reset role;
rollback;
