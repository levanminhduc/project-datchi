## Context

The Issue V2 return endpoint (`POST /api/issues/v2/:id/return`) currently uses a 3-phase approach:
1. **PREFLIGHT**: Find `HARD_ALLOCATED` cones in `thread_inventory` matching the return quantities
2. **EXECUTE INVENTORY**: Flip found cones from `HARD_ALLOCATED` → `AVAILABLE`
3. **UPDATE COUNTERS**: Update `returned_full`, `returned_partial` in `thread_issue_lines` and log to `thread_issue_return_logs`

The problem: When inventory data becomes inconsistent (no `HARD_ALLOCATED` cones exist despite issues being confirmed), Phase 1 fails and returns error "Không đủ cuộn nguyên đã xuất".

Current flow location: `server/routes/issuesV2.ts` lines 1742-2192.

## Goals / Non-Goals

**Goals:**
- Make return operation resilient to data inconsistency
- Maintain physical tracking when `HARD_ALLOCATED` cones exist (ideal path)
- Log warnings when fallback is used for auditability
- Enable returning both full and partial cones simultaneously

**Non-Goals:**
- Fix the root cause of data inconsistency (seed scripts, migrations)
- Change the confirm flow logic
- Modify frontend validation (already correct)
- Add UI indicators for fallback scenarios

## Decisions

### Decision 1: Fallback Strategy for Missing HARD_ALLOCATED Cones

**Choice**: When `HARD_ALLOCATED` cones not found, fallback to counting validation only (no inventory update).

**Rationale**:
- Alternative A (Find AVAILABLE cones and mark them): Would create phantom allocations - marking AVAILABLE cones as "returned" makes no logical sense
- Alternative B (Fail with detailed error): Current behavior, blocks business operations
- **Chosen approach**: Skip inventory update entirely, only update counters. The validation (returned <= issued - already_returned) ensures correctness.

**Implementation**:
```
IF HARD_ALLOCATED cones found:
  → Use them (current behavior)
  → Flip to AVAILABLE
ELSE:
  → Log warning: "Fallback: No HARD_ALLOCATED cones for thread_type_id X"
  → Skip inventory update
  → Continue with counter updates
```

### Decision 2: Simplify PREFLIGHT Logic

**Choice**: Remove the complex cone-finding logic, rely on quantity validation.

**Rationale**:
- Current PREFLIGHT (lines 1876-2015) is ~140 lines of complex cone selection with `selectedConeIds` tracking
- The actual business requirement is just: `new_returned + already_returned <= issued`
- Physical tracking is nice-to-have, not critical for business operation

**New flow**:
```
Phase 1: VALIDATE
  - Check: returned_full <= issued_full - already_returned_full
  - Check: total_returned <= total_issued

Phase 2: TRY INVENTORY UPDATE (best-effort)
  - Try find HARD_ALLOCATED cones
  - If found: flip to AVAILABLE
  - If not found: log warning, skip

Phase 3: UPDATE COUNTERS (always)
  - Update thread_issue_lines
  - Insert thread_issue_return_logs
  - Check if all returned → set status RETURNED
```

### Decision 3: Remove Convert-to-Partial Logic in Return

**Choice**: Remove the complex "convert full cone to partial" logic in return flow.

**Rationale**:
- Current code (lines 1968-2011) tries to convert full cones to partial when not enough partial cones exist
- This adds complexity and potential bugs
- If user wants to return partial, they should have partial cones already allocated
- Simplification outweighs edge case handling

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Loss of physical tracking when data inconsistent | Warning logs for audit; tracking works when data is consistent |
| Users may not notice data inconsistency | Consider future: add admin alert when fallback used |
| Removing convert logic may break edge cases | Current convert logic is already buggy; simpler = more reliable |
| Counters may drift from inventory | Counters are source of truth for business; inventory is secondary |
