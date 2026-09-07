# Test Cases — Auth Module (FR-1, FR-2, FR-9)

Run these against your live Supabase project. Mark each as you go — do not
mark "Verified" without actually performing the step.

## Setup (do this first)

1. In Supabase dashboard → SQL Editor, run in order:
   - `db/001_schema.sql`
   - `db/002_rls_policies.sql`
   - `db/003_seed_skills.sql`
2. In Supabase dashboard → Authentication → Providers, confirm Email provider is enabled.
3. In Supabase dashboard → Authentication → URL Configuration, note whether
   "Confirm email" is required (affects TC-1.2 below).
4. Open `index.html` via a local server (e.g. VS Code Live Server) — **do not
   open via `file://`**, the Supabase JS client and fetch calls need http(s).

## FR-1: Register Account

| Test ID | Scenario | Steps | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|
| TC-1.1 | Successful registration | Fill valid name/email/password/status, submit | Success message shown, redirected to login after ~2s | Success toast displayed; redirected to login.html | **Verified** | Registration UI toast |
| TC-1.2 | Email verification | After TC-1.1, check inbox | Verification email received (if email confirmation enabled in Supabase) | Verification email received with confirmation link | **Verified** | Email inbox |
| TC-1.3 | Duplicate email rejected | Register again with same email | Error: "This email is already registered..." | "This email is already registered. Please sign in instead." displayed | **Verified** | Red alert toast |
| TC-1.4 | Password too short | Enter 5-char password | Client-side error before submit: "at least 8 characters" | Blocked client-side: "Password must be at least 8 characters in length." | **Verified** | Form validation |
| TC-1.5 | Passwords don't match | Different password/confirm values | Error: "Passwords do not match" | Blocked client-side: "Passwords do not match." | **Verified** | Form validation |
| TC-1.6 | Missing academic status | Leave dropdown unselected | Error: "Select your current academic status" | Blocked: "Please select your current academic status." | **Verified** | Form validation |
| TC-1.7 | public.users auto-provisioned | After TC-1.1, check `public.users` table in Supabase | Row exists with correct full_name and role, id matches auth.users.id | Row auto-provisioned in public.users and public.profiles via trigger | **Verified** | Supabase Table Editor |
| TC-1.8 | Malicious input (XSS attempt) | Enter `<script>alert(1)</script>` as full name | Rejected by form validation: "Full name cannot contain HTML or script characters (<, >)" (prevents stored XSS) | Input blocked by regex validation with error toast; sanitized in DB trigger | **Verified** | Form validation toast |

## FR-2: Login

| Test ID | Scenario | Steps | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|
| TC-2.1 | Successful login (Student) | Log in with verified Student account | Redirected to `dashboard.html`, name shown | | Not Yet Tested | |
| TC-2.2 | Successful login (Admin) | Manually set a user's role to 'Admin' in Supabase, log in | Redirected to `admin-dashboard.html` | Redirected to `admin-dashboard.html` with RBAC verification badge ("Role-Based Access Control Verified: Administrator privileges active") | **Verified** | Admin dashboard banner / console log |
| TC-2.3 | Wrong password | Correct email, wrong password | Generic error: "Incorrect email or password." (does not say which field) | | Not Yet Tested | |
| TC-2.4 | Non-existent email | Unregistered email | Same generic error as TC-2.3 (no field-specific leak) | | Not Yet Tested | |
| TC-2.5 | Deactivated account | Set `account_status = 'Inactive'` for a user, attempt login | Signed out immediately, error: "This account has been deactivated." | | Not Yet Tested | |
| TC-2.6 | Empty fields | Submit with no email/password | Client-side error, no request sent | | Not Yet Tested | |
| TC-2.7 | SQL injection attempt | Enter `' OR '1'='1` as email | Rejected as invalid email format / login fails safely (Supabase parameterizes queries) | | Not Yet Tested | |
| TC-2.8 | Cross-user data isolation | Log in as User A, attempt to query User B's profile via browser console (`supabaseClient.from('profiles').select().eq('user_id', <userB_id>)`) | Empty result — blocked by RLS policy | | Not Yet Tested | |

## FR-9: Log Out

| Test ID | Scenario | Steps | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|
| TC-9.1 | Logout terminates session | Click "Log out" on dashboard | Redirected to `login.html`, session cleared | | Not Yet Tested | |
| TC-9.2 | Post-logout access blocked | After logout, navigate directly to `dashboard.html` URL | Redirected to `login.html` (requireAuth blocks it) | | Not Yet Tested | |
| TC-9.3 | Logout available on admin page too | Log in as Admin, click "Log out" | Same behavior as TC-9.1 | | Not Yet Tested | |

## Evidence to capture for FYP2 report

- Screenshot: registration form + success message
- Screenshot: duplicate-email error
- Screenshot: `public.users` and `auth.users` rows side by side (proves the trigger works)
- Screenshot: login error (generic message)
- Screenshot: Student dashboard vs Admin dashboard (proves role-based redirect)
- Screenshot/console output: TC-2.8 cross-user isolation proof — this is strong evidence for your Security section
