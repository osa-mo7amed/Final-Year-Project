# Requirements traceability

FYP1 physical PDF pages are used below. FR labels are repository aliases for the nine Appendix A modules.
“Local DB” means executable PostgreSQL tests; “live SQL” means role/claim simulation with rolled-back fixtures;
“mock UI” means Edge browser with synthetic API responses. None implies real email delivery or human evaluation.

| ID / baseline | Implemented module | Evidence / remaining verification |
|---|---|---|
| FR-1, pp78–79 registration and email verification | auth.js; atomic signup trigger | Signup role safety: local DB/live SQL. Form rendering: browser. Real email/duplicate email service behavior pending |
| FR-2, pp79–81 login and role routing | Database role only; inactive checks | Local DB/live SQL authorization; real password login/role redirect passed (live-browser.json) |
| FR-3, pp81–82 profile/skills/completeness | Atomic save_profile; shared completeness UI | Local DB rollback; mock UI save/reload; real browser persistence passed |
| FR-4, pp82–84 ranked/explained recommendations | Single PostgreSQL scorer/RPC | Local edge cases and synthetic evaluation; mock UI cards/details; 20 live browser timings passed; no concurrent load claim |
| FR-5, pp84–85 skill gaps/guidance | Same RPC matched/missing skills and guidance | Mock UI score/guidance; content effectiveness human review pending |
| FR-6, pp85–87 combined search/filters | Filters shared ranked results; required skill AND filter | Mock UI no-results/reset; real combined-filter acceptance pending |
| FR-7, pp87–88 admin job CRUD | Atomic save_job and archive_job | Local DB rollback/archive; live SQL create/archive; mock UI rendering; real UI create/edit/archive passed |
| FR-8, pp89–90 user creation/roles/status | Isolated signup client; admin_update_user | Local/live SQL role/status and self-lockout; creation email flow pending |
| FR-9, pp90–91 logout | Auth signOut and protected-page guards | Local revoked-session denial; real Auth logout/token denial and browser redirects passed |
| Scope addition, Table 4.8 pp63-64 / ERD p93 | Minimal Submitted application | Local duplicate/ownership/deadline/archive checks; mock UI feedback; supervisor acknowledgement pending |

| Nonfunctional baseline, pp91–95 | Implementation / evidence | Remaining |
|---|---|---|
| PR-1 integrity | Keys, unique constraints, transactions; DB tests | Larger data/import cases |
| PR-2/3 response, acknowledgement <=5s | Immediate disabled/loading states | Real 20-run action-to-visible measurements |
| PR-4 recommendations <=3s | SQL engine; latency script and browser measurement instructions | 20 sequential live runs passed (max 1534.49 ms); concurrent load pending |
| PR-5 / MA-1 extensibility and documentation | Separate controllers, authoritative SQL, setup/evaluation guides | Future maintenance assessment |
| PR-6 concurrent reliability | Stateless API; database transactions/locking | Concurrent real-load testing |
| PR-7 / RE-1 errors | Explicit errors, rollback, no silent scorer fallback | Full fault-injection and transport coverage |
| RE-2 backups | pg_dump script and general isolated-restore guidance (not a verified runbook) | Client tools, isolated destination, credentials, executable restore procedure, operational schedule and actual backup/restore test |
| AV-1 uptime | Managed backend dependency | Hosting/availability measurement; no 24/7 guarantee established |
| AV-2 / SE-1/2 authorized access/isolation | Least privilege, RLS, guarded RPCs | Authenticated HTTP role suite passed; see live-auth.json |
| AV-3 / PT-1 devices/browsers | Edge 1440/390px mock UI checks | Chrome, Firefox, Safari and real-device checks |
| SE-3 passwords | Supabase Auth; no custom hashes/client secret keys | Auth operational settings; leaked-password protection disabled |
| MA-2 user acceptance | Task sheet and response templates | Real UAT participants |
| US-1/2/3 usable consistent interface | Preserved visual system, keyboard/modal enhancements | SUS study and full accessibility audit |
| SC-1/2/3 academic/privacy/content constraints | Minimal private data, explicit study consent/anonymization instructions | Supervisor/institutional compliance review; no legal compliance certification |

Objective 1: requirements compared to report. Objectives 2/3: implemented with automated and limited live evidence.
Objective 4: reproducible synthetic evaluation and study materials ready; human evaluation is not complete.
