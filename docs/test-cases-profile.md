# Test Cases — Profile Management Module (FR-3)

Run these tests against your live Supabase instance using a logged-in student account (e.g. `osaalfahal@gmail.com`). Mark each test as you verify it.

---

## Test Execution Matrix (Status: Verified)

| Test ID | Scenario | Steps | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|
| **TC-3.1** | Profile Auto-Load on Page Open | Sign in as Student, navigate to `profile.html` | Student name and role display in sidebar; initial profile fields (e.g. Field of Study from registration) auto-fill | Sidebar displays full name and role; registered field of study auto-fills form fields | **Verified** | Profile UI initial load |
| **TC-3.2** | Dynamic Profile Strength Meter | Add/remove skills or edit academic fields | Completeness bar and percentage in header and card update dynamically (0% to 100%) in real time | Meter, header badge, and progress bar recalculate immediately as fields and skills change | **Verified** | Live meter UI gauge |
| **TC-3.3** | Technical & Soft Skills Tagging | Select skills from Technical and Soft dropdowns, click "+ Add Skill", then click '×' on a chip | Skill chips render with removable '×'; duplicate selections blocked; removing a chip recalculates strength | Chips render correctly; duplicate additions trigger alert; removing chip updates count and meter | **Verified** | Interactive skill chips |
| **TC-3.4** | Profile Persistence & Save | Fill all academic fields, attach $\ge 3$ technical and $\ge 2$ soft skills, click "Save Changes" | "Profile updated successfully!" toast; refreshing the page retains all saved data and skills | Success toast displayed; all fields and chips persist across page refresh via Supabase DB | **Verified** | Database round-trip |
| **TC-3.5** | CGPA Validation | Enter invalid CGPA (e.g. `4.50` or `-0.5`), click "Save Changes" | Error toast: "CGPA must be a valid number between 0.00 and 4.00"; submission blocked | Blocked with red alert toast: "CGPA must be a valid number between 0.00 and 4.00" | **Verified** | Client-side validation toast |
| **TC-3.6** | Row-Level Security (Profile Isolation) | While logged in as Student A, attempt to update Student B's profile via console (`supabaseClient.from('profiles').update({...}).eq('user_id', 'foreign-id')`) | Blocked server-side by PostgreSQL RLS policy `profiles_update_own` (0 rows affected / error) | Foreign profiles query returns `[]`; cross-user update affects 0 rows; enforced by PostgreSQL RLS | **Verified** | Browser DevTools Console / RLS |

---

## Profile Strength Scoring Formula (§14 Spec)
- **Base Verification (15%):** Full Name + Verified Account
- **Academic Background (25%):**
  - Institution: +7%
  - Programme: +6%
  - Field of Study: +6%
  - CGPA (> 0.00): +6%
- **Technical Skills (25%):**
  - $\ge 3$ Technical Skills: +25%
  - 2 Technical Skills: +18%
  - 1 Technical Skill: +10%
- **Soft Skills (15%):**
  - $\ge 2$ Soft Skills: +15%
  - 1 Soft Skill: +8%
- **Career Interests (10%):** Comma-separated interest tags entered (+10%)
- **Certifications (10%):** Professional certifications entered (+10%)
- **Total Possible:** $100\%$
