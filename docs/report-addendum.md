# FYP2 Report Addendum — Implementation Decisions & Methodology

This document supplements the approved FYP1 report. It resolves five gaps identified
during the FYP2 implementation audit that had no methodology defined in FYP1. Insert
the relevant sections into your FYP2 report (Ch.4 for architecture/database, a new
Ch.5 or appendix for evaluation methodology).

---

## 1. Architecture Technology Justification

**FYP1 Ch.4.2 specified:** HTML/PHP/CSS/JS frontend → dedicated web server → MySQL,
with a server-side recommendation engine.

**FYP2 implementation uses:** HTML/CSS/JS frontend → Supabase (Auth + PostgreSQL +
Edge Functions).

### Rationale

| FYP1 requirement | How the substitution satisfies it |
|---|---|
| Relational DBMS (Ch.4.4 ERD) | PostgreSQL is a relational DBMS; the ERD entities, primary keys, and foreign keys carry over unchanged |
| Server-side request handling | Supabase's PostgREST layer and Edge Functions (Deno runtime) serve the same role as a PHP-driven web server |
| Server-side recommendation engine (Ch.4.2) | Implemented as a Postgres/Deno Edge Function — computation happens server-side, never in the browser, preserving the FYP1 architectural intent |
| SE-1/SE-2 (no cross-user data access, Ch.4 NFR) | PostgreSQL Row-Level Security enforces this at the database layer — stronger than an equivalent PHP session check, since it cannot be bypassed even by a bug in application code |
| SE-3 (password hashing) | Supabase Auth handles hashing natively; no plaintext or custom hashing code needed |

**What did not change:** the three-layer pattern (client → application/API layer →
relational database), the ERD, the use cases, and the functional requirements. Only
the vendor/runtime implementing each layer changed.

**Recommended report framing:** describe this in Ch.4.2 as a "technology
substitution" with the justification above, and replace Figure 4.1 with the updated
architecture diagram (rendered separately in this session — capture it as an image
for the report).

---

## 2. Database Design Deviation Notes

Two deviations from the literal FYP1 ERD, both documented rather than silently made:

### 2.1 Denormalized skill/interest fields

`Recommendation.MatchedSkills` / `MissingSkills` (FYP1 Table 4.7) and
`Profile.CareerInterests` / `Certifications` (FYP1 Table 4.2) remain denormalized
(stored as arrays/text rather than junction tables) in FYP2.

**Justification:** these are *computed snapshots*, not live relationships. A
recommendation's matched-skills list reflects the state of the profile and job at
the moment of computation — if the profile changes later, the historical
recommendation record should not silently change with it. Normalizing this into a
junction table would imply a live, always-current relationship, which is the wrong
semantics for an audit trail of past recommendations.

### 2.2 Application table — added feature

FYP1's ERD (Table 4.8) defined an `Application` entity, but no corresponding
functional requirement or use case existed in the SRS (Appendix A §3). This was a
gap between the database design and the requirements specification.

**Decision:** a minimal "Apply to Job" flow was added in FYP2, scoped to:
- User submits an application to a job posting (one application per user per posting)
- Status tracking: Submitted → Viewed → Shortlisted / Rejected
- No employer-side interview scheduling, messaging, or contract features (these
  remain explicitly out of scope per FYP1 §1.4.2 System Scope item 5)

**Report action needed:** add a short new use case ("Apply to Job") to your FYP2
report's requirements section, with its own FR table entry, since this is new scope
beyond what FYP1's SRS approved. Flag this to your supervisor as a scope addition,
not a silent change — it was added because the table already existed in the ERD and
leaving it completely unused would be a design inconsistency.

---

## 3. Recommendation Engine — Scoring Formula & Rationale

Rule-based, weighted scoring (not ML) per the earlier decision — chosen for
explainability, since FR-4 and FR-5 explicitly require the system to show *why* a
job was recommended, and a black-box model cannot do that as directly.

### 3.1 Formula

```
MatchScore(user, job) =
    (W_required × RequiredSkillCoverage)
  + (W_preferred × PreferredSkillCoverage)
  + (W_field × FieldOfStudyAlignment)
  + (W_interest × CareerInterestAlignment)
```

All terms are normalized to [0, 1] before weighting; the final score is scaled to
0–100 to match `Recommendation.MatchScore` (FYP1 Table 4.7, DECIMAL(5,2)).

### 3.2 Variables

| Variable | Definition | Calculation |
|---|---|---|
| `RequiredSkillCoverage` | Fraction of the job's *required* skills present in the user's profile | `(matched required skills) / (total required skills)` |
| `PreferredSkillCoverage` | Fraction of the job's *preferred* (non-required) skills present in the user's profile | `(matched preferred skills) / (total preferred skills)`, defaults to 0 if job has none |
| `FieldOfStudyAlignment` | Whether the user's `Profile.FieldOfStudy` matches the job's `Industry`/domain | 1 if match (exact or from a small curated synonym map, e.g. "Software Engineering" ~ "Information Technology"), else 0 |
| `CareerInterestAlignment` | Overlap between `Profile.CareerInterests` tags and the job's title/industry keywords | `(matching interest tags) / (total interest tags)`, 0 if profile has none |

### 3.3 Weight Justification

| Weight | Value | Rationale |
|---|---|---|
| `W_required` | 0.50 | Required skills are the primary suitability signal — this is what SRS §3.5 calls "matched skills," the core of the skill-alignment feature. Given the highest weight since missing a *required* skill is the strongest predictor of a poor match. |
| `W_preferred` | 0.20 | Preferred skills matter but shouldn't dominate — a candidate with all required skills and no preferred ones should still rank above one with some preferred but missing required skills. |
| `W_field` | 0.15 | Survey data (FYP1 Fig. 3.2) shows respondents span multiple disciplines; field alignment is a coarse but meaningful signal, especially for users with sparse skill data (addressing Problem Statement 1.2.4 — limited personalization for users with little profile data). |
| `W_interest` | 0.15 | Career interests are self-reported and less reliable than skills, but useful as a tiebreaker and for surfacing exploratory matches. |

Weights sum to 1.0 so the final score stays interpretable as a percentage. These are
starting values — Section 5 below explains how they should be tuned against real
evaluation data rather than left as an arbitrary guess.

### 3.4 Example Calculation

Profile: Field of Study = "Computer Science", Skills = {Python, SQL, Communication},
Career Interests = {"software development"}.

Job posting: Required skills = {Python, SQL, React}, Preferred skills = {Communication},
Industry = "Information Technology", Title = "Junior Software Developer".

- `RequiredSkillCoverage` = 2/3 = 0.667 (Python, SQL matched; React missing)
- `PreferredSkillCoverage` = 1/1 = 1.0 (Communication matched)
- `FieldOfStudyAlignment` = 1 (CS ~ IT, curated synonym match)
- `CareerInterestAlignment` = 1/1 = 1.0 ("software development" appears in job title)

```
MatchScore = (0.50 × 0.667) + (0.20 × 1.0) + (0.15 × 1) + (0.15 × 1.0)
           = 0.3335 + 0.20 + 0.15 + 0.15
           = 0.8335 → 83.35%
```

Missing skill shown to user: **React** (the one required skill not matched) — this
is exactly what FR-5's skill-gap feature needs to display.

### 3.5 Ranking Procedure

1. Compute `MatchScore` for every Active job posting against the user's profile.
2. Sort descending by `MatchScore`.
3. Return top-N (e.g. top 10) for the dashboard (FR-4).
4. For each returned job, also compute and store the matched/missing skill ID
   arrays (used directly by FR-5's skill-gap display — no separate calculation
   needed, since it's a byproduct of step 1).

### 3.6 Edge Cases

| Case | Handling |
|---|---|
| Job has zero required skills | `RequiredSkillCoverage` treated as 1.0 (nothing to miss) — weight shifts effectively to other terms |
| User profile has zero skills | `RequiredSkillCoverage` = 0 for all jobs; system should trigger the "complete your profile" prompt (SRS §3.4 Alternative Scenario) rather than showing all-zero recommendations |
| Tie scores | Secondary sort by `Deadline` ascending (soonest-closing jobs surfaced first) |
| No jobs meet a minimum threshold (e.g. all scores < 20%) | Display all ranked results anyway but flag low-confidence ones in the UI, rather than showing an empty state that hides available (if imperfect) opportunities |

### 3.7 Complexity

O(J × S) per user, where J = active job postings and S = average skills per job —
trivial at FYP scale (tens to low hundreds of postings). No need for approximate or
indexed matching structures at this scale; a full recomputation on each dashboard
load is acceptable and keeps the system simple to test and explain (supports
PR-4's 3-second target easily at this scale — to be confirmed by the benchmark in
Section 6).

---

## 4. Skill-Improvement Guidance — Content Methodology

SRS §3.5 requires "structured suggestions or learning resource recommendations" for
missing skills. To avoid fabricating course names, providers, or statistics:

**Approach:** a curated, skill-to-guidance mapping table, stored as data (not
hardcoded per-job text), authored by you as the developer using genuinely known,
generic learning directions — not invented specific courses/certifications/URLs
unless you have personally verified they exist and are appropriate to cite.

**Structure per skill:**
```
{
  "skill": "React",
  "learning_direction": "Practice building small interactive UI projects
    (e.g. a to-do list or dashboard) to apply component-based thinking.",
  "practice_area": "Frontend web development",
  "expected_outcome": "Ability to build and reason about component state
    and props in a real project."
}
```

This gives structured, defensible guidance without claiming specific external
resources exist. If you want to cite real platforms (e.g. "official documentation,"
"freeCodeCamp," "Coursera") that's acceptable **only as a generic category
reference** ("look for a beginner course on an established learning platform"), not
as a specific named course/instructor/statistic you haven't verified yourself.

**Action needed from you:** populate this mapping for the ~29 seeded skills in
`db/003_seed_skills.sql`. I can draft the initial content, but you should review
each entry for accuracy before it goes in your report as "implemented."

---

## 5. Recommendation Accuracy Evaluation Methodology (Objective 4)

This was completely undefined in FYP1 — it is the single highest-risk gap for
Objective 4 ("evaluate the developed system in terms of ... recommendation
accuracy").

### 5.1 Method: Precision@K against expert-labeled relevance

Since there is no historical hiring/application dataset, ground truth must come from
**human relevance judgment**, not automatically-generated labels.

**Procedure:**
1. Construct a test set of 10–15 realistic user profiles (can be drawn from your
   questionnaire respondents' described backgrounds, anonymized, or newly authored
   to cover a range of fields per FYP1 Fig. 3.2).
2. For each test profile, run the recommendation engine against your seeded job
   postings, take the top-10 results.
3. Have 2–3 independent judges (e.g. your supervisor, a peer, a career-services
   contact — people who did **not** write the scoring code) rate each of the top-10
   jobs per profile as "Relevant" or "Not Relevant," blind to the system's score.
4. Compute:
   - `Precision@5` = (relevant jobs in top 5) / 5, averaged across all test profiles
   - `Precision@10` = (relevant jobs in top 10) / 10, averaged
   - Inter-rater agreement (e.g. Cohen's Kappa if 2 judges) to show the ground truth
     itself is reliable

**Why this method, not classic ML metrics:** Precision/Recall/F1 require a
pre-existing ground-truth relevance dataset, which doesn't exist for a new system
with no usage history. Expert-judged Precision@K is the standard substitute used in
recommender-systems literature (Ricci et al., *Recommender Systems Handbook*,
already cited in your FYP1 references [8]) when no historical interaction data is
available.

### 5.2 What NOT to do

- Do not report an "accuracy" figure without defining it as above.
- Do not skip real judges and self-label your own test cases as ground truth — that
  removes the independence the evaluation needs.
- Do not fabricate a Precision@K number without actually running the study.

### 5.3 Status

**Not yet executed.** This requires the recommendation engine to be built and a
working job dataset to exist first. Flag as `Not Yet Tested` in your report until
you actually run it.

---

## 6. Usability Evaluation Methodology (Objective 4)

**Method: System Usability Scale (SUS)** — a validated, widely-used 10-item
questionnaire (Brooke, 1996), standard in software engineering FYPs.

**Procedure:**
1. Recruit 10–15 participants matching the target user profile (students/fresh
   graduates — consistent with your FYP1 questionnaire population, Ch.3.2.1).
2. Give each participant a short task list using the working prototype:
   register → complete profile → view recommendations → check skill gap for one job
   → search/filter jobs.
3. Immediately after, have them complete the standard 10-item SUS questionnaire
   (5-point Likert scale, alternating positive/negative statements).
4. Score per SUS's standard method: for odd items, score = response − 1; for even
   items, score = 5 − response; sum all, multiply by 2.5 → score out of 100.
5. Report the mean score and compare against the published SUS benchmark (a score
   above ~68 is considered above-average usability).

**Status:** Not yet executed — requires a working prototype and real participants.
Do not fabricate scores or participant counts.

---

## 7. Performance Testing Methodology (PR-3, PR-4)

- **PR-3 (UI acknowledgment ≤ 5s):** instrument key actions (login, profile save,
  search) with `performance.now()` in the browser, log time from user action to
  visible UI response, across at least 20 runs each, report mean/median/max.
- **PR-4 (Recommendations ≤ 3s):** log Edge Function execution time server-side
  (Supabase Edge Functions provide invocation duration in logs), across the full
  test-profile set from Section 5.1, report mean/median/max.

Both must be measured against the actual deployed system, not estimated.

---

## Summary of Decisions Made Today

| Item | Decision | Status |
|---|---|---|
| Architecture deviation | Documented as justified technology substitution | Ready for report |
| Denormalized skill/interest fields | Justified as computed snapshot, not live relation | Ready for report |
| Application table | Added as minimal in-scope feature; flag as scope addition to supervisor | Ready for report, needs supervisor sign-off |
| Recommendation formula | Weighted rule-based, weights justified above | Designed — not yet implemented in code |
| Skill-improvement content | Curated mapping table approach, no fabricated resources | Designed — needs your content review |
| Recommendation accuracy evaluation | Expert-judged Precision@K methodology | Designed — not yet executed |
| Usability evaluation | SUS questionnaire, 10–15 participants | Designed — not yet executed |
| Performance testing | Client + server-side timing instrumentation | Designed — not yet executed |
