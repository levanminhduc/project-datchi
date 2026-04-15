## Why

The Issue V2 quota calculation system has 6 critical bugs that cause departments to see incorrect remaining quota. The root cause is that quota calculations do not properly separate by `thread_color_id`, and department-level quota is not capped by the global limit. Real data shows PO 9013332 allowing 159 excess cones to be issued when it should allow 0. These bugs directly cause material over-issuance, a serious business impact.

## What Changes

- **Fix dept quota global cap (CRITICAL-1+2):** Both `getQuotaCones()` and `batchGetQuotaCones()` dept paths return `dept_allocation_based - dept_issued` without checking global remaining. Add: `min(deptRemaining, globalRemaining)` where `globalRemaining = globalBaseQuota - globalIssuedAllDepts`.
- **Fix issued queries missing thread_color_id filter (CRITICAL-3+4):** `getConfirmedIssuedEquivalent()`, `getConfirmedIssuedEquivalentByDept()`, and `_getConfirmedIssuedGross()` query `thread_issue_lines` by `thread_type_id` only. Add `thread_color_id` filter parameter: when not null use `.eq()`, when null use `.is()`.
- **Fix _getBaseQuotaCones() .find() bug (CRITICAL-5):** Uses `.find()` which returns only the first matching spec row. Replace with `.filter()` + `.reduce()` to sum `meters_per_unit` across all matching specs. Also add `thread_color_id` matching to the spec filter.
- **Fix batchLookupThreadColorIds() first-wins ambiguity (CRITICAL-6):** When multiple thread_color_id values exist for the same thread_type+style_color combination, only the first is kept. Fix: update return type to `number[]` (all colors). Actual consumer is `GET /api/issues/v2/:id` enrichment path. Separately, single-item `lookupThreadColorId()` callers (validate-line, add-line, create-with-line) must use `!== undefined` check to preserve explicit `null` from frontend, not fall back to lookup.
- **Add missing .limit() on issued queries (WARNING-8):** Add `.limit(10000)` to all Supabase `.select()` calls that return multiple rows in the affected functions.

## Capabilities

### New Capabilities

- `issue-v2-quota-color-isolation`: Quota calculation correctly isolates by thread_color_id across all issued/base-quota/remaining functions, and dept quota is capped by global limit.

### Modified Capabilities

(none -- no existing spec-level requirements are changing, this is a bug fix to match existing business rules)

## Impact

- **Backend only** -- 3 files modified, no frontend or database changes
- `server/routes/issuesV2.ts` -- 5 functions: `getQuotaCones`, `getConfirmedIssuedEquivalent`, `getConfirmedIssuedEquivalentByDept`, `_getBaseQuotaCones`, `_getConfirmedIssuedGross`
- `server/utils/issue-v2-batch-quota.ts` -- `batchGetQuotaCones` dept path: add global cap
- `server/utils/issue-v2-batch-lookups.ts` -- `batchLookupThreadColorIds`: handle multiple colors per key
- No API contract changes (same request/response shapes)
- No database schema changes
- Risk: quota calculations affect all Issue V2 operations (create, validate, form-data). Thorough testing with real PO data required.
