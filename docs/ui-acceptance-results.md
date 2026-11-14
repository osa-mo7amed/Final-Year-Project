# Stage 2.3.1: isolated search and keyboard acceptance

2026-11-14. **Checkpoint 2.3.1 complete; Stage 2.3 and Stage 2 remain incomplete.**

## Final observed result

Chrome 157.0.8103.51, headless Windows, 1440x900 and 390x900 viewports: **22 checks passed, 0 failed**
(11 checks repeated at two widths). Edge launch was attempted and failed with target/context/browser closed;
no Edge application pass is claimed. Firefox, Safari and physical devices were not tested.

Final raw results, source hashes and four screenshots:
[ui-acceptance-2026-11-14T10-33-41-169Z/results.json](evidence/ui-acceptance-2026-11-14T10-33-41-169Z/results.json).

This is synthetic UI integration evidence. Four explicitly synthetic jobs include equal scores, different
industries/locations/types, and a preferred-only skill to distinguish it from required-skill filtering.
Scores are supplied fixture values, not a recommendation accuracy measurement. Repository files were
fulfilled directly through Playwright routing because loopback HTTP navigation was denied in this environment.
The Supabase SDK was replaced by a mock; all other external requests were blocked, including Google Fonts.
Screenshots therefore use available fallback fonts. No live backend, email, account or posting was changed.
The script starts/stops a loopback server, but its successful run does not exercise server delivery.

## Executed checks at each width

1. Combined keyword, industry, location, placement and required-skills AND filtering returns the expected single job; a preferred skill does not satisfy a required-skill filter.
2. Reset restores all four jobs and preserves the supplied equal-score order. This is not a database tie-break test.
3. Company search combined with placement/location selects the expected different job.
4. Enter submits keyboard search; no-results Reset restores the corpus.
5. Both filter select elements have associated accessible labels.
6. Search document has no horizontal page overflow at the tested width.
7. Failed recommendation request remains Unavailable after Reset; stale results cannot masquerade as fresh results.
8. Retry restores listings and clears the stale alert after the mocked service recovers.
9. Dashboard dialog opens by keyboard, wraps forward Tab, closes on Escape and returns focus to its trigger.
10. Dashboard alert exposes a polite live region (attribute check, not a screen-reader study).
11. No uncaught page errors in these search/dashboard journeys.

The final search screenshots were inspected at both widths. Authored visual direction was preserved.
The mobile navigation is horizontally constrained; complete navigation reachability, zoom/reflow and
screen-reader/contrast testing still belong to the wider accessibility review. Passing no-overflow is not
proof that every control is reachable or accessible.

## Defects and retained attempts

| Finding | Fix / outcome |
|---|---|
| Industry and location selects had visual headings but no associated labels | Converted headings to explicit labels, retaining appearance; tests now find accessible names |
| After a failed refresh, Reset re-rendered cached jobs and replaced Unavailable with a successful count | Track successful loading, clear cached jobs on failure and prevent filters from replacing the failure state |
| Failed loading offered no in-page recovery | Added Retry loading listings; successful retry clears the previous error |
| Initial direct loopback navigation denied | Test harness delivers local files through Playwright routing; limitation explicitly retained |
| Smooth scrolling distorted early full-page screenshots | Harness now scrolls instantly to top before capture; no application CSS changed |

Retained evidence folders (never substituted for one another):

- `ui-acceptance-2026-11-14T10-31-22-193Z`: loopback access denied, zero executed checks; not a pass.
- `ui-acceptance-2026-11-14T10-31-38-086Z`: 16 pass / 4 fail, showing both original defects at both widths.
- `ui-acceptance-2026-11-14T10-32-18-247Z`: 22 pass; screenshot review exposed temporarily stale error message after recovery.
- `ui-acceptance-2026-11-14T10-33-00-705Z`: 22 pass after stale-error clearing; smooth-scroll capture issue remained.
- `ui-acceptance-2026-11-14T10-33-41-169Z`: final 22 pass, capture positioning corrected.

JavaScript syntax and `git diff --check` passed. Existing database and auth suites were not rerun for this
search/HTML-only application change; prior artifacts remain historical. No timing in these mocked runs
establishes PR-3/PR-4 or concurrent reliability.

## Reproduce

```powershell
$env:PLAYWRIGHT_MODULE='C:\Users\osaal\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
node tests/ui-acceptance.cjs
```

Every run writes a timestamped evidence directory; no historical report/screenshots are overwritten.
`tests/browser-fixtures.cjs` is an explicit mock helper derived from the existing browser harness.
Its responses are not used by production pages outside the test.

## Next checkpoint: 2.3.2

Continue profile/job validation and failed-save/retry checks using isolated fixtures; broaden accessibility
(reverse Tab, background interaction, zoom/reflow, full labels/contrast and keyboard navigation); investigate
the Edge startup failure and available browser environments. Predeclare acknowledgement and bounded-load
conditions before measuring; do not report mocked timing as hosted performance. Real-device/Safari checks
and live infrastructure-dependent measurements may need explicit manual evidence forms. Ingest manual
email E01-E08 outcomes if provided. Stop before Stage 3 and update both continuity files.
