## 1. Types and Data Layer

- [x] 1.1 Add `isSaved` prop to `ResultsDetailView.vue` props interface
- [x] 1.2 Add delivery date override Map to `useWeeklyOrderCalculation.ts` composable (keyed by spec_id, storing edited delivery_date strings)
- [x] 1.3 Add function to merge edited delivery_dates into calculation results before save

## 2. ResultsDetailView - Inline DatePicker (Pre-Save)

- [x] 2.1 Replace static delivery_date column format with conditional template: editable DatePicker (pre-save) vs countdown display (post-save)
- [x] 2.2 Implement inline DatePicker using Quasar q-popup-proxy + DatePicker component in the delivery_date column cell
- [x] 2.3 Emit delivery_date changes to parent via event or composable update (local-only, no API call)

## 3. ResultsDetailView - Countdown Display (Post-Save)

- [x] 3.1 Implement countdown format function: compute days remaining (delivery_date - today), return "còn N Ngày" or "Đã đến hạn Giao"
- [x] 3.2 Add tooltip showing actual DD/MM/YYYY date when hovering over countdown text
- [x] 3.3 Handle null delivery_date case: display "—"

## 4. Role-Based Edit Locking

- [x] 4.1 Import `useAuth` in ResultsDetailView and compute `canEditAfterSave` based on isRoot/isAdmin
- [x] 4.2 Show DatePicker for root/admin users even after save; read-only countdown for other roles

## 5. Parent Integration

- [x] 5.1 Pass `isSaved` prop from parent page (index.vue) to ResultsDetailView based on whether results exist for the current week
- [x] 5.2 Merge edited delivery_dates into calculation_data and summary_data before calling saveResults API

## 6. Verification

- [x] 6.1 Run `npm run type-check` and fix any TypeScript errors
- [x] 6.2 Run `npm run lint` and fix any lint issues
