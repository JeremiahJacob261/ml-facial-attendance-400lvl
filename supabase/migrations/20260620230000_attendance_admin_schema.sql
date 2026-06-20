create table if not exists public.students (
  id text primary key,
  name text not null,
  matric text not null unique,
  photo_url text,
  embedding jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id text primary key,
  code text not null unique,
  title text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.halls (
  id text primary key,
  name text not null unique,
  capacity integer,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint halls_capacity_non_negative check (capacity is null or capacity >= 0)
);

create table if not exists public.attendance_sessions (
  id text primary key,
  course_id text references public.courses(id) on delete set null,
  hall_id text references public.halls(id) on delete set null,
  course text not null,
  hall text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id text primary key,
  session_id text references public.attendance_sessions(id) on delete set null,
  student_id text references public.students(id) on delete set null,
  student_name text not null,
  matric_number text not null,
  course_id text references public.courses(id) on delete set null,
  hall_id text references public.halls(id) on delete set null,
  course text not null,
  hall text not null,
  status text not null check (status in ('present', 'absent')),
  method text not null check (method in ('biometric', 'manual')),
  confidence numeric,
  timestamp timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_records_session_matric_unique unique (session_id, matric_number)
);

create index if not exists attendance_sessions_start_time_idx
  on public.attendance_sessions (start_time desc);

create index if not exists attendance_records_timestamp_idx
  on public.attendance_records (timestamp desc);

create index if not exists attendance_records_session_id_idx
  on public.attendance_records (session_id);

create index if not exists attendance_records_student_id_idx
  on public.attendance_records (student_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

drop trigger if exists halls_set_updated_at on public.halls;
create trigger halls_set_updated_at
before update on public.halls
for each row execute function public.set_updated_at();

drop trigger if exists attendance_sessions_set_updated_at on public.attendance_sessions;
create trigger attendance_sessions_set_updated_at
before update on public.attendance_sessions
for each row execute function public.set_updated_at();

drop trigger if exists attendance_records_set_updated_at on public.attendance_records;
create trigger attendance_records_set_updated_at
before update on public.attendance_records
for each row execute function public.set_updated_at();

alter table public.students enable row level security;
alter table public.courses enable row level security;
alter table public.halls enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.students,
  public.courses,
  public.halls,
  public.attendance_sessions,
  public.attendance_records
to anon, authenticated;

drop policy if exists "demo public students access" on public.students;
create policy "demo public students access"
on public.students for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "demo public courses access" on public.courses;
create policy "demo public courses access"
on public.courses for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "demo public halls access" on public.halls;
create policy "demo public halls access"
on public.halls for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "demo public attendance sessions access" on public.attendance_sessions;
create policy "demo public attendance sessions access"
on public.attendance_sessions for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "demo public attendance records access" on public.attendance_records;
create policy "demo public attendance records access"
on public.attendance_records for all
to anon, authenticated
using (true)
with check (true);
