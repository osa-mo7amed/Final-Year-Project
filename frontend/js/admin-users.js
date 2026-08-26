// ============================================================================
// InternMatch — Admin User Management Controller (admin-users.js)
// Implements FR-8 / UC-08: Administrator User Accounts & Role Management
// ============================================================================

let currentAdminId = null;
let allUsers = [];
let currentPage = 1;
const PAGE_SIZE = 6;

document.addEventListener('DOMContentLoaded', async () => {
  const authContext = await requireAuth('Admin');
  if (!authContext) return;

  currentAdminId = authContext.session.user.id;
  await fetchAdminUsers();
  setupUserAdminEvents();
});

// ----------------------------------------------------------------------------
// 1. Fetch Registered Users & Profiles
// ----------------------------------------------------------------------------
async function fetchAdminUsers() {
  const { data: users, error } = await supabaseClient
    .from('users')
    .select(`
      id,
      full_name,
      role,
      account_status,
      created_at,
      profiles (field_of_study)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    showToast(`Failed to load users: ${error.message}`, 'error');
    return;
  }

  allUsers = (users || []).map(u => ({
    id: u.id,
    full_name: u.full_name || 'Unnamed User',
    role: u.role || 'Student',
    account_status: u.account_status || 'Active',
    field_of_study: u.profiles && u.profiles.length > 0 ? (u.profiles[0].field_of_study || '—') : '—',
    created_at: u.created_at
  }));

  document.getElementById('users-count-label').textContent = `${allUsers.length} registered users`;
  renderUsersTable();
}

// ----------------------------------------------------------------------------
// 2. Render Users Table & Pagination (Figure 4.10)
// ----------------------------------------------------------------------------
function renderUsersTable() {
  const query = document.getElementById('user-search-input').value.trim().toLowerCase();
  const filtered = allUsers.filter(u => {
    if (!query) return true;
    return u.full_name.toLowerCase().includes(query) ||
           u.role.toLowerCase().includes(query) ||
           u.field_of_study.toLowerCase().includes(query);
  });

  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = '';

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  if (paginated.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">No user accounts found.</td></tr>`;
  } else {
    paginated.forEach(user => {
      const tr = document.createElement('tr');

      const isSelf = user.id === currentAdminId;
      const statusClass = user.account_status === 'Active' ? 'status-badge--active' : 'status-badge--inactive';

      tr.innerHTML = `
        <td style="font-weight: 600; color: var(--text-main);">
          ${escapeHtml(user.full_name)} ${isSelf ? '<span style="font-size:0.75rem; color:var(--amber);">(You)</span>' : ''}
        </td>
        <td style="color: var(--text-muted); font-family: var(--font-mono); font-size: 0.8rem;">
          ${user.id.slice(0, 18)}…
        </td>
        <td>
          <span class="tag-chip" style="font-size: 0.78rem; font-weight: 700; color: ${user.role === 'Admin' ? 'var(--amber)' : '#38bdf8'};">
            ${escapeHtml(user.role)}
          </span>
        </td>
        <td>${escapeHtml(user.field_of_study)}</td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(user.account_status)}</span></td>
        <td style="text-align: right;">
          <button class="btn btn-secondary edit-user-btn" data-id="${user.id}" style="padding: 4px 10px; font-size: 0.78rem;">Edit</button>
          ${!isSelf ? `
            <button class="btn ${user.account_status === 'Active' ? 'btn-danger' : 'btn-success'} toggle-status-btn" data-id="${user.id}" data-status="${user.account_status}" style="padding: 4px 10px; font-size: 0.78rem; margin-left: 4px;">
              ${user.account_status === 'Active' ? 'Deactivate' : 'Activate'}
            </button>
          ` : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Update Pagination Info
  document.getElementById('users-pagination-info').textContent =
    `Showing ${paginated.length} of ${total} results`;

  const controls = document.getElementById('users-pagination-controls');
  controls.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn btn-outline';
  prevBtn.style.padding = '4px 10px';
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => { currentPage--; renderUsersTable(); });
  controls.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = i === currentPage ? 'btn btn-primary' : 'btn btn-outline';
    pageBtn.style.padding = '4px 10px';
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => { currentPage = i; renderUsersTable(); });
    controls.appendChild(pageBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn-outline';
  nextBtn.style.padding = '4px 10px';
  nextBtn.textContent = 'Next';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => { currentPage++; renderUsersTable(); });
  controls.appendChild(nextBtn);
}

// ----------------------------------------------------------------------------
// 3. Edit User Modal & Status Toggle Handlers
// ----------------------------------------------------------------------------
function openUserModal(user) {
  const modal = document.getElementById('user-edit-modal');
  document.getElementById('edit-user-id').value = user.id;
  document.getElementById('editUserName').value = user.full_name;
  document.getElementById('editUserRole').value = user.role;
  document.getElementById('editUserStatus').value = user.account_status;

  // Disable changing self-role or deactivating self
  const isSelf = user.id === currentAdminId;
  document.getElementById('editUserRole').disabled = isSelf;
  document.getElementById('editUserStatus').disabled = isSelf;

  modal.classList.add('is-open');
}

async function handleSaveUserSubmit(event) {
  event.preventDefault();
  const saveBtn = document.getElementById('save-user-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  const userId = document.getElementById('edit-user-id').value;
  const fullName = document.getElementById('editUserName').value.trim();
  const role = document.getElementById('editUserRole').value;
  const status = document.getElementById('editUserStatus').value;

  const payload = {
    full_name: fullName,
    role: role,
    account_status: status,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseClient
    .from('users')
    .update(payload)
    .eq('id', userId);

  saveBtn.disabled = false;
  saveBtn.textContent = 'Save Changes';

  if (error) {
    showToast(`Update failed: ${error.message}`, 'error');
  } else {
    document.getElementById('user-edit-modal').classList.remove('is-open');
    showToast('User account updated successfully!', 'success');
    await fetchAdminUsers();
  }
}

async function handleToggleStatus(userId, currentStatus) {
  if (userId === currentAdminId) {
    return alert('You cannot deactivate your own administrative account.');
  }

  const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  if (!confirm(`Are you sure you want to set this user account to ${nextStatus}?`)) return;

  const { error } = await supabaseClient
    .from('users')
    .update({ account_status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    showToast(`Status update failed: ${error.message}`, 'error');
  } else {
    showToast(`User status changed to ${nextStatus}.`, 'success');
    await fetchAdminUsers();
  }
}

// ----------------------------------------------------------------------------
// 4. Event Listeners
// ----------------------------------------------------------------------------
function setupUserAdminEvents() {
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('close-user-modal-btn').addEventListener('click', () => {
    document.getElementById('user-edit-modal').classList.remove('is-open');
  });
  document.getElementById('cancel-user-modal-btn').addEventListener('click', () => {
    document.getElementById('user-edit-modal').classList.remove('is-open');
  });
  document.getElementById('user-edit-form').addEventListener('submit', handleSaveUserSubmit);

  // Search input
  document.getElementById('user-search-input').addEventListener('input', () => {
    currentPage = 1;
    renderUsersTable();
  });

  // Table buttons
  document.getElementById('users-table-body').addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-user-btn')) {
      const uid = e.target.getAttribute('data-id');
      const user = allUsers.find(u => u.id === uid);
      if (user) openUserModal(user);
    } else if (e.target.classList.contains('toggle-status-btn')) {
      const uid = e.target.getAttribute('data-id');
      const status = e.target.getAttribute('data-status');
      handleToggleStatus(uid, status);
    }
  });
}

function showToast(msg, type = 'info') {
  const alertBox = document.getElementById('users-alert');
  alertBox.textContent = msg;
  alertBox.className = `alert-toast alert-toast--${type} is-visible`;
  setTimeout(() => { alertBox.className = 'alert-toast'; }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
