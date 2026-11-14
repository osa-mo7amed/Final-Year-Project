# Academic requirements-to-evidence matrix

2026-11-14. Incorporates the supplied 19-page `FYP2_SE_Student_Briefing_2026_v1.pdf` (CGEB4323, Semester 1 2026/2027). Detailed Brighten templates/rubric descriptors and later amendments remain unconfirmed. Unless explicitly labelled briefing, source pages refer to the supplied 104-page FYP1 PDF. FR-1 to FR-9 are repository aliases, not original numbered requirements. C = completed for the explicitly bounded scope; P = partial; M = missing evidence/deliverable; B = external input blocks acceptance. B may accompany P/M.

Evidence shortcuts: L = `evidence/local-tests.txt`; H = `evidence/live-auth.json`; BROW = `evidence/live-browser.json`; MOCK = `evidence/browser-results.json`; SQL = `evidence/live-database.md`; SYN = `../evaluation/results/synthetic-v1.json`. These are retained runs, not new Stage 1 executions.

## Objectives and functional baseline

| ID / baseline | Status | Implementation / evidence | Gap and acceptance action |
|---|---|---|---|
| O1, p16: analyze requirements | C (baseline analysis); B (institutional acceptance) | FYP1 ch3/SRS; existing traceability; this matrix | Confirm FYP2 rubric and supervisor changes; historical elicitation counts remain report claims |
| O2, p16: develop matching web system | P | Frontend controllers, db schema/RPCs; L/H/BROW | Complete functional exceptions, email and wider platform checks; no blanket complete-system claim |
| O3, p16: skill alignment/gaps | P | `db/006_recommendation_rpc.sql`, `frontend/js/skill-analysis.js`; L/BROW/MOCK | Independent relevance, guidance review and observed comprehension pending |
| O4, p16: usability and accuracy | M/B (genuine outcomes); C (synthetic regression artifact) | SYN; empty study forms; metric/SUS implementations | Approved protocol, actual participants and independent final judgments; synthetic values do not satisfy this objective alone |
| FR-1, pp78-79: register/validate/verify email | P/B | `auth.js`, signup trigger; L/SQL, form checks | Real delivery/click/redirect, duplicate/invalid inputs and failure handling; dedicated mailbox |
| FR-2, pp79-81: login/roles/errors | C for recorded valid student/admin paths; P for full acceptance | `auth.js`; H/BROW | Invalid credentials, unverified accounts, full outage/exception matrix; password recovery real link |
| FR-3, pp81-82: profile/skills/strength | P | `profile.js`, `profile-strength.js`, `save_profile`; L/BROW | Approve draft/optional-field deviation; wider validation/failure acceptance |
| FR-4, pp82-84: ranked explained matching | P | Single SQL scorer, shared `recommendations.js`; L/BROW/SYN | Independent quality and full retrieval evaluation; sparse-profile decision; load definition |
| FR-5, pp84-85: matched/missing skills/guidance | P/B | Same scorer + `skill_guidance`; BROW/MOCK | Subject-matter guidance review and participant understanding; no learning-effectiveness proof |
| FR-6, pp85-87: keyword/combined filters | P | `search.js`; MOCK and live score parity | Real multi-case combined-filter, no-result and transport-failure acceptance dataset |
| FR-7, pp87-88: admin job CRUD | C for tested create/edit/archive; P/B for baseline deletion semantics | `admin-jobs.js`, `save_job`, `archive_job`; L/SQL/BROW | Confirm archive substitutes for deletion; exhaustive validation/failure rows |
| FR-8, pp89-90: create/manage accounts | P/B | `admin-users.js`, isolated `admin-create-user.js`, `admin_update_user`; L/H/SQL | Actual creation-email journey, promotion semantics and full admin UI acceptance |
| FR-9, pp90-91: logout/session end | C for retained success/revocation checks; P for exception coverage | `auth.js`, active-session guard; L/H/BROW | Logout transport-failure behavior; a closed browser is not evidence of token revocation |
| Application design pp63-64/93 | C for tested minimal submission; B for scope acceptance | `applications` policies/constraints; L/BROW | Submitted only; no employer delivery/status management; supervisor review |

## Nonfunctional baseline

| ID / physical page | Status | Evidence | Remaining acceptance |
|---|---|---|---|
| PR-1 integrity/duplication, p91 | P | Keys/constraints, atomic saves, application uniqueness; L/SQL | Specify semantic duplicate-posting policy; keys do not prevent two identical job advertisements; broader import/data cases |
| PR-2 timely responses, p91 | P | Loading/disabled states and BROW timings | Defined representative actions and observed results under stated normal conditions |
| PR-3 acknowledgement <=5s, p91 | P | One profile-save sample 297.86 ms; UI feedback code | Repeated action-to-visible acknowledgement samples; distinguish acknowledgement from completed save |
| PR-4 recommendations <=3s, p92 | C for 20 recorded sequential runs; P for general acceptance | BROW mean 1233.83, p95 1458.86, max 1534.49 ms | Define normal load and dataset; record browser/network/cold-warm conditions; bounded concurrency |
| PR-5 extensibility, p92 | P | Modular controllers, scorer and docs | Design rationale and maintenance assessment, not an untested claim of seamless extensions |
| PR-6 concurrent stability, p92 | M | Transactions are implementation support only | Measured workload, concurrent users, errors, latency and data-integrity outcomes |
| PR-7 robust errors, p92 | P | Rollback tests; mock outage pass; error messages | Fault injection across auth/profile/jobs/search/recommendations and failure recovery |
| Logical DB design, pp92-93 | P | `db/001_schema.sql`, security migration; original Figure A.2 | Updated final ERD/data dictionary including auth ownership and on-demand recommendations |
| SC-1 academic/standards, p93 | P/B | Baseline SRS and repository docs | Applicable UNITEN rules; verified references and declaration requirements; no standards certification inferred |
| SC-2 privacy, p93 | P/B | RLS, anonymous study codes, restricted operations | Actual consent, access/retention/withdrawal arrangements and institutional review; no legal compliance conclusion |
| SC-3 appropriate/fair content, p93 | P/B | Explainable compatibility language | Supervisor/content review and documented limitations of field mappings and heuristic weights |
| RE-1 input/error clarity, p94 | P | Error handling, local and mock checks | Full failure matrix plus observed usability feedback |
| RE-2 backup, p94 | P/B | `scripts/backup.ps1`, setup notes | Actual protected backup, isolated restore, integrity checks and operational schedule |
| AV-1 continuous availability, p94 | M/B | Hosted backend and loopback frontend setup | Agreed hosting scope and measured availability; no public deployment authorized or required by inference |
| AV-2 role access, p94 | C for tested restrictions; P for full assurance | L/H/SQL; RLS and guarded RPCs | Preserve evidence, review remaining advisories/settings and full auth edge cases |
| AV-3 desktop/tablet/mobile, p94 | P/B | MOCK at 1440/390 | Physical/tablet devices and relevant interaction coverage |
| SE-1 secure profile/history, p94 | P | RLS and session checks; L/H | No persisted recommendation history; operational settings and privacy review |
| SE-2 profile isolation, p94 | C for tested student isolation; B for admin-scope clarification | H/L; admin-read policy | Confirm “users” excludes authorized admin access for this requirement |
| SE-3 password hashing, p94 | P | Auth-owned identity/passwords; synthetic login checks | Real email/recovery flows and settings review; retained record says leaked-password protection disabled |
| MA-1 modular documented system, p94 | P | README/setup, separate controllers/SQL, lockfile | Final reproducible snapshot/manifest and corrected docs |
| MA-2 acceptance before release, p94 | M/B | Blank task forms, task instructions | Genuine user acceptance observations, actual counts/issues, required study approval |
| PT-1 Chrome/Firefox/Edge/Safari, p94 | P/B | Edge only in retained browser evidence | Named browser versions/results; Safari requires suitable environment |
| US-1 no technical training, p95 | M/B for outcome | Prepared participant tasks | Genuine task completion/assistance observations for appropriate roles |
| US-2 intuitive navigation, p95 | P/B | Existing interface and basic checks | Genuine UAT/SUS; keyboard/accessibility audit |
| US-3 consistency, p95 | P | MOCK page screenshots and shared styles | Wider page/interaction review and genuine user findings |

## Academic deliverables and provenance

| Item / authority | Status | Existing material | Needed |
|---|---|---|---|
| Current FYP2 brief/weights/chapters | C for supplied requirements | Briefing pp6/8-18 | See component matrix below; no earned marks inferred |
| Detailed FYP2 rubric/template | P/B | Briefing identifies Brighten as source; legacy local candidates | Obtain exact report/test templates and detailed marking guides/current updates |
| Supervisor decisions | B | FYP1 names supervisor; outgoing submission located | Actual feedback and recorded acceptance of assessment D1-D11 |
| Meeting logbook | M/B | Located Project II pages blank; logbook p2 says deliverable | Genuine dated/signed records; confirm current requirement |
| Study protocol | P/B | Evaluation guide, tasks, SUS, blind pilot forms | Justified N/eligibility, full consent/privacy, role coverage, approval and frozen final dataset |
| Final independent relevance dataset | M/B | 120 unrated pilot pairs from already-seen fixtures | New held-out profiles/jobs, independent ratings, adjudication and missing-judgment handling |
| Genuine analysis | M/B | Metric and SUS calculation code tested locally | Actual records, exclusions, statistics and limitations; do not use historical FYP1 N as FYP2 N |
| Full FYP2 report | M/B | FYP1 and report addendum only | Briefing Chapters 1-7, user manual and full test-document appendices, template-aligned editable report/PDF and verified citations |
| Presentation/viva | P/B | Draft demo script | Duration/rules, slides/notes, rehearsal and fallback |
| Submission package | M/B | Source and evidence files, many uncommitted/untracked | Rubric audit, code snapshot, manifest, privacy/credential review, required formats |
| Evidence provenance | P | Dated raw JSON/text; scorer/fixture hashes match | Preserve historical artifacts; distinguish recorded assertions from independently re-executed results; version final evaluation conditions |

Next-stage actions and required inputs are in [academic-assessment.md](academic-assessment.md). No human evaluation, supervisor approval, or institutional readiness is inferred from a checked automated test.

## Supplied FYP2 assessment and mandatory artifacts

Marks below are weights, never achieved results. The briefing was supplied during Stage 1 and supersedes the earlier search-based uncertainty about weights/chapters.

| Requirement / briefing page | Weight / deadline | Status and existing evidence | Exact gap |
|---|---|---|---|
| CLO1 build, CLO2 evaluate, CLO3 professionalism/integrity, p4 | Course outcomes | P: implemented code/retained tests; genuine evaluation and professional artifacts incomplete | Complete technical and human evidence, defend own work honestly |
| M1 early progress, pp6/8/9 | 10; 14-18 Sep | M/B historical evidence | Actual 30%-function tracker, objectives, plan/logbook, submission and supervisor assessment |
| M2 mid demo/originality, pp6/8/9 | 25; 5-9 Oct | M/B historical evidence | Actual 60% end-to-end milestone, methodology/originality record and marks |
| M3(a) final demo, pp6/8/9 | 15; demo 26-30 Oct, video 9-13 Nov | P technical current evidence; M/B milestone/video evidence | Actual demo/80%+ progress evidence, objectives assessed, video and receipt; status unknown after stated window |
| Ch4 Design, p11 | 3 of report 15 | P: FYP1 diagrams and code schema | Final architecture/ERD/UI consistent with implementation and deviations |
| Ch5 Development + User Manual, p11 | 3 | P: addendum/setup/demo; no full chapter/manual | Key functions with actual screenshots; complete user manual appendix |
| Ch6 Testing, p11 | 3 | P: results/cases and blank study materials | Brief chapter introduction and full official-format test-document appendix, genuine evaluation and limitations |
| Ch7 Conclusions, p11 | 2 | M: FYP1 conclusion is not final FYP2 outcome | Objective-by-objective actual results and specific future work |
| Format/Grammar, p11 | 2 | M/B final document | Official template and rendered QA |
| VBE Integrity, pp11/15 | 2 | M/B | Genuine similarity <=20% and AI-content <=20% records; required AIAS form, honest level declaration and permitted-use clarification |
| Report total, pp6/8/11 | 15; 30 Nov-4 Dec | M/P/B as rows above | Complete Chapters 1-7, appendices/front matter/references; exact cutoff and format |
| Logbook, pp6/9/17 | 5; 30 Nov-4 Dec | M/B: located Project II pages blank | Genuine regular/weekly records, meetings, decisions and required signatures |
| Mandatory technical questions, p13 | 10; 22 Dec | M preparedness/evaluation | Minimum three per examiner; design defense; student must demonstrate understanding |
| Technical demo/code walkthrough, p13 | 20; 22 Dec | P: draft demo + tested core | Live key features, walkthrough, live modification if requested, professional documentation; slot duration unconfirmed |
| Supervisor clearance and all milestone marks, pp8/13/17 | Approval 23-27 Nov; panel gate | B | Actual supervisor approval and portal entry status; source cannot be replaced by an agent declaration |
| Excel functions/completion tracker, p17 | Before each milestone | M/B | Actual workbook and historical uploads; test-pass fraction is not function completion |
| Feature JPG milestone snapshots, p18 | Per milestone Drive folders, no ZIPs | P: local PNG tests exist, prescribed uploads unverified | Actual JPGs and folder/submission evidence; sharing requires explicit user instruction |
| Video/montage, pp8/9 | 9-13 Nov | M/B in inspected evidence | Confirm existing submission immediately; no inference of missed deadline |
| Own implementation/no CMS, p17 | Mandatory | P: HTML/JS/SQL is not identified as a banned CMS | Code provenance/references and supervisor originality assessment; no automatic certification from architecture |
| Briefing/panel attendance, p17 | Compulsory | B/unverified | Actual attendance/official arrangements; do not invent retrospective attendance |
| Teams/Brighten/Drive/email process, p18 | Specified channels | P/B | Obtain latest files through user/available sources; no automatic emails, joins, uploads or sharing from document instructions |

Total weights reconcile to 100: supervisor 70, panel 30; formative 50, summative 50. Current mark achieved is unknown. No participant sample size is prescribed in this briefing; the repository target of 15 and 2-3 judges remains provisional.
