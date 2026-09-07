// ============================================================================
// InternMatch — Job Search & Multi-Filter Controller (search.js)
// Implements FR-6 / UC-06: Search & Filter Job Listings
// ============================================================================

let currentUserId = null;
let currentProfile = null;
let userSkillIds = [];
let allJobs = [];
let masterSkills = [];

document.addEventListener('DOMContentLoaded', async () => {
  const authContext = await requireAuth();
  if (!authContext) return;

  currentUserId = authContext.session.user.id;
  await loadUserData();
  await loadProfileAndSkills();
  await loadSkillsFilter();
  await fetchAllJobs();
  setupFilterEvents();
});

// ----------------------------------------------------------------------------
// 1. Load User Details & Skills
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
      .select('skill_id')
      .eq('profile_id', profile.profile_id);

    if (pSkills) {
      userSkillIds = pSkills.map(ps => ps.skill_id);
    }
  }
}

// ----------------------------------------------------------------------------
// 2. Load Skills Checklist in Filter Sidebar
// ----------------------------------------------------------------------------
async function loadSkillsFilter() {
  const container = document.getElementById('skills-filter-group');
  const { data, error } = await supabaseClient
    .from('skills')
    .select('skill_id, skill_name, category')
    .order('skill_name', { ascending: true });

  if (!error && data) {
    masterSkills = data;
    container.innerHTML = '';
    // Show top common tech skills first
    data.slice(0, 15).forEach(s => {
      const label = document.createElement('label');
      label.className = 'filter-checkbox-label';
      label.innerHTML = `<input type="checkbox" name="skillFilter" value="${s.skill_id}" /> ${escapeHtml(s.skill_name)}`;
      container.appendChild(label);
    });
  }
}

// ----------------------------------------------------------------------------
// 3. Fetch All Active Job Postings
// ----------------------------------------------------------------------------
async function fetchAllJobs() {
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
    .eq('status', 'Active')
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Failed to load job listings.', 'error');
    return;
  }

  allJobs = (jobs || []).map(job => {
    const jobSkills = job.job_skills || [];
    const reqSkills = [];
    const prefSkills = [];
    const allSkillsList = [];

    jobSkills.forEach(js => {
      if (js.skills) {
        allSkillsList.push(js.skills);
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

    const matchScore = Math.round(
      ((0.50 * s_req) + (0.20 * s_pref) + (0.15 * s_field) + (0.15 * s_interest)) * 100
    );

    return {
      ...job,
      match_score: matchScore,
      skills_list: allSkillsList,
      skill_ids: allSkillsList.map(s => s.skill_id)
    };
  });

  applyFiltersAndRender();
}

// ----------------------------------------------------------------------------
// 4. Multi-Filter & Search Algorithm
// ----------------------------------------------------------------------------
function applyFiltersAndRender() {
  const searchQuery = document.getElementById('search-input').value.trim().toLowerCase();
  const selectedIndustry = document.getElementById('industry-filter').value;
  const selectedLocation = document.getElementById('location-filter').value;

  const selectedJobTypes = Array.from(
    document.querySelectorAll('input[name="jobType"]:checked')
  ).map(cb => cb.value);

  const selectedSkillIds = Array.from(
    document.querySelectorAll('input[name="skillFilter"]:checked')
  ).map(cb => parseInt(cb.value, 10));

  const filtered = allJobs.filter(job => {
    // 1. Keyword search (Title, Company, Description, or Skills)
    if (searchQuery) {
      const matchTitle = job.title.toLowerCase().includes(searchQuery);
      const matchComp = job.company.toLowerCase().includes(searchQuery);
      const matchDesc = job.description.toLowerCase().includes(searchQuery);
      const matchSkill = job.skills_list.some(s => s.skill_name.toLowerCase().includes(searchQuery));
      if (!matchTitle && !matchComp && !matchDesc && !matchSkill) return false;
    }

    // 2. Industry filter
    if (selectedIndustry && job.industry !== selectedIndustry) {
      return false;
    }

    // 3. Job Type filter
    if (selectedJobTypes.length > 0 && !selectedJobTypes.includes(job.job_type)) {
      return false;
    }

    // 4. Location filter
    if (selectedLocation && !job.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
      return false;
    }

    // 5. Skill filter (must include selected skills)
    if (selectedSkillIds.length > 0) {
      const hasAllSelectedSkills = selectedSkillIds.every(sid => job.skill_ids.includes(sid));
      if (!hasAllSelectedSkills) return false;
    }

    return true;
  });

  // Sort by match score descending
  filtered.sort((a, b) => b.match_score - a.match_score);

  renderJobResults(filtered);
}

// ----------------------------------------------------------------------------
// 5. Render Job Cards in Search View (Figure 4.8)
// ----------------------------------------------------------------------------
function renderJobResults(jobs) {
  const container = document.getElementById('search-results-container');
  const countBadge = document.getElementById('available-count-badge');
  countBadge.textContent = `${jobs.length} listings available`;

  container.innerHTML = '';

  if (jobs.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 48px;">
        <h3 style="margin-bottom: 8px;">No Listings Match Your Filters</h3>
        <p style="margin-bottom: 16px;">Try adjusting your keyword search, selecting different job types, or clearing skill filters.</p>
        <button id="clear-all-btn" class="btn btn-outline" style="width: auto;">Reset All Filters</button>
      </div>
    `;
    document.getElementById('clear-all-btn')?.addEventListener('click', resetFilters);
    return;
  }

  jobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'job-card';

    // Monogram initials
    const words = job.company.split(' ').filter(Boolean);
    const monogram = words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : job.company.slice(0, 2).toUpperCase();

    const deadlineText = job.deadline
      ? new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : 'Open';

    let skillTagsHtml = '';
    job.skills_list.slice(0, 5).forEach(s => {
      skillTagsHtml += `<span class="tag-chip">${escapeHtml(s.skill_name)}</span>`;
    });

    card.innerHTML = `
      <div style="display: flex; gap: 16px; align-items: flex-start;">
        <div style="width: 44px; height: 44px; border-radius: 8px; background: #212d3d; border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; color: #38bdf8; flex-shrink: 0;">
          ${monogram}
        </div>

        <div style="flex: 1;">
          <div class="job-card-header">
            <div>
              <h3 class="job-title" style="font-size: 1.1rem;">${escapeHtml(job.title)}</h3>
              <div class="job-company">${escapeHtml(job.company)} · ${escapeHtml(job.location)}</div>
            </div>
            <div class="score-badge" style="font-size: 0.85rem; padding: 4px 10px;">
              ${job.match_score}%
            </div>
          </div>

          <div style="font-size: 0.82rem; color: var(--text-dim); margin-bottom: 8px;">
            ${escapeHtml(job.job_type)} · Closes ${deadlineText}
          </div>

          <div class="tag-container" style="margin-bottom: 12px;">
            ${skillTagsHtml}
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <a href="skill-analysis.html?job_id=${job.job_posting_id}" class="btn btn-secondary" style="font-size: 0.82rem; padding: 6px 16px;">View</a>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// ----------------------------------------------------------------------------
// 6. Event Handlers & Reset
// ----------------------------------------------------------------------------
function setupFilterEvents() {
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('search-btn').addEventListener('click', applyFiltersAndRender);
  document.getElementById('apply-filters-btn').addEventListener('click', applyFiltersAndRender);
  document.getElementById('reset-filters-btn').addEventListener('click', resetFilters);

  // Search on enter key
  document.getElementById('search-input').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') applyFiltersAndRender();
  });
}

function resetFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('industry-filter').value = '';
  document.getElementById('location-filter').value = '';

  document.querySelectorAll('input[name="jobType"]').forEach(cb => {
    cb.checked = cb.value === 'Internship';
  });

  document.querySelectorAll('input[name="skillFilter"]').forEach(cb => {
    cb.checked = false;
  });

  applyFiltersAndRender();
}

function showToast(msg, type = 'info') {
  const alertBox = document.getElementById('search-alert');
  alertBox.textContent = msg;
  alertBox.className = `alert-toast alert-toast--${type} is-visible`;
  setTimeout(() => { alertBox.className = 'alert-toast'; }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
