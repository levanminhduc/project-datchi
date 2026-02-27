## 1. Refactor Validation Logic

- [x] 1.1 Extract validation logic into separate function `validateReturnQuantities` in `issuesV2.ts`
- [x] 1.2 Implement quantity-based validation: check `returned_full <= issued_full - already_returned_full`
- [x] 1.3 Implement total validation: check `total_returned <= total_issued` ← (verify: validation rejects when exceeding limits)

## 2. Refactor PREFLIGHT to Best-Effort Inventory Lookup

- [x] 2.1 Create helper function `tryFindHardAllocatedCones(threadTypeId, count, isPartial)` that returns found cones or empty array
- [x] 2.2 Replace strict PREFLIGHT logic with best-effort lookup - continue even when cones not found
- [x] 2.3 Add warning log when HARD_ALLOCATED cones not found: include thread_type_id, issue_id, line_id, requested vs found ← (verify: warning logged when fallback used)

## 3. Refactor EXECUTE to Handle Missing Cones

- [x] 3.1 Modify inventory update to only process cones that were found (skip if empty)
- [x] 3.2 Remove convert-full-to-partial logic (simplify flow)
- [x] 3.3 Ensure counter updates always run regardless of inventory update result ← (verify: counters updated even when no HARD_ALLOCATED cones)

## 4. Test Scenarios

- [x] 4.1 Test return with HARD_ALLOCATED cones present (ideal path)
- [x] 4.2 Test return with no HARD_ALLOCATED cones (fallback path)
- [x] 4.3 Test simultaneous full + partial return
- [x] 4.4 Test return exceeding limits (should fail validation) ← (verify: all scenarios pass per spec)
