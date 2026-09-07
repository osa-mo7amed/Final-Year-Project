-- ============================================================================
-- INTERNMATCH MASTER POSTGRESQL / SUPABASE SETUP SCRIPT (000_run_all.sql)
-- Executes the complete database schema, constraints, RLS policies, seeds,
-- and recommendation engine RPC functions in one single script.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & ENUM TYPES
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

do $$ begin
  create type user_role as enum ('Student', 'Graduate', 'Admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_status as enum ('Active', 'Inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_type as enum ('Internship', 'Full-Time', 'Part-Time');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_status as enum ('Active', 'Closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_status as enum ('Submitted', 'Viewed', 'Shortlisted', 'Rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type skill_category as enum ('Technical', 'Soft');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. TABLES (Tables 4.1 to 4.8 from Approved FYP1 Report)
-- ----------------------------------------------------------------------------

-- Table 4.1: User
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name varchar(100) not null,
  role user_role not null default 'Student',
  account_status account_status not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table 4.2: Profile
create table if not exists public.profiles (
  profile_id bigint generated always as identity primary key,
  user_id uuid not null unique references public.users(id) on delete cascade,
  institution varchar(150),
  programme varchar(150),
  year_of_study smallint check (year_of_study between 0 and 6),
  cgpa numeric(3,2) check (cgpa >= 0 and cgpa <= 4.00),
  field_of_study varchar(100),
  career_interests text,
  certifications text,
  profile_strength smallint not null default 0 check (profile_strength between 0 and 100),
  updated_at timestamptz not null default now()
);

-- Table 4.3: Skill
create table if not exists public.skills (
  skill_id bigint generated always as identity primary key,
  skill_name varchar(100) not null unique,
  category skill_category not null,
  created_at timestamptz not null default now()
);

-- Table 4.4: ProfileSkill (Associative)
create table if not exists public.profile_skills (
  profile_skill_id bigint generated always as identity primary key,
  profile_id bigint not null references public.profiles(profile_id) on delete cascade,
  skill_id bigint not null references public.skills(skill_id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (profile_id, skill_id)
);

-- Table 4.5: JobPosting
create table if not exists public.job_postings (
  job_posting_id bigint generated always as identity primary key,
  title varchar(150) not null,
  company varchar(150) not null,
  description text not null,
  job_type job_type not null,
  location varchar(100) not null,
  industry varchar(100),
  deadline date,
  status job_status not null default 'Active',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table 4.6: JobSkill (Associative)
create table if not exists public.job_skills (
  job_skill_id bigint generated always as identity primary key,
  job_posting_id bigint not null references public.job_postings(job_posting_id) on delete cascade,
  skill_id bigint not null references public.skills(skill_id) on delete cascade,
  is_required boolean not null default true,
  unique (job_posting_id, skill_id)
);

-- Table 4.7: Recommendation
create table if not exists public.recommendations (
  recommendation_id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  job_posting_id bigint not null references public.job_postings(job_posting_id) on delete cascade,
  match_score numeric(5,2) not null check (match_score >= 0 and match_score <= 100),
  matched_skills bigint[] default '{}',
  missing_skills bigint[] default '{}',
  generated_at timestamptz not null default now(),
  unique (user_id, job_posting_id)
);

-- Table 4.8: Application
create table if not exists public.applications (
  application_id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  job_posting_id bigint not null references public.job_postings(job_posting_id) on delete cascade,
  status application_status not null default 'Submitted',
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_posting_id)
);

-- Skill Guidance Table (FR-5 Actionable Gap Guidance)
create table if not exists public.skill_guidance (
  guidance_id bigint generated always as identity primary key,
  skill_id bigint not null unique references public.skills(skill_id) on delete cascade,
  learning_direction text not null,
  practice_area text not null,
  expected_outcome text not null,
  recommended_duration varchar(50) not null default '2-3 weeks',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES & TRIGGERS
-- ----------------------------------------------------------------------------
create index if not exists idx_job_postings_status on public.job_postings(status);
create index if not exists idx_job_postings_industry on public.job_postings(industry);
create index if not exists idx_job_postings_type on public.job_postings(job_type);
create index if not exists idx_job_postings_location on public.job_postings(location);
create index if not exists idx_recommendations_user on public.recommendations(user_id);
create index if not exists idx_profile_skills_profile on public.profile_skills(profile_id);
create index if not exists idx_job_skills_job on public.job_skills(job_posting_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_job_postings_updated_at on public.job_postings;
create trigger trg_job_postings_updated_at before update on public.job_postings
  for each row execute function public.set_updated_at();

drop trigger if exists trg_applications_updated_at on public.applications;
create trigger trg_applications_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

-- Auto-provision user record and default empty profile upon registration
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role public.user_role := 'Student';
  v_raw_role text;
begin
  -- Safely parse role enum, tolerating variations
  v_raw_role := new.raw_user_meta_data->>'role';
  if v_raw_role in ('Student', 'Graduate', 'Admin') then
    v_role := v_raw_role::public.user_role;
  elsif v_raw_role = 'Fresh Graduate' then
    v_role := 'Graduate'::public.user_role;
  end if;

  -- 1. Insert or update public.users (sanitizing HTML tags for XSS defense)
  insert into public.users (id, full_name, role)
  values (
    new.id,
    replace(replace(coalesce(new.raw_user_meta_data->>'full_name', 'Unnamed User'), '<', '&lt;'), '>', '&gt;'),
    v_role
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        updated_at = now();

  -- 2. Auto-provision matching profile record (sanitizing HTML tags)
  insert into public.profiles (user_id, field_of_study)
  values (
    new.id,
    nullif(trim(replace(replace(coalesce(new.raw_user_meta_data->>'field_of_study', ''), '<', '&lt;'), '>', '&gt;')), '')
  )
  on conflict (user_id) do nothing;

  return new;
exception when others then
  -- Prevent uncaught exceptions from failing the signup transaction
  raise warning 'handle_new_auth_user error: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Ensure schema permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.profile_skills enable row level security;
alter table public.job_postings enable row level security;
alter table public.job_skills enable row level security;
alter table public.recommendations enable row level security;
alter table public.applications enable row level security;
alter table public.skill_guidance enable row level security;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'Admin'
  );
$$ language sql security definer stable;

-- Users policies
drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin" on public.users
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check (id = auth.uid() or public.is_admin());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (id = auth.uid());

drop policy if exists "users_update_admin" on public.users;
create policy "users_update_admin" on public.users
  for update using (public.is_admin());

-- Profiles policies
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (user_id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (user_id = auth.uid());

-- Skills policies
drop policy if exists "skills_select_all" on public.skills;
create policy "skills_select_all" on public.skills
  for select using (true);

drop policy if exists "skills_insert_admin" on public.skills;
create policy "skills_insert_admin" on public.skills
  for insert with check (public.is_admin());

-- Profile Skills policies
drop policy if exists "profile_skills_select_own" on public.profile_skills;
create policy "profile_skills_select_own" on public.profile_skills
  for select using (
    exists (select 1 from public.profiles p where p.profile_id = profile_skills.profile_id and p.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "profile_skills_modify_own" on public.profile_skills;
create policy "profile_skills_modify_own" on public.profile_skills
  for all using (
    exists (select 1 from public.profiles p where p.profile_id = profile_skills.profile_id and p.user_id = auth.uid())
  );

-- Job Postings policies
drop policy if exists "job_postings_select_active_or_admin" on public.job_postings;
create policy "job_postings_select_active_or_admin" on public.job_postings
  for select using (status = 'Active' or public.is_admin());

drop policy if exists "job_postings_insert_admin" on public.job_postings;
create policy "job_postings_insert_admin" on public.job_postings
  for insert with check (public.is_admin());

drop policy if exists "job_postings_update_admin" on public.job_postings;
create policy "job_postings_update_admin" on public.job_postings
  for update using (public.is_admin());

drop policy if exists "job_postings_delete_admin" on public.job_postings;
create policy "job_postings_delete_admin" on public.job_postings
  for delete using (public.is_admin());

-- Job Skills policies
drop policy if exists "job_skills_select_all" on public.job_skills;
create policy "job_skills_select_all" on public.job_skills
  for select using (true);

drop policy if exists "job_skills_modify_admin" on public.job_skills;
create policy "job_skills_modify_admin" on public.job_skills
  for all using (public.is_admin());

-- Recommendations policies
drop policy if exists "recommendations_select_own" on public.recommendations;
create policy "recommendations_select_own" on public.recommendations
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "recommendations_insert_own" on public.recommendations;
create policy "recommendations_insert_own" on public.recommendations
  for insert with check (user_id = auth.uid());

-- Applications policies
drop policy if exists "applications_select_own_or_admin" on public.applications;
create policy "applications_select_own_or_admin" on public.applications
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own" on public.applications
  for insert with check (user_id = auth.uid());

drop policy if exists "applications_update_own_or_admin" on public.applications;
create policy "applications_update_own_or_admin" on public.applications
  for update using (user_id = auth.uid() or public.is_admin());

-- Skill Guidance policies
drop policy if exists "skill_guidance_select_all" on public.skill_guidance;
create policy "skill_guidance_select_all" on public.skill_guidance
  for select using (true);

drop policy if exists "skill_guidance_modify_admin" on public.skill_guidance;
create policy "skill_guidance_modify_admin" on public.skill_guidance
  for all using (public.is_admin());
