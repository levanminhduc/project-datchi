## 0. Database - Update Check Constraint

- [ ] 0.0 Create and verify database backup before any changes (required for safe rollback) [MANUAL - user must do before deploy]
- [x] 0.1 Create migration to drop `chk_issue_lines_returned_not_exceed_issued` constraint
- [x] 0.2 Add new constraint with total-based validation: `returned_full <= issued_full AND (returned_full + returned_partial) <= (issued_full + issued_partial)` ← (verify: migration runs successfully, new constraint allows cross-type returns)

## 1. Backend - Update Validation Logic

- [x] 1.1 Update validation in `POST /api/issues/v2/:id/return` to use new formula: `returned_full <= issued_full` AND `(returned_full + returned_partial) <= (issued_full + issued_partial)`
- [x] 1.2 Update error messages to reflect new validation rules (Vietnamese)
- [x] 1.3 Update `allReturned` completion logic to use total-based check: `(returned_full + returned_partial) >= (issued_full + issued_partial)` instead of per-type comparison ← (verify: issue correctly transitions to RETURNED status after cross-type return)

## 2. Backend - Update addStock() Function

- [x] 2.1 Refactor `addStock()` to accept partial return quantity and handle conversion logic
- [x] 2.2 Implement priority sourcing: first find partial cones HARD_ALLOCATED, then convert full cones if needed
- [x] 2.3 When converting full to partial: update `is_partial=true` and calculate `quantity_meters = meters_per_cone * partial_cone_ratio`
- [x] 2.4 Add helper to fetch `meters_per_cone` from `thread_types` table for the conversion calculation ← (verify: addStock correctly converts full cones to partial with proper quantity_meters calculation)

## 3. Frontend - Update Validation and UI

- [x] 3.1 Update `validateReturnQuantities()` in `useReturnV2.ts` to use new validation formula
- [x] 3.2 Update validation error messages to match new rules (Vietnamese)
- [x] 3.3 Update `getMaxReturnPartial()` in `return.vue` to allow partial returns up to total remaining (not just issued_partial)
- [x] 3.4 Update partial input field `:disable` condition to allow input when total remaining > 0
- [x] 3.5 Update `hasOutstandingItems()` to use total-based check ← (verify: frontend validation matches backend rules, allows valid cross-type returns, UI enables partial input for lines with issued_partial=0)

## 4. Testing

- [ ] 4.1 Test scenario: return more partial than issued partial (should succeed)
- [ ] 4.2 Test scenario: return exceeding total issued (should fail)
- [ ] 4.3 Test scenario: return more full than issued full (should fail)
- [ ] 4.4 Verify converted cones have correct `is_partial=true` and `quantity_meters` values in database
- [ ] 4.5 Test full-only return: verify `is_partial` remains `false` and `quantity_meters` unchanged
- [ ] 4.6 Test multi-step return: verify cumulative validation across multiple return submissions
- [ ] 4.7 Test completion: verify issue transitions to RETURNED after total is fully returned ← (verify: all spec scenarios pass, inventory data is correct, completion status works correctly)
