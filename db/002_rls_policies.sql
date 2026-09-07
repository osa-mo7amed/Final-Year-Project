-- ============================================================================
-- Row-Level Security Policies
-- Satisfies FYP1 NFR SE-1 (authorised-only access) and SE-2 (no cross-user
-- profile visibility). Enforced at the database layer so it cannot be
-- bypassed by a compromised or buggy frontend.
-- ============================================================================

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.profile_skills enable row level security;
alter table public.job_postings enable row level security;
alter table public.job_skills enable row level security;
alter table public.recommendations enable row level security;
alter table public.applications enable row level security;

-- Helper: is the current auth'd user an Admin?
-- Implemented in plpgsql with explicit search_path to eliminate mutual inlining recursion
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text;
begin
  -- 1. Check user_metadata in JWT (instant, zero table recursion)
  if coalesce(auth.jwt()->'user_metadata'->>'role', '') = 'Admin' then
    return true;
  end if;

  -- 2. Check public.users directly
  select role::text into v_role
  from public.users
  where id = auth.uid();

  return coalesce(v_role = 'Admin', false);
end;
$$;

-- ----------------------------------------------------------------------------
-- users: a user can read/update their own row; Admins can read/update all
-- ----------------------------------------------------------------------------
drop policy if exists "users_select_own_or_admin" on public.users;
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_select_all_admin" on public.users;

-- Policy 1: Any user can read their OWN row. Pure column equality. Zero function calls. Zero recursion.
create policy "users_select_own" on public.users
  for select using (id = auth.uid());

-- Policy 2: Admins can read all rows
create policy "users_select_all_admin" on public.users
  for select using (public.is_admin());

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check (id = auth.uid() or public.is_admin());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (id = auth.uid());

drop policy if exists "users_update_admin" on public.users;
create policy "users_update_admin" on public.users
  for update using (public.is_admin());

-- Automatically sync role updates from public.users to auth.users user_metadata
create or replace function public.sync_user_role_to_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role::text)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sync_user_role on public.users;
create trigger trg_sync_user_role
  after update of role on public.users
  for each row execute function public.sync_user_role_to_auth();

-- ----------------------------------------------------------------------------
-- profiles: strictly own profile only; Admins can read (not edit) for support
-- ----------------------------------------------------------------------------
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (user_id = auth.uid() or public.is_admin());

create policy "profiles_insert_own" on public.profiles
  for insert with check (user_id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- skills: readable by everyone logged in (needed for profile building + job
-- posting forms); only Admins can add new master skills
-- ----------------------------------------------------------------------------
create policy "skills_select_all" on public.skills
  for select using (auth.uid() is not null);

create policy "skills_insert_admin" on public.skills
  for insert with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- profile_skills: only the owning user can see/manage their own skill list
-- ----------------------------------------------------------------------------
create policy "profile_skills_select_own" on public.profile_skills
  for select using (
    exists (select 1 from public.profiles p
            where p.profile_id = profile_skills.profile_id and p.user_id = auth.uid())
    or public.is_admin()
  );

create policy "profile_skills_modify_own" on public.profile_skills
  for all using (
    exists (select 1 from public.profiles p
            where p.profile_id = profile_skills.profile_id and p.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- job_postings: Active postings readable by all logged-in users;
-- only Admins can create/update/delete
-- ----------------------------------------------------------------------------
create policy "job_postings_select_active_or_admin" on public.job_postings
  for select using (status = 'Active' or public.is_admin());

create policy "job_postings_insert_admin" on public.job_postings
  for insert with check (public.is_admin());

create policy "job_postings_update_admin" on public.job_postings
  for update using (public.is_admin());

create policy "job_postings_delete_admin" on public.job_postings
  for delete using (public.is_admin());

-- ----------------------------------------------------------------------------
-- job_skills: readable alongside job postings; writable only by Admins
-- ----------------------------------------------------------------------------
create policy "job_skills_select_all" on public.job_skills
  for select using (auth.uid() is not null);

create policy "job_skills_modify_admin" on public.job_skills
  for all using (public.is_admin());

-- ----------------------------------------------------------------------------
-- recommendations: strictly own records only (never cross-user, never public)
-- ----------------------------------------------------------------------------
create policy "recommendations_select_own" on public.recommendations
  for select using (user_id = auth.uid() or public.is_admin());

create policy "recommendations_insert_own" on public.recommendations
  for insert with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- applications: users see/manage only their own; Admins can view all
-- ----------------------------------------------------------------------------
create policy "applications_select_own_or_admin" on public.applications
  for select using (user_id = auth.uid() or public.is_admin());

create policy "applications_insert_own" on public.applications
  for insert with check (user_id = auth.uid());

create policy "applications_update_own_or_admin" on public.applications
  for update using (user_id = auth.uid() or public.is_admin());
