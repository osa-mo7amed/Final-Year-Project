-- ============================================================================
-- 005_seed_skill_guidance.sql: Skill Improvement Guidance Table & Seed
-- Implements FR-5 / FR-SKL-03: Structured suggestions for missing skills
-- Provides realistic, actionable learning directions, practice areas, and outcomes
-- matching Figure 4.7 in the approved FYP1 report.
-- ============================================================================

-- 1. Create skill_guidance table
create table if not exists public.skill_guidance (
  guidance_id bigint generated always as identity primary key,
  skill_id bigint not null unique references public.skills(skill_id) on delete cascade,
  learning_direction text not null,
  practice_area text not null,
  expected_outcome text not null,
  recommended_duration varchar(50) not null default '2-3 weeks',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.skill_guidance enable row level security;

create policy "skill_guidance_select_all" on public.skill_guidance
  for select using (auth.uid() is not null);

create policy "skill_guidance_modify_admin" on public.skill_guidance
  for all using (public.is_admin());

-- 2. Seed guidance mapping for skills
do $$
declare
  r record;
begin
  -- Docker (Featured in Figure 4.7)
  select skill_id into r from public.skills where skill_name = 'Docker';
  if r.skill_id is not null then
    insert into public.skill_guidance (skill_id, learning_direction, practice_area, expected_outcome, recommended_duration)
    values (
      r.skill_id,
      'Work through official containerization fundamentals and write Dockerfiles for multi-tier web applications.',
      'DevOps & Application Containerization',
      'Containerize a local full-stack web project using Docker Compose with separate web and database services.',
      '2-3 weeks'
    ) on conflict (skill_id) do update set
      learning_direction = excluded.learning_direction,
      practice_area = excluded.practice_area,
      expected_outcome = excluded.expected_outcome;
  end if;

  -- Python
  select skill_id into r from public.skills where skill_name = 'Python';
  if r.skill_id is not null then
    insert into public.skill_guidance (skill_id, learning_direction, practice_area, expected_outcome, recommended_duration)
    values (
      r.skill_id,
      'Study core Python syntax, object-oriented concepts, and standard data structures (lists, dictionaries, sets).',
      'Core Programming & Scripting',
      'Build command-line automation tools and modular scripts with comprehensive error handling.',
      '2-4 weeks'
    ) on conflict (skill_id) do update set learning_direction = excluded.learning_direction;
  end if;

  -- JavaScript
  select skill_id into r from public.skills where skill_name = 'JavaScript';
  if r.skill_id is not null then
    insert into public.skill_guidance (skill_id, learning_direction, practice_area, expected_outcome, recommended_duration)
    values (
      r.skill_id,
      'Master modern ES6+ features including Promises, Async/Await, Destructuring, and DOM manipulation.',
      'Frontend & Web Engineering',
      'Develop interactive client-side web interfaces with dynamic state management and asynchronous API calls.',
      '3-4 weeks'
    ) on conflict (skill_id) do update set learning_direction = excluded.learning_direction;
  end if;

  -- React
  select skill_id into r from public.skills where skill_name = 'React';
  if r.skill_id is not null then
    insert into public.skill_guidance (skill_id, learning_direction, practice_area, expected_outcome, recommended_duration)
    values (
      r.skill_id,
      'Learn component lifecycles, functional components, React Hooks (useState, useEffect), and props passing.',
      'Frontend Framework Development',
      'Build a responsive single-page dashboard application consuming RESTful APIs.',
      '3-4 weeks'
    ) on conflict (skill_id) do update set learning_direction = excluded.learning_direction;
  end if;

  -- SQL
  select skill_id into r from public.skills where skill_name = 'SQL';
  if r.skill_id is not null then
    insert into public.skill_guidance (skill_id, learning_direction, practice_area, expected_outcome, recommended_duration)
    values (
      r.skill_id,
      'Practice writing relational queries, complex multi-table JOINs, GROUP BY aggregations, and subqueries.',
      'Relational Database Management',
      'Design normalized database schemas with foreign key constraints and write performant analytical queries.',
      '2-3 weeks'
    ) on conflict (skill_id) do update set learning_direction = excluded.learning_direction;
  end if;

  -- AWS / Cloud Computing
  select skill_id into r from public.skills where skill_name = 'AWS';
  if r.skill_id is not null then
    insert into public.skill_guidance (skill_id, learning_direction, practice_area, expected_outcome, recommended_duration)
    values (
      r.skill_id,
      'Explore core AWS cloud infrastructure services: S3 object storage, EC2 instances, and IAM security policies.',
      'Cloud Architecture & Deployment',
      'Deploy and host a static web application on S3/CloudFront and configure basic server networking.',
      '3-4 weeks'
    ) on conflict (skill_id) do update set learning_direction = excluded.learning_direction;
  end if;

  -- Tableau / Data Analysis
  select skill_id into r from public.skills where skill_name = 'Tableau';
  if r.skill_id is not null then
    insert into public.skill_guidance (skill_id, learning_direction, practice_area, expected_outcome, recommended_duration)
    values (
      r.skill_id,
      'Understand data visualization best practices, calculated fields, filtering, and storytelling with dashboards.',
      'Business Intelligence & Reporting',
      'Construct an executive KPI dashboard connecting to multi-table CSV/SQL datasets.',
      '2 weeks'
    ) on conflict (skill_id) do update set learning_direction = excluded.learning_direction;
  end if;

  -- TypeScript
  select skill_id into r from public.skills where skill_name = 'TypeScript';
  if r.skill_id is not null then
    insert into public.skill_guidance (skill_id, learning_direction, practice_area, expected_outcome, recommended_duration)
    values (
      r.skill_id,
      'Learn static type systems, interfaces, generics, type aliases, and compiling TypeScript to JavaScript.',
      'Type-Safe Web Development',
      'Refactor an existing JavaScript project to strict TypeScript with zero any-type bypasses.',
      '2-3 weeks'
    ) on conflict (skill_id) do update set learning_direction = excluded.learning_direction;
  end if;

  -- Machine Learning
  select skill_id into r from public.skills where skill_name = 'Machine Learning';
  if r.skill_id is not null then
    insert into public.skill_guidance (skill_id, learning_direction, practice_area, expected_outcome, recommended_duration)
    values (
      r.skill_id,
      'Study supervised learning algorithms (regression, decision trees, random forests) and scikit-learn pipelines.',
      'Applied Data Science & Modeling',
      'Train, evaluate, and tune a predictive model using cross-validation and standard classification metrics.',
      '4 weeks'
    ) on conflict (skill_id) do update set learning_direction = excluded.learning_direction;
  end if;

  -- Cybersecurity Fundamentals
  select skill_id into r from public.skills where skill_name = 'Cybersecurity Fundamentals';
  if r.skill_id is not null then
    insert into public.skill_guidance (skill_id, learning_direction, practice_area, expected_outcome, recommended_duration)
    values (
      r.skill_id,
      'Learn the CIA triad, OWASP Top 10 vulnerabilities, authentication mechanics, and network scanning tools.',
      'Security Operations & Analysis',
      'Conduct a vulnerability assessment on a local test lab environment and document mitigation steps.',
      '3 weeks'
    ) on conflict (skill_id) do update set learning_direction = excluded.learning_direction;
  end if;

  -- Soft Skills: Communication
  select skill_id into r from public.skills where skill_name = 'Communication';
  if r.skill_id is not null then
    insert into public.skill_guidance (skill_id, learning_direction, practice_area, expected_outcome, recommended_duration)
    values (
      r.skill_id,
      'Practice technical writing, drafting clear system documentation, and communicating progress in standups.',
      'Professional Collaboration',
      'Author a clear technical specification document and present project findings concisely to stakeholders.',
      'Ongoing'
    ) on conflict (skill_id) do update set learning_direction = excluded.learning_direction;
  end if;

  -- Soft Skills: Problem Solving
  select skill_id into r from public.skills where skill_name = 'Problem Solving';
  if r.skill_id is not null then
    insert into public.skill_guidance (skill_id, learning_direction, practice_area, expected_outcome, recommended_duration)
    values (
      r.skill_id,
      'Apply structured algorithmic decomposition techniques and root-cause analysis when debugging code.',
      'Analytical Thinking',
      'Solve algorithmic challenge problems and systematically document debugging workflows.',
      'Ongoing'
    ) on conflict (skill_id) do update set learning_direction = excluded.learning_direction;
  end if;

  -- Soft Skills: Teamwork
  select skill_id into r from public.skills where skill_name = 'Teamwork';
  if r.skill_id is not null then
    insert into public.skill_guidance (skill_id, learning_direction, practice_area, expected_outcome, recommended_duration)
    values (
      r.skill_id,
      'Participate in collaborative group software projects using Git branches, pull requests, and peer code reviews.',
      'Collaborative Engineering',
      'Successfully merge feature branches and resolve merge conflicts collaboratively in a shared repo.',
      'Ongoing'
    ) on conflict (skill_id) do update set learning_direction = excluded.learning_direction;
  end if;

end $$;
