## [2026-03-06] Round 1 (from spx-apply auto-verify)

### spx-arch-verifier
- Fixed: W1 — Extracted duplicated nested JSONB parsing logic into shared `fn_parse_calculation_cones` helper function, used by both `fn_confirm_week_with_reserve` and `fn_receive_delivery`
- Fixed: W2 — Added `failedItems` counter to PO import execute phase; incremented on style creation failure. Added `failed_items` to `POImportResult` type (server + frontend). Frontend shows "Thất bại: N" in red when > 0
- Fixed: S1 — Changed `new_style` status color from `positive` to `warning` and label from "Mới" to "Mã hàng mới" to distinguish from regular `new` status

### spx-verifier
- Fixed: W1 — Removed `status === 'new_style'` from `newPOsSet` condition to prevent inflating `new_pos` preview count for new_style rows that reference existing POs
- Note: S1 already addressed by arch-verifier S1 fix above

## [2026-03-06] Round 2 (from spx-apply re-verify)

### spx-arch-verifier
- Fixed: W1 — Changed inline style_code q-badge color from `info` to `warning` to match status column badge
- Fixed: W2 — Added `failedItems++` before `continue` on PO creation race failure (`!poId` guard) so result totals reconcile
