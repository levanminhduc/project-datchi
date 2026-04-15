## Context

The Issue V2 module handles thread issuance to departments against purchase orders. Each PO has style-color combinations, and each style-color has thread specs defining which thread types and colors are needed. The quota system calculates how many cones of each thread a department can receive based on weekly order confirmations and department product allocations.

Current state: Quota calculations in `server/routes/issuesV2.ts` and `server/utils/issue-v2-batch-quota.ts` treat all thread colors under the same thread type as interchangeable. This causes cross-contamination where issuing thread color C5393 counts against the quota for C9700, and department quotas are not bounded by the global limit.

There are two parallel code paths that must stay consistent:
1. **Single-item path** -- functions in `issuesV2.ts` used for individual line validation and the `getQuotaCones` endpoint
2. **Batch path** -- functions in `issue-v2-batch-*.ts` used by the form-data endpoint for loading all items at once

The batch path already partially handles thread_color_id via `compositeKey(threadTypeId, threadColorId)`, but the dept path in `batchGetQuotaCones` does not enforce the global cap.

## Goals / Non-Goals

**Goals:**
- Quota remaining for each thread_type+thread_color combination is calculated independently
- Department quota is always capped by global remaining (prevents over-issuance across departments)
- Both single-item and batch code paths produce identical results
- All issued-quantity queries filter by thread_color_id when available
- Base quota calculation sums all matching spec rows (not just the first)
- Zero API contract changes -- callers see same request/response shapes

**Non-Goals:**
- Frontend changes (all fixes are backend-only)
- Database schema changes
- Changing the batch path's `computeQuotaPerItem()` or `buildIssuedMap()` (already correct)
- Performance optimization of quota queries beyond adding `.limit()`
- Refactoring the dual single/batch architecture into a unified path

## Decisions

### D1: Add thread_color_id parameter to issued-quantity functions

The three issued-quantity functions (`getConfirmedIssuedEquivalent`, `getConfirmedIssuedEquivalentByDept`, `_getConfirmedIssuedGross`) will receive an optional `threadColorId?: number | null` parameter. When `threadColorId` is a number, the query adds `.eq('thread_color_id', threadColorId)`. When `threadColorId` is `null` (explicit null, meaning the line has no color), the query adds `.is('thread_color_id', null)`. When `threadColorId` is `undefined` (parameter not passed), no filter is added -- this preserves backward compatibility for any callers that don't have the color info.

**Alternative considered:** Making the parameter required. Rejected because existing callers in other code paths may not have color info available, and breaking them is unnecessary risk.

### D2: Global cap enforcement pattern in dept path

In `getQuotaCones()` dept branch (line 783+): after computing `deptRemaining = deptBaseQuota - deptIssuedNet`, additionally compute `globalRemaining` by calling the existing global path logic (base quota from weekly orders minus all-dept issued). Return `min(deptRemaining, globalRemaining)`.

For `batchGetQuotaCones()` dept branch (line 195+): similarly fetch global issued (all departments, not just current) and global base quota, then clamp each item's dept remaining by its global remaining.

**Alternative considered:** Creating a separate `getGlobalRemaining()` helper. Accepted partially -- the global path already exists as the non-dept branch of `getQuotaCones()`. For single-item, we reuse existing functions. For batch, we add a parallel all-dept issued query.

### D3: Fix _getBaseQuotaCones() spec aggregation

Replace `.find()` at line 745 with `.filter()` to get all matching spec rows, then `.reduce()` to sum their `meters_per_unit`. The filter must match both `style_id` (via nested `style_thread_specs`) and `thread_color_id` (when provided).

This aligns the single-item path with the batch path's `computeQuotaPerItem()` which already uses filter+reduce.

### D4: batchLookupThreadColorIds -- return all colors + align callers

Two separate caller groups need distinct fixes:
1. **Batch lookup callers** (`batchLookupThreadColorIds`): The actual consumer is the `GET /api/issues/v2/:id` enrichment path (~line 3028 in issuesV2.ts), which uses batch lookup to resolve thread_color_ids for display. Update the function to return `Map<string, number[]>` (array of all matching colors) instead of `Map<string, number | undefined>` (first-wins). Update this caller to handle the new array return type.
2. **Single-item lookup callers** (`lookupThreadColorId`): The validate-line, add-line, create-with-line paths use single-item lookup. These callers already receive `thread_color_id` from the frontend request body. Fix: use `!== undefined` check (not `??`) to prefer explicit value (including explicit `null`) over lookup fallback.

### D5: Add thread_color_id to _getBaseQuotaCones() signature

`_getBaseQuotaCones()` currently has no thread_color_id parameter. Add `threadColorId?: number | null` and apply the same filter logic as the spec filter in `getQuotaCones()`. This ensures the standalone function is consistent with the inline code in the dept branch.

## Risks / Trade-offs

[Risk: Global cap queries add latency to dept path] -- Mitigation: The dept path now requires one additional query (global issued across all depts). This is acceptable because these are already multi-query functions, and correctness outweighs the ~50ms additional latency.

[Risk: Changing batchLookupThreadColorIds return type breaks callers] -- Mitigation: All callers will be updated in the same change. The function is only used within `issue-v2-batch-lookups.ts` and its direct importers. Grep for all usages before implementing.

[Risk: Null vs undefined semantics for thread_color_id] -- Mitigation: Use explicit convention: `null` means "line explicitly has no color" (filter with `.is(null)`), `undefined` means "caller doesn't know" (no filter). **Operationalization at call sites:** callers that receive `thread_color_id` from request body MUST check `!== undefined` (not `??`) to distinguish explicit `null` from absent. Pattern: `const tcId = row.thread_color_id !== undefined ? row.thread_color_id : lookupResult`. Using `??` would incorrectly treat explicit `null` as "absent" and trigger lookup fallback.

[Risk: Regression in existing correct paths] -- Mitigation: The batch path functions (`computeQuotaPerItem`, `buildIssuedMap`, `computeStockFromData`) are verified correct and will not be modified. Only the dept-global-cap and single-item functions change.

[Risk: Global cap null/edge-case propagation] -- When global base quota is `null` (no confirmed order weeks, no matching specs, or zero meters_per_cone), the dept-global-cap logic MUST propagate `null` through: if `globalRemaining` is `null`, dept remaining also becomes `null` (cannot compute quota). Edge cases: (1) zero ordered qty → globalRemaining=null → dept=null, (2) no spec match → globalRemaining=null → dept=null, (3) global has quota but dept has no allocation → use existing unallocated-remainder path unchanged. Both single-item and batch paths MUST handle these identically.
