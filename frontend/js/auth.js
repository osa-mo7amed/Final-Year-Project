// ============================================================================
// InternMatch — Auth Module (auth.js)
// Implements FR-1 (Register), FR-2 (Login), FR-9 (Logout)
// Enforces client-side validation for usability, while Supabase Auth and
// PostgreSQL triggers handle identity, password hashing, and role isolation.
// ============================================================================

function showAlert(el, message, type = 'error') {
  el.textContent = message;
  el.className = `alert-toast alert-toast--${type} is-visible`;
}

function hideAlert(el) {
  el.className = 'alert-toast';
}

function setLoading(btn, isLoading, label) {
  btn.disabled = isLoading;
  btn.textContent = isLoading ? 'Please wait…' : label;
}

// ----------------------------------------------------------------------------
// FR-1: Register Account (Figure 4.4)
// Captures: Full name, email, password, confirm password, field of study, role.
// ----------------------------------------------------------------------------
async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  const alertBox = document.getElementById('form-alert');
  const submitBtn = document.getElementById('submit-btn');
  hideAlert(alertBox);

  const fullName = form.fullName.value.trim();
  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;
  const role = form.academicStatus.value; // 'Student' or 'Graduate'
  const fieldOfStudy = form.fieldOfStudy ? form.fieldOfStudy.value.trim() : '';

  // Validation
  if (!fullName || fullName.length < 2) {
    return showAlert(alertBox, 'Please enter your full name.', 'error');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return showAlert(alertBox, 'Please enter a valid university or personal email address.', 'error');
  }
  if (password.length < 8) {
    return showAlert(alertBox, 'Password must be at least 8 characters in length.', 'error');
  }
  if (password !== confirmPassword) {
    return showAlert(alertBox, 'Passwords do not match.', 'error');
  }
  if (!role) {
    return showAlert(alertBox, 'Please select your current academic status.', 'error');
  }

  setLoading(submitBtn, true, 'Create account');

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
        field_of_study: fieldOfStudy
      }
    }
  });

  setLoading(submitBtn, false, 'Create Account →');

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return showAlert(alertBox, 'This email is already registered. Please sign in instead.', 'error');
    }
    return showAlert(alertBox, `Registration failed: ${error.message}`, 'error');
  }

  showAlert(alertBox, 'Account created successfully! Check your email if verification is required, or sign in now.', 'success');
  form.reset();
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 2000);
}

// ----------------------------------------------------------------------------
// FR-2: Login (Figure 4.3)
// Generic anti-enumeration error message on failure.
// ----------------------------------------------------------------------------
async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const alertBox = document.getElementById('form-alert');
  const submitBtn = document.getElementById('submit-btn');
  hideAlert(alertBox);

  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value;

  if (!email || !password) {
    return showAlert(alertBox, 'Please enter both your email address and password.', 'error');
  }

  setLoading(submitBtn, true, 'Signing in…');

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    setLoading(submitBtn, false, 'Sign In →');
    return showAlert(alertBox, 'Incorrect email or password. Please verify your credentials and try again.', 'error');
  }

  // Fetch role and account status
  const { data: userRow, error: userError } = await supabaseClient
    .from('users')
    .select('role, account_status')
    .eq('id', data.user.id)
    .single();

  setLoading(submitBtn, false, 'Sign In →');

  if (userError || !userRow) {
    // If trigger hadn't fired or row missing, redirect to student dashboard as safe default
    window.location.href = 'dashboard.html';
    return;
  }

  if (userRow.account_status === 'Inactive') {
    await supabaseClient.auth.signOut();
    return showAlert(alertBox, 'This account has been deactivated. Please contact the system administrator.', 'error');
  }

  window.location.href = userRow.role === 'Admin' ? 'admin-jobs.html' : 'dashboard.html';
}

// ----------------------------------------------------------------------------
// FR-9: Log Out
// ----------------------------------------------------------------------------
async function handleLogout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

// ----------------------------------------------------------------------------
// Route Guard for Protected Pages
// ----------------------------------------------------------------------------
async function requireAuth(requiredRole = null) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  if (requiredRole) {
    const { data: userRow } = await supabaseClient
      .from('users')
      .select('role, full_name')
      .eq('id', session.user.id)
      .single();

    if (!userRow || userRow.role !== requiredRole) {
      window.location.href = 'dashboard.html';
      return null;
    }
    return { session, profile: userRow };
  }

  return { session };
}
