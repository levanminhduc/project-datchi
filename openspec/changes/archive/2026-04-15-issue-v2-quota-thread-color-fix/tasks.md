## 1. Fix issued-quantity queries -- add thread_color_id filter + .limit()

- [x] 1.1 In `server/routes/issuesV2.ts`, add `threadColorId?: number | null` parameter to `getConfirmedIssuedEquivalent()` (line 576). Add conditional filter: when number use `.eq('thread_color_id', threadColorId)`, when null use `.is('thread_color_id', null)`, when undefined skip. Add `.limit(10000)` to the query.
- [x] 1.2 In `server/routes/issuesV2.ts`, add `threadColorId?: number | null` parameter to `getConfirmedIssuedEquivalentByDept()` (line 622). Apply same conditional filter logic and add `.limit(10000)`.
- [x] 1.3 In `server/routes/issuesV2.ts`, add `threadColorId?: number | null` parameter to `_getConfirmedIssuedGross()` (line 683). Apply same conditional filter logic and add `.limit(10000)`. <- (verify: all three functions have consistent thread_color_id filter logic; null vs undefined semantics are correct; .limit(10000) present on all queries)

## 2. Fix _getBaseQuotaCones() -- sum all matching specs + thread_color_id filter

- [x] 2.1 In `server/routes/issuesV2.ts`, add `threadColorId?: number | null` parameter to `_getBaseQuotaCones()` (line 717). Replace `.find()` at line 745 with `.filter()` using the same specFilter pattern from `getQuotaCones()`: match `style_id` AND `thread_color_id` when provided. Use `.reduce()` to sum `meters_per_unit` across all matching specs. <- (verify: .find() is replaced with .filter()+.reduce(); specFilter matches thread_color_id correctly; single spec row and multi-spec-row cases both work)

## 3. Fix getQuotaCones() -- pass thread_color_id to sub-calls + enforce global cap in dept path

- [x] 3.1 In `server/routes/issuesV2.ts` `getQuotaCones()` (line 764), update the dept branch (line 783+) to pass `threadColorId` to `getConfirmedIssuedEquivalentByDept()` call at line 813.
- [x] 3.2 In the same dept branch, after computing `deptRemaining` (line 816), compute `globalRemaining` by calling the global-path logic: get global base quota via `_getBaseQuotaCones(poId, styleId, colorId, threadTypeId, threadColorId)` and global issued via `getConfirmedIssuedEquivalent(poId, styleId, colorId, threadTypeId, ratio, threadColorId)`. Return `min(deptRemaining, max(0, globalBaseQuota - globalIssued))`. **Edge case:** if `globalBaseQuota` is null (no confirmed weeks / no spec), return null (same as global path behavior).
- [x] 3.3 In the global branch of `getQuotaCones()` (line 820+), pass `threadColorId` to `getConfirmedIssuedEquivalent()` call. Ensure the specFilter at line 779-781 is also used consistently for the global branch (already uses `threadColorId` via closure). <- (verify: dept path returns min(dept, global); all sub-calls receive threadColorId; global path also filters by threadColorId; null global quota propagates correctly; PO 9013332 scenario: DK01 C9700 remaining = 0, DK01 C5393 remaining = 1)

## 4. Fix batchGetQuotaCones() -- enforce global cap in dept-allocation path

- [x] 4.1 In `server/utils/issue-v2-batch-quota.ts` `batchGetQuotaCones()` (line 183), in the dept-allocation branch (line 195-214): add a parallel query to fetch global issued across ALL departments (remove `.eq('thread_issues.department', department)` filter in a separate query). Build a global issued map.
- [x] 4.2 Fetch global base quota (total ordered quantity from confirmed weeks) in the same parallel batch. Compute `globalRemaining` per item using the same formula as `computeQuotaPerItem` but with global ordered qty and global issued. **Edge case:** if global base quota returns null for an item, that item's final result is also null.
- [x] 4.3 Clamp each item's dept remaining by its global remaining: `min(deptRemaining, globalRemaining)`. <- (verify: batchGetQuotaCones dept path now caps by global; results match getQuotaCones single-item path for same inputs; compositeKey usage is consistent; null propagation matches single-item path)

## 5. Fix batchLookupThreadColorIds() -- return all matching colors

- [x] 5.1 In `server/utils/issue-v2-batch-lookups.ts`, change `batchLookupThreadColorIds()` return type from `Map<string, number | undefined>` to `Map<string, number[]>`. Update the loop to push all `thread_color_id` values per key instead of first-wins.
- [x] 5.2 Update all callers of `batchLookupThreadColorIds()` to handle the new `number[]` return type. **Actual callers** (grep for imports): primarily `GET /api/issues/v2/:id` enrichment path (~line 3028 in issuesV2.ts) and any form-data usage. Each caller must be checked individually for how it uses the result. <- (verify: grep for all usages of batchLookupThreadColorIds across entire server/; every caller handles number[] correctly)

## 6. Update single-item callers in issuesV2.ts to pass threadColorId

- [x] 6.1 In `server/routes/issuesV2.ts`, find all call sites of `getConfirmedIssuedEquivalent`, `getConfirmedIssuedEquivalentByDept`, `_getConfirmedIssuedGross`, and `_getBaseQuotaCones`. Pass the available `threadColorId` parameter to each call. **NOTE:** These are single-item path functions, distinct from batch functions in task 5.
- [x] 6.2 In single-item `lookupThreadColorId()` callers (validate-line, add-line, create-with-line), ensure the explicitly provided `thread_color_id` from the request body is preferred over the lookup result. **Use `!== undefined` check** (not `??`) to preserve explicit `null` semantics: `const tcId = row.thread_color_id !== undefined ? row.thread_color_id : lookupResult`. <- (verify: no call site of the modified functions omits threadColorId when it is available; `??` is not used where null must be preserved; type-check passes with `npm run type-check`)

## 7. Validation

- [x] 7.1 Run `npm run type-check` to verify no TypeScript errors across the codebase.
- [x] 7.2 Run `npm run lint` to verify no linting errors.
- [ ] 7.3 Manual data verification: query PO 9013332 / Style 6902 / BLACK 04 via psql to verify: (a) global quota C9700 = 403, (b) global issued C9700 = 403 → remaining = 0, (c) DK01 C9700 remaining = 0 (capped by global), (d) DK01 C5393 remaining = 1. Compare single-item (`getQuotaCones`) and batch (`batchGetQuotaCones`) results for same inputs to confirm parity. <- (verify: type-check and lint pass; real data verification confirms correct quota; single-item and batch paths produce identical results)
