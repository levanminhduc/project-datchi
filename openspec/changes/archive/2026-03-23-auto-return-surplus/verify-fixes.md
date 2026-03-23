## [2026-03-23] Round 1 (from spx-apply auto-verify)

### spx-verifier
- Fixed: [CRITICAL C1] AssignmentControlDialog.vue COMPLETED label inconsistency — changed filter condition from `=== 'CANCELLED'` to `!== 'CONFIRMED' && !== 'DRAFT'` to properly hide action buttons for COMPLETED weeks
- Fixed: [CRITICAL C2] Duplicate COMPLETED value in `OrderWeekStatus` enum in `src/types/thread/enums.ts` — removed duplicate entry
- Fixed: [WARNING W1] DELETE complete endpoint missing item-week verification — added check that item belongs to week before deleting completion
- Fixed: [WARNING W2+W4] Raw `q-checkbox` used instead of `AppCheckbox` — replaced with `AppCheckbox` component and added `aria-label` for accessibility
- Fixed: [WARNING W3] Preview dialog focus management — added `@show` handler to auto-focus confirm button when dialog opens

## [2026-03-23] Round 2 (re-verify)

### spx-verifier
- Fixed: Duplicate `'WEEK_COMPLETED'` in `server/types/thread.ts` MovementType — removed duplicate entry
- Fixed: [WARNING W1] PATCH /:id/status allowed COMPLETED bypass RPC — removed `'COMPLETED'` from `VALID_STATUS_TRANSITIONS.CONFIRMED`
- Fixed: [WARNING W2] Autofocus on Cancel instead of Confirm in surplus preview dialog — moved `autofocus` to "Xác nhận" button
