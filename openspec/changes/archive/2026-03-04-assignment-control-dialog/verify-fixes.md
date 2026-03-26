## [2026-03-04] Round 3 (from spx-apply auto-verify)

### spx-uiux-verifier
- Fixed: Added `aria-label="Đóng dialog"` to close button in AppDialog.vue (shared component — benefits all dialogs app-wide)



### spx-verifier
- Fixed: Renamed slot variable `props` → `cellProps` to avoid shadowing component props
- Fixed: Added `style="min-width: min(720px, 80vw)"` on content div to provide wider dialog on desktop

### spx-uiux-verifier
- Fixed: Wrapped QTable in `<div :aria-busy="loading" aria-live="polite">` for screen reader loading announcements



### spx-verifier
- Fixed: Added "Tổng: N dòng" footer count to AssignmentControlDialog.vue
- Fixed: Made empty state message dynamic based on selected status filter

### spx-arch-verifier
- Fixed: Refactored AssignmentControlDialog.vue to use AppDialog wrapper instead of raw q-dialog + q-card
- Note: W2 (loans/all route ordering) is pre-existing issue not introduced by this change - skipped

### spx-uiux-verifier
- Fixed: Refactored to AppDialog (resolves WARNING about inconsistent dialog pattern)
- Fixed: Added title="Thống kê chỉ đã gán" to QTable for accessible name
- Fixed: Dynamic empty state message based on selectedStatus filter
- Fixed: Column labels translated to Vietnamese (Kế hoạch, Đã giữ, Đã cấp, Chênh lệch)
- Fixed: Added footer total count "Tổng: N dòng"
- Note: aria-label on close button not added — AppDialog's close button is internal and not exposed
