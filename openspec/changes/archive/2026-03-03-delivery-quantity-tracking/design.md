## Context

The thread inventory system uses weekly orders to plan thread requirements. When a weekly order is confirmed, available inventory is reserved using FEFO (First Expiry First Out). However:

1. `thread_order_deliveries` tracks delivery dates but lacks a `quantity_cones` column to know HOW MANY cones are expected
2. Current "pending" calculation relies on `total_final` from `thread_order_results.summary_data` which is a snapshot - not updated when loans occur
3. Loans between weeks (`fn_borrow_thread`) move cones but don't adjust the expected delivery quantities
4. When inventory becomes available after confirm (returns, recovery, quota overestimate), there's no manual way to reserve additional stock

**Current Schema:**
```
thread_order_deliveries
├─ week_id, thread_type_id, supplier_id
├─ delivery_date, actual_delivery_date, status
├─ received_quantity, inventory_status
└─ ❌ NO quantity_cones (expected delivery)
```

**Existing Functions:**
- `fn_reserve_for_week` - reserves AVAILABLE cones during confirm
- `fn_borrow_thread` - moves RESERVED cones from week A to week B, creates loan record
- `fn_receive_delivery` - creates cones, auto-reserves up to shortage (uses `total_cones` field that doesn't exist yet)

## Goals / Non-Goals

**Goals:**
- Track expected delivery quantity (`quantity_cones`) per delivery record
- Auto-populate `quantity_cones` from shortage when saving weekly order results
- Adjust `quantity_cones` when loans occur (source week +N, target week -N)
- Allow manual reservation from available stock post-confirm (reduces shortage/pending)
- Maintain audit trail via `thread_order_loans` with `from_week_id=NULL` for stock reservations

**Non-Goals:**
- Automatic stock monitoring/alerts (future feature)
- Multi-warehouse reservation preference (use first available)
- Loan repayment tracking (loans are one-way transfers)
- UI for delivery quantity manual override (managed via loans/reservations)

## Decisions

### D1: Add `quantity_cones` column to deliveries

**Decision:** Add nullable INTEGER column with DEFAULT 0

**Rationale:**
- Existing rows will get 0, new rows populated from shortage
- Nullable allows backfill via migration query

**Alternatives considered:**
- Store in separate table → rejected, adds complexity, delivery already has receiving columns
- Compute on-the-fly from results → rejected, doesn't handle loan adjustments

### D2: Populate quantity_cones in saveResults

**Decision:** When saving weekly order results, UPDATE each delivery's `quantity_cones` to match `total_final` from summary_data

**Rationale:**
- `total_final = sl_can_dat + additional_order` = what user decided to order
- Already iterating over summary_data to create/update deliveries
- Sync happens naturally with user's final decision

**Edge case:** User re-saves with different quantities → overwrites previous quantity_cones (correct behavior, reflects latest decision)

### D3: Modify fn_borrow_thread to adjust deliveries

**Decision:** After moving cones, UPDATE both weeks' delivery records:
```sql
-- Source week: needs more from supplier
UPDATE thread_order_deliveries
SET quantity_cones = quantity_cones + v_moved
WHERE week_id = p_from_week_id AND thread_type_id = p_thread_type_id;

-- Target week: needs less from supplier
UPDATE thread_order_deliveries
SET quantity_cones = GREATEST(0, quantity_cones - v_moved)
WHERE week_id = p_to_week_id AND thread_type_id = p_thread_type_id;
```

**Rationale:**
- Loan transfers reserved cones → source loses inventory → needs more from NCC
- Target receives cones → needs less from NCC
- GREATEST(0, ...) prevents negative (can't expect negative deliveries)

### D4: New fn_reserve_from_stock function

**Decision:** Create new RPC similar to `fn_reserve_for_week` but:
- Only callable for CONFIRMED weeks
- Creates loan record with `from_week_id = NULL` (audit trail)
- Adjusts delivery `quantity_cones -= reserved_count`

**Signature:**
```sql
fn_reserve_from_stock(
  p_week_id INTEGER,
  p_thread_type_id INTEGER,
  p_quantity INTEGER,
  p_reason TEXT,
  p_user VARCHAR
) RETURNS JSON
```

**Returns:** `{ success, reserved, shortage, loan_id }`

**Alternatives considered:**
- Reuse fn_reserve_for_week → rejected, that's for confirm-time, doesn't create loan record
- No audit trail → rejected, user explicitly wants to track "borrowed from stock"

### D5: Loan record with from_week_id=NULL

**Decision:** Allow `from_week_id = NULL` in `thread_order_loans` to indicate "from stock"

**Migration:**
- ALTER TABLE to make `from_week_id` nullable
- Update CHECK constraint `chk_loan_self_borrow` to handle NULL

```sql
ALTER TABLE thread_order_loans
ALTER COLUMN from_week_id DROP NOT NULL;

-- Update constraint to allow NULL
ALTER TABLE thread_order_loans
DROP CONSTRAINT chk_loan_self_borrow,
ADD CONSTRAINT chk_loan_self_borrow CHECK (
  from_week_id IS NULL OR from_week_id <> to_week_id
);
```

### D6: Backend API endpoint for reserve from stock

**Decision:** Add `POST /api/weekly-orders/:id/reserve-from-stock`

**Request body:**
```json
{
  "thread_type_id": 123,
  "quantity": 10,
  "reason": "Tồn kho có thêm từ return"
}
```

**Response:** RPC result with loan_id for audit

### D7: Frontend UI for reserve from stock

**Decision:** Add "Lấy từ tồn kho" button in weekly order reservation tab (for CONFIRMED weeks with shortage > 0)

**Flow:**
1. User sees reservation summary with shortage
2. Clicks "Lấy từ tồn kho" for a thread type
3. Dialog shows: available stock count, input for quantity (max = min(shortage, available))
4. Confirm → calls API → refreshes reservation summary

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Delivery record doesn't exist when loan happens | fn_borrow_thread creates delivery if not exists (same pattern as saveResults) |
| quantity_cones goes negative from multiple loans | GREATEST(0, ...) in UPDATE |
| Race condition on concurrent loans | RPC uses FOR UPDATE locking on delivery row |
| Backfill existing deliveries | Migration sets quantity_cones = 0, saveResults will update on next save |
| fn_receive_delivery references total_cones | Already uses this field - migration adds it, function works |

## Migration Plan

1. **Add column:** `ALTER TABLE thread_order_deliveries ADD COLUMN quantity_cones INTEGER NOT NULL DEFAULT 0`
2. **Make from_week_id nullable:** `ALTER TABLE thread_order_loans ALTER COLUMN from_week_id DROP NOT NULL`
3. **Update constraint:** Drop and recreate `chk_loan_self_borrow`
4. **Create fn_reserve_from_stock:** New function
5. **Modify fn_borrow_thread:** Add delivery quantity adjustments
6. **Backend:** Update saveResults, add new endpoint
7. **Frontend:** Update types, add UI

**Rollback:** Column can be dropped, functions can be reverted to previous versions from git.

## Open Questions

None - all decisions confirmed with user during exploration phase.
