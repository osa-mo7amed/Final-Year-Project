# Stage 2 technical readiness

Updated 2026-11-14 (Asia/Kuala_Lumpur). **Checkpoints 2.1 and 2.2 independent work complete; real email acceptance pending. Stage 2 remains in progress.**

## Checkpoint 2.1 results

| Check | Actual result | Evidence / boundary |
|---|---|---|
| Compare retained evidence snapshot | No changed/missing files among the Stage 1 manifest entries at preflight | `evidence/academic-stage2-environment.json`; the manifest is not every repository file or execution-time provenance |
| Hosted job eligibility, read-only | At 18:18 Malaysia time: 10 jobs, 1 eligible, 9 expired Active, 0 Closed | `evidence/academic-stage2-live-preflight.json` includes query/time/results |
| Eligible listing | ID 17, SQA Intern, deadline 2026-11-14 | Inclusive date rule makes it ineligible on 15 Nov if unchanged. Authenticity not verified; not established as synthetic test data |
| Hosted/local recommendation parity | All three recommendation-function body MD5 values match; invoker mode and empty search paths retained | Same JSON plus local comparison in environment JSON; not full schema/policy/deployment parity |
| Local runtime | Node v24.22.1, pinned PGlite dependency resolves | Runtime inventory, not fresh suite execution |
| Browser automation | Bundled Playwright located; Chrome 157.0.8103.51 headless launch passed | No app navigation performed; does not establish Chrome app compatibility |
| Edge | Executable present (file version 157.0.4341.46); headless launch failed with target/context/browser closed | Current preflight failure retained; does not negate the historical 13 Nov test evidence or prove an application defect |
| Firefox/WebKit | Expected Playwright browser binaries absent in current environment; standard Firefox location absent | Provision or use another suitable environment later. WebKit is not proof of Safari compatibility |
| Accessibility tooling | `axe-core` / `@axe-core/playwright` not resolved in repo or bundled package paths checked | Automated tooling can be provisioned later; keyboard/manual checks still needed |
| Backup tooling | pg_dump, pg_restore, psql and Docker not found on PATH; standard PostgreSQL install directory absent | Bounded discovery only, not proof tools exist nowhere on disk. No backup/restore attempted |
| Dedicated test credentials | No INTERNMATCH-prefixed environment variables present | No secrets inspected/printed; dedicated mailbox/account not selected for this checkpoint |
| Documentation | Corrected ERD locator, backup evidence wording, demo rerun guidance and stale zero-eligible claim | Existing historical JSON/text/screenshots preserved |

No application/SQL code changes, hosted writes, account changes, test emails, load tests or public deployment.
Retained automated tests and synthetic benchmark were not rerun because the relevant source/evidence manifest
matched and this checkpoint made documentation changes only. Browser launch probes are environment checks.

## Evidence-preservation rules for subsequent checkpoints

Use dated output files under `docs/evidence/` and record source hashes, actual browser versions, account type,
dataset size, network/context and test conditions. Do not overwrite 13 Nov artifacts to make a new run look
historical. Existing browser scripts write fixed output paths and the benchmark overwrites its JSON; adapt
output destinations before a justified rerun. Snapshot comparison is not itself a test pass.

Use dedicated synthetic accounts/postings with explicit markers, tracked IDs and scoped cleanup. Do not use
SQA Intern (ID 17) for application/mutation tests, extend genuine deadlines, or use existing real users as
fixtures. Prefer a separate test project for failure/load work. Recheck eligibility immediately before demos.

## Remaining technical acceptance register

Real-service acceptance rows below remain **pending**, not passed by being planned. Checkpoint 2.2 added passing mocked controller checks and fixes; see `email-auth-acceptance.md` and `evidence/academic-stage2-auth-checks.json`. User will execute manual E01-E08 checks. Existing evidence may cover part of a row.

| ID / checkpoint | Cases to execute or prepare | Acceptance evidence | Dependencies |
|---|---|---|---|
| EMAIL-1 / 2.2 | Dedicated student signup; confirm blocked before verification; actual delivered email; valid link; profile redirect; login | Redacted timestamps/screenshots, account role, expected/actual result. A success toast is insufficient | User-designated test inbox; ability to receive/open automated test mail; configured allowed redirects |
| EMAIL-2 / 2.2 | Duplicate signup, invalid inputs, invalid/expired/reused link and mail failure | Actual observed provider/UI behavior; do not require account enumeration when service intentionally masks it | Dedicated test address and safe expiry/reuse method |
| EMAIL-3 / 2.2 | Recovery request, valid reset, mismatched/short password, new login, old password denial, invalid/expired link | Real link journey with redacted tokens/passwords; no unverified recovery pass | Same dedicated inbox/account |
| EMAIL-4 / 2.2 | Admin creates ordinary test account, admin session preserved, recipient verifies; explicit role changes on test user | Actual mail delivery plus UI/backend role behavior; signup must not grant Admin | Dedicated admin/test recipient, no real account mutations |
| AUTH-1 / 2.2 | Invalid login, unverified/inactive handling, auth outage, logout failure, protected route recovery | Separate successful, failed and blocked outcomes; stale-token denial where applicable | Inspect auth/recovery logic; test fixtures/mocks for failure cases |
| UI-1 / 2.3 | Combined keyword/company/skill/industry/type/location filters; reset/no results; multiple postings and ties | Case matrix with known fixtures, expected IDs/order and actual UI behavior | New safe synthetic dataset; label mocked versus live |
| UI-2 / 2.3 | Profile/job validation and transport failures; rollback; repeated submission; retry | Reproducible fault injection, no unintended persistence/duplicate writes | Isolated local or test environment; scoped fixtures |
| A11Y-1 / 2.3 | Keyboard-only navigation, labels/names, focus visibility/order, modal focus/escape/return, error announcements, zoom/reflow/contrast | Automated findings plus manual observations and fixed/retested defects; no blanket accessibility certification | Tooling or manual audit; preserve existing visual direction |
| BROWSER-1 / 2.3 | Edge launch investigation; Chrome/Firefox journeys; Safari/real tablet/mobile when available | Versions, viewport/device, flows, errors/screenshots, limitations | Chrome available; Edge probe failed; other browsers/devices not available in current checks |
| PERF-1 / 2.3 | At least 20 representative action-to-visible acknowledgement observations for <=5s criterion | Raw samples, action definition, mean/median/p95/max/errors; separate acknowledgement from save completion | Synthetic accounts; actual browser conditions; repeated action coverage |
| PERF-2 / 2.3 | Defined normal-load recommendation navigation and bounded concurrent workload | Predeclared corpus/concurrency/duration/stop conditions; raw latency/errors and integrity results | Separate test environment preferred; no uncontrolled production load |
| BACKUP-1 / 2.4 | Install/locate compatible tools; create protected dump; restore into isolated destination | Exit codes/logs, archive inventory, constraints/data/function/RLS checks, app smoke checks; never credentials/private dump contents | Private connection supplied locally, verified isolated target, storage/retention decision |
| OPS-1 / 2.4 | Auth settings/advisories, backup schedule, hosting/availability scope | Dated read-only settings/advisory record; accepted limitations and actual observations | Owner settings access; no claim of continuous uptime from managed hosting |

## Checkpoint 2.3.1 update

See `ui-acceptance-results.md`: 22 isolated Chrome checks passed at two widths, search failure/reset/retry and
filter labels fixed, dashboard keyboard modal checks passed. Edge launch blocked; other browsers/devices,
full accessibility, profile/job failures and measured backend/load acceptance remain open. New evidence is
routed local HTML plus mocked SDK, not a live backend or HTTP-server test. Earlier historical results preserved.

## Exact continuation

On `Continue Stage 2.3.2`, address remaining UI-1/UI-2/A11Y-1/BROWSER-1 and performance cases in safe isolated contexts,
splitting into sub-checkpoints if needed. User elected to run manual email checks; collect redacted E01-E08
outcomes from `email-auth-acceptance.md` when supplied. No mailbox input is required to start independent 2.3
work. Backup/restore remains checkpoint 2.4; genuine participant studies remain later stages.
