// ============================================================================
// InternMatch — Student Dashboard Controller (dashboard.js)
// Implements FR-4 / UC-04: Personalized Ranked Recommendations
// ============================================================================

let currentUserId = null;
let currentProfile = null;
let userSkillIds = [];
let rankedJobs = [];

document.addEventListener('DOMContentLoaded', async () => {
  const authContext = await requireAuth();
  if (!authContext) return;

  currentUserId = authContext.session.user.id;
  await loadUserData();
  await loadProfileAndSkills();
  await generateAndRenderRecommendations();
  setupDashboardEvents();
});

// ----------------------------------------------------------------------------
// 1. Load User Information
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

// ----------------------------------------------------------------------------
// 2. Load Profile & Skill IDs
// ----------------------------------------------------------------------------
async function loadProfileAndSkills() {
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', currentUserId)
    .single();

  if (profile) {
    currentProfile = profile;
    const strength = profile.profile_strength || 0;
    document.getElementById('strength-val').textContent = `${strength}%`;
    document.getElementById('strength-bar').style.width = `${strength}%`;

    // Fetch skills
    const { data: pSkills } = await supabaseClient
      .from('profile_skills')
      .select('skill_id')
      .eq('profile_id', profile.profile_id);

    if (pSkills) {
      userSkillIds = pSkills.map(ps => ps.skill_id);
    }
  } else {
    document.getElementById('strength-val').textContent = '15%';
    document.getElementById('strength-bar').style.width = '15%';
  }
}

// ----------------------------------------------------------------------------
// 3. Compute Recommendations & Render Ranked List
// ----------------------------------------------------------------------------
async function generateAndRenderRecommendations() {
  const container = document.getElementById('recommendations-container');
  const incompleteBox = document.getElementById('incomplete-profile-box');

  // Check if profile is empty
  if (!currentProfile || userSkillIds.length === 0) {
    incompleteBox.style.display = 'block';
  } else {
    incompleteBox.style.display = 'none';
  }

  // Attempt RPC first, fallback to client-side math
  let recommendations = [];
  try {
    const { data: rpcData, error: rpcErr } = await supabaseClient
      .rpc('calculate_recommendations_for_user', { p_user_id: currentUserId });

    if (!rpcErr && rpcData && rpcData.length > 0) {
      recommendations = rpcData;
    } else {
      recommendations = await computeRecommendationsClientSide();
    }
  } catch (err) {
    console.warn('RPC unavailable, executing client computation:', err);
    recommendations = await computeRecommendationsClientSide();
  }

  rankedJobs = recommendations;

  if (recommendations.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 40px;">
        <h3>No Job Postings Available</h3>
        <p style="margin-top: 8px;">There are currently no active internship or job postings in the database.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  recommendations.forEach(job => {
    const card = document.createElement('div');
    card.className = 'job-card';

    // Format deadline
    const deadlineText = job.deadline
      ? new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Open Until Filled';

    // Render skill chips
    let skillTagsHtml = '';
    const skillsList = job.matched_skills && job.missing_skills
      ? [...job.matched_skills, ...job.missing_skills]
      : (job.skills || []);

    skillsList.slice(0, 6).forEach(s => {
      skillTagsHtml += `<span class="tag-chip">${escapeHtml(s.skill_name || s)}</span>`;
    });

    const matchScore = parseFloat(job.match_score || 0).toFixed(0);

    card.innerHTML = `
      <div class="job-card-header">
        <div>
          <h3 class="job-title">${escapeHtml(job.title)}</h3>
          <div class="job-company">${escapeHtml(job.company)} · ${escapeHtml(job.location)}</div>
        </div>
        <div class="score-badge">
          ${matchScore}% match
        </div>
      </div>

      <div class="tag-container">
        ${skillTagsHtml}
      </div>

      <div class="job-meta-row" style="align-items: center; justify-content: space-between; margin-bottom: 0;">
        <span>${escapeHtml(job.job_type)} · Closes ${deadlineText}</span>
        <div style="display: flex; gap: 8px;">
          <a href="skill-analysis.html?job_id=${job.job_posting_id}" class="btn btn-secondary" style="font-size: 0.82rem; padding: 6px 14px;">Skill Analysis</a>
          <button class="btn btn-outline view-details-btn" data-id="${job.job_posting_id}" style="font-size: 0.82rem; padding: 6px 14px;">View Details</button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// ----------------------------------------------------------------------------
// 4. Client-Side Mathematical Recommendation Engine (Fallback / Standalone)
// ----------------------------------------------------------------------------
async function computeRecommendationsClientSide() {
  // Fetch active postings + joined skills
  const { data: jobs, error } = await supabaseClient
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
        skills (skill_id, skill_name, category)
      )
    `)
    .eq('status', 'Active');

  if (error || !jobs) return [];

  const userField = currentProfile?.field_of_study || '';
  const userInterests = (currentProfile?.career_interests || '').toLowerCase();

  return jobs.map(job => {
    const jobSkills = job.job_skills || [];
    const reqSkills = [];
    const prefSkills = [];
    const allSkills = [];

    jobSkills.forEach(js => {
      if (js.skills) {
        allSkills.push(js.skills);
        if (js.is_required) {
          reqSkills.push(js.skills.skill_id);
        } else {
          prefSkills.push(js.skills.skill_id);
        }
      }
    });

    // 1. RequiredSkillCoverage: (matched required) / (total required)
    const s_req = reqSkills.length === 0
      ? 1.0
      : reqSkills.filter(id => userSkillIds.includes(id)).length / reqSkills.length;

    // 2. PreferredSkillCoverage: (matched preferred) / (total preferred), 0 if none
    const s_pref = prefSkills.length === 0
      ? 0.0
      : prefSkills.filter(id => userSkillIds.includes(id)).length / prefSkills.length;

    // 3. FieldOfStudyAlignment: 1 if match, else 0
    let s_field = 0.0;
    const ind = (job.industry || '').toLowerCase().trim();
    const uf = userField.toLowerCase().trim();
    if (uf && (ind.includes(uf) || uf.includes(ind) ||
        (['computer science', 'software engineering', 'information technology'].includes(uf) && ['information technology', 'software', 'telecommunications', 'e-commerce & tech'].includes(ind)) ||
        (['electrical engineering', 'electrical power engineering'].includes(uf) && ['engineering & energy', 'telecommunications'].includes(ind)))) {
      s_field = 1.0;
    }

    // 4. CareerInterestAlignment: 1 if match, else 0
    let s_interest = 0.0;
    const ui = userInterests.toLowerCase().trim();
    if (ui && (job.title.toLowerCase().includes(ui) || (job.description && job.description.toLowerCase().includes(ui)))) {
      s_interest = 1.0;
    }

    const totalScore = Math.round(
      ((0.50 * s_req) + (0.20 * s_pref) + (0.15 * s_field) + (0.15 * s_interest)) * 100
    );

    return {
      job_posting_id: job.job_posting_id,
      title: job.title,
      company: job.company,
      description: job.description,
      job_type: job.job_type,
      location: job.location,
      industry: job.industry,
      deadline: job.deadline,
      match_score: totalScore,
      skills: allSkills
    };
  }).sort((a, b) => b.match_score - a.match_score);
}

// ----------------------------------------------------------------------------
// 5. Job Details Modal & Apply Action
// ----------------------------------------------------------------------------
function setupDashboardEvents() {
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  const modal = document.getElementById('job-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  closeModalBtn.addEventListener('click', () => modal.classList.remove('is-open'));

  // Open modal on click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('view-details-btn')) {
      const jobId = parseInt(e.target.getAttribute('data-id'), 10);
      const job = rankedJobs.find(j => j.job_posting_id === jobId);
      if (job) openJobModal(job);
    }
  });

  // Modal Apply action
  document.getElementById('modal-apply-btn').addEventListener('click', async () => {
    const btn = document.getElementById('modal-apply-btn');
    const jobId = btn.getAttribute('data-job-id');
    if (!jobId) return;

    btn.disabled = true;
    btn.textContent = 'Submitting Application...';

    const { error } = await supabaseClient
      .from('applications')
      .insert({
        user_id: currentUserId,
        job_posting_id: parseInt(jobId, 10),
        status: 'Submitted'
      });

    if (error) {
      if (error.message.includes('unique') || error.code === '23505') {
        showDashboardToast('You have already submitted an application for this position.', 'info');
      } else {
        showDashboardToast(`Application error: ${error.message}`, 'error');
      }
    } else {
      showDashboardToast('Application submitted successfully!', 'success');
      btn.textContent = '✓ Application Submitted';
      return;
    }

    btn.disabled = false;
    btn.textContent = 'Apply to Position';
  });
}

function openJobModal(job) {
  const modal = document.getElementById('job-modal');
  document.getElementById('modal-job-title').textContent = job.title;
  document.getElementById('modal-company').textContent = `${job.company} · ${job.location}`;
  document.getElementById('modal-desc').textContent = job.description;

  const deadlineText = job.deadline
    ? new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Open Until Filled';

  document.getElementById('modal-meta').innerHTML = `
    <span><strong>Type:</strong> ${escapeHtml(job.job_type)}</span>
    <span><strong>Industry:</strong> ${escapeHtml(job.industry || 'General')}</span>
    <span><strong>Closing Date:</strong> ${deadlineText}</span>
    <span class="score-badge">${parseFloat(job.match_score || 0).toFixed(0)}% Match</span>
  `;

  const skillsContainer = document.getElementById('modal-skills');
  skillsContainer.innerHTML = '';
  const skillsList = job.skills || [];
  skillsList.forEach(s => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.textContent = s.skill_name || s;
    skillsContainer.appendChild(chip);
  });

  document.getElementById('modal-analysis-link').href = `skill-analysis.html?job_id=${job.job_posting_id}`;
  const applyBtn = document.getElementById('modal-apply-btn');
  applyBtn.setAttribute('data-job-id', job.job_posting_id);
  applyBtn.disabled = false;
  applyBtn.textContent = 'Apply to Position';

  modal.classList.add('is-open');
}

function showDashboardToast(msg, type = 'info') {
  const alertBox = document.getElementById('dashboard-alert');
  alertBox.textContent = msg;
  alertBox.className = `alert-toast alert-toast--${type} is-visible`;
  setTimeout(() => { alertBox.className = 'alert-toast'; }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
