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
