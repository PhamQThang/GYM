-- ONLY for a brand-new disposable PostgreSQL instance without Supabase.
-- Minimal SQL test doubles, NOT a replacement for Supabase Auth/Storage testing.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
create schema auth;
create schema storage;
create table auth.users (
  id uuid primary key,
  email text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
grant usage on schema public, auth, storage to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- Mirror broad API table grants so that tests exercise RLS, not accidental denial.
alter default privileges in schema public grant all on tables to anon, authenticated;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(text) returns text[] language sql immutable as $$
  select string_to_array($1, '/');
$$;
