# Actual test results — 2026-11-13

These results supersede unsupported historical “Verified” labels. No participant responses or independent
relevance judgments were collected. Failures found during development were corrected and rerun; the files
below record the successful final runs and their precise scope.

| Test / environment | Observed result | Evidence |
|---|---|---|
| Node test runner + local PGlite PostgreSQL | 14 tests passed, 0 failed; includes SQL authorization, atomic writes, scoring, completeness parity, frontend guards, ranking metrics and SUS scoring | [Raw output](evidence/local-tests.txt), `tests/*.test.cjs` |
| Hosted PostgreSQL with transaction-scoped synthetic fixtures | Authorization, signup-role safety, profile rollback, admin/self-lockout, job/archive, inactive and anonymous cases passed; fixtures rolled back | [Live database record](evidence/live-database.md), `tests/live-rollback.sql` |
| Live anonymous HTTP requests | User SELECT, job SELECT and recommendation RPC each returned 401 | [JSON](evidence/live-anonymous.json) |
| Live Auth password login + authenticated REST | Student/admin login 200; foreign RPC/direct escalation 403; metadata cannot authorize; own profile save 200; deactivation and logout make old tokens fail protected writes | [JSON](evidence/live-auth.json) |
| Live Edge browser with dedicated synthetic accounts | 9 workflow checks passed; job create/edit/archive, profile persistence, applications/duplicates, login redirects, logout guard and score parity; 0 page errors | [JSON](evidence/live-browser.json), [screenshots](evidence/live-browser/) |
| Edge layout/UI regression with mocked API | 12 pages × 2 widths (1440/390), no page errors or horizontal page overflow; job modal, profile reload, combined filters/search/reset, application feedback, guidance, saved evaluation and outage state checked | [JSON](evidence/browser-results.json), [screenshots](evidence/browser/) |
| Production scorer source parity | Local/live scorer bodies have identical MD5; recommendation functions are invoker-mode | [Database record](evidence/live-database.md) |
| Synthetic recommendation evaluation | 10 profiles, 12 jobs; macro P@5 0.58, Recall@5 0.935, F1@5 0.6949206, MAP 0.8967857 | [Versioned raw output](../evaluation/results/synthetic-v1.json), [summary](evidence/synthetic-summary.txt) |
| Supabase Auth settings (read-only) | Email enabled, signup enabled, mailer autoconfirm false | [Settings evidence](evidence/auth-settings.json) |
| Repository checks | JavaScript syntax checks and `git diff --check` passed; scanned source/docs/tests for private-key and privileged credential patterns | These are static checks, not functional test evidence |

## Measured performance

The live browser measured 20 sequential recommendation navigations from navigation start until a synthetic
recommendation card was visible. This includes route guard, user/profile requests, recommendation RPC and DOM
rendering. Mean 1233.83 ms; median 1416.25 ms; p95 1458.86 ms; maximum 1534.49 ms. All 20 were <=3000 ms.
Raw samples and method are retained in live-browser.json. The measured corpus contained nine retained ineligible postings and four active synthetic postings (visible in the retained dashboard screenshot). This was one browser context and
sequential requests, not a concurrent load test or a general production guarantee. Local benchmark SQL time
is a different measurement and must not be used to claim PR-4.

One live profile save click-to-success measurement was 297.86 ms. It is not a 20-run PR-3 assessment.

## Defects found and corrected during browser work

The job-create control accepted clicks before initialization installed its handlers. Profile inputs accepted
early edits that asynchronous loading could overwrite. Controls now remain disabled until initialization
finishes; load failures keep profile editing disabled. Both were retested in the successful live journey.

## Still pending or limited

- Real registration/verification/recovery emails and administrator-created account email flow. Synthetic live
  users were provisioned directly for testing, so password login success does not prove signup/email delivery.
- Wider filter datasets, exhaustive transport failure injection, accessibility audit and
  Chrome/Firefox/Safari/device coverage beyond the tested Edge viewports.
- Concurrent-load tests, 20-run UI acknowledgement timing, operational backup/restore and availability evidence.
- Independent relevance judging, SUS/UAT participants, guidance review and supervisor decisions in report-addendum.md.
- Leaked-password protection is disabled in the connected Auth configuration.

All temporary live accounts/postings/applications were removed after testing; original counts were restored.
At the end of the 2026-11-13 run, the retained nine postings were ineligible. No public deployment was published.

## Stage 2 checkpoint 2.1: read-only preflight, 2026-11-14

The current hosted inventory now has 10 postings: one eligible and nine expired Active postings.
The eligible SQA Intern listing (ID 17) has a deadline of 2026-11-14; eligibility is inclusive of that
Asia/Kuala_Lumpur date and will expire on 15 November if unchanged. This is not verification of a real
vacancy or permission to use it as synthetic test data. No postings or accounts were changed.

All three hosted recommendation function bodies match their local MD5 values and remain SECURITY INVOKER
with empty search paths. Files covered by the Stage 1 evidence manifest were unchanged at preflight.
This supports reuse of retained evidence within its original limits; it is not a complete deployment audit
or a fresh functional-test pass. See `evidence/academic-stage2-live-preflight.json`,
`evidence/academic-stage2-environment.json` and `technical-readiness.md` for remaining work.

## Stage 2 checkpoint 2.2: controller regression, 2026-11-14

14 focused tests passed (11 new auth-flow tests plus 3 existing frontend tests), 0 failed; Node v24.22.1 with mocked SDK/DOM. Evidence: `evidence/academic-stage2-auth-checks.json`. Signup redirect and auth/recovery/admin-cleanup failure handling fixed without changing visual design or SQL. Initial test-file syntax error corrected before final pass. JavaScript syntax and diff checks passed. No fresh live/browser/email test is claimed; historical live results predate these changes. User selected manual real-mail checks using `email-auth-acceptance.md`; E01-E08 remain NOT RUN until results are supplied.

## Stage 2.3.1: isolated Chrome UI regression, 2026-11-14

22 checks passed at 1440/390px after fixing missing filter labels and stale listings after failed requests.
Includes filters/reset, failure/retry, modal keyboard focus/Escape, live-region attributes and page errors.
Final evidence: `evidence/ui-acceptance-2026-11-14T10-33-41-169Z/results.json`; failed attempts and screenshots
retained. See `ui-acceptance-results.md`. Repository files delivered by Playwright routes after loopback access
denial; mocked SDK and blocked external traffic. Edge launch failed. No hosted timing, cross-browser-wide,
real-device, complete accessibility or human UAT claim. Syntax and diff checks passed.
