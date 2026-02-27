## Why

The current Return V2 flow (`POST /api/issues/v2/:id/return`) validates that `returned_partial <= issued_partial`, which blocks a common real-world scenario: returning partial cones that were originally issued as full cones. In production, workers typically receive full cones, use a portion, and return them as partial cones. The current validation rejects this because it strictly checks each cone type independently rather than allowing cross-type conversion.

## What Changes

- Modify validation logic in Return V2 to allow `returned_partial` to exceed `issued_partial`, as long as total returned cones do not exceed total issued cones
- Update `addStock()` function to automatically convert full cones to partial cones when returning more partial cones than were originally issued as partial
- When converting full cones to partial: set `is_partial=true` and recalculate `quantity_meters` using `partial_cone_ratio` (default 0.3)
- Update frontend validation in `useReturnV2.ts` to match new backend rules

## Capabilities

### New Capabilities
- `return-cone-conversion`: Allow returning partial cones from originally issued full cones, with automatic inventory conversion and quantity recalculation

### Modified Capabilities
<!-- None - this is a new capability, not changing existing spec requirements -->

## Impact

- **Backend**: `server/routes/issuesV2.ts` - validation logic, `addStock()` function, and `allReturned` completion logic
- **Frontend**:
  - `src/composables/thread/useReturnV2.ts` - `validateReturnQuantities()` function
  - `src/pages/thread/issues/v2/return.vue` - `getMaxReturnPartial()` and input field constraints
- **Database**: Migration required to update `thread_issue_lines` constraint `chk_issue_lines_returned_not_exceed_issued` from per-type to total-based validation
- **Business Logic**: Partial cone ratio (0.3) from `system_settings.partial_cone_ratio` already exists
