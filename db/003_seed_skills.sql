-- ============================================================================
-- Baseline skill taxonomy seed
-- Needed before recommendation/skill-gap matching logic can be tested.
-- Curated for the FYP's target respondent fields (Ch.3.2.1 Fig 3.2: CS/IT,
-- Engineering, Business, Software Engineering dominate the survey sample).
-- This is a starting set — extend via the Admin "add skill" flow as needed.
-- ============================================================================

insert into public.skills (skill_name, category) values
  -- Technical: programming
  ('Python', 'Technical'),
  ('JavaScript', 'Technical'),
  ('Java', 'Technical'),
  ('SQL', 'Technical'),
  ('PHP', 'Technical'),
  ('C++', 'Technical'),
  -- Technical: web/frameworks
  ('React', 'Technical'),
  ('Node.js', 'Technical'),
  ('HTML/CSS', 'Technical'),
  -- Technical: data & infra
  ('Data Analysis', 'Technical'),
  ('Excel', 'Technical'),
  ('Cloud Computing', 'Technical'),
  ('Git/Version Control', 'Technical'),
  ('Database Management', 'Technical'),
  ('Machine Learning', 'Technical'),
  ('Cybersecurity Fundamentals', 'Technical'),
  ('Networking', 'Technical'),
  ('UI/UX Design', 'Technical'),
  -- Technical: engineering-adjacent (given 44% Engineering respondents)
  ('AutoCAD', 'Technical'),
  ('MATLAB', 'Technical'),
  ('Circuit Design', 'Technical'),
  ('Project Scheduling', 'Technical'),
  -- Soft skills
  ('Communication', 'Soft'),
  ('Teamwork', 'Soft'),
  ('Problem Solving', 'Soft'),
  ('Time Management', 'Soft'),
  ('Adaptability', 'Soft'),
  ('Leadership', 'Soft'),
  ('Critical Thinking', 'Soft'),
  ('Presentation Skills', 'Soft')
on conflict (skill_name) do nothing;
