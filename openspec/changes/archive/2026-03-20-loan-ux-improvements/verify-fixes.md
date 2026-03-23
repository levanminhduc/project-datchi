## 2026-03-20 Round 1 (from spx-verify + spx-apply fix pass)

### spx-verifier
- Fixed: Misleading auto-return summary text in `ReceiveResultDialog.vue` — "Trả X cuộn cho 0 khoản mượn đã thanh toán" when `settled=0` but `returned_cones>0`. Now shows "Trả X cuộn" and conditionally appends "· Y khoản mượn đã thanh toán" only when `settled > 0`.
- Fixed: Duplicate `cones_returned` display in `ReceiveResultDialog.vue` detail rows — removed redundant `q-item-section side` that echoed the same value already shown in `q-item-label caption`.

### spx-arch-verifier
- Fixed: New `q-table` in `loans.vue` breakdown sub-table replaced with `DataTable` component — imports added accordingly.
- Fixed: All English `'Unknown'` fallback strings in `deliveries.vue` error handlers replaced with Vietnamese `'Không xác định'`.

### spx-uiux-verifier
- Fixed: `"Lot number"` label in `ReceiveResultDialog.vue` localized to `"Số lô"`.
- Fixed: `fn_loan_detail_by_thread_type` in migration `20260320000002` — added `AND d.deleted_at IS NULL` filter to both the outer `WHERE` clause on `thread_order_deliveries d` and the inner LATERAL subquery `tod2`.
