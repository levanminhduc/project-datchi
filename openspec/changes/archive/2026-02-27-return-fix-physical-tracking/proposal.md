## Why

The current return (Nhập Lại Chỉ) endpoint requires finding cones with `HARD_ALLOCATED` status in inventory to flip back to `AVAILABLE`. When data becomes inconsistent (e.g., after seed data reset), no `HARD_ALLOCATED` cones exist even though issues were confirmed, causing returns to fail with "Không đủ cuộn nguyên đã xuất".

This fix makes the return logic resilient to data inconsistency while maintaining physical tracking as much as possible.

## What Changes

- **Modify return PREFLIGHT logic**: Instead of requiring `HARD_ALLOCATED` cones, implement fallback to find `AVAILABLE` cones of the same thread_type when `HARD_ALLOCATED` not found
- **Add warning logs**: When fallback is used, log warning for audit purposes
- **Skip redundant inventory updates**: When cones are already `AVAILABLE`, skip the status flip (no-op) but still update issue line counters and return logs
- **Maintain backward compatibility**: If `HARD_ALLOCATED` cones exist, use them (ideal case)

## Capabilities

### New Capabilities
- `return-fallback-logic`: Fallback mechanism to handle data inconsistency when returning thread cones

### Modified Capabilities
- `thread-issue-returns`: Modify validation to allow returns even when HARD_ALLOCATED cones are missing (relaxed constraint)

## Impact

- **Backend**: `server/routes/issuesV2.ts` - POST `/:id/return` endpoint (lines 1742-2192)
- **No frontend changes**: Frontend validation logic remains unchanged
- **Data**: Existing inconsistent data will now work; new data continues to use HARD_ALLOCATED when available
- **Audit**: Warning logs added when fallback is used for traceability
