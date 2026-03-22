## Context

The thread borrowing system between weekly orders is fully implemented at the DB and API level. When receiving deliveries via `fn_receive_delivery`, the function:
1. Creates cones in `thread_inventory`
2. Auto-reserves cones for the owning week's shortage
3. Calls `fn_auto_return_loans` for surplus cones → settles ACTIVE loans by reserving cones for lender weeks
4. Returns `auto_return: { settled, returned_cones }` in the response

**Problem**: The frontend ignores the `auto_return` field in the response. Users only see "Đã nhập X cuộn vào kho" without knowing that some cones were auto-returned to lender weeks. The delivery tracking table also shows `quantity_cones` (already adjusted by borrowing) without showing the borrowing context.

Current `fn_loan_dashboard_summary` aggregates per-week but not per-thread-type, making it hard to see color-level loan detail.

## Goals / Non-Goals

**Goals:**
- Surface auto-return results in the receive delivery flow (which loans settled, how many cones returned, to which weeks)
- Show borrowing context on delivery tracking (original qty vs adjusted qty)
- Enhance loan dashboard with per-thread-type breakdown
- Keep changes minimal — leverage existing backend data, avoid new DB schema

**Non-Goals:**
- Changing the auto-return logic or borrowing mechanics (already working correctly)
- Adding manual loan settlement UI (auto-return handles this)
- Modifying `fn_receive_delivery` or `fn_auto_return_loans` core logic
- Adding new tables or major schema changes

## Decisions

### D1: Show auto-return results in a result dialog (not just snackbar)

**Rationale**: A snackbar is ephemeral and cannot display structured data (which weeks, how many cones). A result dialog after receive allows users to see the full breakdown and dismiss when ready.

**Alternative**: Expand snackbar with HTML — rejected because Quasar snackbar has limited formatting and auto-dismisses.

**Implementation**: After `confirmReceive()` succeeds, show a result dialog with:
- Cones created count
- Cones auto-reserved for this week
- Auto-return section (if `auto_return.returned_cones > 0`): settled loans count, returned cones count

### D2: Enhance `fn_receive_delivery` return value with loan detail

Current return: `{ success, cones_created, cones_reserved, remaining_shortage, lot_number, auto_return: { settled, returned_cones } }`

**Enhancement**: `fn_auto_return_loans` should return which loans were settled (loan IDs + lender week names) so frontend can display them. Modify to return `auto_return: { settled, returned_cones, details: [{ loan_id, from_week_name, cones_returned }] }`.

**Alternative**: Separate API call to fetch recent loan activity — rejected because it adds latency and is non-atomic (data could change between calls).

### D3: Add `original_quantity_cones` column to track pre-borrow delivery quantity

Currently `quantity_cones` in `thread_order_deliveries` is mutated when borrowing occurs. There's no way to show "originally ordered X, borrowed Y, net pending Z" because the original value is lost.

**Implementation**: Add `original_quantity_cones` column (nullable, backfill from current `quantity_cones`). On borrow, only `quantity_cones` changes. Display shows: Original | Borrowed (original - current) | Net Pending (current - received).

**Alternative**: Calculate borrowed amount by summing `thread_order_loans` — viable but requires join and is less performant for display. Use this as a fallback without schema change.

**Chosen approach**: Calculate from `thread_order_loans` to avoid schema migration. Query: `SUM(quantity_cones) FROM thread_order_loans WHERE to_week_id = :week_id AND thread_type_id = :tt_id AND status = 'ACTIVE'` gives borrowed-in. `SUM WHERE from_week_id` gives lent-out. The `quantity_cones` in delivery already reflects net after borrow adjustments.

### D4: Enhance `fn_loan_dashboard_summary` with thread_type grouping

Add a companion RPC `fn_loan_dashboard_by_thread_type(p_week_id)` that returns per-thread-type breakdown for a given week. This avoids bloating the main summary which is per-week.

**Alternative**: Return nested JSON from existing function — rejected because it would change the response shape and break the existing loans.vue page.

### D5: Frontend component placement

- **Receive result dialog**: New component `ReceiveResultDialog.vue` in `src/components/thread/weekly-order/`
- **Delivery table columns**: Modify existing `deliveries.vue` — add columns from loan context
- **Thread-type breakdown**: Add expandable section to existing `loans.vue` page

## Risks / Trade-offs

- [Loan calculation from `thread_order_loans` may be slow for weeks with many loan records] → Mitigation: Indexes exist on `to_week_id` and `from_week_id`; rows per week typically < 50
- [`fn_auto_return_loans` currently returns minimal data] → Mitigation: Modify to return detail array; backward compatible since caller (`fn_receive_delivery`) can handle extended JSON
- [Adding columns to delivery tracking table may clutter the view] → Mitigation: Use conditional display — only show borrow columns if any borrows exist for that week
