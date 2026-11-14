# Setup and deployment

## Runtime and configuration

Node.js 22+ runs the local static server and tests. pnpm installs the pinned PGlite development dependency;
`pnpm-lock.yaml` records exact resolution. Browser Supabase SDK is pinned to 2.57.4 from jsDelivr.
Internet access is required for that SDK and the connected backend. No privileged key is shipped.
Use `node scripts/serve.cjs`, then open `http://127.0.0.1:8080`. Do not open pages through file://.

`frontend/js/supabase-config.js` contains the project URL and public anon key. Replace both for another
environment. RLS and RPC authorization protect data; hiding the public key is not a security control.
Set Auth Site URL and allowed redirect URLs to the intended origin, including
`http://127.0.0.1:8080/frontend/pages/profile.html` and `.../reset-password.html` for local development.
Enable email confirmations and configure mail delivery. Verify registration and recovery in a real inbox.
No new public deployment was published during this work.

## Fresh database

Use a new Supabase project. Do not run the fresh setup against an existing database.
Run `node scripts/build-db.cjs`, then execute `db/000_run_all.sql` in its SQL editor.
It is an atomic transaction generated from 001, 002, 003, 005, 006 and 007 in that order.
The guidance table is created by 005. RLS is enabled before grants are issued. Job seeds are excluded.
Do not execute isolated early setup files and expose that partial database.

Create a verified ordinary account first. As the project owner, explicitly promote the chosen ID:

```sql
update public.users set role = 'Admin' where id = '<verified-owner-user-id>';
```

Use only the intended account ID. Metadata is not authoritative. New signups can become Student or Graduate,
never Admin. Administrators can create ordinary accounts in Manage Users without replacing their own session;
email verification still applies. Role promotion is a separate explicit admin action.

## Existing environment

The upgrade file is `supabase/migrations/20261112223800_secure_consistent_internmatch.sql`.
It combines 006 and 007, replaces old policies/functions/grants, and does not delete user/job/application data.
Apply it transactionally with the Supabase migration tool. Bootstrap an initial administrator in the same
transaction if the old environment has only metadata-based administrators.
The connected deployment included the user-authorized administrator bootstrap; no account ID is hardcoded
in the reusable migration. The hosted migration history may use its own application timestamp.

Only `db/007_security_and_writes.sql` defines final grants and policies. 002 is a deny-by-default bootstrap.
`node scripts/build-db.cjs` regenerates setup/upgrade files after source changes. Review generated differences;
do not amend an already-applied migration to deploy a new change: generate a new migration instead.

## Seed data and demo

`db/004_seed_jobs.sql` is optional demonstration data, not verified current vacancies. It contains dates
that may expire. Do not rerun it on the connected project or extend real job deadlines just to populate a demo.
Create explicitly named synthetic postings through Manage Jobs with future deadlines for demonstrations.
Closed/expired jobs are excluded from recommendations and student searches. Existing applications survive archival.

## Backup and operational requirements

`scripts/backup.ps1` uses pg_dump with an owner-supplied `INTERNMATCH_DATABASE_URL` and writes an ignored
custom-format dump under `backups/`. Install PostgreSQL client tools before using it. Keep the connection
string private. Store backups in protected storage outside the repository. Configure an operational backup
schedule in the hosting environment and test restoration into an isolated database. This run did not obtain
database credentials, create a backup, verify a restore or establish an uptime guarantee.

The Supabase advisor still reports leaked-password protection disabled. Review the project's supported Auth
settings and enable it where available: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
The authenticated SECURITY DEFINER advisory covers five intentional, guarded entry points; each has an empty
search path and explicit active-account/admin checks. Anonymous EXECUTE was revoked. Review these checks whenever
changing RPCs: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

## Repeat the dedicated live tests

Use a test project where possible. These steps provision and remove only generated reserved-domain accounts:

1. Run `node tests/live-auth.cjs prepare`. It writes credentials and scoped SQL fixtures to ignored `tmp/`.
2. Inspect and execute `tmp/live-fixture-setup.sql` through the correct project's privileged SQL editor.
   This is test provisioning only, not the application signup implementation. No emails are sent.
3. Run `node tests/live-auth.cjs check`. It intentionally deactivates the synthetic student.
4. Execute `tmp/live-fixture-reset.sql`, then run `node tests/live-browser.cjs` with Playwright available.
5. Execute the exact generated `tmp/live-fixture-cleanup.sql`; verify that only the generated fixtures were
   removed. Delete the temporary credential/SQL files afterward. Never substitute real account IDs.

The live browser test uses port 8082 and creates clearly labelled synthetic jobs. Interrupted attempts may
leave fixtures until cleanup. The recorded run's fixtures were cleaned up and its credentials removed.
