## Context

The Thread Inventory Management System uses Weekly Orders to plan and reserve thread cones for production. Current lifecycle: `DRAFT → CONFIRMED → CANCELLED`. When CONFIRMED, cones are reserved (`RESERVED_FOR_ORDER` status with `reserved_week_id`). Issue V2 issues these cones to production lines.

**Problem**: After all PO-Style-Color items in a week finish issuance, leftover reserved cones remain locked with no release mechanism. The only way to free them is CANCEL, which is semantically wrong (the week succeeded, it wasn't cancelled).

**Current release mechanism**: `fn_release_week_reservations` (used by CANCEL) simply sets all `RESERVED_FOR_ORDER` cones to `AVAILABLE` and clears `reserved_week_id`. It blocks if active loans exist.

**Loan system**: Weeks can borrow cones from other weeks. Borrowed cones have `original_week_id ≠ reserved_week_id`. When releasing, borrowed cones must return to their original week, not go to AVAILABLE.

## Goals / Non-Goals

**Goals:**
- Allow users to mark individual PO-Style-Color items as "issuance complete"
- Release surplus reserved cones when all items in a week are complete
- Properly handle borrowed cones (return to lender week)
- Lock completed weeks from further operations
- Prevent Issue V2 from creating new issuances for completed combos
- Full audit trail via WEEK_COMPLETED movement type

**Non-Goals:**
- Auto-detection of "issuance complete" (always manual user action)
- Partial week completion (releasing cones for some items while others continue)
- Modifying existing Issue V2 return flow (HARD_ALLOCATED/IN_PRODUCTION → AVAILABLE)
- Changing the existing CANCEL flow

## Decisions

### D1: New RPC `fn_complete_week_and_release` instead of reusing `fn_release_week_reservations`

**Choice**: Create a new function that handles loan-aware release.

**Rationale**: The existing `fn_release_week_reservations` treats all reserved cones identically (→ AVAILABLE). With loans, we need two paths:
- Own cones (`original_week_id IS NULL` or `= week_id`) → AVAILABLE, clear `reserved_week_id`
- Borrowed cones (`original_week_id IS NOT NULL AND ≠ week_id`) → re-reserve for original week (`reserved_week_id = original_week_id`, clear `original_week_id`)

The function also auto-settles loan records (`thread_order_loans.status → SETTLED`).

**Alternative considered**: Modify `fn_release_week_reservations` — rejected because CANCEL semantics differ (CANCEL blocks on loans, COMPLETE auto-settles).

### D2: `thread_order_item_completions` as separate table (not column on `thread_order_items`)

**Choice**: New join table `thread_order_item_completions(item_id, completed_at, completed_by)`.

**Rationale**: Clean separation of concerns. `thread_order_items` defines WHAT to order; completions track operational status. Also supports undo (DELETE row) cleanly without nullable columns.

**Alternative considered**: Boolean `is_completed` column on `thread_order_items` — simpler but loses audit info (who/when) and mixes planning data with operational data.

### D3: Issue V2 blocking via `findCompletedWeekItemIds` check

**Choice**: Add a guard in Issue V2 validate and confirm endpoints that checks if ALL weeks containing the PO-Style-Color combo have status `COMPLETED`. If so, block even with over-quota notes.

**Rationale**: `findConfirmedWeekIds()` already excludes COMPLETED weeks (returns only CONFIRMED), so quota naturally drops to 0. But users can bypass via over-quota notes. A hard block prevents this.

**Implementation**: New helper `isComboCompletedInAllWeeks(poId, styleId, styleColorId)` that returns true if every week containing this combo is COMPLETED (and at least one such week exists).

### D4: Status transition: CONFIRMED → COMPLETED (one-way)

**Choice**: Add `COMPLETED` to `WeeklyOrderStatus`. Transition map: `CONFIRMED: ['CANCELLED', 'COMPLETED']`. COMPLETED is terminal (no transitions out).

**Rationale**: Once surplus is released, the cones are gone. Reversal would require re-reserving, which conflicts with cones that may have been allocated elsewhere.

### D5: Movement type WEEK_COMPLETED

**Choice**: New `movement_type` enum value `WEEK_COMPLETED` in `thread_movements`.

**Rationale**: Distinct from `RETURN` (which is Issue V2 return from production) and from CANCEL release (which has no movement logged). Enables filtering/reporting on completed week releases.

## Risks / Trade-offs

**[Risk] Borrowed cones' original week may also be COMPLETED** → Mitigation: The RPC checks if the original week is still CONFIRMED before re-reserving. If original week is COMPLETED/CANCELLED, cone goes to AVAILABLE instead. Edge case but safe fallback.

**[Risk] Race condition on concurrent "Trả dư"** → Mitigation: RPC uses `SELECT ... FOR UPDATE` on the week row. Second concurrent call sees status already COMPLETED and returns early with error.

**[Risk] Large number of reserved cones** → Mitigation: Single SQL UPDATE with WHERE clause, not row-by-row. Movement logging done via INSERT ... SELECT. Performance acceptable for expected volumes (<1000 cones per week).

**[Trade-off] No undo after "Trả dư"** → Accepted. Once cones are released, they may be reserved/allocated elsewhere. Users see preview dialog before confirming.
