-- Generated upgrade; preserves existing data.
-- Source: db/006_recommendation_rpc.sql
-- Authoritative engine v2. The pure function also drives the synthetic benchmark.
create or replace function public.score_compatibility(p_profile jsonb, p_job jsonb)
returns jsonb language plpgsql immutable security invoker set search_path = '' as $$
declare
  sk jsonb; matched jsonb := '[]'; missing jsonb := '[]';
  nr int := 0; np int := 0; mr int := 0; mp int := 0;
  r numeric; p numeric; f numeric := 0; i numeric := 0; score numeric;
  uf text := lower(btrim(coalesce(p_profile->>'field_of_study','')));
  ind text := lower(btrim(coalesce(p_job->>'industry','')));
  interests text[]; tag text; hits int := 0;
  haystack text := lower(coalesce(p_job->>'title','') || ' ' || coalesce(p_job->>'description',''));
begin
  for sk in select value from jsonb_array_elements(coalesce(p_job->'skills','[]')) loop
    if (sk->>'is_required')::boolean then nr := nr+1; else np := np+1; end if;
    if coalesce(p_profile->'skill_ids','[]') @> jsonb_build_array((sk->>'skill_id')::bigint) then
      matched := matched || jsonb_build_array(sk);
      if (sk->>'is_required')::boolean then mr := mr+1; else mp := mp+1; end if;
    else missing := missing || jsonb_build_array(sk); end if;
  end loop;
  r := case when nr=0 then 1 else mr::numeric/nr end;
  p := case when np=0 then 0 else mp::numeric/np end;
  if uf <> '' and ind <> '' and (uf=ind or
    (uf in ('computer science','software engineering','information technology') and ind in ('information technology','software','telecommunications','e-commerce & tech')) or
    (uf in ('electrical engineering','electrical power engineering') and ind in ('engineering & energy','telecommunications'))) then f := 1; end if;
  select array_agg(distinct btrim(t)) into interests
    from unnest(string_to_array(lower(coalesce(p_profile->>'career_interests','')),',')) t where btrim(t) <> '';
  if cardinality(interests)>0 then
    foreach tag in array interests loop
      if strpos(haystack,tag)>0 then hits := hits+1; end if;
    end loop;
    i := hits::numeric/cardinality(interests);
  end if;
  score := round(50*r+20*p+15*f+15*i,2);
  return jsonb_build_object('match_score',score,'matched_skills',matched,'missing_skills',missing,
    'factors',jsonb_build_object('required',r,'preferred',p,'field',f,'interests',i),
    'explanation',format('Compatibility %s/100: required skills %s/%s (%s points); preferred %s/%s (%s points); field %s points; interests %s points. %sNot a hiring probability.',
      score,mr,nr,round(50*r,2),mp,np,round(20*p,2),round(15*f,2),round(15*i,2),
      case when nr=0 then 'No required skills specified: the required component receives 50 points. ' else '' end));
end $$;

create or replace function public.calculate_recommendations_for_user(p_user_id uuid)
returns table(job_posting_id bigint,title varchar,company varchar,description text,
  job_type public.job_type,location varchar,industry varchar,deadline date,
  match_score numeric,matched_skills jsonb,missing_skills jsonb,explanation text)
language plpgsql security invoker set search_path = '' as $$
declare profile_data jsonb;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() or not private.actor_active() then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  select to_jsonb(p) || jsonb_build_object('skill_ids',coalesce((select jsonb_agg(ps.skill_id)
    from public.profile_skills ps where ps.profile_id=p.profile_id),'[]')) into profile_data
    from public.profiles p where p.user_id=p_user_id;
  return query select j.job_posting_id,j.title,j.company,j.description,j.job_type,j.location,j.industry,j.deadline,
    (s.result->>'match_score')::numeric,s.result->'matched_skills',s.result->'missing_skills',s.result->>'explanation'
  from public.job_postings j
  cross join lateral (select public.score_compatibility(coalesce(profile_data,'{}'),to_jsonb(j)||jsonb_build_object('skills',
    coalesce((select jsonb_agg(jsonb_build_object('skill_id',k.skill_id,'skill_name',k.skill_name,'category',k.category,
      'is_required',js.is_required,'guidance',case when g.skill_id is null then null else to_jsonb(g) end) order by k.skill_id)
      from public.job_skills js join public.skills k using(skill_id) left join public.skill_guidance g using(skill_id)
      where js.job_posting_id=j.job_posting_id),'[]'))) result) s
  where j.status='Active' and (j.deadline is null or j.deadline >= (now() at time zone 'Asia/Kuala_Lumpur')::date)
  order by (s.result->>'match_score')::numeric desc,j.deadline asc nulls last,j.job_posting_id;
end $$;

create or replace function public.get_skill_analysis_for_job(p_user_id uuid,p_job_id bigint)
returns jsonb language sql security invoker set search_path = '' as $$
  select to_jsonb(r) from public.calculate_recommendations_for_user(p_user_id) r where r.job_posting_id=p_job_id;
$$;

-- Source: db/007_security_and_writes.sql
-- Non-destructive upgrade: preserve all accounts, jobs and applications.
alter function public.set_updated_at() set search_path = '';
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create or replace function private.actor_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.users u join auth.users a on a.id=u.id
    where u.id=auth.uid() and u.account_status='Active' and a.email_confirmed_at is not null
    and exists(select 1 from auth.sessions s where s.user_id=u.id and s.id::text=auth.jwt()->>'session_id'));
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.actor_active() and exists(select 1 from public.users where id=auth.uid() and role='Admin');
$$;
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users(id,full_name,role) values(new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'),''),'Unnamed User'),
    case when new.raw_user_meta_data->>'role' in ('Graduate','Fresh Graduate') then 'Graduate'::public.user_role else 'Student'::public.user_role end);
  insert into public.profiles(user_id,field_of_study) values(new.id,nullif(btrim(new.raw_user_meta_data->>'field_of_study'),''));
  return new;
end $$;
drop trigger if exists trg_sync_user_role on public.users;
do $$ declare p record; begin
  for p in select * from pg_policies where schemaname='public' and tablename in
    ('users','profiles','skills','profile_skills','job_postings','job_skills','recommendations','applications','skill_guidance') loop
    execute format('drop policy %I on public.%I',p.policyname,p.tablename);
  end loop;
end $$;
revoke all on public.users,public.profiles,public.skills,public.profile_skills,public.job_postings,
  public.job_skills,public.recommendations,public.applications,public.skill_guidance from public,anon,authenticated;
revoke all on all sequences in schema public from public,anon,authenticated;
revoke execute on all functions in schema public from public,anon,authenticated;
revoke execute on all functions in schema private from public,anon,authenticated;
grant select on public.users,public.profiles,public.skills,public.profile_skills,public.job_postings,
  public.job_skills,public.recommendations,public.applications,public.skill_guidance to authenticated;
grant insert(user_id,job_posting_id,status) on public.applications to authenticated;
grant usage on sequence public.applications_application_id_seq to authenticated;
grant execute on function private.actor_active(),public.is_admin() to authenticated;
grant execute on function public.score_compatibility(jsonb,jsonb),public.calculate_recommendations_for_user(uuid),
  public.get_skill_analysis_for_job(uuid,bigint) to authenticated;
create policy users_read on public.users for select to authenticated using (id=auth.uid() or public.is_admin());
create policy profiles_read on public.profiles for select to authenticated
  using(private.actor_active() and (user_id=auth.uid() or public.is_admin()));
create policy profile_skills_read on public.profile_skills for select to authenticated using(private.actor_active() and
  exists(select 1 from public.profiles p where p.profile_id=profile_skills.profile_id));
create policy skills_read on public.skills for select to authenticated using(private.actor_active());
create policy guidance_read on public.skill_guidance for select to authenticated using(private.actor_active());
create policy jobs_read on public.job_postings for select to authenticated using(private.actor_active() and
  (public.is_admin() or (status='Active' and (deadline is null or deadline >= (now() at time zone 'Asia/Kuala_Lumpur')::date))));
create policy job_skills_read on public.job_skills for select to authenticated using(private.actor_active() and
  exists(select 1 from public.job_postings j where j.job_posting_id=job_skills.job_posting_id));
create policy recommendations_read on public.recommendations for select to authenticated
  using(private.actor_active() and user_id=auth.uid());
create policy applications_read on public.applications for select to authenticated
  using(private.actor_active() and (user_id=auth.uid() or public.is_admin()));
create policy applications_submit on public.applications for insert to authenticated with check(
  private.actor_active() and user_id=auth.uid() and status='Submitted' and
  exists(select 1 from public.job_postings j where j.job_posting_id=applications.job_posting_id and j.status='Active'
    and (j.deadline is null or j.deadline >= (now() at time zone 'Asia/Kuala_Lumpur')::date)));

create or replace function public.save_profile(p_profile jsonb,p_skill_ids bigint[]) returns bigint
language plpgsql security definer set search_path = '' as $$
declare pid bigint; strength int; nt int; ns int;
begin
  if not private.actor_active() then raise exception 'Not authorized' using errcode='42501'; end if;
  perform 1 from public.users where id=auth.uid() for update;
  select count(*) filter(where category='Technical'),count(*) filter(where category='Soft') into nt,ns
    from public.skills where skill_id=any(p_skill_ids);
  strength := 15 + case when coalesce(btrim(p_profile->>'institution'),'')<>'' then 7 else 0 end
    + case when coalesce(btrim(p_profile->>'programme'),'')<>'' then 6 else 0 end
    + case when coalesce(btrim(p_profile->>'field_of_study'),'')<>'' then 6 else 0 end
    + case when nullif(p_profile->>'cgpa','')::numeric between 0 and 4 then 6 else 0 end
    + case when nt>=3 then 25 when nt=2 then 18 when nt=1 then 10 else 0 end
    + case when ns>=2 then 15 when ns=1 then 8 else 0 end
    + case when coalesce(btrim(p_profile->>'career_interests'),'')<>'' then 10 else 0 end
    + case when coalesce(btrim(p_profile->>'certifications'),'')<>'' then 10 else 0 end;
  insert into public.profiles(user_id,institution,programme,field_of_study,year_of_study,cgpa,career_interests,certifications,profile_strength)
  values(auth.uid(),nullif(btrim(p_profile->>'institution'),''),nullif(btrim(p_profile->>'programme'),''),nullif(btrim(p_profile->>'field_of_study'),''),
    nullif(p_profile->>'year_of_study','')::smallint,nullif(p_profile->>'cgpa','')::numeric,
    nullif(btrim(p_profile->>'career_interests'),''),nullif(btrim(p_profile->>'certifications'),''),strength)
  on conflict(user_id) do update set institution=excluded.institution,programme=excluded.programme,field_of_study=excluded.field_of_study,
    year_of_study=excluded.year_of_study,cgpa=excluded.cgpa,career_interests=excluded.career_interests,certifications=excluded.certifications,
    profile_strength=excluded.profile_strength returning profile_id into pid;
  delete from public.profile_skills where profile_id=pid;
  insert into public.profile_skills(profile_id,skill_id) select pid,id from (select distinct unnest(p_skill_ids) id) s;
  return pid;
end $$;
create or replace function public.save_job(p_job_id bigint,p_job jsonb,p_skills jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare jid bigint; k text;
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode='42501'; end if;
  foreach k in array array['title','company','description','location','job_type'] loop
    if coalesce(btrim(p_job->>k),'')='' then raise exception 'Required job field: %',k using errcode='22023'; end if;
  end loop;
  if p_job_id is null then
    insert into public.job_postings(title,company,description,job_type,location,industry,deadline,status,created_by)
    values(btrim(p_job->>'title'),btrim(p_job->>'company'),btrim(p_job->>'description'),(p_job->>'job_type')::public.job_type,
      btrim(p_job->>'location'),p_job->>'industry',nullif(p_job->>'deadline','')::date,
      (p_job->>'status')::public.job_status,auth.uid()) returning job_posting_id into jid;
  else
    update public.job_postings set title=btrim(p_job->>'title'),company=btrim(p_job->>'company'),description=btrim(p_job->>'description'),
      job_type=(p_job->>'job_type')::public.job_type,location=btrim(p_job->>'location'),industry=p_job->>'industry',
      deadline=nullif(p_job->>'deadline','')::date,status=(p_job->>'status')::public.job_status
      where job_posting_id=p_job_id returning job_posting_id into jid;
    if jid is null then raise exception 'Job not found' using errcode='22023'; end if;
  end if;
  delete from public.job_skills where job_posting_id=jid;
  insert into public.job_skills(job_posting_id,skill_id,is_required)
    select jid,(s->>'skill_id')::bigint,(s->>'is_required')::boolean from jsonb_array_elements(p_skills) s;
  return jid;
end $$;
create or replace function public.archive_job(p_job_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode='42501'; end if;
  update public.job_postings set status='Closed' where job_posting_id=p_job_id;
  if not found then raise exception 'Job not found' using errcode='22023'; end if;
end $$;
create or replace function public.admin_update_user(p_user_id uuid,p_name text,p_role public.user_role,p_status public.account_status) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(891773);
  if not public.is_admin() then raise exception 'Not authorized' using errcode='42501'; end if;
  if p_user_id=auth.uid() and (p_role<>'Admin' or p_status<>'Active') then
    raise exception 'You cannot demote or deactivate your own administrator account' using errcode='22023';
  end if;
  if coalesce(btrim(p_name),'')='' then raise exception 'Name is required' using errcode='22023'; end if;
  update public.users set full_name=btrim(p_name),role=p_role,account_status=p_status where id=p_user_id;
  if not found then raise exception 'User not found' using errcode='22023'; end if;
end $$;
revoke all on function public.save_profile(jsonb,bigint[]),public.save_job(bigint,jsonb,jsonb),public.archive_job(bigint),
  public.admin_update_user(uuid,text,public.user_role,public.account_status) from public,anon;
grant execute on function public.save_profile(jsonb,bigint[]),public.save_job(bigint,jsonb,jsonb),public.archive_job(bigint),
  public.admin_update_user(uuid,text,public.user_role,public.account_status) to authenticated;
