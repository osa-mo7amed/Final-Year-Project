// ============================================================================
// InternMatch — Skill Alignment & Gap Analysis Controller (skill-analysis.js)
// Implements FR-5 / UC-05: Skill Alignment, Gap Identification & Structured Guidance
// ============================================================================

let currentUserId = null;
let currentProfile = null;
let userSkillIds = [];
let currentJobId = null;
let currentJobData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const authContext = await requireAuth();
  if (!authContext) return;

  currentUserId = authContext.session.user.id;
  await loadUserData();
  await loadProfileAndSkills();

  // Check URL params
  const urlParams = new URLSearchParams(window.location.search);
  const jobIdParam = urlParams.get('job_id');

  if (jobIdParam) {
    currentJobId = parseInt(jobIdParam, 10);
    await analyzeJob(currentJobId);
  } else {
    await initJobSelector();
  }

  setupEventListeners();
});

// ----------------------------------------------------------------------------
// 1. Load User Details & Profile Skills
// ----------------------------------------------------------------------------
async function loadUserData() {
  const { data: userRow, error } = await supabaseClient
    .from('users')
    .select('full_name, role')
    .eq('id', currentUserId)
    .single();

  if (!error && userRow) {
    document.getElementById('sidebar-user-name').textContent = userRow.full_name || 'Student User';
    document.getElementById('sidebar-user-role').textContent = userRow.role || 'Student';
  }
}

async function loadProfileAndSkills() {
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', currentUserId)
    .single();

  if (profile) {
    currentProfile = profile;
    const { data: pSkills } = await supabaseClient
      .from('profile_skills')
      .select('skill_id, skills (skill_id, skill_name, category)')
      .eq('profile_id', profile.profile_id);

    if (pSkills) {
      userSkillIds = pSkills.map(ps => ps.skill_id);
    }
  }
}

// ----------------------------------------------------------------------------
// 2. Job Selector (if accessed directly)
// ----------------------------------------------------------------------------
async function initJobSelector() {
  const selectBanner = document.getElementById('job-select-banner');
  const jobSelect = document.getElementById('job-selector');
  selectBanner.style.display = 'block';

  const { data: jobs, error } = await supabaseClient
    .from('job_postings')
    .select('job_posting_id, title, company')
    .eq('status', 'Active')
    .order('created_at', { ascending: false });

  if (!error && jobs && jobs.length > 0) {
    jobSelect.innerHTML = '<option value="" disabled selected>Choose a job posting to inspect alignment...</option>';
    jobs.forEach(j => {
      const opt = document.createElement('option');
      opt.value = j.job_posting_id;
      opt.textContent = `${j.title} — ${j.company}`;
      jobSelect.appendChild(opt);
    });

    jobSelect.addEventListener('change', () => {
      currentJobId = parseInt(jobSelect.value, 10);
      analyzeJob(currentJobId);
    });

    // Auto-analyze first job by default
    currentJobId = jobs[0].job_posting_id;
    jobSelect.value = currentJobId;
    await analyzeJob(currentJobId);
  }
}

// ----------------------------------------------------------------------------
// 3. Analyze Selected Job Alignment & Gaps
// ----------------------------------------------------------------------------
async function analyzeJob(jobId) {
  // Fetch job posting details + job skills + guidance
  const { data: job, error } = await supabaseClient
    .from('job_postings')
    .select(`
      job_posting_id,
      title,
      company,
      description,
      job_type,
      location,
      industry,
      deadline,
      job_skills (
        is_required,
        skills (
          skill_id,
          skill_name,
          category,
          skill_guidance (
            learning_direction,
            practice_area,
            expected_outcome,
            recommended_duration
          )
        )
      )
    `)
    .eq('job_posting_id', jobId)
    .single();

  if (error || !job) {
    showToast('Failed to load job details for alignment analysis.', 'error');
    return;
  }

  currentJobData = job;

  // Header Subtitle
  document.getElementById('header-job-subtitle').textContent =
    `${job.title} · ${job.company}`;

  const deadlineText = job.deadline
    ? new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Open Until Filled';

  document.getElementById('bottom-deadline-text').textContent =
    `Application closes ${deadlineText} · ${job.company}.`;

  // Categorize matched vs missing skills
  const matchedSkills = [];
  const missingSkills = [];
  const reqIds = [];
  const prefIds = [];

  const jobSkillsList = job.job_skills || [];

  jobSkillsList.forEach(js => {
    const s = js.skills;
    if (!s) return;

    const isUserHas = userSkillIds.includes(s.skill_id);
    const item = {
      skill_id: s.skill_id,
      skill_name: s.skill_name,
      category: s.category,
      is_required: js.is_required,
      guidance: s.skill_guidance && s.skill_guidance.length > 0 ? s.skill_guidance[0] : null
    };

    if (isUserHas) {
      matchedSkills.push(item);
    } else {
      missingSkills.push(item);
    }

    if (js.is_required) {
      reqIds.push(s.skill_id);
    } else {
      prefIds.push(s.skill_id);
    }
  });

  // Calculate exact match score per report-addendum.md §3
  // 1. RequiredSkillCoverage: (matched required) / (total required)
  const s_req = reqIds.length === 0
    ? 1.0
    : reqIds.filter(id => userSkillIds.includes(id)).length / reqIds.length;

  // 2. PreferredSkillCoverage: (matched preferred) / (total preferred), 0 if none
  const s_pref = prefIds.length === 0
    ? 0.0
    : prefIds.filter(id => userSkillIds.includes(id)).length / prefIds.length;

  // 3. FieldOfStudyAlignment: 1 if match, else 0
  let s_field = 0.0;
  const ind = (job.industry || '').toLowerCase().trim();
  const uf = (currentProfile?.field_of_study || '').toLowerCase().trim();
  if (uf && (ind.includes(uf) || uf.includes(ind) ||
      (['computer science', 'software engineering', 'information technology'].includes(uf) && ['information technology', 'software', 'telecommunications', 'e-commerce & tech'].includes(ind)) ||
      (['electrical engineering', 'electrical power engineering'].includes(uf) && ['engineering & energy', 'telecommunications'].includes(ind)))) {
    s_field = 1.0;
  }

  // 4. CareerInterestAlignment: 1 if match, else 0
  const userInterests = (currentProfile?.career_interests || '').toLowerCase().trim();
  let s_interest = 0.0;
  if (userInterests && (job.title.toLowerCase().includes(userInterests) || (job.description && job.description.toLowerCase().includes(userInterests)))) {
    s_interest = 1.0;
  }

  const totalScore = Math.round(
    ((0.50 * s_req) + (0.20 * s_pref) + (0.15 * s_field) + (0.15 * s_interest)) * 100
  );

  // Update UI Elements
  document.getElementById('analysis-score-num').textContent = `${totalScore}%`;

  const totalJobSkillsCount = jobSkillsList.length;
  const matchedCount = matchedSkills.length;
  const missingCount = missingSkills.length;

  document.getElementById('matched-count-badge').textContent = `(${matchedCount}/${totalJobSkillsCount})`;
  document.getElementById('missing-count-badge').textContent = `(${missingCount}/${totalJobSkillsCount})`;

  const summaryTextEl = document.getElementById('analysis-summary-text');
  if (totalScore >= 80) {
    summaryTextEl.textContent = `Your profile aligns strongly with this role. ${matchedCount} of your skills match the ${totalJobSkillsCount} required skills. Close ${missingCount} gap${missingCount === 1 ? '' : 's'} to reach a full match.`;
  } else if (totalScore >= 60) {
    summaryTextEl.textContent = `Your profile has moderate compatibility (${matchedCount}/${totalJobSkillsCount} skills matched). Review the structured learning guidance below to bridge your missing competencies.`;
  } else {
    summaryTextEl.textContent = `This position has significant competency gaps with your current profile (${missingCount} missing skills). Follow the recommended skill development pathways to prepare for similar roles.`;
  }

  // Render Matched Skills (✓ Green)
  const matchedListEl = document.getElementById('matched-skills-list');
  matchedListEl.innerHTML = '';
  if (matchedSkills.length === 0) {
    matchedListEl.innerHTML = '<span style="color: var(--text-dim); font-size: 0.88rem;">No matching skills identified for this posting.</span>';
  } else {
    matchedSkills.forEach(s => {
      const chip = document.createElement('div');
      chip.className = 'tag-chip tag-chip--matched';
      chip.style.fontSize = '0.9rem';
      chip.style.padding = '8px 14px';
      chip.innerHTML = `✓ ${escapeHtml(s.skill_name)} <span style="font-size: 0.75rem; opacity: 0.8;">(${s.category})</span>`;
      matchedListEl.appendChild(chip);
    });
  }

  // Render Missing Skills (✕ Red)
  const missingListEl = document.getElementById('missing-skills-list');
  missingListEl.innerHTML = '';
  if (missingSkills.length === 0) {
    missingListEl.innerHTML = '<span style="color: #4ade80; font-size: 0.88rem;">✓ Full skill match! You possess all required and preferred competencies.</span>';
  } else {
    missingSkills.forEach(s => {
      const chip = document.createElement('div');
      chip.className = 'tag-chip tag-chip--missing';
      chip.style.fontSize = '0.9rem';
      chip.style.padding = '8px 14px';
      chip.innerHTML = `✕ ${escapeHtml(s.skill_name)} <span style="font-size: 0.75rem; opacity: 0.8;">(${s.is_required ? 'Required' : 'Preferred'})</span>`;
      missingListEl.appendChild(chip);
    });
  }

  // Render Structured Guidance
  renderGuidance(missingSkills);
}

// ----------------------------------------------------------------------------
// 4. Render Structured Improvement Guidance (Figure 4.7)
// ----------------------------------------------------------------------------
function renderGuidance(missingSkills) {
  const container = document.getElementById('guidance-container');
  container.innerHTML = '';

  if (missingSkills.length === 0) {
    container.innerHTML = `
      <div style="padding: 16px; color: #4ade80; font-size: 0.95rem;">
        🎉 Outstanding! You have no skill gaps for this position. You are fully prepared to submit your application.
      </div>
    `;
    return;
  }

  missingSkills.forEach(item => {
    const box = document.createElement('div');
    box.className = 'guidance-box';

    const g = item.guidance || {
      learning_direction: `Study core documentation and fundamental concepts for ${item.skill_name}.`,
      practice_area: 'Skill Acquisition',
      expected_outcome: `Build a small portfolio project to demonstrate competence in ${item.skill_name}.`,
      recommended_duration: '2-3 weeks'
    };

    box.innerHTML = `
      <div class="guidance-skill-title">${escapeHtml(item.skill_name)} — ${escapeHtml(g.practice_area)}</div>
      <p style="color: var(--text-main); margin-bottom: 8px; font-size: 0.9rem; line-height: 1.5;">
        ${escapeHtml(g.learning_direction)}
      </p>
      <div style="font-size: 0.84rem; color: var(--text-muted); display: flex; gap: 16px; flex-wrap: wrap;">
        <span><strong>Target Outcome:</strong> ${escapeHtml(g.expected_outcome)}</span>
        <span><strong>Estimated Duration:</strong> ${escapeHtml(g.recommended_duration)}</span>
      </div>
    `;

    container.appendChild(box);
  });
}

// ----------------------------------------------------------------------------
// 5. Apply Now Handler
// ----------------------------------------------------------------------------
function setupEventListeners() {
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  const handleApply = async () => {
    if (!currentJobId) return;

    const btns = [document.getElementById('header-apply-btn'), document.getElementById('bottom-apply-btn')];
    btns.forEach(b => { b.disabled = true; b.textContent = 'Submitting...'; });

    const { error } = await supabaseClient
      .from('applications')
      .insert({
        user_id: currentUserId,
        job_posting_id: currentJobId,
        status: 'Submitted'
      });

    if (error) {
      if (error.message.includes('unique') || error.code === '23505') {
        showToast('You have already applied for this position.', 'info');
      } else {
        showToast(`Application failed: ${error.message}`, 'error');
      }
      btns.forEach(b => { b.disabled = false; b.textContent = 'Apply Now'; });
    } else {
      showToast('Application submitted successfully!', 'success');
      btns.forEach(b => { b.textContent = '✓ Applied'; });
    }
  };

  document.getElementById('header-apply-btn').addEventListener('click', handleApply);
  document.getElementById('bottom-apply-btn').addEventListener('click', handleApply);
}

function showToast(msg, type = 'info') {
  const alertBox = document.getElementById('analysis-alert');
  alertBox.textContent = msg;
  alertBox.className = `alert-toast alert-toast--${type} is-visible`;
  setTimeout(() => { alertBox.className = 'alert-toast'; }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
