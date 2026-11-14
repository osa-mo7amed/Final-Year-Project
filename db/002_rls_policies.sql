-- Bootstrap only. Final policies and grants are defined in 007_security_and_writes.sql.
create or replace function public.is_admin() returns boolean language sql stable security invoker set search_path = '' as $$ select false $$;
do $$ declare t text; begin
foreach t in array array['users','profiles','skills','profile_skills','job_postings','job_skills','recommendations','applications'] loop
execute format('alter table public.%I enable row level security',t);
end loop; end $$;
