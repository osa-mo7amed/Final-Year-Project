-- ============================================================================
-- InternMatch Database Schema
-- Maps FYP1 Chapter 4.4 / Appendix A ERD to PostgreSQL (Supabase)
-- Requirement traceability: see docs/traceability-matrix.md
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUM TYPES (replace MySQL ENUM columns from FYP1 design)
-- ----------------------------------------------------------------------------
create type user_role as enum ('Student', 'Graduate', 'Admin');
create type account_status as enum ('Active', 'Inactive');
create type job_type as enum ('Internship', 'Full-Time', 'Part-Time');
create type job_status as enum ('Active', 'Closed');
create type application_status as enum ('Submitted', 'Viewed', 'Shortlisted', 'Rejected');
create type skill_category as enum ('Technical', 'Soft');

-- ----------------------------------------------------------------------------
-- public.users  (maps FR-1/FR-2 fields not owned by Supabase Auth)
-- 1:1 with auth.users via shared primary key = auth.users.id
-- FYP1 Table 4.1 User Table
-- ----------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name varchar(100) not null,
  role user_role not null default 'Student',
  account_status account_status not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Note: Email lives in auth.users (unique, managed by Supabase).
-- Note: EmailVerified lives in auth.users.email_confirmed_at (no duplicate column).
-- Note: Password hash is managed entirely by Supabase Auth (never touched by app code).

-- ----------------------------------------------------------------------------
-- public.profiles  — FYP1 Table 4.2 Profile Table
-- ----------------------------------------------------------------------------
create table public.profiles (
  profile_id bigint generated always as identity primary key,
  user_id uuid not null unique references public.users(id) on delete cascade,
  institution varchar(150),
  programme varchar(150),
  year_of_study smallint check (year_of_study between 0 and 6),
  cgpa numeric(3,2) check (cgpa >= 0 and cgpa <= 4.00),
  field_of_study varchar(100),
  career_interests text,       -- comma-separated tags (denormalized by design, see docs)
  certifications text,         -- comma-separated list (denormalized by design, see docs)
  profile_strength smallint not null default 0 check (profile_strength between 0 and 100),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- public.skills — FYP1 Table 4.3 Skill Table
-- ----------------------------------------------------------------------------
create table public.skills (
  skill_id bigint generated always as identity primary key,
  skill_name varchar(100) not null unique,
  category skill_category not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- public.profile_skills — FYP1 Table 4.4 ProfileSkill (Associative)
-- ----------------------------------------------------------------------------
create table public.profile_skills (
  profile_skill_id bigint generated always as identity primary key,
  profile_id bigint not null references public.profiles(profile_id) on delete cascade,
  skill_id bigint not null references public.skills(skill_id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (profile_id, skill_id)
);

-- ----------------------------------------------------------------------------
-- public.job_postings — FYP1 Table 4.5 JobPosting Table
-- ----------------------------------------------------------------------------
create table public.job_postings (
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

-- ----------------------------------------------------------------------------
-- public.job_skills — FYP1 Table 4.6 JobSkill (Associative)
-- is_required maps FYP1 IsRequired INT(1); kept as boolean (semantically identical)
-- ----------------------------------------------------------------------------
create table public.job_skills (
  job_skill_id bigint generated always as identity primary key,
  job_posting_id bigint not null references public.job_postings(job_posting_id) on delete cascade,
  skill_id bigint not null references public.skills(skill_id) on delete cascade,
  is_required boolean not null default true,
  unique (job_posting_id, skill_id)
);

-- ----------------------------------------------------------------------------
-- public.recommendations — FYP1 Table 4.7 Recommendation Table
-- matched_skills/missing_skills stored as skill_id arrays (Postgres native array
-- type) instead of MySQL comma-separated TEXT — same denormalization concept
-- (computed snapshot, not a live FK relationship) but type-safe or queryable.
-- ----------------------------------------------------------------------------
create table public.recommendations (
  recommendation_id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  job_posting_id bigint not null references public.job_postings(job_posting_id) on delete cascade,
  match_score numeric(5,2) not null check (match_score >= 0 and match_score <= 100),
  matched_skills bigint[] default '{}',
  missing_skills bigint[] default '{}',
  generated_at timestamptz not null default now(),
  unique (user_id, job_posting_id)
);

-- ----------------------------------------------------------------------------
-- public.applications — FYP1 Table 4.8 Application Table
-- Added per project decision: minimal "Apply to Job" flow (was in ERD but had
-- no corresponding FR/use case in FYP1 SRS — scoped as a small addition).
-- ----------------------------------------------------------------------------
create table public.applications (
  application_id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  job_posting_id bigint not null references public.job_postings(job_posting_id) on delete cascade,
  status application_status not null default 'Submitted',
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_posting_id)
);

-- ----------------------------------------------------------------------------
-- Indexes to support search/filter (FR-6) and recommendation lookups (FR-4)
-- ----------------------------------------------------------------------------
create index idx_job_postings_status on public.job_postings(status);
create index idx_job_postings_industry on public.job_postings(industry);
create index idx_job_postings_type on public.job_postings(job_type);
create index idx_job_postings_location on public.job_postings(location);
create index idx_recommendations_user on public.recommendations(user_id);
create index idx_profile_skills_profile on public.profile_skills(profile_id);
create index idx_job_skills_job on public.job_skills(job_posting_id);

-- ----------------------------------------------------------------------------
-- updated_at auto-touch trigger (generic, reused across tables)
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_job_postings_updated_at before update on public.job_postings
  for each row execute function public.set_updated_at();
create trigger trg_applications_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Auto-create public.users and public.profiles row when a new auth.users row is created
-- (keeps the 1:1 link intact automatically at registration)
-- Uses explicit search_path, safe role casting, on-conflict handling, and exception trap.
-- ----------------------------------------------------------------------------
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

-- Ensure proper grants
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;
