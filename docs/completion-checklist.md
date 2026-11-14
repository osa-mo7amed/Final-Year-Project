# FYP2 completion checklist — 2026-11-13

Baseline: 104-page FYP1 report; requirements, scope, architecture and SRS reviewed.
Existing frontend direction/assets and uncommitted work preserved. Original PDF unchanged. No public deployment.

- [x] Compare repository, report and connected project uszwimitxmzqwtqlugxx.
- [x] Harden signup, authorization, inactive/revoked sessions and RPC ownership.
- [x] Bootstrap the user-selected administrator without changing other real accounts.
- [x] Use one production SQL scorer across dashboard/search/analysis/evaluation.
- [x] Make profile/job writes atomic; enforce application ownership, deadlines and uniqueness.
- [x] Verify core student/admin workflows with real Auth/REST and dedicated synthetic accounts.
- [x] Correct loading races found in the live browser run.
- [x] Pass 14 automated tests and 24 Edge desktop/mobile page checks.
- [x] Apply live migration, run rollback SQL/HTTP tests and verify deployed scorer source parity.
- [x] Measure 20 end-to-end recommendation loads: all under 3 seconds in the tested small-corpus sequential run.
- [x] Remove synthetic live fixtures; final counts restored to 2 users, 9 jobs, 0 applications, 1 authorized admin.
- [x] Correct synthetic metrics; prepare blank SUS/task/relevance materials.
- [x] Reconcile setup, report material, traceability and evidence; remove unsupported verification claims.
- [x] Review diff/credential patterns; retain public anon key only in browser configuration.

Remaining human/operational work (not claimed complete):

- [ ] Verify registration, administrator-created account and recovery links through a real mailbox.
- [ ] Collect planned SUS/UAT participants (target 15, actual collected 0) and independent relevance judgments.
- [ ] Have supervisor acknowledge technology/scope decisions and review learning guidance.
- [ ] Configure operational backups and verify a restore; review leaked-password protection.
- [ ] Complete wider browser/device/accessibility, concurrent-load and full failure/filter-matrix acceptance checks.
- [ ] Prepare a stable, clearly labelled synthetic demo posting. Read-only recheck on 2026-11-14 found one eligible listing out of ten, but its deadline is 2026-11-14; do not alter genuine listings for tests. See `evidence/academic-stage2-live-preflight.json`.

See test-results.md for exact environments and evidence; no claim that the entire FYP or human evaluation is complete.

Stage 2 checkpoint 2.1 completed on 2026-11-14: read-only eligibility/function parity and evidence/environment
inventory, plus documentation corrections. Remaining checkpoint acceptance criteria are in `technical-readiness.md`.
