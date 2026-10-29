-- Idempotent supplemental migration for the legacy app schema.

create table if not exists public.daily_water (
  client_id uuid not null references public.clients(id) on delete cascade,
  log_date date not null,
  ml int not null check (ml >= 0),
  updated_at timestamptz not null default now(),
  primary key (client_id, log_date)
);
alter table public.daily_water enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'daily_water' and policyname = 'daily_water_client_access') then
    create policy daily_water_client_access on public.daily_water for all to authenticated
      using (public.can_access_client(client_id)) with check (public.can_access_client(client_id));
  end if;
end $$;

alter table public.clients add column if not exists target_weight_kg numeric(5,1);
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.clients'::regclass and conname = 'clients_target_weight_kg_check') then
    alter table public.clients add constraint clients_target_weight_kg_check check (target_weight_kg between 20 and 300);
  end if;
end $$;

create table if not exists public.meal_slots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  scheduled_time time,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists meal_slots_client_order_idx on public.meal_slots (client_id, order_index);
alter table public.meal_slots enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'meal_slots' and policyname = 'meal_slots_client_access') then
    create policy meal_slots_client_access on public.meal_slots for all to authenticated
      using (public.can_access_client(client_id)) with check (public.can_access_client(client_id));
  end if;
end $$;

-- Create one self-owned client row for each PT that does not already have one.
insert into public.clients (pt_id, user_id, full_name, email, height_cm, target_weight_kg)
select p.id, p.id, p.full_name, u.email, 175, 70
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'pt'
  and not exists (select 1 from public.clients c where c.user_id = p.id);

-- Seed default nutrition and meal slots for every PT's self-owned client.
insert into public.nutrition_profiles (client_id, target_kcal, protein_g, carbs_g, fat_g)
select c.id, 3000, 200, 350, 85
from public.clients c
join public.profiles p on p.id = c.user_id and p.role = 'pt'
where c.pt_id = c.user_id
on conflict (client_id) do nothing;

insert into public.meal_slots (client_id, name, scheduled_time, order_index)
select c.id, v.name, v.scheduled_time::time, v.order_index
from public.clients c
join public.profiles p on p.id = c.user_id and p.role = 'pt'
cross join (values
  ('Bữa sáng', '07:45', 0),
  ('Bữa trưa', '12:30', 1),
  ('Trước tập', '16:15', 2),
  ('Bữa tối', '20:00', 3)
) as v(name, scheduled_time, order_index)
where c.pt_id = c.user_id
  and not exists (
    select 1 from public.meal_slots ms
    where ms.client_id = c.id and ms.name = v.name
  );

-- Stable IDs preserve references to the old local exercise IDs.
insert into public.exercises (id, pt_id, name, primary_muscle, secondary_muscles, equipment)
values
  ('00000000-0000-4000-8000-000000000001', null, 'Đẩy Ngực Ngang Tạ Đòn', 'Ngực Giữa', array['Vai Trước', 'Tay Sau']::text[], 'Barbell'),
  ('00000000-0000-4000-8000-000000000002', null, 'Đẩy Ngực Dốc Lên (Máy Smith)', 'Ngực Trên', array['Vai Trước']::text[], 'Machine'),
  ('00000000-0000-4000-8000-000000000003', null, 'Ép Ngực Máy', 'Ngực Trong', array[]::text[], 'Machine'),
  ('00000000-0000-4000-8000-000000000004', null, 'Kéo Xô Rộng Tay', 'Xô', array['Bắp Tay Trước']::text[], 'Cable'),
  ('00000000-0000-4000-8000-000000000005', null, 'Ngồi Kéo Cáp Tập Lưng', 'Lưng Giữa', array['Cầu Vai', 'Xô']::text[], 'Cable'),
  ('00000000-0000-4000-8000-000000000006', null, 'Cuốn Cáp Cầm Ngửa', 'Bắp Tay Trước', array['Cẳng Tay']::text[], 'Cable'),
  ('00000000-0000-4000-8000-000000000007', null, 'Kéo Cáp Qua Đầu', 'Tay Sau', array[]::text[], 'Cable'),
  ('00000000-0000-4000-8000-000000000008', null, 'Gánh Tạ (Squat)', 'Đùi Trước', array['Mông', 'Lưng Dưới']::text[], 'Barbell'),
  ('00000000-0000-4000-8000-000000000009', null, 'Máy Đạp Đùi (Leg Press)', 'Đùi Trước', array['Mông']::text[], 'Machine'),
  ('00000000-0000-4000-8000-000000000010', null, 'Ngồi Cuốn Đùi Sau', 'Đùi Sau', array[]::text[], 'Machine'),
  ('00000000-0000-4000-8000-000000000011', null, 'Romanian Deadlift (RDL)', 'Đùi Sau', array['Mông', 'Lưng Dưới']::text[], 'Barbell'),
  ('00000000-0000-4000-8000-000000000012', null, 'Đẩy Tạ Đơn Qua Đầu', 'Vai Trước', array['Tay Sau']::text[], 'Dumbbell'),
  ('00000000-0000-4000-8000-000000000013', null, 'Kéo Cáp Dang Vai', 'Vai Giữa', array[]::text[], 'Cable'),
  ('00000000-0000-4000-8000-000000000014', null, 'Nhón Gót (Calf Raise)', 'Bắp Chân', array[]::text[], 'Machine')
on conflict (id) do update set
  name = excluded.name,
  primary_muscle = excluded.primary_muscle,
  secondary_muscles = excluded.secondary_muscles,
  equipment = excluded.equipment;
