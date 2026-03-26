## Why

When receiving thread deliveries, the system auto-returns borrowed cones to lender weeks (`fn_auto_return_loans`), but the UI does not surface these results. Users cannot see how many cones were auto-returned, to which week, or which loans were settled. Additionally, the delivery tracking page shows `quantity_cones` (already adjusted for borrows) without explaining the relationship between original order quantity, borrowed quantity, and net pending quantity. This makes the borrow/return flow opaque to warehouse staff.

## What Changes

- Show auto-return results in the receive delivery success feedback (cones returned, loans settled, target weeks)
- Add "borrowed context" columns to delivery tracking table (original qty, borrowed qty, net pending)
- Enhance loan summary dashboard with per-thread-type breakdown and outstanding balance per week
- Add receive result dialog showing detailed breakdown instead of just a snackbar toast

## Capabilities

### New Capabilities
- `receive-auto-return-feedback`: Display auto-return loan settlement results when receiving deliveries — shows which loans were settled, how many cones returned to which lender week
- `delivery-loan-context`: Show borrowed quantity context alongside delivery tracking — original order qty, borrowed out, borrowed in, net expected from supplier

### Modified Capabilities
- `delivery-inventory-receiving`: Enhance receive response to include auto_return details (already returned by backend but ignored by frontend)

## Impact

- **Frontend**: Modify `deliveries.vue` (receive result display, delivery table columns), modify `deliveryService.ts` (response type), modify `loans.vue` (enhanced summary)
- **Backend**: Minor — may need to enhance `fn_loan_dashboard_summary` RPC for per-thread-type breakdown; receive endpoint already returns `auto_return` data
- **Database**: Possibly add/modify `fn_loan_dashboard_summary` to include thread_type grouping
- **No breaking changes** — purely additive UX improvements
