-- =====================================================================
-- PT App – Supabase schema v0.1 (theo SRS ngày 28/10/2026)
-- Chạy file này trong Supabase Dashboard → SQL Editor → New query.
--
-- Vai trò:
--   pt     : huấn luyện viên, quản lý học viên của mình
--   client : học viên, chỉ thấy dữ liệu của chính mình
--
-- Nguyên tắc:
--   * Mọi bảng đều bật Row Level Security (RLS).
--   * Số liệu tính được (buổi đã dùng, công nợ…) lấy qua VIEW, không lưu trùng.
--   * Không xóa cứng dữ liệu nghiệp vụ; dùng status / archived_at.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Kiểu dữ liệu liệt kê
-- ---------------------------------------------------------------------
create type public.user_role         as enum ('pt', 'client');
create type public.client_status     as enum ('active', 'paused', 'inactive');
create type public.training_mode     as enum ('offline', 'online');
create type public.package_mode      as enum ('offline', 'online', 'hybrid');
create type public.package_status    as enum ('active', 'paused', 'expired', 'completed', 'cancelled');
-- attended = Đã tập | excused = Vắng có báo (KHÔNG trừ buổi) | no_show = Vắng không báo (trừ buổi)
create type public.session_status    as enum ('scheduled', 'attended', 'excused', 'no_show', 'rescheduled', 'cancelled');
create type public.payment_method    as enum ('cash', 'bank_transfer', 'other');
create type public.set_status        as enum ('planned', 'completed', 'skipped');
create type public.meal_log_status   as enum ('as_planned', 'adjusted', 'skipped', 'off_plan');

-- ---------------------------------------------------------------------
-- 1. Hàm tiện ích chung
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 2. Tài khoản và học viên
-- ---------------------------------------------------------------------
-- Một dòng cho mỗi tài khoản đăng nhập (auth.users).
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        public.user_role not null default 'client',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Hồ sơ học viên do PT tạo. user_id để trống cho tới khi học viên được mời
-- và đăng nhập lần đầu (giai đoạn 3). PT vẫn quản lý được học viên chưa có tài khoản.
create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  pt_id         uuid not null references public.profiles(id),
  user_id       uuid unique references auth.users(id) on delete set null,
  full_name     text not null,
  phone         text,
  email         text,
  gender        text check (gender in ('male', 'female', 'other')),
  birth_year    int  check (birth_year between 1930 and 2020),
  height_cm     numeric(5,1) check (height_cm between 100 and 250),
  goal          text,                       -- giảm mỡ, tăng cơ, giữ dáng…
  health_notes  text,                       -- chấn thương, bệnh lý
  start_date    date not null default current_date,
  status        public.client_status not null default 'active',
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.clients (pt_id, status);
create unique index clients_pt_email_uq on public.clients (pt_id, lower(email)) where email is not null;

-- ---------------------------------------------------------------------
-- 3. Hàm phân quyền (security definer để tránh vòng lặp RLS)
-- ---------------------------------------------------------------------
create or replace function public.is_pt()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'pt');
$$;

-- PT của học viên đang đăng nhập (null nếu không phải học viên)
create or replace function public.my_pt_id()
returns uuid language sql stable security definer set search_path = public as $$
  select pt_id from clients where user_id = auth.uid() limit 1;
$$;

-- client_id của học viên đang đăng nhập
create or replace function public.my_client_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from clients where user_id = auth.uid() limit 1;
$$;

-- Người đang đăng nhập là PT của học viên này?
create or replace function public.is_pt_of(p_client_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from clients where id = p_client_id and pt_id = auth.uid());
$$;

-- Người đang đăng nhập là PT của học viên, hoặc chính học viên đó?
create or replace function public.can_access_client(p_client_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from clients
    where id = p_client_id and (pt_id = auth.uid() or user_id = auth.uid())
  );
$$;

-- ---------------------------------------------------------------------
-- 4. Gói tập, gia hạn, thanh toán
-- ---------------------------------------------------------------------
create table public.package_templates (
  id             uuid primary key default gen_random_uuid(),
  pt_id          uuid not null references public.profiles(id),
  name           text not null,
  sessions       int  not null check (sessions > 0),
  price_vnd      bigint not null check (price_vnd >= 0),
  duration_days  int  not null check (duration_days > 0),
  mode           public.package_mode not null default 'offline',
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.client_packages (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id),
  template_id     uuid references public.package_templates(id),
  name            text not null,
  sessions_total  int  not null check (sessions_total > 0),
  price_vnd       bigint not null check (price_vnd >= 0),   -- giá thực sau giảm giá
  mode            public.package_mode not null default 'offline',
  start_date      date not null default current_date,
  end_date        date not null,
  status          public.package_status not null default 'active',
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (end_date >= start_date)
);
create index on public.client_packages (client_id, status);

-- GT-09: gia hạn gói hết hạn mà còn buổi
create table public.package_extensions (
  id            uuid primary key default gen_random_uuid(),
  package_id    uuid not null references public.client_packages(id),
  old_end_date  date not null,
  new_end_date  date not null,
  reason        text,
  created_at    timestamptz not null default now(),
  check (new_end_date > old_end_date)
);

create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  package_id  uuid not null references public.client_packages(id),
  amount_vnd  bigint not null check (amount_vnd > 0),
  paid_on     date not null default current_date,
  method      public.payment_method not null default 'bank_transfer',
  note        text,
  created_at  timestamptz not null default now()
);
create index on public.payments (package_id);

-- ---------------------------------------------------------------------
-- 5. Lịch tập và điểm danh
-- ---------------------------------------------------------------------
create table public.training_sessions (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id),
  package_id      uuid references public.client_packages(id),
  starts_at       timestamptz not null,
  duration_min    int not null default 60 check (duration_min between 15 and 240),
  mode            public.training_mode not null default 'offline',
  online_link     text,
  status          public.session_status not null default 'scheduled',
  program_day_id  uuid,                -- FK thêm ở mục 7
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.training_sessions (starts_at);
create index on public.training_sessions (client_id, starts_at);
create index on public.training_sessions (package_id, status);

-- ---------------------------------------------------------------------
-- 6. Chỉ số cơ thể
-- ---------------------------------------------------------------------
create table public.body_metrics (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id),
  measured_on   date not null default current_date,
  weight_kg     numeric(5,1) check (weight_kg between 20 and 300),
  body_fat_pct  numeric(4,1) check (body_fat_pct between 2 and 70),
  chest_cm      numeric(5,1),
  waist_cm      numeric(5,1),
  hip_cm        numeric(5,1),
  thigh_cm      numeric(5,1),
  arm_cm        numeric(5,1),
  photo_paths   text[] not null default '{}',   -- đường dẫn trong bucket progress-photos
  note          text,
  created_by    uuid default auth.uid(),
  created_at    timestamptz not null default now()
);
create index on public.body_metrics (client_id, measured_on desc);

-- ---------------------------------------------------------------------
-- 7. Bài tập, giáo án, nhật ký tập
-- ---------------------------------------------------------------------
-- pt_id null = bài tập hệ thống, ai cũng xem được
create table public.exercises (
  id                 uuid primary key default gen_random_uuid(),
  pt_id              uuid references public.profiles(id),
  name               text not null,
  primary_muscle     text not null,
  secondary_muscles  text[] not null default '{}',
  equipment          text,
  video_url          text,
  instructions       text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);

-- client_id null = giáo án mẫu của PT
create table public.programs (
  id           uuid primary key default gen_random_uuid(),
  pt_id        uuid not null references public.profiles(id),
  client_id    uuid references public.clients(id),
  name         text not null,
  description  text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.program_days (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references public.programs(id) on delete cascade,
  name        text not null,              -- Push, Pull, Chân…
  day_index   int  not null default 0,
  focus       text,
  notes       text
);

create table public.program_exercises (
  id                uuid primary key default gen_random_uuid(),
  program_day_id    uuid not null references public.program_days(id) on delete cascade,
  exercise_id       uuid not null references public.exercises(id),
  order_index       int  not null default 0,
  planned_sets      int  not null default 3 check (planned_sets between 1 and 20),
  rep_min           int  not null default 8,
  rep_max           int  not null default 12,
  target_weight_kg  numeric(6,2),
  rest_seconds      int  not null default 90,
  notes             text,
  check (rep_max >= rep_min)
);

alter table public.training_sessions
  add constraint training_sessions_program_day_fk
  foreign key (program_day_id) references public.program_days(id) on delete set null;

-- Một lần tập thực tế (học viên tự ghi, hoặc PT ghi trong buổi dạy)
create table public.workout_logs (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid not null references public.clients(id),
  training_session_id  uuid references public.training_sessions(id) on delete set null,
  program_day_id       uuid references public.program_days(id) on delete set null,
  started_at           timestamptz not null default now(),
  ended_at             timestamptz,
  note                 text,
  created_by           uuid default auth.uid(),
  created_at           timestamptz not null default now()
);
create index on public.workout_logs (client_id, started_at desc);

create table public.workout_sets (
  id                   uuid primary key default gen_random_uuid(),
  workout_log_id       uuid not null references public.workout_logs(id) on delete cascade,
  exercise_id          uuid not null references public.exercises(id),
  program_exercise_id  uuid references public.program_exercises(id) on delete set null,
  set_number           int not null check (set_number > 0),
  weight_kg            numeric(6,2) not null default 0,
  reps                 int not null default 0,
  status               public.set_status not null default 'completed',
  created_at           timestamptz not null default now()
);
create index on public.workout_sets (workout_log_id);
create index on public.workout_sets (exercise_id);

-- ---------------------------------------------------------------------
-- 8. Dinh dưỡng
-- ---------------------------------------------------------------------
create table public.nutrition_profiles (
  client_id           uuid primary key references public.clients(id),
  activity_factor     numeric(4,3) not null default 1.375 check (activity_factor between 1.2 and 1.9),
  meals_per_day       int not null default 4 check (meals_per_day between 1 and 8),
  dislikes            text,
  allergies           text,
  medical_conditions  text,          -- có nội dung → giao diện hiện cảnh báo DD-09
  is_pregnant         boolean not null default false,
  target_kcal         int,
  protein_g           int,
  carbs_g             int,
  fat_g               int,
  updated_at          timestamptz not null default now()
);

-- Thực phẩm tính theo 100g. pt_id null = dữ liệu hệ thống.
-- Món ăn ngoài (phở, cơm tấm…) cũng nằm ở đây với unit = 'phần'.
create table public.foods (
  id                 uuid primary key default gen_random_uuid(),
  pt_id              uuid references public.profiles(id),
  name               text not null,
  unit               text not null default 'g',        -- g, quả, chén, muỗng, phần
  unit_grams         numeric(7,1) not null default 1,  -- 1 đơn vị = bao nhiêu gram
  kcal_per_100g      numeric(6,1) not null check (kcal_per_100g >= 0),
  protein_per_100g   numeric(5,1) not null default 0,
  carbs_per_100g     numeric(5,1) not null default 0,
  fat_per_100g       numeric(5,1) not null default 0,
  is_eating_out      boolean not null default false,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);
create index on public.foods (lower(name));

-- Món tự nấu ghép từ nhiều thực phẩm
create table public.dishes (
  id          uuid primary key default gen_random_uuid(),
  pt_id       uuid references public.profiles(id),
  name        text not null,
  servings    numeric(4,1) not null default 1 check (servings > 0),  -- công thức cho bao nhiêu phần
  notes       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.dish_ingredients (
  dish_id  uuid not null references public.dishes(id) on delete cascade,
  food_id  uuid not null references public.foods(id),
  grams    numeric(7,1) not null check (grams > 0),
  primary key (dish_id, food_id)
);

-- client_id null = thực đơn mẫu
create table public.meal_plans (
  id           uuid primary key default gen_random_uuid(),
  pt_id        uuid not null references public.profiles(id),
  client_id    uuid references public.clients(id),
  name         text not null,
  target_kcal  int,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.meal_plan_items (
  id            uuid primary key default gen_random_uuid(),
  meal_plan_id  uuid not null references public.meal_plans(id) on delete cascade,
  day_index     int  not null default 0 check (day_index between 0 and 6),  -- 0 = Thứ 2
  meal_name     text not null,               -- Sáng, Trưa, Phụ, Tối
  order_index   int  not null default 0,
  dish_id       uuid references public.dishes(id),
  food_id       uuid references public.foods(id),
  servings      numeric(4,2),                -- dùng với dish
  grams         numeric(7,1),                -- dùng với food
  check ((dish_id is not null and servings is not null and food_id is null)
      or (food_id is not null and grams is not null and dish_id is null))
);

-- Nhật ký ăn. Calo/macro được tính và LƯU lại lúc ghi (snapshot),
-- để sửa thư viện món về sau không làm đổi số liệu cũ.
create table public.meal_logs (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references public.clients(id),
  log_date           date not null default current_date,
  meal_name          text not null,
  status             public.meal_log_status not null,
  meal_plan_item_id  uuid references public.meal_plan_items(id) on delete set null,
  dish_id            uuid references public.dishes(id),
  food_id            uuid references public.foods(id),
  description        text,                  -- tên hiển thị, ví dụ "Phở bò tái"
  kcal               numeric(6,1) not null default 0,
  protein_g          numeric(6,1) not null default 0,
  carbs_g            numeric(6,1) not null default 0,
  fat_g              numeric(6,1) not null default 0,
  photo_path         text,
  created_by         uuid default auth.uid(),
  created_at         timestamptz not null default now()
);
create index on public.meal_logs (client_id, log_date);

-- ---------------------------------------------------------------------
-- 9. Trigger
-- ---------------------------------------------------------------------
create trigger profiles_updated   before update on public.profiles          for each row execute function public.set_updated_at();
create trigger clients_updated    before update on public.clients           for each row execute function public.set_updated_at();
create trigger pkgtpl_updated     before update on public.package_templates for each row execute function public.set_updated_at();
create trigger pkg_updated        before update on public.client_packages   for each row execute function public.set_updated_at();
create trigger sessions_updated   before update on public.training_sessions for each row execute function public.set_updated_at();
create trigger programs_updated   before update on public.programs          for each row execute function public.set_updated_at();
create trigger mealplans_updated  before update on public.meal_plans        for each row execute function public.set_updated_at();
create trigger nutrition_updated  before update on public.nutrition_profiles for each row execute function public.set_updated_at();

-- Khi có tài khoản mới: tạo profile (mặc định 'client') và tự nối với
-- hồ sơ học viên mà PT đã tạo trước bằng cùng email.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  update clients
     set user_id = new.id
   where user_id is null
     and email is not null
     and lower(email) = lower(new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Gia hạn gói: ghi lịch sử xong thì tự cập nhật end_date và mở lại gói
create or replace function public.apply_package_extension()
returns trigger language plpgsql as $$
begin
  update client_packages
     set end_date = new.new_end_date,
         status   = case when status = 'expired' then 'active' else status end
   where id = new.package_id;
  return new;
end $$;

create trigger package_extension_applied
  after insert on public.package_extensions
  for each row execute function public.apply_package_extension();

-- ---------------------------------------------------------------------
-- 10. View tính toán (security_invoker để RLS vẫn áp dụng)
-- ---------------------------------------------------------------------
-- Buổi đã dùng: chỉ 'attended' và 'no_show' (GT-03, GT-08)
create view public.client_package_summary
with (security_invoker = true) as
select
  p.*,
  coalesce(s.used, 0)                              as sessions_used,
  p.sessions_total - coalesce(s.used, 0)           as sessions_left,
  coalesce(pay.paid, 0)                            as paid_vnd,
  p.price_vnd - coalesce(pay.paid, 0)              as debt_vnd,
  (p.end_date - current_date)                      as days_left
from public.client_packages p
left join (
  select package_id, count(*)::int as used
  from public.training_sessions
  where status in ('attended', 'no_show')
  group by package_id
) s on s.package_id = p.id
left join (
  select package_id, sum(amount_vnd)::bigint as paid
  from public.payments
  group by package_id
) pay on pay.package_id = p.id;

-- Tổng calo/macro theo ngày (DD-08)
create view public.daily_nutrition
with (security_invoker = true) as
select
  client_id,
  log_date,
  sum(kcal)       as kcal,
  sum(protein_g)  as protein_g,
  sum(carbs_g)    as carbs_g,
  sum(fat_g)      as fat_g,
  count(*) filter (where status = 'as_planned') as meals_as_planned,
  count(*)                                       as meals_logged
from public.meal_logs
group by client_id, log_date;

-- ---------------------------------------------------------------------
-- 11. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.clients             enable row level security;
alter table public.package_templates   enable row level security;
alter table public.client_packages     enable row level security;
alter table public.package_extensions  enable row level security;
alter table public.payments            enable row level security;
alter table public.training_sessions   enable row level security;
alter table public.body_metrics        enable row level security;
alter table public.exercises           enable row level security;
alter table public.programs            enable row level security;
alter table public.program_days        enable row level security;
alter table public.program_exercises   enable row level security;
alter table public.workout_logs        enable row level security;
alter table public.workout_sets        enable row level security;
alter table public.nutrition_profiles  enable row level security;
alter table public.foods               enable row level security;
alter table public.dishes              enable row level security;
alter table public.dish_ingredients    enable row level security;
alter table public.meal_plans          enable row level security;
alter table public.meal_plan_items     enable row level security;
alter table public.meal_logs           enable row level security;

-- profiles: tự xem/sửa tên của mình; PT xem được profile học viên của mình.
-- Không ai tự đổi được role (chỉ cấp quyền update cột full_name).
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid()
         or exists (select 1 from public.clients c where c.user_id = profiles.id and c.pt_id = auth.uid()));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant  update (full_name) on public.profiles to authenticated;

-- clients
create policy clients_pt_all on public.clients for all to authenticated
  using (pt_id = auth.uid()) with check (pt_id = auth.uid() and public.is_pt());
create policy clients_self_select on public.clients for select to authenticated
  using (user_id = auth.uid());

-- package_templates: PT quản lý gói của mình
create policy pkgtpl_pt_all on public.package_templates for all to authenticated
  using (pt_id = auth.uid()) with check (pt_id = auth.uid() and public.is_pt());

-- Gói, gia hạn, thanh toán, lịch: PT toàn quyền, học viên chỉ xem
create policy pkg_pt_all on public.client_packages for all to authenticated
  using (public.is_pt_of(client_id)) with check (public.is_pt_of(client_id));
create policy pkg_client_select on public.client_packages for select to authenticated
  using (client_id = public.my_client_id());

create policy ext_pt_all on public.package_extensions for all to authenticated
  using (exists (select 1 from public.client_packages p where p.id = package_id and public.is_pt_of(p.client_id)))
  with check (exists (select 1 from public.client_packages p where p.id = package_id and public.is_pt_of(p.client_id)));
create policy ext_client_select on public.package_extensions for select to authenticated
  using (exists (select 1 from public.client_packages p where p.id = package_id and p.client_id = public.my_client_id()));

create policy pay_pt_all on public.payments for all to authenticated
  using (exists (select 1 from public.client_packages p where p.id = package_id and public.is_pt_of(p.client_id)))
  with check (exists (select 1 from public.client_packages p where p.id = package_id and public.is_pt_of(p.client_id)));
create policy pay_client_select on public.payments for select to authenticated
  using (exists (select 1 from public.client_packages p where p.id = package_id and p.client_id = public.my_client_id()));

create policy ses_pt_all on public.training_sessions for all to authenticated
  using (public.is_pt_of(client_id)) with check (public.is_pt_of(client_id));
create policy ses_client_select on public.training_sessions for select to authenticated
  using (client_id = public.my_client_id());

-- Chỉ số cơ thể: cả PT và học viên đều ghi được
create policy bm_access on public.body_metrics for all to authenticated
  using (public.can_access_client(client_id)) with check (public.can_access_client(client_id));

-- Bài tập: xem bài hệ thống + của PT mình; PT sửa bài của mình
create policy ex_select on public.exercises for select to authenticated
  using (pt_id is null or pt_id = auth.uid() or pt_id = public.my_pt_id());
create policy ex_pt_write on public.exercises for insert to authenticated
  with check (pt_id = auth.uid() and public.is_pt());
create policy ex_pt_update on public.exercises for update to authenticated
  using (pt_id = auth.uid()) with check (pt_id = auth.uid());

-- Giáo án: PT toàn quyền giáo án của mình; học viên xem giáo án gán cho mình
create policy prog_pt_all on public.programs for all to authenticated
  using (pt_id = auth.uid())
  with check (pt_id = auth.uid() and public.is_pt() and (client_id is null or public.is_pt_of(client_id)));
create policy prog_client_select on public.programs for select to authenticated
  using (client_id is not null and client_id = public.my_client_id());

create policy pday_access on public.program_days for all to authenticated
  using (exists (select 1 from public.programs p where p.id = program_id))      -- RLS của programs lọc sẵn
  with check (exists (select 1 from public.programs p where p.id = program_id and p.pt_id = auth.uid()));

create policy pex_access on public.program_exercises for all to authenticated
  using (exists (select 1 from public.program_days d where d.id = program_day_id))
  with check (exists (select 1 from public.program_days d join public.programs p on p.id = d.program_id
                      where d.id = program_day_id and p.pt_id = auth.uid()));

-- Nhật ký tập: PT và học viên đều ghi được
create policy wl_access on public.workout_logs for all to authenticated
  using (public.can_access_client(client_id)) with check (public.can_access_client(client_id));
create policy ws_access on public.workout_sets for all to authenticated
  using (exists (select 1 from public.workout_logs w where w.id = workout_log_id))
  with check (exists (select 1 from public.workout_logs w where w.id = workout_log_id));

-- Hồ sơ dinh dưỡng: PT sửa, học viên xem
create policy np_pt_all on public.nutrition_profiles for all to authenticated
  using (public.is_pt_of(client_id)) with check (public.is_pt_of(client_id));
create policy np_client_select on public.nutrition_profiles for select to authenticated
  using (client_id = public.my_client_id());

-- Thực phẩm, món ăn: giống bài tập
create policy food_select on public.foods for select to authenticated
  using (pt_id is null or pt_id = auth.uid() or pt_id = public.my_pt_id());
create policy food_pt_insert on public.foods for insert to authenticated
  with check (pt_id = auth.uid() and public.is_pt());
create policy food_pt_update on public.foods for update to authenticated
  using (pt_id = auth.uid()) with check (pt_id = auth.uid());

create policy dish_select on public.dishes for select to authenticated
  using (pt_id is null or pt_id = auth.uid() or pt_id = public.my_pt_id());
create policy dish_pt_insert on public.dishes for insert to authenticated
  with check (pt_id = auth.uid() and public.is_pt());
create policy dish_pt_update on public.dishes for update to authenticated
  using (pt_id = auth.uid()) with check (pt_id = auth.uid());

create policy di_select on public.dish_ingredients for select to authenticated
  using (exists (select 1 from public.dishes d where d.id = dish_id));
create policy di_pt_write on public.dish_ingredients for all to authenticated
  using (exists (select 1 from public.dishes d where d.id = dish_id and d.pt_id = auth.uid()))
  with check (exists (select 1 from public.dishes d where d.id = dish_id and d.pt_id = auth.uid()));

-- Thực đơn: PT toàn quyền; học viên xem thực đơn của mình
create policy mp_pt_all on public.meal_plans for all to authenticated
  using (pt_id = auth.uid())
  with check (pt_id = auth.uid() and public.is_pt() and (client_id is null or public.is_pt_of(client_id)));
create policy mp_client_select on public.meal_plans for select to authenticated
  using (client_id is not null and client_id = public.my_client_id());

create policy mpi_select on public.meal_plan_items for select to authenticated
  using (exists (select 1 from public.meal_plans m where m.id = meal_plan_id));
create policy mpi_pt_write on public.meal_plan_items for all to authenticated
  using (exists (select 1 from public.meal_plans m where m.id = meal_plan_id and m.pt_id = auth.uid()))
  with check (exists (select 1 from public.meal_plans m where m.id = meal_plan_id and m.pt_id = auth.uid()));

-- Nhật ký ăn: PT và học viên đều ghi được
create policy ml_access on public.meal_logs for all to authenticated
  using (public.can_access_client(client_id)) with check (public.can_access_client(client_id));

-- ---------------------------------------------------------------------
-- 12. Kho ảnh tiến độ (private). Đường dẫn file: {client_id}/{tên-file}.jpg
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy photos_select on storage.objects for select to authenticated
  using (bucket_id = 'progress-photos'
         and public.can_access_client(((storage.foldername(name))[1])::uuid));
create policy photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'progress-photos'
              and public.can_access_client(((storage.foldername(name))[1])::uuid));
create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'progress-photos'
         and public.can_access_client(((storage.foldername(name))[1])::uuid));

-- =====================================================================
-- SAU KHI CHẠY FILE NÀY:
-- 1. Authentication → Sign In / Providers → TẮT "Allow new users to sign up"
--    (chỉ PT mời học viên, người lạ không tự đăng ký được).
-- 2. Tạo tài khoản PT: Authentication → Users → Add user.
-- 3. Đặt vai trò PT cho tài khoản đó (thay email của bạn):
--      update public.profiles set role = 'pt', full_name = 'Tên bạn'
--      where id = (select id from auth.users where email = 'ban@example.com');
-- =====================================================================
