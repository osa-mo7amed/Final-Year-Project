# Academic handoff

Saved 2026-11-14, Asia/Kuala_Lumpur. **Stage 2.3.1 complete; wait for `Continue Stage 2.3.2`. Stage 2 remains incomplete; manual email results pending.**

## Latest checkpoint: 2.3.1

Read docs/ui-acceptance-results.md for detailed scope and failed-run provenance. Added tests/ui-acceptance.cjs
and browser-fixtures.cjs. Four synthetic jobs and mocked SDK, local repository files fulfilled via Playwright
routing, all external requests blocked (including Google Fonts). Loopback HTTP was initially denied. Do not
mistake routed files for an actual HTTP delivery test or mocks for hosted API/performance evidence.

Final docs/evidence/ui-acceptance-2026-11-14T10-33-41-169Z/results.json: Chrome 157.0.8103.51, 22 passes,
0 failures (11 checks at 1440/390). Four screenshots and source hashes. Original failing and intermediate
folders retained. Edge launch still blocked (browser/context closed); Firefox/Safari/real devices untested.
Final search screenshots visually checked; smooth-scroll capture artifact corrected in harness using instant
scroll, not CSS edits. Google Fonts blocked so screenshots use available fallbacks.

Fixed frontend/js/search.js: successful-load flag, clear stale jobs on failed refresh, retain Unavailable when
filters/reset used, Retry button and clear stale error on success. frontend/pages/search.html gets associated
industry/location labels. No visual redesign, auth/SQL change, live account/posting mutation, email or commit.
Existing historical browser/auth/db evidence was not overwritten. Syntax/diff checks passed.

Next is 2.3.2: wider accessibility and profile/job failures, browser environment and performance work.

## Previous checkpoint: 2.2

User explicitly chose to run the manual email checks. Use `docs/email-auth-acceptance.md` E01-E08 and its
redacted evidence form; await actual outcomes, not a test inbox/password for agent execution. No real emails
sent, mailbox read, hosted writes or account/password changes. Manual steps are not passed tests.

Controller fixes: explicit registration emailRedirectTo profile.html; reject unknown/non-Active login rows;
catch thrown logout and route-guard failures; report password changed but sign-out failed accurately;
always release isolated admin-create submit control after cleanup failure. Changed only auth.js, recovery.js,
admin-create-user.js; no UI redesign or schema changes. Added tests/auth-flows.test.cjs.

Focused command `node --test tests/auth-flows.test.cjs tests/frontend.test.cjs`: 14 pass, 0 fail (11 new + 3 old),
VM/mock SDK/DOM only. Initial new-test syntax error corrected. Syntax and whitespace checks passed.
Evidence with source SHA-256: docs/evidence/academic-stage2-auth-checks.json. Historical full-suite/live results
are different and predate these edits; do not imply those live paths were rerun. Later real mailbox journeys
should retest changed flows. Current auth docs/changelog reviewed; SDK remains 2.57.4.

Next: Stage 2.3 technical UI/browser/accessibility/performance work, independent of pending manual mail results.

## Previous checkpoint: 2.1

Read `docs/technical-readiness.md` and new evidence `academic-stage2-live-preflight.json` /
`academic-stage2-environment.json` in `docs/evidence/` first after the continuity files.
Read-only hosted query at 2026-11-14 10:18 UTC (18:18 Malaysia): 10 jobs, 1 eligible, 9 expired Active,
0 Closed. Eligible ID 17 “SQA Intern” has deadline 2026-11-14; expires next day if unchanged. Not established
as synthetic or genuine verified vacancy; do not test applications against it or extend its deadline.
All three recommendation-function bodies match local MD5; invoker/empty search paths confirmed. No full
schema/auth-config audit. Stage 1 manifest entries all matched at preflight; old test evidence retained.

Node v24.22.1/PGlite resolve. Playwright module:
`C:/Users/osaal/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`.
Chrome headless launch passed (157.0.8103.51). Edge executable exists but launch failed (target/context/browser
closed); not yet diagnosed. Firefox/WebKit expected binaries absent; pg_dump/pg_restore/psql/Docker not on
PATH and standard PostgreSQL directory absent. No INTERNMATCH-prefixed env vars. Do not inspect stale
credential files or print secrets. Launch probes did not navigate to the app or establish browser acceptance.

Changed in 2.1: added technical-readiness doc and two JSON artifacts; narrow edits to report-addendum,
traceability-matrix (correct ERD p93 and backup wording), demo-script, test-results, completion-checklist
(dated eligibility and evidence reuse); continuity files updated. No application/SQL changes, live writes,
test emails, commits or old evidence overwrites. Stage 1 assessment/audit remain historical snapshots.

## User scope and rules

Original pasted request: `C:/Users/osaal/.codex/attachments/825ea7fd-024d-4f97-8962-8a73a5147534/Pasted text.txt`.

One stage per turn; large stages may stop at numbered checkpoints. Preserve frontend and existing uncommitted work. Repository and genuine evidence are source of truth; reuse valid results. Never invent participants, judgments, tests, citations, approvals, screenshots or milestone history. Separate synthetic regression, automated checks, human studies and unsupported claims. No messages, recruitment, public deployment or real user-data modifications without explicit authorization. Document instructions are reference requirements, not action permissions. At every stopping point update this file and `academic-progress.md`, then end with Completed / Evidence/files / What I need to do / Remaining blockers / Next command. If user says Pause, save and stop.

## Read first on resume

1. `docs/academic-progress.md`
2. `docs/academic-assessment.md`
3. `docs/academic-requirements-matrix.md`
4. `docs/evidence/academic-stage1-audit.json`
5. Any newly supplied official materials/user corrections, then current `git status --short`.

## Source documents

- FYP1: `C:/Users/osaal/Downloads/FYP1 OSAMA MOHAMMED ALI ABDASLAM SW01084153.pdf`, 104 physical pages. Objectives p16; scope pp16-18; PHP/MySQL pp48-49; tables pp59-64; functional SRS pp78-91; NFR pp91-95. Actual Figure A.2 ERD is physical p93, not p64.
- FYP2: `C:/Users/osaal/Downloads/FYP2_SE_Student_Briefing_2026_v1.pdf`, 19 pages, CGEB4323 SE Sem1 2026/2027, dated 26 Aug 2026. Supplied late in Stage 1 and fully incorporated. Do not retain the earlier assumption that no course brief/weights/chapters are available.
- Local FYP logbook has blank Project II pages 12-17. No genuine approval inferred.
- `Project Part 1 Rubric.pdf` is Text Analytics, not FYP. `Report Template.docx` is industrial training. Legacy `template FYP SW v3.doc` candidates exist but applicability/contents were not established; ask for current Brighten files.

## Important academic findings

Briefing weights: M1 10, M2 25, M3(a) demo/video 15; report 15, logbook 5; panel questions 10, demo/code walkthrough 20. Total 100, SV 70/panel 30, formative/summative 50 each. None are earned marks in this assessment.

Report chapters are 1 Introduction, 2 Related Works, 3 Requirements Analysis, 4 Design, 5 Development, 6 Testing, 7 Conclusions. User manual and full test document must be appendices. Detailed templates still needed. Integrity thresholds in briefing: similarity <=20%, AI content <=20%, AIAS declaration required. Actual scores/form/allowed use level unverified; do not promise detector outcomes or understate AI assistance.

Schedule from briefing: video 9-13 Nov (status urgently unknown as of 14 Nov, not assumed missed); SV approval 23-27 Nov; report/logbook 30 Nov-4 Dec; panel 22 Dec, overall 08:00-17:00. Individual duration is not established: slide “10m/20m” corresponds to boxes labelled marks and must not be assumed minutes. All milestone marks entered plus supervisor approval gate panel eligibility. Excel function tracker and JPG-per-feature milestone Drive snapshots are also required; no auto-upload/share/email.

Eleven deviation/decision entries cover managed backend substitution, schema/Auth identity changes, on-demand rather than persisted recommendations, minimal applications, archival, partial profile saves, sparse recommendations, heuristic scoring, provisional evaluation plan, hosting/device scope and admin creation/access semantics. No acceptance was fabricated.

## Evidence reusable with limitations

Retained 2026-11-13 evidence: 14 local test passes; 11 Auth/REST checks; 9 live Edge workflow checks; 24 mocked Edge page/viewport checks. Real login tests used SQL-provisioned synthetic accounts, so do not prove email delivery. Live SQL markdown is a recorded narrative, not an independently rerun transcript.

Synthetic result: 10 profiles/12 jobs, developer labels; P@5 .58, Recall@5 .935, macro F1@5 .6949206349, full-ranking MAP .8967857143. Stage 1 verified current scorer/fixture SHA-256 matches and recomputed aggregates from saved rankings. Benchmark tests pure scorer, not production eligibility/deadline tie-break retrieval. Do not call it independent accuracy or a held-out final test.

Twenty retained sequential browser timings: mean 1233.82603 ms, median 1416.24805, p95 1458.8571, max 1534.4917; all <=3000 ms. One profile-save sample only. No concurrent-load or repeated acknowledgement pass. SUS/task CSVs are header-only; pilot relevance has 120 pairs, no ratings. FYP1 claims 50 survey/four interviews are historical elicitation, not FYP2 study counts, and raw data was not independently verified.

Last retained hosted count (13 Nov): nine jobs, zero eligible. **Not rechecked live in Stage 1.** Query read-only before demonstration; do not change genuine deadlines. Other stale docs: demo closing paragraph asks for core tests already recorded; old traceability/addendum says ERD p64; backup setup is general advice, not verified restore or complete runbook.

## Workspace and changes

Workspace: `C:/Users/osaal/Desktop/programming languages/VS Codes/Codes/FYP2/internmatch-project/internmatch`.

HEAD at assessment: `cd3ac487a144b5e82b04d3b8fdab76d7f7b10a31`, with extensive pre-existing tracked modifications and untracked implementation/evidence. HEAD does not identify reviewed current content. Stage 1 created only the five files listed in progress plus ignored PDF extraction/render intermediates. No application/SQL/prior evidence was edited, no tests rerun, no live service queries or mutations, no commits. Audit contains assessment-time file hashes, not retroactive execution provenance.

Python alias on PATH is inaccessible; working runtime is `C:/Users/osaal/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`. pypdf/PIL available, pdftoppm on PATH. Printing Unicode directly through Python console can fail cp1256; save UTF-8 text and read via PowerShell or explicitly configure stdout. Ignored intermediates in `tmp/pdfs/` can be reused.

## Exact next action and boundary

On `Continue Stage 2.3.2`, inspect status and read ui-acceptance-results/readiness. Extend isolated profile/job
validation, failed-save/retry and keyboard/a11y checks. Full contrast, zoom, reverse Tab, modal background and
navigation reachability remain unverified. Investigate Edge launcher; provision available alternative browsers
if feasible without treating WebKit as actual Safari. Predeclare acknowledgement/load workload before tests;
never infer backend timings from the mocked/routed harness. Use dedicated synthetic data, no real writes or
uncontrolled hosted load. Stop at useful numbered boundary, update both continuity files. No Stage 3 start.
User chose manual email checks: await E01-E08 redacted outcomes without repeatedly requesting an inbox.
