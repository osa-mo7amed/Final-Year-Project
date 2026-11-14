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
  const btns = [document.getElementById('header-apply-btn'),document.getElementById('bottom-apply-btn')];
  btns.forEach(b=>{b.disabled=true;b.textContent='Loading…';});
  currentJobData = null;
  let job;
  try { job = (await fetchRecommendations(currentUserId)).find(j=>j.job_posting_id===jobId); }
  catch(err) { showToast(err.message,'error'); return; }
  if (!job) {showToast('This listing is unavailable, closed or expired.','error');return;}
  btns.forEach(b=>{b.disabled=false;b.textContent='Apply Now';});
  currentJobData = job;

  // Header Subtitle
  document.getElementById('header-job-subtitle').textContent =
    `${job.title} · ${job.company}`;

  const deadlineText = job.deadline
    ? new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Open Until Filled';

  document.getElementById('bottom-deadline-text').textContent =
    `Application closes ${deadlineText} · ${job.company}.`;

  const matchedSkills = job.matched_skills || [];
  const missingSkills = job.missing_skills || [];
  const totalScore = Number(job.match_score).toFixed(2);
  const jobSkillsList = [...matchedSkills,...missingSkills];

  // Update UI Elements
  document.getElementById('analysis-score-num').textContent = `${totalScore}%`;

  const totalJobSkillsCount = jobSkillsList.length;
  const matchedCount = matchedSkills.length;
  const missingCount = missingSkills.length;

  document.getElementById('matched-count-badge').textContent = `(${matchedCount}/${totalJobSkillsCount})`;
  document.getElementById('missing-count-badge').textContent = `(${missingCount}/${totalJobSkillsCount})`;

  const summaryTextEl = document.getElementById('analysis-summary-text');
  summaryTextEl.textContent = job.explanation;

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
      chip.innerHTML = `✓ ${escapeHtml(s.skill_name)} <span style="font-size: 0.75rem; opacity: 0.8;">(${escapeHtml(s.category)} · ${s.is_required ? 'Required' : 'Preferred'})</span>`;
      matchedListEl.appendChild(chip);
    });
  }

  // Render Missing Skills (✕ Red)
  const missingListEl = document.getElementById('missing-skills-list');
  missingListEl.innerHTML = '';
  if (missingSkills.length === 0) {
    missingListEl.innerHTML = '<span style="color: #4ade80; font-size: 0.88rem;">No listed skill gaps. This does not assess experience or guarantee suitability.</span>';
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
        🎉 Outstanding! You have no skill gaps for this position. Review the full role requirements before applying.
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
    if (!currentJobId || !currentJobData) return;

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
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
