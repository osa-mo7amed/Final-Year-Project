-- ============================================================================
-- 004_seed_jobs.sql: Baseline Job Postings & Job Skills Seed
-- Implements sample job opportunities matching FYP1 Chapter 4.3 interface mockups
-- (Petronas Digital, Maxis Berhad, TM, Grab Holdings, CIMB Bank, Celcom Axiata)
-- and expands across disciplines (Software, Data, Cloud, AI, Security, Power Eng).
-- ============================================================================

-- Ensure created_by allows NULL for baseline seeds if no user is registered yet
alter table if exists public.job_postings alter column created_by drop not null;

do $$
declare
  v_admin_id uuid;
  v_job_id bigint;
  v_skill_python bigint;
  v_skill_js bigint;
  v_skill_react bigint;
  v_skill_sql bigint;
  v_skill_php bigint;
  v_skill_cpp bigint;
  v_skill_node bigint;
  v_skill_htmlcss bigint;
  v_skill_data_analysis bigint;
  v_skill_cloud bigint;
  v_skill_git bigint;
  v_skill_db_mgmt bigint;
  v_skill_ml bigint;
  v_skill_cyber bigint;
  v_skill_network bigint;
  v_skill_uiux bigint;
  v_skill_autocad bigint;
  v_skill_matlab bigint;
  v_skill_circuit bigint;
  v_skill_proj_sched bigint;
  v_skill_comm bigint;
  v_skill_teamwork bigint;
  v_skill_prob_solve bigint;
  v_skill_time_mgmt bigint;
  v_skill_adapt bigint;
  v_skill_lead bigint;
  v_skill_crit_think bigint;
  v_skill_pres bigint;
  v_skill_docker bigint;
  v_skill_aws bigint;
  v_skill_cicd bigint;
  v_skill_ts bigint;
  v_skill_tableau bigint;
  v_skill_r bigint;
  v_skill_go bigint;
  v_skill_k8s bigint;
begin
  -- 1. Ensure any missing skills from mockups exist in public.skills
  insert into public.skills (skill_name, category) values
    ('Docker', 'Technical'),
    ('AWS', 'Technical'),
    ('CI/CD', 'Technical'),
    ('TypeScript', 'Technical'),
    ('Tableau', 'Technical'),
    ('R', 'Technical'),
    ('Go', 'Technical'),
    ('Kubernetes', 'Technical')
  on conflict (skill_name) do nothing;

  -- Cache skill IDs
  select skill_id into v_skill_python from public.skills where skill_name = 'Python';
  select skill_id into v_skill_js from public.skills where skill_name = 'JavaScript';
  select skill_id into v_skill_react from public.skills where skill_name = 'React';
  select skill_id into v_skill_sql from public.skills where skill_name = 'SQL';
  select skill_id into v_skill_php from public.skills where skill_name = 'PHP';
  select skill_id into v_skill_cpp from public.skills where skill_name = 'C++';
  select skill_id into v_skill_node from public.skills where skill_name = 'Node.js';
  select skill_id into v_skill_htmlcss from public.skills where skill_name = 'HTML/CSS';
  select skill_id into v_skill_data_analysis from public.skills where skill_name = 'Data Analysis';
  select skill_id into v_skill_cloud from public.skills where skill_name = 'Cloud Computing';
  select skill_id into v_skill_git from public.skills where skill_name = 'Git/Version Control';
  select skill_id into v_skill_db_mgmt from public.skills where skill_name = 'Database Management';
  select skill_id into v_skill_ml from public.skills where skill_name = 'Machine Learning';
  select skill_id into v_skill_cyber from public.skills where skill_name = 'Cybersecurity Fundamentals';
  select skill_id into v_skill_network from public.skills where skill_name = 'Networking';
  select skill_id into v_skill_uiux from public.skills where skill_name = 'UI/UX Design';
  select skill_id into v_skill_autocad from public.skills where skill_name = 'AutoCAD';
  select skill_id into v_skill_matlab from public.skills where skill_name = 'MATLAB';
  select skill_id into v_skill_circuit from public.skills where skill_name = 'Circuit Design';
  select skill_id into v_skill_proj_sched from public.skills where skill_name = 'Project Scheduling';
  select skill_id into v_skill_comm from public.skills where skill_name = 'Communication';
  select skill_id into v_skill_teamwork from public.skills where skill_name = 'Teamwork';
  select skill_id into v_skill_prob_solve from public.skills where skill_name = 'Problem Solving';
  select skill_id into v_skill_time_mgmt from public.skills where skill_name = 'Time Management';
  select skill_id into v_skill_adapt from public.skills where skill_name = 'Adaptability';
  select skill_id into v_skill_lead from public.skills where skill_name = 'Leadership';
  select skill_id into v_skill_crit_think from public.skills where skill_name = 'Critical Thinking';
  select skill_id into v_skill_pres from public.skills where skill_name = 'Presentation Skills';
  select skill_id into v_skill_docker from public.skills where skill_name = 'Docker';
  select skill_id into v_skill_aws from public.skills where skill_name = 'AWS';
  select skill_id into v_skill_cicd from public.skills where skill_name = 'CI/CD';
  select skill_id into v_skill_ts from public.skills where skill_name = 'TypeScript';
  select skill_id into v_skill_tableau from public.skills where skill_name = 'Tableau';
  select skill_id into v_skill_r from public.skills where skill_name = 'R';
  select skill_id into v_skill_go from public.skills where skill_name = 'Go';
  select skill_id into v_skill_k8s from public.skills where skill_name = 'Kubernetes';

  -- Find or fallback admin UUID
  select id into v_admin_id from public.users where role = 'Admin' limit 1;
  if v_admin_id is null then
    select id into v_admin_id from public.users limit 1;
  end if;
  -- If no user is registered yet, v_admin_id remains NULL (valid for system seeds)

  -- --------------------------------------------------------------------------
  -- JOB 1: Software Engineer Intern (Petronas Digital) - Figure 4.5 & 4.7
  -- --------------------------------------------------------------------------
  insert into public.job_postings (title, company, description, job_type, location, industry, deadline, status, created_by)
  values (
    'Software Engineer Intern',
    'Petronas Digital Sdn. Bhd.',
    'Join Petronas Digital as a Software Engineering Intern to develop scalable cloud applications, RESTful APIs, and responsive frontend systems supporting energy transition initiatives.',
    'Internship',
    'Kuala Lumpur',
    'Information Technology',
    '2026-05-30',
    'Active',
    v_admin_id
  ) returning job_posting_id into v_job_id;

  insert into public.job_skills (job_posting_id, skill_id, is_required) values
    (v_job_id, v_skill_python, true),
    (v_job_id, v_skill_js, true),
    (v_job_id, v_skill_react, true),
    (v_job_id, v_skill_sql, true),
    (v_job_id, v_skill_docker, true),
    (v_job_id, v_skill_comm, false),
    (v_job_id, v_skill_prob_solve, false)
  on conflict do nothing;

  -- --------------------------------------------------------------------------
  -- JOB 2: Data Analyst Intern (Maxis Berhad) - Figure 4.5
  -- --------------------------------------------------------------------------
  insert into public.job_postings (title, company, description, job_type, location, industry, deadline, status, created_by)
  values (
    'Data Analyst Intern',
    'Maxis Berhad',
    'Work with the enterprise business intelligence team at Bukit Damansara to clean datasets, build interactive KPI dashboards in Tableau, and run statistical analytics using Python and SQL.',
    'Internship',
    'Bukit Damansara, KL',
    'Telecommunications',
    '2026-06-15',
    'Active',
    v_admin_id
  ) returning job_posting_id into v_job_id;

  insert into public.job_skills (job_posting_id, skill_id, is_required) values
    (v_job_id, v_skill_python, true),
    (v_job_id, v_skill_sql, true),
    (v_job_id, v_skill_data_analysis, true),
    (v_job_id, v_skill_tableau, true),
    (v_job_id, v_skill_r, false),
    (v_job_id, v_skill_crit_think, false)
  on conflict do nothing;

  -- --------------------------------------------------------------------------
  -- JOB 3: Junior Web Developer (Telekom Malaysia) - Figure 4.5 & 4.8
  -- --------------------------------------------------------------------------
  insert into public.job_postings (title, company, description, job_type, location, industry, deadline, status, created_by)
  values (
    'Junior Web Developer',
    'Telekom Malaysia Bhd.',
    'Entry-level web developer role based at TM Tower, Kuala Lumpur. Responsible for implementing frontend user interfaces using modern JavaScript, React, and TypeScript with CI/CD deployment on AWS.',
    'Full-Time',
    'Kuala Lumpur',
    'Information Technology',
    '2026-07-01',
    'Active',
    v_admin_id
  ) returning job_posting_id into v_job_id;

  insert into public.job_skills (job_posting_id, skill_id, is_required) values
    (v_job_id, v_skill_js, true),
    (v_job_id, v_skill_react, true),
    (v_job_id, v_skill_ts, true),
    (v_job_id, v_skill_aws, false),
    (v_job_id, v_skill_cicd, false),
    (v_job_id, v_skill_teamwork, false)
  on conflict do nothing;

  -- --------------------------------------------------------------------------
  -- JOB 4: Backend Developer Intern (Grab Holdings) - Figure 4.8 & 4.9
  -- --------------------------------------------------------------------------
  insert into public.job_postings (title, company, description, job_type, location, industry, deadline, status, created_by)
  values (
    'Backend Developer Intern',
    'Grab Holdings',
    'Join Grab R&D Centre at Bangsar South to build high-throughput microservices in Go and Python, orchestrate containers with Kubernetes, and optimize distributed PostgreSQL clusters.',
    'Internship',
    'Bangsar South, KL',
    'Information Technology',
    '2026-06-20',
    'Active',
    v_admin_id
  ) returning job_posting_id into v_job_id;

  insert into public.job_skills (job_posting_id, skill_id, is_required) values
    (v_job_id, v_skill_python, true),
    (v_job_id, v_skill_go, true),
    (v_job_id, v_skill_k8s, true),
    (v_job_id, v_skill_sql, false),
    (v_job_id, v_skill_git, false)
  on conflict do nothing;

  -- --------------------------------------------------------------------------
  -- JOB 5: UI/UX Design Intern (CIMB Bank) - Figure 4.9
  -- --------------------------------------------------------------------------
  insert into public.job_postings (title, company, description, job_type, location, industry, deadline, status, created_by)
  values (
    'UI/UX Design Intern',
    'CIMB Bank',
    'Design user-centric web and mobile banking experiences at Menara CIMB. Collaborate closely with software engineering teams using Figma and frontend HTML/CSS prototyping.',
    'Internship',
    'Kuala Lumpur',
    'Banking & Finance',
    '2026-05-31',
    'Active',
    v_admin_id
  ) returning job_posting_id into v_job_id;

  insert into public.job_skills (job_posting_id, skill_id, is_required) values
    (v_job_id, v_skill_uiux, true),
    (v_job_id, v_skill_htmlcss, true),
    (v_job_id, v_skill_comm, true),
    (v_job_id, v_skill_pres, false)
  on conflict do nothing;

  -- --------------------------------------------------------------------------
  -- JOB 6: Cloud Engineer Intern (Celcom Axiata) - Figure 4.9
  -- --------------------------------------------------------------------------
  insert into public.job_postings (title, company, description, job_type, location, industry, deadline, status, created_by)
  values (
    'Cloud Engineer Intern',
    'Celcom Axiata Bhd.',
    'Assist the cloud operations team in Shah Alam with deploying multi-region infrastructure on AWS, implementing automated monitoring, and managing Linux server workloads.',
    'Internship',
    'Shah Alam, Selangor',
    'Telecommunications',
    '2026-07-10',
    'Active',
    v_admin_id
  ) returning job_posting_id into v_job_id;

  insert into public.job_skills (job_posting_id, skill_id, is_required) values
    (v_job_id, v_skill_cloud, true),
    (v_job_id, v_skill_aws, true),
    (v_job_id, v_skill_network, true),
    (v_job_id, v_skill_cicd, false),
    (v_job_id, v_skill_prob_solve, false)
  on conflict do nothing;

  -- --------------------------------------------------------------------------
  -- JOB 7: Electrical Power Engineering Trainee (Tenaga Nasional Berhad)
  -- --------------------------------------------------------------------------
  insert into public.job_postings (title, company, description, job_type, location, industry, deadline, status, created_by)
  values (
    'Electrical Power Engineering Trainee',
    'Tenaga Nasional Berhad (TNB)',
    'Industrial training at TNB headquarters / sub-station facility. Participate in smart grid monitoring, power system analysis using MATLAB, and high-voltage circuit design reviews.',
    'Internship',
    'Kuala Lumpur',
    'Engineering & Energy',
    '2026-06-30',
    'Active',
    v_admin_id
  ) returning job_posting_id into v_job_id;

  insert into public.job_skills (job_posting_id, skill_id, is_required) values
    (v_job_id, v_skill_circuit, true),
    (v_job_id, v_skill_matlab, true),
    (v_job_id, v_skill_autocad, true),
    (v_job_id, v_skill_proj_sched, false),
    (v_job_id, v_skill_teamwork, false)
  on conflict do nothing;

  -- --------------------------------------------------------------------------
  -- JOB 8: Cybersecurity Analyst Intern (CyberSecurity Malaysia)
  -- --------------------------------------------------------------------------
  insert into public.job_postings (title, company, description, job_type, location, industry, deadline, status, created_by)
  values (
    'Cybersecurity Analyst Intern',
    'CyberSecurity Malaysia',
    'Support security operations centre (SOC) analysts in threat vulnerability scanning, incident logging, and network protocol anomaly detection in Cyberjaya.',
    'Internship',
    'Cyberjaya, Selangor',
    'Cybersecurity',
    '2026-06-25',
    'Active',
    v_admin_id
  ) returning job_posting_id into v_job_id;

  insert into public.job_skills (job_posting_id, skill_id, is_required) values
    (v_job_id, v_skill_cyber, true),
    (v_job_id, v_skill_network, true),
    (v_job_id, v_skill_python, false),
    (v_job_id, v_skill_crit_think, true)
  on conflict do nothing;

  -- --------------------------------------------------------------------------
  -- JOB 9: AI & Machine Learning Graduate Trainee (Shopee)
  -- --------------------------------------------------------------------------
  insert into public.job_postings (title, company, description, job_type, location, industry, deadline, status, created_by)
  values (
    'AI & Machine Learning Graduate Trainee',
    'Shopee Malaysia',
    'Entry-level graduate program in e-commerce recommendation models, search ranking algorithms, and large-scale tabular feature engineering using Python and Machine Learning frameworks.',
    'Full-Time',
    'Kuala Lumpur',
    'E-Commerce & Tech',
    '2026-07-31',
    'Active',
    v_admin_id
  ) returning job_posting_id into v_job_id;

  insert into public.job_skills (job_posting_id, skill_id, is_required) values
    (v_job_id, v_skill_python, true),
    (v_job_id, v_skill_ml, true),
    (v_job_id, v_skill_data_analysis, true),
    (v_job_id, v_skill_sql, true),
    (v_job_id, v_skill_git, false)
  on conflict do nothing;

end $$;
