## Context

Return V2 (`POST /api/issues/v2/:id/return`) currently enforces strict validation:
- `returned_full <= issued_full`
- `returned_partial <= issued_partial`

This blocks the common production scenario where full cones are issued but returned as partial cones after use. The `addStock()` function also expects to find cones with matching `is_partial` values in `HARD_ALLOCATED` status.

**Current flow:**
```
Issue: 5 full + 2 partial = 7 cones
Return: 1 full + 5 partial → REJECTED (5 > 2 partial issued)
```

**Desired flow:**
```
Issue: 5 full + 2 partial = 7 cones
Return: 1 full + 5 partial → ACCEPTED (total 6 <= 7)
Backend auto-converts 3 full cones to partial (5 partial needed, only 2 available)
```

## Goals / Non-Goals

**Goals:**
- Allow returning more partial cones than originally issued as partial
- Automatically convert full cones to partial when needed for return
- Maintain inventory accuracy by updating `is_partial` and `quantity_meters`
- Keep UI simple: user enters return quantities, backend handles conversion logic

**Non-Goals:**
- Converting partial cones back to full cones (one-way conversion only)
- Tracking exact meters remaining (use `partial_cone_ratio` for simplicity)
- Changing the Recovery flow (barcode + weighing) - that remains separate

## Decisions

### Decision 1: New validation formula

**Current:**
```
returned_full <= issued_full
returned_partial <= issued_partial
```

**New:**
```
returned_full <= issued_full
(returned_full + returned_partial) <= (issued_full + issued_partial)
```

**Rationale:** This allows any combination of returns as long as total doesn't exceed total issued. The first rule ensures we don't "create" full cones from nothing.

### Decision 2: Cone sourcing priority in `addStock()`

When returning partial cones:
1. First, find `HARD_ALLOCATED` cones with `is_partial=true` (already partial)
2. If not enough, find `HARD_ALLOCATED` cones with `is_partial=false` and convert them

**Rationale:** Prefer keeping full cones as full (they have more value). Only convert when necessary.

### Decision 3: Quantity calculation on conversion

When converting full → partial:
```
quantity_meters = thread_types.meters_per_cone * system_settings.partial_cone_ratio (0.3)
```

**Rationale:** We don't know exact remaining meters without weighing. Use the standard partial ratio for consistency. This matches how partial cones are created in manual stock entry.

### Decision 4: Backend-driven logic, minimal UI change

Backend handles all conversion logic. Frontend only changes validation formula to match.

**Rationale:** Simpler for users - they just enter what they're returning. Backend figures out which cones to convert.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Inventory meter accuracy may drift (actual remaining could be 50%, we record 30%) | Acceptable trade-off for simplicity. Recovery flow with weighing is available for precision when needed. |
| Converting the "wrong" full cone (e.g., newer cone when older should be converted) | Use LIFO order for conversion (most recently allocated first) to minimize impact. |
| Edge case: returning more full cones than available after conversion | Validation ensures `returned_full <= issued_full`, so this can't happen. |
| No transaction atomicity across stock + counter updates | Known limitation - current flow already operates this way and has been stable. Adding full transaction support would require RPC function refactoring, which is out of scope for this change. |

## Migration Plan

**Database migration required** to update check constraint:

1. **Create migration** to alter `thread_issue_lines` constraint:
   - Drop: `chk_issue_lines_returned_not_exceed_issued` (old: `returned_full <= issued_full AND returned_partial <= issued_partial`)
   - Add: New constraint with total-based validation: `returned_full <= issued_full AND (returned_full + returned_partial) <= (issued_full + issued_partial)`

2. **Deploy order**:
   1. **Create and verify database backup** before any changes
   2. Deploy database migration
   3. Deploy backend changes
   4. Deploy frontend changes

3. **Rollback**:
   - **Before any cross-type returns are made**: Revert migration and code safely - existing data remains valid under old constraint.
   - **After cross-type returns exist** (rows with `returned_partial > issued_partial`): Rollback is DATA-BREAKING. This affects both `thread_issue_lines` counters AND `thread_inventory` records (converted cones have `is_partial=true` and modified `quantity_meters`).

   **Rollback options after feature usage**:
   - **Option A (Recommended)**: Restore from pre-change database backup. This is the only fully consistent rollback path since both issue counters and inventory state are affected.
   - **Option B (Partial)**: Manual cleanup with data audit:
     1. Identify affected issues: `SELECT * FROM thread_issue_lines WHERE returned_partial > issued_partial`
     2. Adjust counters: `UPDATE thread_issue_lines SET returned_partial = issued_partial WHERE returned_partial > issued_partial`
     3. Note: Converted inventory records (`is_partial` changes) cannot be reliably identified and reverted without additional tracking. Accept this inconsistency or restore from backup.
   - **Option C**: Accept forward-only migration - do not rollback after feature usage.
