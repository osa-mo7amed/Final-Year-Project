// ============================================================================
// InternMatch — Admin Job Management Controller (admin-jobs.js)
// Implements FR-7 / UC-07: Administrator Job Postings Management
// ============================================================================

let currentAdminId = null;
let allJobs = [];
let masterSkills = [];
let modalAttachedSkills = []; // [{ skill_id, skill_name, is_required }]
let currentPage = 1;
const PAGE_SIZE = 6;

document.addEventListener('DOMContentLoaded', async () => {
  const authContext = await requireAuth('Admin');
  if (!authContext) return;

  currentAdminId = authContext.session.user.id;
  await loadMasterSkills();
  await fetchAdminJobs();
  setupAdminEvents();
});

// ----------------------------------------------------------------------------
// 1. Load Master Skills for Modal Picker
// ----------------------------------------------------------------------------
async function loadMasterSkills() {
  const { data, error } = await supabaseClient
    .from('skills')
    .select('skill_id, skill_name, category')
    .order('skill_name', { ascending: true });

  if (!error && data) {
    masterSkills = data;
    const picker = document.getElementById('modal-skill-picker');
    picker.innerHTML = '<option value="" disabled selected>Select a skill to attach...</option>';
    data.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.skill_id;
      opt.textContent = `${s.skill_name} (${s.category})`;
      picker.appendChild(opt);
    });
  }
}

// ----------------------------------------------------------------------------
// 2. Fetch Job Postings from Supabase
// ----------------------------------------------------------------------------
async function fetchAdminJobs() {
  const { data, error } = await supabaseClient
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
      status,
      created_at,
      job_skills (
        job_skill_id,
        skill_id,
        is_required,
        skills (skill_id, skill_name, category)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    showToast(`Error loading postings: ${error.message}`, 'error');
    return;
  }

  allJobs = data || [];
  const activeCount = allJobs.filter(j => j.status === 'Active').length;
  document.getElementById('active-jobs-count').textContent = `${activeCount} active listings`;

  renderJobsTable();
}

// ----------------------------------------------------------------------------
// 3. Render Table & Pagination (Figure 4.9)
// ----------------------------------------------------------------------------
function renderJobsTable() {
  const query = document.getElementById('job-search-input').value.trim().toLowerCase();
  const filtered = allJobs.filter(j => {
    if (!query) return true;
    return j.title.toLowerCase().includes(query) ||
           j.company.toLowerCase().includes(query) ||
           j.location.toLowerCase().includes(query);
  });

  const tbody = document.getElementById('jobs-table-body');
  tbody.innerHTML = '';

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  if (paginated.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">No job postings found.</td></tr>`;
  } else {
    paginated.forEach(job => {
      const tr = document.createElement('tr');

      const deadlineText = job.deadline
        ? new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Open';

      const statusClass = job.status === 'Active' ? 'status-badge--active' : 'status-badge--closed';

      tr.innerHTML = `
        <td style="font-weight: 600; color: var(--text-main);">${escapeHtml(job.title)}</td>
        <td>${escapeHtml(job.company)}</td>
        <td><span class="tag-chip" style="font-size:0.78rem;">${escapeHtml(job.job_type)}</span></td>
        <td>${escapeHtml(job.location)}</td>
        <td style="color: var(--text-muted);">${deadlineText}</td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(job.status)}</span></td>
        <td style="text-align: right;">
          <button class="btn btn-secondary edit-job-btn" data-id="${job.job_posting_id}" style="padding: 4px 10px; font-size: 0.78rem;">Edit</button>
          <button class="btn btn-danger delete-job-btn" data-id="${job.job_posting_id}" style="padding: 4px 10px; font-size: 0.78rem; margin-left: 4px;">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Update Pagination Info
  document.getElementById('pagination-info').textContent =
    `Showing ${paginated.length} of ${total} results`;

  const controls = document.getElementById('pagination-controls');
  controls.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn btn-outline';
  prevBtn.style.padding = '4px 10px';
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => { currentPage--; renderJobsTable(); });
  controls.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = i === currentPage ? 'btn btn-primary' : 'btn btn-outline';
    pageBtn.style.padding = '4px 10px';
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => { currentPage = i; renderJobsTable(); });
    controls.appendChild(pageBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn-outline';
  nextBtn.style.padding = '4px 10px';
  nextBtn.textContent = 'Next';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => { currentPage++; renderJobsTable(); });
  controls.appendChild(nextBtn);
}

// ----------------------------------------------------------------------------
// 4. Modal Open / Save / Delete Handlers
// ----------------------------------------------------------------------------
function openJobModal(job = null) {
  const modal = document.getElementById('job-form-modal');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('job-crud-form');
  form.reset();

  modalAttachedSkills = [];

  if (job) {
    modalTitle.textContent = 'Edit Job Posting';
    document.getElementById('crud-job-id').value = job.job_posting_id;
    document.getElementById('jobTitle').value = job.title;
    document.getElementById('companyName').value = job.company;
    document.getElementById('jobTypeSelect').value = job.job_type;
    document.getElementById('jobLocation').value = job.location;
    document.getElementById('jobIndustry').value = job.industry || 'Information Technology';
    document.getElementById('jobDeadline').value = job.deadline || '';
    document.getElementById('jobStatusSelect').value = job.status;
    document.getElementById('jobDescription').value = job.description;

    // Load existing skills
    (job.job_skills || []).forEach(js => {
      if (js.skills) {
        modalAttachedSkills.push({
          skill_id: js.skills.skill_id,
          skill_name: js.skills.skill_name,
          is_required: js.is_required
        });
      }
    });
  } else {
    modalTitle.textContent = 'Create New Job Posting';
    document.getElementById('crud-job-id').value = '';
    document.getElementById('jobStatusSelect').value = 'Active';
    document.getElementById('jobTypeSelect').value = 'Internship';
  }

  renderModalSkillTags();
  modal.classList.add('is-open');
}

function renderModalSkillTags() {
  const container = document.getElementById('modal-job-skills-tags');
  container.innerHTML = '';
  if (modalAttachedSkills.length === 0) {
    container.innerHTML = '<span style="font-size:0.82rem; color:var(--text-dim);">No skills attached yet. Attach skills to drive recommendations.</span>';
    return;
  }

  modalAttachedSkills.forEach(s => {
    const chip = document.createElement('span');
    chip.className = s.is_required ? 'tag-chip tag-chip--matched' : 'tag-chip';
    chip.innerHTML = `${escapeHtml(s.skill_name)} <strong style="font-size:0.75rem;">[${s.is_required ? 'Req' : 'Pref'}]</strong> <span class="tag-remove" data-id="${s.skill_id}">&times;</span>`;
    container.appendChild(chip);
  });
}

async function handleSaveJobSubmit(event) {
  event.preventDefault();
  const submitBtn = document.getElementById('save-job-submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  const jobId = document.getElementById('crud-job-id').value;
  const payload = {
    title: document.getElementById('jobTitle').value.trim(),
    company: document.getElementById('companyName').value.trim(),
    job_type: document.getElementById('jobTypeSelect').value,
    location: document.getElementById('jobLocation').value.trim(),
    industry: document.getElementById('jobIndustry').value,
    deadline: document.getElementById('jobDeadline').value || null,
    status: document.getElementById('jobStatusSelect').value,
    description: document.getElementById('jobDescription').value.trim(),
    created_by: currentAdminId,
    updated_at: new Date().toISOString()
  };

  let targetId = jobId;

  if (jobId) {
    const { error } = await supabaseClient
      .from('job_postings')
      .update(payload)
      .eq('job_posting_id', parseInt(jobId, 10));

    if (error) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Job Posting';
      return showToast(`Update failed: ${error.message}`, 'error');
    }
  } else {
    const { data: newJob, error } = await supabaseClient
      .from('job_postings')
      .insert(payload)
      .select('job_posting_id')
      .single();

    if (error) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Job Posting';
      return showToast(`Creation failed: ${error.message}`, 'error');
    }
    targetId = newJob.job_posting_id;
  }

  // Sync Job Skills
  if (targetId) {
    await supabaseClient
      .from('job_skills')
      .delete()
      .eq('job_posting_id', targetId);

    if (modalAttachedSkills.length > 0) {
      const rows = modalAttachedSkills.map(s => ({
        job_posting_id: targetId,
        skill_id: s.skill_id,
        is_required: s.is_required
      }));
      await supabaseClient.from('job_skills').insert(rows);
    }
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Save Job Posting';
  document.getElementById('job-form-modal').classList.remove('is-open');
  showToast('Job posting saved successfully!', 'success');
  await fetchAdminJobs();
}

async function handleDeleteJob(jobId) {
  if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return;

  const { error } = await supabaseClient
    .from('job_postings')
    .delete()
    .eq('job_posting_id', jobId);

  if (error) {
    showToast(`Delete failed: ${error.message}`, 'error');
  } else {
    showToast('Job posting deleted.', 'success');
    await fetchAdminJobs();
  }
}

// ----------------------------------------------------------------------------
// 5. Event Listeners
// ----------------------------------------------------------------------------
function setupAdminEvents() {
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('open-add-job-btn').addEventListener('click', () => openJobModal(null));
  document.getElementById('close-job-modal-btn').addEventListener('click', () => {
    document.getElementById('job-form-modal').classList.remove('is-open');
  });
  document.getElementById('cancel-job-modal-btn').addEventListener('click', () => {
    document.getElementById('job-form-modal').classList.remove('is-open');
  });
  document.getElementById('job-crud-form').addEventListener('submit', handleSaveJobSubmit);

  // Search filter
  document.getElementById('job-search-input').addEventListener('input', () => {
    currentPage = 1;
    renderJobsTable();
  });

  // Table action clicks (Edit / Delete)
  document.getElementById('jobs-table-body').addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-job-btn')) {
      const jobId = parseInt(e.target.getAttribute('data-id'), 10);
      const job = allJobs.find(j => j.job_posting_id === jobId);
      if (job) openJobModal(job);
    } else if (e.target.classList.contains('delete-job-btn')) {
      const jobId = parseInt(e.target.getAttribute('data-id'), 10);
      handleDeleteJob(jobId);
    }
  });

  // Attach Skill in Modal
  document.getElementById('modal-add-skill-btn').addEventListener('click', () => {
    const picker = document.getElementById('modal-skill-picker');
    const isReqSelect = document.getElementById('modal-skill-req');
    const skillId = parseInt(picker.value, 10);
    if (!skillId) return;

    if (modalAttachedSkills.some(s => s.skill_id === skillId)) {
      return alert('Skill is already attached to this job posting.');
    }

    const sObj = masterSkills.find(s => s.skill_id === skillId);
    if (sObj) {
      modalAttachedSkills.push({
        skill_id: sObj.skill_id,
        skill_name: sObj.skill_name,
        is_required: isReqSelect.value === 'true'
      });
      renderModalSkillTags();
      picker.value = '';
    }
  });

  // Remove Skill in Modal
  document.getElementById('modal-job-skills-tags').addEventListener('click', (e) => {
    if (e.target.classList.contains('tag-remove')) {
      const sid = parseInt(e.target.getAttribute('data-id'), 10);
      modalAttachedSkills = modalAttachedSkills.filter(s => s.skill_id !== sid);
      renderModalSkillTags();
    }
  });
}

function showToast(msg, type = 'info') {
  const alertBox = document.getElementById('admin-alert');
  alertBox.textContent = msg;
  alertBox.className = `alert-toast alert-toast--${type} is-visible`;
  setTimeout(() => { alertBox.className = 'alert-toast'; }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
