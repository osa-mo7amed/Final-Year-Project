# Stage 2.2: email and authentication acceptance

2026-11-14, Asia/Kuala_Lumpur. Independent controller checks complete; **real email acceptance remains pending**.
No test emails, mailbox reads, hosted account mutations or real password changes were performed in this checkpoint.

## Changes and actual checks

- Registration now passes an explicit same-origin `profile.html` confirmation destination. Previously it relied on the backend Site URL. The allowed redirect configuration and actual mail click still need validation.
- Login refuses unknown roles and non-Active account states instead of treating them as a student route.
- Logout handles both returned SDK errors and thrown failures; it does not redirect as though sign-out succeeded.
- Protected-route initialization returns null and redirects on thrown session/profile request failures.
- Password recovery distinguishes password-update success from sign-out failure. It warns that a session may remain active rather than implying successful sign-out.
- Isolated administrator signup cleanup always restores its submit control, even if session inspection or sign-out fails. Main admin session is not used for the created user's signup.

`node --test tests/auth-flows.test.cjs tests/frontend.test.cjs`: **14 passed, 0 failed** (11 new controller regression tests + 3 existing frontend tests). Node v24.22.1, VM with mocked SDK/DOM. No browser rendering, provider verification, email delivery, database or real user study is implied. An initial new-test syntax error was corrected before the passing run. The old 14-test result in `evidence/local-tests.txt` is a different, historical suite; do not add these counts as unique independent cases.

Evidence: `evidence/academic-stage2-auth-checks.json`. The source hashes identify this checkpoint. Old live browser evidence predates these controller edits; repeat affected real journeys when the mailbox is available. No schema/security policy changes were made.

Current documentation consulted: [Supabase signUp](https://supabase.com/docs/reference/javascript/auth-signup), [password recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), and [changelog](https://supabase.com/changelog.md). The browser SDK remains pinned at 2.57.4; no SDK upgrade was performed. The recent listed breaking changes for Flutter/CLI do not change this vanilla-JavaScript patch.

## Safe setup for the remaining manual tests

1. Use a dedicated inbox you control and two unused test addresses/aliases (student and admin-created recipient). Do not use a real user's account. Use a separate test project if available; record project ID/origin privately and only a non-secret environment label in public evidence.
2. Start `node scripts/serve.cjs` and keep it running. Use `http://127.0.0.1:8080/frontend/pages/register.html`. Opening links on another device resolves loopback on that device, so complete this local test on the same computer. Avoid mixing localhost and 127.0.0.1 origins.
3. In the intended project's Auth configuration, verify email confirmations are enabled, signup enabled, mail transport usable, and the exact callback URLs allowed: `http://127.0.0.1:8080/frontend/pages/profile.html` and `http://127.0.0.1:8080/frontend/pages/reset-password.html`. Record actual settings/date without keys. If changes are needed, the owner should make them deliberately; no settings were changed here.
4. Use clean browser profiles/contexts for student, administrator and link-reuse/expiry tests. Keep original emails private. Never save access tokens, complete callback URLs/fragments, passwords, inbox addresses, service keys or unredacted Network exports in evidence.
5. Assign codes such as EMAIL-STUDENT-01 and EMAIL-CREATED-01. Record timestamps in Malaysia time and redacted screenshots showing the resulting page/feedback, with address bar query/fragment hidden. Save evidence outside tracked files until redacted.

## Execute and record (all rows currently NOT RUN)

| ID | Exact action | Expected result / evidence |
|---|---|---|
| E01 registration and unverified access | Register the student test address with valid inputs. Before clicking the email, try signing in and opening dashboard in a clean context. Then inspect inbox/spam. Record request/arrival times. | Before verification, no protected access; email actually received. Success feedback alone is not delivery. Record any rate-limit/transport failure rather than repeating rapidly. |
| E02 verification destination | Open the latest signup link on the same computer while server is running. Record sanitized destination path, confirmation outcome, and whether profile/dashboard is accessible afterward. | Valid link establishes confirmed access and reaches configured app origin. If sent to another Site URL or an error page, fail the redirect case. Do not save link tokens. |
| E03 duplicate and invalid signup | With the verified dedicated address, attempt signup again; separately try mismatched passwords, short password, malformed email and invalid name/field. | Invalid client inputs rejected; no second account. Duplicate provider response may mask account existence; record actual message rather than inferring creation. Confirm account count/identity only for the dedicated address in owner UI. |
| E04 recovery request | Sign out of student. Enter dedicated email on login page, click Forgot password once; inspect inbox and record arrival time. | Neutral request feedback, actual reset email. No arrival means pending/failure, not pass. Network-off request should show retry feedback and must be recorded separately. |
| E05 password reset | Open newest reset link in a clean context. Try mismatched/short values first; then a valid different password. Record update and sign-out feedback. | Invalid values blocked; valid change succeeds. If sign-out fails, record partial success and follow warning; do not claim token revocation. In fresh contexts, old password fails and new password signs in. Never record either password. |
| E06 invalid/reused/expired links | Open a used link in a fresh context with no session. For expiry, request a separate link, record configured expiry and wait past it without changing shared production settings. Open it once after expiry. Also visit reset page directly with no session. | Invalid/expired link cannot create a new valid recovery session; unauthenticated direct reset cannot change password. Existing signed-in sessions can legitimately change their own password, so they invalidate this test's isolation. Record expiry duration and actual outcome; if expiry not observed, leave pending. |
| E07 admin-created account | In dedicated authorized admin context, create the second ordinary Student/Graduate test address. Verify the admin remains signed in as admin. In separate recipient context receive/click email and sign in. | Actual recipient delivery/verification; normal role only at creation; admin session preserved. Test promotion/deactivation only on dedicated fixtures and only if explicitly included in approved test scope. |
| E08 login/logout failures | Try wrong password for dedicated student. Sign in correctly, switch browser offline and attempt logout; restore network and retry logout. Revisit protected page after successful logout. | Generic credential error. Failed logout must not claim success; successful retry redirects and protected route denies access. Record browser page errors; do not equate offline UI behavior with backend revocation. |

For E03/E08, registration/login service returned errors and thrown errors are different cases; the controller tests cover selected mocked cases only. Mailbox checks are not a complete fault-injection matrix.

## Evidence form (copy once per case)

```text
Case ID:
Status: NOT RUN / PASS / FAIL / BLOCKED / PARTIAL
Run timestamp and timezone:
Tester code:
Environment label / app origin:
Browser version / device:
Dedicated account code (no address):
Preconditions (confirmed? signed out? fresh browser context?):
Steps actually executed:
Expected result:
Observed result:
Mail requested / received timestamps (if applicable):
Configured link expiry and time tested (if applicable):
Redacted screenshot/log paths:
Defect or blocker:
Cleanup performed / remaining synthetic fixtures:
```

Do not fill PASS from these instructions. Retain failed cases and retest records. Track only test-created IDs for cleanup; do not delete or deactivate real users. Mailbox designation and results can be supplied later without blocking independent Stage 2.3 work.
