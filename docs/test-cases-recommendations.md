# Recommendation, search and application cases

| Case | Action | Expected | Evidence |
|---|---|---|---|
| REC-01 | Compare same job in dashboard/search/analysis | Same score and underlying explanation | Shared endpoint, DB tests, live browser evidence |
| REC-02 | Required/preferred, empty fields/lists, literal regex characters in interests | Documented formula/edge behavior | database.test.cjs |
| REC-03 | Equal scores/deadlines | Stable ascending job ID | database.test.cjs |
| REC-04 | Expired or Closed jobs | Excluded from student search/recommendations and application inserts | database.test.cjs |
| REC-05 | RPC failure versus valid empty result | Explicit failure versus empty state, no silent fallback | frontend.test.cjs and mock browser outage |
| REC-06 | Keyword plus type/location/industry/required-skill filters | AND across filter groups; all selected required skills present | Mock browser combined keyword/industry/location/type and required-skill checks passed |
| REC-07 | No-results query then reset | Empty state then all eligible rows | Mock browser |
| REC-08 | Job details/skill guidance | Correct matched/missing required/preferred categories | Mock UI plus live browser evidence |
| APP-01 | Apply then repeat | One row only, duplicate feedback | DB suite/live browser |
| APP-02 | Apply for another user or expired job | Rejected | DB suite |
| JOB-01 | Fail job skill write | Parent and old skills preserved | DB suite |
| JOB-02 | Archive job with applications | Closed, application history retained | DB suite/live browser |

Seed postings are demonstrations. Applications stay inside InternMatch; no employer workflow is implemented.
