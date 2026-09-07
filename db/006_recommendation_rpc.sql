-- ============================================================================
-- 006_recommendation_rpc.sql: Explainable Recommendation Engine Functions
-- Implements FR-4 (Job Recommendations) & FR-5 (Skill Gap Analysis)
-- Formula per Project Instructions (v2) & docs/report-addendum.md §3:
-- MatchScore = (0.50 * RequiredSkillCoverage)
--            + (0.20 * PreferredSkillCoverage)
--            + (0.15 * FieldOfStudyAlignment)
--            + (0.15 * CareerInterestAlignment)
-- Scaled to 0–100. Transparent, reproducible, rule-based (not ML).
-- ============================================================================

create or replace function public.calculate_recommendations_for_user(p_user_id uuid)
returns table (
  job_posting_id bigint,
  title varchar,
  company varchar,
  description text,
  job_type job_type,
  location varchar,
  industry varchar,
  deadline date,
  match_score numeric,
  matched_skills jsonb,
  missing_skills jsonb,
  explanation text
) as $$
declare
  v_user_field varchar;
  v_user_interests text;
  v_user_skill_ids bigint[];
begin
  -- 1. Fetch user profile attributes
  select
    p.field_of_study,
    coalesce(p.career_interests, ''),
    coalesce(array_agg(ps.skill_id) filter (where ps.skill_id is not null), '{}')
  into
    v_user_field,
    v_user_interests,
    v_user_skill_ids
  from public.profiles p
  left join public.profile_skills ps on ps.profile_id = p.profile_id
  where p.user_id = p_user_id
  group by p.profile_id, p.field_of_study, p.career_interests;

  -- Default fallback if user has no profile row yet
  if v_user_skill_ids is null then
    v_user_skill_ids := '{}';
  end if;

  -- 2. Compute scores for all active job postings
  return query
  with job_skill_breakdown as (
    select
      jp.job_posting_id as j_id,
      jp.title as j_title,
      jp.company as j_company,
      jp.description as j_desc,
      jp.job_type as j_type,
      jp.location as j_loc,
      jp.industry as j_ind,
      jp.deadline as j_deadline,
      -- Required skills (is_required = true)
      coalesce(array_agg(s.skill_id) filter (where js.is_required = true), '{}') as req_skill_ids,
      -- Preferred skills (is_required = false)
      coalesce(array_agg(s.skill_id) filter (where js.is_required = false), '{}') as pref_skill_ids,
      -- All skills for this job
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'skill_id', s.skill_id,
            'skill_name', s.skill_name,
            'category', s.category,
            'is_required', js.is_required
          )
        ) filter (where s.skill_id is not null),
        '[]'::jsonb
      ) as all_job_skills
    from public.job_postings jp
    left join public.job_skills js on js.job_posting_id = jp.job_posting_id
    left join public.skills s on s.skill_id = js.skill_id
    where jp.status = 'Active'
    group by jp.job_posting_id
  ),
  scoring as (
    select
      jsb.j_id,
      jsb.j_title,
      jsb.j_company,
      jsb.j_desc,
      jsb.j_type,
      jsb.j_loc,
      jsb.j_ind,
      jsb.j_deadline,
      jsb.all_job_skills,
      -- Math calculations per report-addendum.md §3.2
      -- 1. RequiredSkillCoverage: (matched required skills) / (total required skills)
      case
        when cardinality(jsb.req_skill_ids) = 0 then 1.0
        else (
          select count(*)::numeric / cardinality(jsb.req_skill_ids)::numeric
          from unnest(jsb.req_skill_ids) x
          where x = any(v_user_skill_ids)
        )
      end as s_req,

      -- 2. PreferredSkillCoverage: (matched preferred skills) / (total preferred skills)
      case
        when cardinality(jsb.pref_skill_ids) = 0 then 0.0
        else (
          select count(*)::numeric / cardinality(jsb.pref_skill_ids)::numeric
          from unnest(jsb.pref_skill_ids) x
          where x = any(v_user_skill_ids)
        )
      end as s_pref,

      -- 3. FieldOfStudyAlignment: 1 if match, else 0
      case
        when v_user_field is null or trim(v_user_field) = '' then 0.0
        when lower(jsb.j_ind) like '%' || lower(trim(v_user_field)) || '%'
          or lower(trim(v_user_field)) like '%' || lower(jsb.j_ind) || '%'
          or (lower(trim(v_user_field)) in ('computer science', 'software engineering', 'information technology') and lower(jsb.j_ind) in ('information technology', 'software', 'telecommunications', 'e-commerce & tech'))
          or (lower(trim(v_user_field)) in ('electrical engineering', 'electrical power engineering') and lower(jsb.j_ind) in ('engineering & energy', 'telecommunications'))
        then 1.0
        else 0.0
      end as s_field,

      -- 4. CareerInterestAlignment: (matching interest tags) / (total interest tags)
      case
        when v_user_interests = '' or trim(v_user_interests) = '' then 0.0
        when lower(jsb.j_title) ~* replace(trim(v_user_interests), ',', '|')
          or lower(jsb.j_desc) ~* replace(trim(v_user_interests), ',', '|')
        then 1.0
        else 0.0
      end as s_interest

    from job_skill_breakdown jsb
  ),
  final_calc as (
    select
      sc.j_id,
      sc.j_title,
      sc.j_company,
      sc.j_desc,
      sc.j_type,
      sc.j_loc,
      sc.j_ind,
      sc.j_deadline,
      sc.all_job_skills,
      round(
        ( (0.50 * sc.s_req) +
          (0.20 * sc.s_pref) +
          (0.15 * sc.s_field) +
          (0.15 * sc.s_interest)
        ) * 100.0,
        2
      ) as computed_score,
      sc.s_req,
      sc.s_pref
    from scoring sc
  )
  select
    fc.j_id as job_posting_id,
    fc.j_title as title,
    fc.j_company as company,
    fc.j_desc as description,
    fc.j_type as job_type,
    fc.j_loc as location,
    fc.j_ind as industry,
    fc.j_deadline as deadline,
    fc.computed_score as match_score,
    -- Matched skills json
    coalesce(
      (
        select jsonb_agg(elem)
        from jsonb_array_elements(fc.all_job_skills) elem
        where (elem->>'skill_id')::bigint = any(v_user_skill_ids)
      ),
      '[]'::jsonb
    ) as matched_skills,
    -- Missing skills json with guidance attached
    coalesce(
      (
        select jsonb_agg(
          elem || jsonb_build_object(
            'guidance', coalesce(sg.learning_direction, 'Review fundamental documentation and build hands-on practice projects.'),
            'practice_area', coalesce(sg.practice_area, 'Skill Development'),
            'expected_outcome', coalesce(sg.expected_outcome, 'Gain practical familiarity in project scenarios.'),
            'recommended_duration', coalesce(sg.recommended_duration, '2-3 weeks')
          )
        )
        from jsonb_array_elements(fc.all_job_skills) elem
        left join public.skill_guidance sg on sg.skill_id = (elem->>'skill_id')::bigint
        where not ((elem->>'skill_id')::bigint = any(v_user_skill_ids))
      ),
      '[]'::jsonb
    ) as missing_skills,
    -- Transparent Explanation
    case
      when fc.computed_score >= 80 then
        'High match based on strong alignment with ' || round(fc.s_req * 100) || '% of required skills and relevant background.'
      when fc.computed_score >= 60 then
        'Moderate match. You meet ' || round(fc.s_req * 100) || '% of required skills. Closing identified skill gaps will improve your standing.'
      else
        'Partial match. This role requires additional competencies that are currently missing from your profile.'
    end as explanation
  from final_calc fc
  order by fc.computed_score desc, fc.j_deadline asc nulls last;

end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------------------
-- Helper RPC: Detailed Skill Analysis for a single job
-- ----------------------------------------------------------------------------
create or replace function public.get_skill_analysis_for_job(p_user_id uuid, p_job_id bigint)
returns jsonb as $$
declare
  v_rec record;
begin
  select * into v_rec
  from public.calculate_recommendations_for_user(p_user_id)
  where job_posting_id = p_job_id
  limit 1;

  if v_rec.job_posting_id is null then
    return null;
  end if;

  return jsonb_build_object(
    'job_posting_id', v_rec.job_posting_id,
    'title', v_rec.title,
    'company', v_rec.company,
    'description', v_rec.description,
    'job_type', v_rec.job_type,
    'location', v_rec.location,
    'industry', v_rec.industry,
    'deadline', v_rec.deadline,
    'match_score', v_rec.match_score,
    'matched_skills', v_rec.matched_skills,
    'missing_skills', v_rec.missing_skills,
    'explanation', v_rec.explanation
  );
end;
$$ language plpgsql security definer;
