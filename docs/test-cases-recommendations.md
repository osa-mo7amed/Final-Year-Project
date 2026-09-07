# Test Cases — Recommendation Engine (FR-4) & Skill Gap Analysis (FR-5)

Run these tests in your browser using your logged-in student account (`osaalfahal@gmail.com`) which now has a completed profile with technical skills, soft skills, field of study, and career interests.

---

## FR-4: Job Recommendations Feed (`dashboard.html`)

| Test ID | Scenario | Steps | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|
| **TC-4.1** | Ranked Recommendations Display | Log in as Student, view `dashboard.html` | Job cards load in descending order of `Match Score` (highest match at the top) | | Not Yet Tested | |
| **TC-4.2** | 4-Factor Formula Accuracy | Inspect top recommended job card's match percentage | Score strictly matches formula: $0.50 \cdot S_{\text{req}} + 0.20 \cdot S_{\text{pref}} + 0.15 \cdot S_{\text{field}} + 0.15 \cdot S_{\text{int}}$ (scaled to 0–100%) | | Not Yet Tested | |
| **TC-4.3** | Transparent Match Explanation | Read the explanation text below the score badge on any card | Clear, explainable breakdown showing required/preferred skill overlaps and field alignment (rule-based, zero ML hallucination) | | Not Yet Tested | |
| **TC-4.4** | Job Detail Modal | Click on any job card in the feed | Modal opens displaying full role overview, deadline, required vs preferred skill tags, and action buttons | | Not Yet Tested | |
| **TC-4.5** | Skill Analysis Navigation | In the job modal or card, click "Detailed Skill Analysis" | Redirects to `skill-analysis.html?job_id=<id>` with the corresponding position pre-loaded | | Not Yet Tested | |

---

## FR-5: Skill Alignment & Gap Analysis (`skill-analysis.html`)

| Test ID | Scenario | Steps | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|
| **TC-5.1** | Circular Score Badge | Open `skill-analysis.html?job_id=1` | Large circular badge renders with the exact match percentage and high/medium/low compatibility label | | Not Yet Tested | |
| **TC-5.2** | Dual-Column Breakdown | Inspect the alignment columns | **Matched Skills** (green $\checkmark$) lists overlapping skills; **Missing Skills** (red $\times$) clearly lists skill gaps | | Not Yet Tested | |
| **TC-5.3** | Actionable Improvement Suggestions | Scroll down to "Skill Improvement Suggestions" | Curated learning suggestions from `public.skill_guidance` render for each missing skill (course links, project ideas, learning resources) | | Not Yet Tested | |
| **TC-5.4** | Job Selector Fallback | Navigate directly to `skill-analysis.html` without `?job_id=` | Dropdown appears at the top: "Select a Job Posting to Analyze"; selecting a job updates the view instantly | | Not Yet Tested | |
| **TC-5.5** | Application Trigger (FR-10 Integration) | Click "Apply Now" button | Toast confirms application submitted; button state updates to prevent duplicate submissions | | Not Yet Tested | |
