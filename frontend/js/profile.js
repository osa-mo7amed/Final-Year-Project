// ============================================================================
// InternMatch — Profile Management Controller (profile.js)
// Implements FR-3 / UC-03: Manage Profile & Profile Strength Indicator
// ============================================================================

let currentUserId = null;
let currentProfileId = null;
let masterSkills = [];
let userTechSkills = [];
let userSoftSkills = [];

document.addEventListener('DOMContentLoaded', async () => {
  const authContext = await requireAuth();
  if (!authContext) return;

  currentUserId = authContext.session.user.id;
  await loadUserData();
  await loadMasterSkills();
  await loadUserProfile();
  setupEventListeners();
  updateProfileStrengthDisplay();
});

// ----------------------------------------------------------------------------
// 1. Load User Details & Sidebar
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
// 2. Load Master Skill Catalogue (Technical & Soft)
// ----------------------------------------------------------------------------
async function loadMasterSkills() {
  const { data, error } = await supabaseClient
    .from('skills')
    .select('skill_id, skill_name, category')
    .order('skill_name', { ascending: true });

  if (!error && data) {
    masterSkills = data;
    populateSkillDropdowns();
  }
}

function populateSkillDropdowns() {
  const techSelect = document.getElementById('tech-skill-select');
  const softSelect = document.getElementById('soft-skill-select');

  techSelect.innerHTML = '<option value="" disabled selected>Select a technical skill...</option>';
  softSelect.innerHTML = '<option value="" disabled selected>Select a soft skill...</option>';

  masterSkills.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.skill_id;
    opt.textContent = s.skill_name;

    if (s.category === 'Technical') {
      techSelect.appendChild(opt);
    } else {
      softSelect.appendChild(opt);
    }
  });
}

// ----------------------------------------------------------------------------
// 3. Load Profile & Profile Skills from Supabase
// ----------------------------------------------------------------------------
async function loadUserProfile() {
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', currentUserId)
    .single();

  if (error && error.code !== 'PGRST116') {
    showToast('Failed to load profile details.', 'error');
    return;
  }

  if (profile) {
    currentProfileId = profile.profile_id;
    document.getElementById('institution').value = profile.institution || '';
    document.getElementById('programme').value = profile.programme || '';
    document.getElementById('fieldOfStudy').value = profile.field_of_study || '';
    document.getElementById('yearOfStudy').value = profile.year_of_study !== null ? profile.year_of_study : '4';
    document.getElementById('cgpa').value = profile.cgpa !== null ? profile.cgpa : '';
    document.getElementById('careerInterests').value = profile.career_interests || '';
    document.getElementById('certifications').value = profile.certifications || '';
  }

  // Load existing profile skills
  if (currentProfileId) {
    const { data: pSkills, error: sErr } = await supabaseClient
      .from('profile_skills')
      .select('skill_id, skills (skill_id, skill_name, category)')
      .eq('profile_id', currentProfileId);

    if (!sErr && pSkills) {
      userTechSkills = [];
      userSoftSkills = [];

      pSkills.forEach(item => {
        if (item.skills) {
          if (item.skills.category === 'Technical') {
            userTechSkills.push(item.skills);
          } else {
            userSoftSkills.push(item.skills);
          }
        }
      });

      renderSkillChips();
    }
  }
}

// ----------------------------------------------------------------------------
// 4. Render Skill Chips UI
// ----------------------------------------------------------------------------
function renderSkillChips() {
  const techContainer = document.getElementById('tech-skills-container');
  const softContainer = document.getElementById('soft-skills-container');

  // Technical chips
  techContainer.innerHTML = '';
  if (userTechSkills.length === 0) {
    techContainer.innerHTML = '<span style="font-size:0.85rem; color:var(--text-dim);">No technical skills added yet.</span>';
  } else {
    userTechSkills.forEach(s => {
      const chip = document.createElement('div');
      chip.className = 'tag-chip';
      chip.innerHTML = `${escapeHtml(s.skill_name)} <span class="tag-remove" data-id="${s.skill_id}" data-type="tech">&times;</span>`;
      techContainer.appendChild(chip);
    });
  }

  // Soft chips
  softContainer.innerHTML = '';
  if (userSoftSkills.length === 0) {
    softContainer.innerHTML = '<span style="font-size:0.85rem; color:var(--text-dim);">No soft skills added yet.</span>';
  } else {
    userSoftSkills.forEach(s => {
      const chip = document.createElement('div');
      chip.className = 'tag-chip';
      chip.innerHTML = `${escapeHtml(s.skill_name)} <span class="tag-remove" data-id="${s.skill_id}" data-type="soft">&times;</span>`;
      softContainer.appendChild(chip);
    });
  }

  updateProfileStrengthDisplay();
}

// ----------------------------------------------------------------------------
// 5. Calculate & Display Dynamic Profile Strength (0 - 100%)
// ----------------------------------------------------------------------------
function calculateProfileStrength() {
  let score = 15; // Basic info (Full name & email verified)

  const inst = document.getElementById('institution').value.trim();
  const prog = document.getElementById('programme').value.trim();
  const field = document.getElementById('fieldOfStudy').value.trim();
  const cgpa = document.getElementById('cgpa').value.trim();

  // Academic background (25%)
  let academicPoints = 0;
  if (inst) academicPoints += 7;
  if (prog) academicPoints += 6;
  if (field) academicPoints += 6;
  if (cgpa && !isNaN(cgpa) && parseFloat(cgpa) > 0) academicPoints += 6;
  score += academicPoints;

  // Technical skills (25%)
  if (userTechSkills.length >= 3) {
    score += 25;
  } else if (userTechSkills.length === 2) {
    score += 18;
  } else if (userTechSkills.length === 1) {
    score += 10;
  }

  // Soft skills (15%)
  if (userSoftSkills.length >= 2) {
    score += 15;
  } else if (userSoftSkills.length === 1) {
    score += 8;
  }

  // Career interests (10%)
  const interests = document.getElementById('careerInterests').value.trim();
  if (interests.length > 0) score += 10;

  // Certifications (10%)
  const certs = document.getElementById('certifications').value.trim();
  if (certs.length > 0) score += 10;

  return Math.min(100, score);
}

function updateProfileStrengthDisplay() {
  const strength = calculateProfileStrength();
  document.getElementById('header-strength-val').textContent = `${strength}%`;
  document.getElementById('strength-display-val').textContent = `${strength}%`;
  document.getElementById('strength-bar-fill').style.width = `${strength}%`;

  const hint = document.getElementById('strength-hint');
  if (strength >= 85) {
    hint.textContent = 'Excellent! Your profile is complete and ready for highly accurate job recommendations.';
  } else if (strength >= 60) {
    hint.textContent = 'Good progress! Add more technical skills and certifications to reach top matching precision.';
  } else {
    hint.textContent = 'Complete your academic information and add at least 3 technical skills to unlock recommendations.';
  }
}

// ----------------------------------------------------------------------------
// 6. Save Profile Changes
// ----------------------------------------------------------------------------
async function handleSaveProfile() {
  const saveBtn = document.getElementById('save-profile-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  const institution = document.getElementById('institution').value.trim();
  const programme = document.getElementById('programme').value.trim();
  const fieldOfStudy = document.getElementById('fieldOfStudy').value.trim();
  const yearOfStudy = parseInt(document.getElementById('yearOfStudy').value, 10);
  const cgpaRaw = document.getElementById('cgpa').value.trim();
  const cgpa = cgpaRaw !== '' ? parseFloat(cgpaRaw) : null;
  const careerInterests = document.getElementById('careerInterests').value.trim();
  const certifications = document.getElementById('certifications').value.trim();
  const profileStrength = calculateProfileStrength();

  // Validation
  if (cgpa !== null && (isNaN(cgpa) || cgpa < 0 || cgpa > 4.0)) {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
    return showToast('CGPA must be a valid number between 0.00 and 4.00', 'error');
  }

  // Ensure public.users record exists for this auth user to satisfy foreign key
  const { data: userCheck } = await supabaseClient
    .from('users')
    .select('id')
    .eq('id', currentUserId)
    .maybeSingle();

  if (!userCheck) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const fullName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Student User';
    const role = session?.user?.user_metadata?.role || 'Student';
    const { error: uErr } = await supabaseClient
      .from('users')
      .upsert({ id: currentUserId, full_name: fullName, role: role });
    if (uErr) {
      console.warn('Auto-provisioning user row warning:', uErr);
    }
  }

  // 1. Upsert Profile
  const profilePayload = {
    user_id: currentUserId,
    institution,
    programme,
    field_of_study: fieldOfStudy,
    year_of_study: yearOfStudy,
    cgpa,
    career_interests: careerInterests,
    certifications,
    profile_strength: profileStrength,
    updated_at: new Date().toISOString()
  };

  let profileId = currentProfileId;

  if (profileId) {
    const { error: pErr } = await supabaseClient
      .from('profiles')
      .update(profilePayload)
      .eq('profile_id', profileId);

    if (pErr) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
      return showToast(`Failed to update profile: ${pErr.message}`, 'error');
    }
  } else {
    const { data: newP, error: pErr } = await supabaseClient
      .from('profiles')
      .insert(profilePayload)
      .select('profile_id')
      .single();

    if (pErr) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
      return showToast(`Failed to create profile: ${pErr.message}`, 'error');
    }
    profileId = newP.profile_id;
    currentProfileId = profileId;
  }

  // 2. Sync Profile Skills
  const allUserSkills = [...userTechSkills, ...userSoftSkills];
  const targetSkillIds = allUserSkills.map(s => s.skill_id);

  // Delete removed skills
  const { error: delErr } = await supabaseClient
    .from('profile_skills')
    .delete()
    .eq('profile_id', profileId);

  // Insert current skills
  if (targetSkillIds.length > 0) {
    const skillRows = targetSkillIds.map(sid => ({
      profile_id: profileId,
      skill_id: sid
    }));

    const { error: insErr } = await supabaseClient
      .from('profile_skills')
      .insert(skillRows);

    if (insErr) {
      console.warn('Skill sync error:', insErr);
    }
  }

  saveBtn.disabled = false;
  saveBtn.textContent = 'Save Changes';
  showToast('Profile updated successfully! Match scores have been refreshed.', 'success');
}

// ----------------------------------------------------------------------------
// 7. Event Listeners & Helpers
// ----------------------------------------------------------------------------
function setupEventListeners() {
  document.getElementById('save-profile-btn').addEventListener('click', handleSaveProfile);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Live input changes update strength gauge
  ['institution', 'programme', 'fieldOfStudy', 'cgpa', 'careerInterests', 'certifications'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateProfileStrengthDisplay);
  });

  // Add Tech Skill
  document.getElementById('add-tech-skill-btn').addEventListener('click', () => {
    const select = document.getElementById('tech-skill-select');
    const skillId = parseInt(select.value, 10);
    if (!skillId) return;

    if (userTechSkills.some(s => s.skill_id === skillId)) {
      return showToast('Skill is already added to your profile.', 'error');
    }

    const skillObj = masterSkills.find(s => s.skill_id === skillId);
    if (skillObj) {
      userTechSkills.push(skillObj);
      renderSkillChips();
      select.value = '';
    }
  });

  // Add Soft Skill
  document.getElementById('add-soft-skill-btn').addEventListener('click', () => {
    const select = document.getElementById('soft-skill-select');
    const skillId = parseInt(select.value, 10);
    if (!skillId) return;

    if (userSoftSkills.some(s => s.skill_id === skillId)) {
      return showToast('Skill is already added to your profile.', 'error');
    }

    const skillObj = masterSkills.find(s => s.skill_id === skillId);
    if (skillObj) {
      userSoftSkills.push(skillObj);
      renderSkillChips();
      select.value = '';
    }
  });

  // Remove Skill Tag
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag-remove')) {
      const skillId = parseInt(e.target.getAttribute('data-id'), 10);
      const type = e.target.getAttribute('data-type');

      if (type === 'tech') {
        userTechSkills = userTechSkills.filter(s => s.skill_id !== skillId);
      } else {
        userSoftSkills = userSoftSkills.filter(s => s.skill_id !== skillId);
      }
      renderSkillChips();
    }
  });
}

function showToast(msg, type = 'info') {
  const alertBox = document.getElementById('profile-alert');
  alertBox.textContent = msg;
  alertBox.className = `alert-toast alert-toast--${type} is-visible`;
  setTimeout(() => {
    alertBox.className = 'alert-toast';
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
