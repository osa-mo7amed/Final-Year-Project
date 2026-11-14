# Academic progress

Last updated: 2026-11-14, Asia/Kuala_Lumpur.

## Current stopping point

**Stage 2.3.1 complete: isolated Chrome search/keyboard checks and fixes. Stage 2.3/Stage 2 remain incomplete.** Wait for `Continue Stage 2.3.2`.



Completed Stage 2.3.1:

- Added tests/ui-acceptance.cjs and tests/browser-fixtures.cjs; all external traffic blocked and synthetic SDK responses used. Direct loopback navigation was denied; local files delivered by test routing instead.
- Reproduced missing filter labels and stale successful listings after request failure. Fixed search.js load-state/error/retry behavior and explicit labels in search.html; preserved visual design.
- Final Chrome 157.0.8103.51 results: 22 pass, 0 fail (11 cases x 1440/390 widths), including modal keyboard checks. Edge launch blocked. No live API/email/data writes or performance claims.
- Retained failed/intermediate runs and final evidence under docs/evidence/ui-acceptance-2026-11-14T10-33-41-169Z; inspected final search screenshots. Summary: docs/ui-acceptance-results.md.
- Changed application files: frontend/js/search.js, frontend/pages/search.html. New harness/helper, summary/evidence; readiness/test-results and continuity docs updated. Syntax and whitespace checks passed. No SQL or live user data changes.

Completed Stage 2 checkpoint 2.2 independent work:

- Fixed explicit signup verification redirect, invalid-role/non-Active login refusal, thrown logout/guard failures, reset sign-out reporting and isolated admin-signup cleanup control recovery.
- Ran focused mocked controller regression: 14 passed (11 new plus 3 existing frontend tests), no network or real email. Syntax checks and diff whitespace checks passed. Initial test-file syntax error corrected before passing run.
- Created `docs/email-auth-acceptance.md` with exact E01-E08 manual steps, setup and redacted evidence form; saved `docs/evidence/academic-stage2-auth-checks.json` with source hashes and actual results.
- User chose **I’ll run the manual email checks**. No dedicated address/password is required from the user for agent execution. Await redacted case outcomes; no real delivery/expiry/reset acceptance claimed.
- Changed `frontend/js/auth.js`, `frontend/js/recovery.js`, `frontend/js/admin-create-user.js`; added `tests/auth-flows.test.cjs`. Existing frontend design, SQL, real accounts and historical evidence preserved. Updated auth/test/readiness docs and continuity files. No messages/emails or hosted changes.

Completed Stage 2 checkpoint 2.1:

- Compared files to Stage 1 evidence manifest: no changed/missing entries at preflight; no blanket suite rerun needed.
- Queried hosted job inventory read-only: 10 postings, one eligible (SQA Intern, ID 17), nine expired Active. Eligible listing deadline is 2026-11-14 and expires on 15 Nov if unchanged. No listing was modified or verified as safe test data.
- Compared all three hosted recommendation function bodies with local SQL: matching hashes, invoker mode, empty search paths.
- Inventoried runtime/tools. Chrome headless launch passed; Edge launch failed. Firefox/WebKit browser binaries and PostgreSQL backup/restore tools not found in checked locations. No application-browser compatibility claim from launch probes.
- Corrected stale documentation and created `docs/technical-readiness.md` with pending cases, acceptance evidence and dependencies.

Stage 2.1 files added: `docs/technical-readiness.md`, `docs/evidence/academic-stage2-live-preflight.json`,
`docs/evidence/academic-stage2-environment.json`. Existing docs edited narrowly: `report-addendum.md`,
`traceability-matrix.md`, `demo-script.md`, `test-results.md`, `completion-checklist.md`; both continuity files updated.
No application/frontend/SQL edits, live writes, emails, account changes, public deployment or commits.

Completed Stage 1:

- Reviewed the supplied FYP1 baseline, current implementation/docs, retained test/evaluation evidence and study templates.
- Incorporated the subsequently supplied 19-page CGEB4323 FYP2 briefing; mapped the 100-mark assessment, required Chapters 1-7, manual/test appendices, video/logbook/tracker, integrity and supervisor-clearance requirements.
- Searched local project/Downloads and connected Drive/Gmail for relevant requirements and feedback. Rejected unrelated Text Analytics rubric and industrial-training/engineering report examples as FYP2 authorities. No messages sent.
- Created requirements-to-evidence matrix, completed/partial/missing/externally blocked classification, prioritized stages, eleven deviation/decision entries and a concise materials list.
- Verified saved synthetic engine/fixture hashes; recomputed metric summaries from saved rankings and latency summaries from saved samples; confirmed zero SUS/task rows and zero ratings among 120 pilot pairs. Did not rerun workloads.
- Visually inspected the FYP1 ERD (physical p93), blank Project II logbook pages and briefing report/panel slides.

## Files created by Stage 1

- `docs/academic-assessment.md`: findings, institutional source review, deadlines, evidence limits, deviations, staged plan, requested materials.
- `docs/academic-requirements-matrix.md`: FYP1 functional/nonfunctional/objective mapping plus FYP2 weighted deliverables and gates.
- `docs/evidence/academic-stage1-audit.json`: retained-artifact arithmetic/hash audit and assessment-time artifact manifest.
- `docs/academic-progress.md`: this checkpoint.
- `docs/academic-handoff.md`: exact continuation instructions.

Temporary text/render files are in ignored `tmp/pdfs/`; original PDFs and prior repository files remain unchanged. No commits, frontend modifications, live queries/writes, public deployment or participant recruitment in Stage 1. Existing dirty/untracked work was preserved.

## Priority missing inputs and decisions

1. Confirm video/montage submission status (briefing window 9-13 Nov; now past). Supply existing file/receipt if available. Unknown is not a missed-deadline finding.
2. Supply Brighten report/test templates, detailed rubric/milestone guides, actual AIAS form, any calendar revisions, exact report cutoff and individual panel duration.
3. Supply genuine M1/M2/M3(a) records/status, originality results, Excel tracker/JPG milestone folders, completed logbook and supervisor feedback/decisions. Confirm approval and all portal marks for panel eligibility.
4. Confirm study eligibility/sample/consent/approval route; later provide genuine participant and independent-judge data. Current target 15 and 2-3 judges is unapproved planning.
5. For technical checks: dedicated mailbox, available browsers/devices and isolated restore resources; secrets remain private.

Supplied schedule: supervisor approval 23-27 Nov; report/logbook 30 Nov-4 Dec; panel 22 Dec (overall event 08:00-17:00, individual duration unconfirmed). Later official updates may supersede it.

## Remaining blockers

Genuine UAT/SUS and independent final relevance evidence absent; email/restore/cross-browser/accessibility/load evidence incomplete; final report/manual/full test appendix/slides/package incomplete; genuine milestones/logbook/originality/AIAS/clearance not evidenced. Course briefing is now received and must not be requested again. Technical work independent of missing inputs may proceed when Stage 2 is requested.

## Exact next action

On `Continue Stage 2.3.2`, read ui-acceptance-results.md, readiness and handoff. Address remaining profile/job
failure tests and broader keyboard/accessibility coverage, browser environment issues, then predeclare and
run feasible acknowledgement/load checks in safe isolated conditions. No hosted performance pass from mocks.
User continues manual E01-E08 email checks; ingest redacted outcomes if supplied. Stop at a useful checkpoint
and update both continuity files. Stage 2.4 backup/restore and Stage 3 are not started.
