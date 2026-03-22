## [2026-03-09] Round 1 (from spx-apply auto-verify)

### spx-arch-verifier
- Fixed: Extracted duplicated `getPartialConeRatio()` logic to `server/utils/settings-helper.ts`. Updated `server/routes/weeklyOrder.ts`, `server/routes/issuesV2.ts`, `server/routes/stock.ts` to import from shared utility instead of each having their own implementation.

### spx-verifier
- Accepted: W1 (zero inventory displays dash instead of "0") — follows existing project convention. All other number columns use the same format pattern. Spec text should be updated rather than code.
- Accepted: S1 (dual snackbar) — on re-inspection, `handleSaveReservePriority()` does NOT add a duplicate snackbar; the composable handles it. No fix needed.
