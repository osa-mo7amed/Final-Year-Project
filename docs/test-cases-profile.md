# Profile cases

See `test-results.md` for actual runs. No historical verification claim is carried forward without evidence.

| Case | Action | Expected | Evidence |
|---|---|---|---|
| PROF-01 | Save fields and skill IDs | Persist together after reload | DB suite; browser evidence |
| PROF-02 | Submit nonexistent skill ID | Entire save rolls back, existing skills remain | Local DB and live SQL |
| PROF-03 | Save CGPA 0 or 4 | Valid; completeness includes CGPA points | DB suite and live browser case |
| PROF-04 | Save CGPA outside 0–4 | Rejected, no partial write | Schema constraint; negative UI acceptance to record |
| PROF-05 | Compare UI completeness with DB across 0–4 tech / 0–3 soft skills | Identical values | 20 combinations in database.test.cjs |
| PROF-06 | User attempts direct/cross-user writes | Denied | DB suite |
| PROF-07 | Profile/skill load fails | Error shown, save disabled to prevent wiping unseen skills | Implementation; fault-injection acceptance pending |

Completeness is supplied-data coverage, not certified ability. Draft profiles allow empty academic fields;
this is a documented relaxation of the FYP1 missing-required-field alternative scenario. Null year of study
stays unspecified instead of silently defaulting to fourth year.
