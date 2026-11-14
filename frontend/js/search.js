// ============================================================================
// InternMatch — Job Search & Multi-Filter Controller (search.js)
// Implements FR-6 / UC-06: Search & Filter Job Listings
// ============================================================================

let currentUserId = null;
let currentProfile = null;
let userSkillIds = [];
let allJobs = [];
let masterSkills = [];
let jobsLoaded = false;

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
    data.forEach(s => {
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
  jobsLoaded = false;
  try {
    allJobs = (await fetchRecommendations(currentUserId)).map(job => ({...job,
      skills_list:job.skills,skill_ids:job.skills.filter(s=>s.is_required).map(s=>s.skill_id)}));
    jobsLoaded = true;
    hideAlert(document.getElementById('search-alert'));
    applyFiltersAndRender();
  } catch (err) {
    allJobs = [];
    const container = document.getElementById('search-results-container');
    const message = document.createElement('p');
    message.textContent = err.message;
    const retry = document.createElement('button');
    retry.id = 'retry-search-btn';
    retry.className = 'btn btn-outline';
    retry.textContent = 'Retry loading listings';
    retry.addEventListener('click', async () => {
      retry.disabled = true;
      await fetchAllJobs();
    });
    container.replaceChildren(message, retry);
    document.getElementById('available-count-badge').textContent = 'Unavailable';
    showToast(err.message,'error');
  }
}

// ----------------------------------------------------------------------------
// 4. Multi-Filter & Search Algorithm
// ----------------------------------------------------------------------------
function applyFiltersAndRender() {
  // Filter changes must not turn a failed request into an apparently valid empty/stale feed.
  if (!jobsLoaded) return;
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
          ${escapeHtml(monogram)}
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
    cb.checked = false;
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
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
