-- ============================================================
-- CA MockForge - Complete Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. QUESTIONS TABLE (the question bank)
create table if not exists questions (
  id uuid default gen_random_uuid() primary key,
  topic text not null,
  level text not null,
  difficulty text not null check (difficulty in ('simple', 'medium', 'hard')),
  question text not null,
  options jsonb not null,
  correct text not null,
  explanation text not null,
  concept text,
  used_count integer default 0,
  created_at timestamp with time zone default now()
);

-- Index for fast lookups by topic+level+difficulty
create index if not exists idx_questions_topic_level_diff 
  on questions(topic, level, difficulty);

-- 2. STUDENT PROFILES TABLE
create table if not exists student_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  tests_taken integer default 0,
  avg_score numeric(5,2) default 0,
  weak_topics text[] default '{}',
  strong_topics text[] default '{}',
  suggested_difficulty text default 'same',
  last_test_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 3. TESTS TABLE (each test a student takes)
create table if not exists tests (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references auth.users(id) on delete cascade,
  test_number integer not null,
  topics text[] not null,
  level text not null,
  question_ids uuid[] not null,
  answers text[],
  timings integer[],
  score integer,
  grade text,
  analysis jsonb,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index if not exists idx_tests_student on tests(student_id);

-- 4. ROW LEVEL SECURITY
alter table questions enable row level security;
alter table student_profiles enable row level security;
alter table tests enable row level security;

-- Questions: anyone authenticated can read
create policy "Authenticated users can read questions"
  on questions for select
  to authenticated
  using (true);

-- Service role can insert questions (via API)
create policy "Service role can insert questions"
  on questions for insert
  to service_role
  using (true);

create policy "Service role can update questions"
  on questions for update
  to service_role
  using (true);

-- Student profiles: students see only their own
create policy "Students view own profile"
  on student_profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Students update own profile"
  on student_profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Students insert own profile"
  on student_profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Tests: students see only their own
create policy "Students view own tests"
  on tests for select
  to authenticated
  using (auth.uid() = student_id);

create policy "Students insert own tests"
  on tests for insert
  to authenticated
  with check (auth.uid() = student_id);

create policy "Students update own tests"
  on tests for update
  to authenticated
  using (auth.uid() = student_id);

-- Service role can read everything (for admin)
create policy "Service role full access to tests"
  on tests for all
  to service_role
  using (true);

create policy "Service role full access to profiles"
  on student_profiles for all
  to service_role
  using (true);

-- 5. AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.student_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
