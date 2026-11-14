# InternMatch FYP2

Student/graduate internship and entry-level job matching with explainable compatibility scores.
Vanilla HTML/CSS/JavaScript, Supabase Auth, PostgREST and PostgreSQL. No build step or Edge Functions.

## Run

Requires Node.js 22+ and pnpm. From this directory:

```powershell
pnpm install --frozen-lockfile
node scripts/serve.cjs
```

Open http://127.0.0.1:8080. The server binds only to loopback and serves frontend/evaluation assets.
Frontend configuration is in `frontend/js/supabase-config.js`; the public anon key is intentionally public.
Never put database passwords or service-role keys there.

```powershell
node --test tests/*.test.cjs
node evaluation/benchmark_accuracy.js
node tests/live-anonymous.cjs
```

Browser testing requires Playwright and Microsoft Edge. Set `PLAYWRIGHT_MODULE` to an installed
Playwright module path when it is not on Node's module path, then run `node tests/browser-check.cjs`.
The browser script starts its own loopback server on port 8081 and uses synthetic mocked API responses.

## Project status

Security and scoring migration applied to connected project `uszwimitxmzqwtqlugxx` on 2026-11-13.
The owner-selected initial administrator was promoted explicitly; existing accounts/jobs were preserved.
Local database tests, live rollback SQL tests, anonymous HTTP tests and mocked browser checks have evidence.
Core authenticated browser journeys and 20 end-to-end recommendation timings passed. Email delivery, backup restoration,
independent relevance judging and participant usability studies remain pending.

Start with [setup](docs/setup-and-deployment.md), [demonstration](docs/demo-script.md),
[test evidence](docs/test-results.md), [requirements](docs/traceability-matrix.md),
[report material](docs/report-addendum.md), [evaluation](docs/evaluation-guide.md),
and [remaining work](docs/completion-checklist.md).
