## Context

The thread inventory system tracks cones with various statuses (AVAILABLE, SOFT_ALLOCATED, HARD_ALLOCATED, IN_PRODUCTION, etc.). Weekly Orders (WO) calculate thread requirements based on POs but don't reserve actual inventory. When WO is confirmed, there's no guarantee the calculated threads will be available at production time.

Current flow:
1. WO created → calculates requirements from POs
2. WO confirmed → creates deliveries for NCC but doesn't touch inventory
3. Issue created → fn_allocate_thread picks AVAILABLE cones
4. Problem: multiple WOs compete for same pool

## Goals / Non-Goals

**Goals:**
- Reserve specific cones for confirmed WOs
- Track which cones belong to which WO
- Allow borrowing between WOs with audit trail
- Auto-reserve incoming deliveries for WOs with shortages
- Integrate seamlessly with existing issue flow

**Non-Goals:**
- Changing the Issue/Allocation UI workflow
- Modifying how PO requirements are calculated
- Implementing FIFO priority between WOs (keep simple: owner-first)
- Adding approval workflow for loans (immediate effect)

## Decisions

### D1: Add `RESERVED_FOR_ORDER` cone status
**Rationale**: Distinct from SOFT_ALLOCATED (which is for active issues). Reserved cones are held for a WO but not yet being issued.

**Alternatives considered**:
- Reuse SOFT_ALLOCATED → confusing, can't distinguish issue vs WO reservation
- Boolean flag `is_reserved` → less queryable, status enum more consistent

### D2: Store reservation in `thread_inventory` columns
**Rationale**:
- `reserved_week_id` → current reservation owner
- `original_week_id` → tracks source when borrowed (for loan detection)

**Alternatives considered**:
- Separate junction table → more complexity, harder to query inventory status

### D3: Create `thread_order_loans` table for audit
**Rationale**: Need to track: who borrowed from whom, how much, when, why. Can't derive this reliably from inventory snapshots.

### D4: Owner-first reservation on delivery
**Rationale**: When NCC delivers for WO#5, reserve for WO#5 first (up to shortage), then AVAILABLE for others. Simpler than FIFO-by-week which requires cross-WO queries.

### D5: Modify `fn_allocate_thread` WHERE clause
**Rationale**: Add `RESERVED_FOR_ORDER` to allowed statuses. When allocating, clear `reserved_week_id` and record `original_week_id` if it was reserved.

## Schema Changes

```sql
-- 1. Add enum value
ALTER TYPE cone_status ADD VALUE 'RESERVED_FOR_ORDER' AFTER 'AVAILABLE';

-- 2. Add columns
ALTER TABLE thread_inventory
  ADD COLUMN reserved_week_id INTEGER REFERENCES thread_order_weeks(id),
  ADD COLUMN original_week_id INTEGER REFERENCES thread_order_weeks(id);

-- 3. New table
CREATE TABLE thread_order_loans (
  id SERIAL PRIMARY KEY,
  from_week_id INTEGER NOT NULL REFERENCES thread_order_weeks(id),
  to_week_id INTEGER NOT NULL REFERENCES thread_order_weeks(id),
  thread_type_id INTEGER NOT NULL REFERENCES thread_types(id),
  quantity_cones INTEGER NOT NULL,
  quantity_meters NUMERIC(12,4),
  reason TEXT,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Trigger for updated_at
CREATE TRIGGER update_thread_order_loans_updated_at
  BEFORE UPDATE ON thread_order_loans
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

-- 4. Indexes
CREATE INDEX idx_inventory_reserved_week ON thread_inventory(reserved_week_id)
  WHERE reserved_week_id IS NOT NULL;
CREATE INDEX idx_loans_from_week ON thread_order_loans(from_week_id);
CREATE INDEX idx_loans_to_week ON thread_order_loans(to_week_id);
```

### D6: Auto-loan requires week context in allocation (REVISED)
**Rationale**: To auto-record loans when allocating reserved cones for a different WO, we need to know the target WO's week_id.

**Chosen approach (hybrid)**:
1. Add `week_id` nullable FK to `thread_allocations` table - persisted at allocation creation time when originating from WO
2. Pass `p_week_id` to `fn_allocate_thread` RPC - retrieved from `thread_allocations.week_id` at execution time

**Why hybrid**:
- Persisting `week_id` on allocation ensures reliable week context even if allocation is executed later or by different route
- Current WO allocation creation (`POST /api/weekly-orders/:id/results`) sets `order_id = "WO-{weekId}-{style_code}-{spec_id}"` - the `order_id` is for display only, NOT authoritative for week resolution
- `week_id` FK is the single source of truth for allocation's WO context

**Schema addition**:
```sql
ALTER TABLE thread_allocations
  ADD COLUMN week_id INTEGER REFERENCES thread_order_weeks(id);
CREATE INDEX idx_allocations_week ON thread_allocations(week_id)
  WHERE week_id IS NOT NULL;
```

### D7: created_by from server auth context
**Rationale**: Loan audit `created_by` must come from server-side auth context, never from client payload. Prevents identity spoofing.

### D8: Atomic confirm with reserve (CRITICAL)
**Rationale**: Confirm + reserve must be atomic. If reserve fails mid-way, data is inconsistent.

**Chosen approach**:
- Create single RPC `fn_confirm_week_with_reserve(p_week_id)` that:
  1. Lock `thread_order_weeks` row `FOR UPDATE`
  2. Validate status = DRAFT
  3. Aggregate summary by `thread_type_id` (dedupe)
  4. Reserve all thread types in one transaction
  5. Update status to CONFIRMED only if all succeed
  6. Return `{success, reservation_summary[]}`

**Why**: Prevents partial reserve state. Either all reserved or none.

### D9: Reverse transitions for allocation cancel/split
**Rationale**: When allocation is cancelled/split/rejected, cones with `original_week_id` must restore to RESERVED_FOR_ORDER.

**Rule**:
- If cone has `original_week_id` and target week still exists and status IN ('DRAFT', 'CONFIRMED'):
  - Set `status = 'RESERVED_FOR_ORDER'`
  - Set `reserved_week_id = original_week_id`
  - Clear `original_week_id`
- Else: set `status = 'AVAILABLE'`, clear both week IDs

### D10: Cancel WO with active loans blocked
**Rationale**: Cannot cancel WO that has outstanding loans (given or received). Would break loan chain.

**Rule**:
- Before cancel, check `thread_order_loans` for:
  - `from_week_id = :week_id AND deleted_at IS NULL` (loans given to others)
  - `to_week_id = :week_id AND deleted_at IS NULL` (loans received from others)
- If any exist → reject cancel with error "Không thể hủy khi còn khoản mượn/cho mượn chưa thanh toán"
- Alternative: require settle/reverse all loans before cancel

### D11: Atomic receive + auto-reserve
**Rationale**: Delivery receive has lost-update race condition. Must lock and atomify.

**Chosen approach**:
- Create RPC `fn_receive_delivery(p_delivery_id, p_received_qty, p_warehouse_id, p_received_by)` that:
  1. Lock `thread_order_deliveries` row `FOR UPDATE`
  2. Atomically increment `received_quantity`
  3. Create cones in `thread_inventory` with status = AVAILABLE
  4. Calculate shortage for week
  5. Auto-reserve new cones up to shortage
  6. Update `inventory_status` based on total received
  7. Return `{success, cones_created, cones_reserved, remaining_shortage}`

### D12: Retry/backoff for SKIP LOCKED shortage
**Rationale**: FOR UPDATE SKIP LOCKED may report false shortage due to lock contention.

**Rule**:
- `fn_reserve_for_week` returns `{reserved, skipped_locked, shortage}`
- If `skipped_locked > 0`, backend should retry after 100ms (max 3 retries)
- Final shortage reported only after retries exhausted
- Alternative: use advisory lock `pg_advisory_xact_lock(thread_type_id)` before reserve loop

### D13: DB constraints for loan integrity
**Schema addition**:
```sql
ALTER TABLE thread_order_loans
  ADD CONSTRAINT chk_loan_self_borrow CHECK (from_week_id <> to_week_id),
  ADD CONSTRAINT chk_loan_qty_positive CHECK (quantity_cones > 0),
  ADD CONSTRAINT chk_loan_meters_nonneg CHECK (quantity_meters >= 0 OR quantity_meters IS NULL);
```

### D14: Atomic borrow with row locking
**Rationale**: Manual borrow must lock candidate cones to prevent over-borrow.

**Rule**: `fn_borrow_thread` must:
1. Select cones `WHERE reserved_week_id = p_from_week AND status = 'RESERVED_FOR_ORDER' FOR UPDATE SKIP LOCKED`
2. Update first N cones (N = p_qty) in same CTE
3. If `COUNT(updated) < p_qty` → raise exception "Không đủ chỉ để mượn"
4. Insert loan record in same transaction

## API Changes

### Backend Endpoints (modify existing routes in `/api/weekly-orders`)
- `PATCH /api/weekly-orders/:id/status` → when status=CONFIRMED, call `fn_confirm_week_with_reserve`; when status=CANCELLED, check active loans then call `fn_release_week_reservations`
- `POST /api/weekly-orders/deliveries/:deliveryId/receive` → call `fn_receive_delivery` (atomic receive + auto-reserve)

### New Endpoints (under existing route group)
- `POST /api/weekly-orders/:id/loans` → manual borrow via `fn_borrow_thread` (created_by from auth context)
- `GET /api/weekly-orders/:id/loans` → loan history
- `GET /api/weekly-orders/:id/reservations` → view reserved cones

### Response contract for confirm
```typescript
// PATCH /api/weekly-orders/:id/status (status=CONFIRMED)
{
  data: {
    week: ThreadOrderWeek,
    reservation_summary: Array<{
      thread_type_id: number,
      needed: number,
      reserved: number,
      shortage: number
    }>
  },
  error: null
}
```

### RPC Changes
- `fn_allocate_thread(p_allocation_id, p_week_id)` → add optional p_week_id param; on cancel/split restore RESERVED_FOR_ORDER if original_week_id set
- `fn_allocate_thread` WHERE clause → status IN ('AVAILABLE', 'RESERVED_FOR_ORDER')
- New: `fn_confirm_week_with_reserve(week_id)` → atomic confirm + reserve all thread types
- New: `fn_reserve_for_week(week_id, thread_type_id, quantity)` → returns {reserved, skipped_locked, shortage}
- New: `fn_release_week_reservations(week_id)` → check active loans first
- New: `fn_borrow_thread(from_week, to_week, thread_type_id, qty, reason, p_user)` → atomic with row locking
- New: `fn_receive_delivery(delivery_id, received_qty, warehouse_id, received_by)` → atomic receive + auto-reserve

## Risks / Trade-offs

**[Risk]** Cones stuck in RESERVED_FOR_ORDER if WO never cancelled
→ Mitigation: Admin UI to view/release orphan reservations

**[Risk]** Race condition when multiple WOs confirm simultaneously
→ Mitigation: Use FOR UPDATE SKIP LOCKED in reserve function + retry/backoff (D12)

**[Risk]** False shortage due to lock contention
→ Mitigation: Retry loop with backoff; report final shortage after retries (D12)

**[Risk]** Lost reservation on allocation cancel
→ Mitigation: Reverse transitions restore RESERVED_FOR_ORDER (D9)

**[Risk]** Cancel WO breaks loan chain
→ Mitigation: Block cancel if active loans exist (D10)

**[Risk]** Over-borrow due to concurrent requests
→ Mitigation: Atomic borrow with row locking in fn_borrow_thread (D14)

**[Risk]** Lost-update on delivery receive
→ Mitigation: Atomic receive RPC with row lock (D11)

**[Trade-off]** Owner-first vs FIFO-by-week
→ Chose owner-first for simplicity. Can add FIFO later if needed.

**[Trade-off]** Storing loan records vs deriving from inventory
→ Chose explicit table for audit trail and reason field

**[Trade-off]** Single atomic RPC vs multiple API calls
→ Chose atomic RPC (fn_confirm_week_with_reserve) to prevent partial state
