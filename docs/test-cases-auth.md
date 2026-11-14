# Authentication and authorization cases

Prior “Verified” claims without retained evidence are superseded by `test-results.md`.

| Case | Action | Expected | Evidence/status |
|---|---|---|---|
| AUTH-01 | Signup metadata requests Admin | Provision Student; no elevated authority | Local DB and live rollback SQL |
| AUTH-02 | Supply valid student/admin password | Correct role redirect | See live-auth/live-browser evidence when present |
| AUTH-03 | Read another user's profile or recommendation RPC | No foreign rows / 403 | Local DB, live SQL and live REST |
| AUTH-04 | PATCH own role or set metadata Admin | Direct update denied; metadata not authoritative | Local DB and live REST |
| AUTH-05 | Deactivate synthetic user, reuse existing token | Protected operation denied | Local DB/live SQL/live REST |
| AUTH-06 | Demote/deactivate own administrator | Rejected | Local DB and live SQL |
| AUTH-07 | Logout and reuse token | Protected operation denied, protected page redirects | Live REST; browser evidence separately |
| AUTH-08 | Anonymous SELECT/RPC | 401/403 | live-anonymous.json |
| AUTH-09 | Missing user row, inactive account, no session | Frontend fails closed | frontend.test.cjs |
| AUTH-10 | Register and verify email, duplicate email, recover password | Email arrives; valid link works; duplicate does not create account | Real inbox/service acceptance pending |
| AUTH-11 | SQL caller without matching auth session | Denied | database.test.cjs |

Use synthetic accounts only. `tests/live-rollback.sql` leaves no rows; it simulates JWT claims and does not
prove password authentication. Live API/browser scripts use real Auth tokens from separate test credentials.

## Stage 2.2 update, 2026-11-14

`tests/auth-flows.test.cjs` adds 11 mocked controller tests; together with the three existing frontend tests, 14 pass. Covers redirect arguments, validation/duplicate response, role routing, transport/logout/guard failures, recovery update versus sign-out errors and isolated admin cleanup. These do not prove mailbox delivery. Real E01-E08 procedures and evidence form: `email-auth-acceptance.md`. User will execute them; results pending.
