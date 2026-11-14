# Live database verification — 2026-11-13

Project: `uszwimitxmzqwtqlugxx`, matching the frontend URL. PostgreSQL 17.

The connected migration tool returned `success: true` for `secure_consistent_internmatch`.
The owner explicitly selected the initial administrator ID; no reusable migration hardcodes that ID.
Before upgrade: 2 users, 9 jobs, 0 applications, 0 database-backed active administrators.
After upgrade: 2 users, 9 jobs, 0 applications, 1 active administrator.

Post-upgrade privilege queries returned false for anonymous SELECT/TRUNCATE on users and authenticated
table-level UPDATE on users. `tests/live-rollback.sql` returned:

```text
PASS: live SQL role simulation, synthetic fixtures rolled back
```

The script exercises signup-role restrictions, metadata escalation, foreign profile access, direct role
updates, cross-user recommendation RPCs, atomic profile rollback, administrator/self-lockout checks,
job create/archive, inactive-account denial and anonymous access. It deliberately simulates role/JWT claims;
real password login and HTTP behavior are evidenced separately in live-auth.json and live-browser.json.

The local scorer function body and live `pg_proc.prosrc` MD5 both equal
`2ae1260187bd5b87db6926ccbabb2aa6`. The production scorer, list RPC and detail RPC all report
`prosecdef=false` (SECURITY INVOKER) and an empty search path. This verifies that the benchmark's scorer
body matches the deployed scorer; it is not an independent relevance assessment.

After the authenticated tests, cleanup targeted only the two generated test IDs with matching reserved-domain
emails and the `internmatch_test` marker, and their synthetic postings. Final query:

```json
{"jobs":9,"users":2,"applications":0,"active_admins":1,"eligible_jobs":0,"test_users_remaining":0}
```

No existing job deadline was changed. The nine retained postings are currently ineligible (closed or expired),
so an empty student feed is expected until an administrator adds an eligible posting.

Final security advisor findings: no mutable-search-path or anonymous-definer execution warning remains.
Five intentional authenticated definer RPCs remain flagged; explicit authorization checks are tested.
Leaked-password protection remains disabled and needs an owner-side Auth setting review.
