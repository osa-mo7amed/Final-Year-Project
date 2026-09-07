# InternMatch — FYP2 Requirements Traceability Matrix

Status values: `Not Started` → `In Progress` → `Implemented` → `Tested` → `Verified`

---

## 1. Functional Requirements Matrix (SRS Baseline)

| ID | FYP1 Requirement | Module | File / Component | Database Entities | Test Case ID | Test Scenario & Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-1** | Register Account (Name, Email, Password, Status, Field of Study) | Authentication | `register.html`, `auth.js` | `auth.users`, `public.users`, `public.profiles` | TC-1.1 to TC-1.8 | Form input validation, trigger auto-creation in `public.users` and `public.profiles`, duplicate email rejection. | **Verified** |
| **FR-2** | Login (Role-based redirect, generic anti-enumeration error) | Authentication | `login.html`, `auth.js` | `auth.users`, `public.users` | TC-2.1 to TC-2.8 | Email/password sign-in, role checking (`Student` $\to$ `dashboard.html`, `Admin` $\to$ `admin-dashboard.html`), deactivated account block. | **Verified** |
| **FR-3** | Manage Profile & Dynamic Profile Strength | Profile Management | `profile.html`, `profile.js` | `public.profiles`, `public.profile_skills`, `public.skills` | TC-3.1 to TC-3.6 | Academic background CRUD, multi-tag tech/soft skill chips with delete/add, live Profile Strength meter ($0-100\%$). | **Verified** |
| **FR-4** | View Job Recommendations | Recommender Engine | `dashboard.html`, `dashboard.js`, `006_recommendation_rpc.sql` | `public.recommendations`, `public.job_postings`, `public.job_skills` | TC-4.1 to TC-4.5 | Ranked recommendation cards, 4-factor scoring per §4 spec ($0.50 \cdot S_{\text{req}} + 0.20 \cdot S_{\text{pref}} + 0.15 \cdot S_{\text{field}} + 0.15 \cdot S_{\text{int}}$), transparent explanation. | **Implemented, Not Yet Tested** |
| **FR-5** | Skill Alignment & Gap Analysis with Guidance | Skill Analysis Module | `skill-analysis.html`, `skill-analysis.js` | `public.profile_skills`, `public.job_skills`, `public.skill_guidance` | TC-5.1 to TC-5.5 | Circular score badge, dual-column Matched Skills ($\checkmark$ green) vs Missing Skills ($\times$ red), curated learning guidance mapping. | **Implemented, Not Yet Tested** (Guidance content needs user review) |
| **FR-6** | Search & Filter Job Listings | Search & Discovery | `search.html`, `search.js` | `public.job_postings`, `public.job_skills`, `public.skills` | TC-6.1 to TC-6.5 | Keyword search across title/company/skills, multi-criteria filters (Industry, Job Type, Location, Required Skills), live match score badges. | **Implemented, Not Yet Tested** |
| **FR-7** | Manage Job Postings (Admin CRUD) | Administrator: Jobs | `admin-jobs.html`, `admin-jobs.js` | `public.job_postings`, `public.job_skills`, `public.skills` | TC-7.1 to TC-7.5 | Admin create job modal with required/preferred skills tagger, edit job, delete job, table pagination, status toggling. | **Implemented, Not Yet Tested** |
| **FR-8** | Manage User Accounts & Roles (Admin) | Administrator: Users | `admin-users.html`, `admin-users.js` | `public.users`, `public.profiles` | TC-8.1 to TC-8.5 | User directory table, role modification (`Student`, `Graduate`, `Admin`), account status toggle (`Active`/`Inactive`), self-safety protection. | **Implemented, Not Yet Tested** |
| **FR-9** | Log Out | Authentication | All views, `auth.js` | `auth.users` (Session termination) | TC-9.1 to TC-9.3 | Global sign out button, session invalidation, route protection preventing post-logout back-navigation. | **Verified** |
| **FR-10** | Apply to Job (Application Tracking) | Applications | `dashboard.html`, `skill-analysis.html` | `public.applications` | TC-10.1 to TC-10.3 | One-click apply button, duplicate application prevention, application status logging (`Submitted`). | **Implemented, Not Yet Tested** (Scope addition — needs supervisor sign-off) |

---

## 2. Non-Functional Requirements Matrix

| NFR ID | Requirement Summary | Implementation Strategy | Measurable Acceptance Criterion | Test Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PR-1** | Data Integrity & Zero Duplication | PostgreSQL UNIQUE constraints on `Email`, `SkillName`, composite keys `(profile_id, skill_id)`, `(job_posting_id, skill_id)`. | Rejection of all conflicting duplicate insert attempts with SQL constraint violations. | SQL DDL unit test script | **Enforced by Schema** |
| **PR-2 / PR-3** | UI Acknowledgment Time $\le 5\text{ s}$ | Lightweight Vanilla JS client-side rendering with instant toast notifications. | UI interaction response $< 200\text{ ms}$ (well below $5\text{ s}$ limit). | Browser DevTools Performance profiler | **Instrumented, Not Yet Measured** |
| **PR-4** | Recommendation Latency $\le 3\text{ s}$ | In-memory / PostgreSQL set operations with indexed lookups. | Full recommendation scoring across job corpus runs in $< 50\text{ ms}$. | `benchmark_accuracy.js` / `evaluation-runner.html` | **Instrumented, Not Yet Measured** |
| **PR-5** | Modular Extensibility | Decoupled ES6 modules, reusable CSS design system tokens, normalized 3NF database schema. | Modifying weights or adding skills requires changing only single configuration points. | Code review against SOLID principles | **Enforced by Architecture** |
| **PR-6** | Concurrent User Handling | Supabase PostgREST stateless connection pooling. | Sustained concurrent requests without session crosstalk. | Stateless JWT verification | **Enforced by Architecture** |
| **PR-7 / RE-1** | Graceful Error Handling | Client-side input validation and structured `try/catch` UI alert blocks. | Zero raw database exceptions or stack traces exposed to end-users. | Negative testing with malformed inputs | **Implemented, Not Yet Tested** |
| **SE-1 / SE-2** | Cross-User Data Isolation | PostgreSQL Row Level Security (RLS) on all 8 tables. | Users cannot read/update foreign profiles, recommendations, or applications. | Foreign user ID query injection attempt (TC-2.8) | **Enforced by RLS & Verified** |
| **SE-3** | Password Hashing | Supabase Auth adaptive hashing (Argon2 / Bcrypt). | Passwords never stored or transmitted in plaintext. | Supabase Auth native | **Enforced by Supabase Auth** |
| **AV-3 / PT-1** | Responsive & Cross-Browser | Semantic HTML5, CSS Grid/Flexbox with standard media queries (375px, 768px, 1200px). | Clean rendering across Chrome, Firefox, Edge, Safari, and mobile viewports. | Responsive viewport testing | **Implemented, Not Yet Tested** |
| **US-1 to US-3** | Usability & Navigation Consistency | Standardized sidebar layout, intuitive color-coded badge system ($\checkmark$ green, $\times$ red). | System Usability Scale (SUS) benchmark score target $\ge 75/100$. | Standardized SUS 10-item evaluation protocol | **Protocol Designed, Not Yet Executed** |

---

## 3. Project Objectives Coverage

| Objective | Target Scope in FYP1 | Implemented Deliverable | Achievement Status |
| :--- | :--- | :--- | :--- |
| **Objective 1:** Requirements Analysis | Comprehensive SRS based on student survey & interviews | SRS v1.0, Questionnaires analysis, Requirements Traceability Matrix | **Achieved** (SRS Baseline & Decisions Log) |
| **Objective 2:** Design & Develop Matching Web | Web platform matching profiles with internship/jobs | HTML/CSS/JS + Supabase platform (`index.html`, `login.html`, `register.html`, `dashboard.html`, `profile.html`, `search.html`, `admin-jobs.html`, `admin-users.html`) | **Implemented, Testing in Progress** |
| **Objective 3:** Skill Alignment & Skill Gap Analysis | Transparent skill compatibility and actionable improvement guidance | Dedicated Skill Analysis view (`skill-analysis.html`) computing set intersections and structured suggestions | **Implemented, Testing & Review in Progress** |
| **Objective 4:** Usability & Recommendation Accuracy Evaluation | Quantitative accuracy benchmark and usability evaluation | Reproducible evaluation suite (`benchmark_accuracy.js`, `evaluation-runner.html`) measuring P@K, Recall@K, MAP, and SUS survey guide | **Methodology Designed, Studies Not Yet Executed** |
