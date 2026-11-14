# Demonstration script

## Preflight (updated 2026-11-14)

Recheck eligibility immediately before the demo. The read-only Stage 2 inventory found 10 jobs:
one eligible posting, SQA Intern (ID 17), with deadline **2026-11-14**, and nine expired Active postings.
The deadline is inclusive in Asia/Kuala_Lumpur, so this posting becomes ineligible on 15 November
unless its genuine source is updated. Its authenticity and suitability as test data were not established.
Do not change its deadline or submit test applications to it. Use explicitly labelled synthetic postings
and dedicated test accounts for mutation tests. See `evidence/academic-stage2-live-preflight.json`.

## Demonstration steps

1. Run `node scripts/serve.cjs`; open `http://127.0.0.1:8080` at desktop and mobile sizes.
2. Register a dedicated student account, verify its email, and sign in. Explain that mail delivery is an
   external dependency. Do not present a success toast as proof that an email arrived.
3. In My Profile, enter an institution, programme, field, CGPA (0 is valid), interests separated by commas,
   certifications, three technical skills and two soft skills. Save, reload, and compare values.
4. In the dashboard, explain the four weighted factors and the distinction between compatibility and hiring
   probability. Open job details and skill analysis; compare the same job's score with Search.
5. Combine keyword, industry, location, type and required-skill filters. Reset all filters. Show a no-results query.
6. Apply to a clearly synthetic posting. Repeat after reopening details; duplicate submission should be rejected.
   This records an expression of interest in InternMatch; it does not send an application to an employer.
7. Sign out, then navigate directly to a protected URL. Sign in as the authorized administrator.
8. Create an explicitly synthetic future-dated job with required/preferred skills, edit it, and archive it.
   Show that existing application history remains. Do not change real users/jobs for the demonstration.
9. Create a dedicated student/graduate account if mail delivery is configured. Demonstrate role/status changes
   only on dedicated test users; self-demotion/deactivation must fail server-side.
10. Open the evaluation page and load the saved synthetic results. Explain that independent relevance and
    SUS results are still uncollected. Reuse the retained results when the relevant sources are unchanged.
    If a fresh run is needed, preserve the old evidence first: `node evaluation/benchmark_accuracy.js`
    overwrites the saved synthetic JSON. `node --test tests/*.test.cjs` runs the local suite.

Core authenticated live journeys and twenty sequential end-to-end recommendation timings already have
retained evidence in `test-results.md`; repeat only when changes or a specific unresolved case justify it.
Real email journeys, wider technical acceptance and genuine participant/judge evidence remain pending.
`evidence/browser/` contains mocked UI screenshots; `evidence/live-browser/` contains dedicated synthetic
account journeys against real Auth/REST. Neither is a participant usability study.
