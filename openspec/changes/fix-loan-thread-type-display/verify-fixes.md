## [2026-03-22] Round 1 (from spx-apply auto-verify)

### spx-verifier
- No issues to fix (PASS)

### spx-arch-verifier
- Fixed: [W1] Weekly order detail page `[id].vue` loan + reserved cones columns now use `formatThreadTypeDisplay()` for consistent NCC-TEX-Màu format
- Fixed: [S1] Extracted shared `formatThreadTypeDisplay()` to `src/utils/thread-format.ts`, refactored all 3 locations (loans.vue, LoanDialog.vue, [id].vue) to use it
- Fixed: Missing `color` field on `ThreadOrderLoan.thread_type` TypeScript type — restored to match backend PostgREST select
