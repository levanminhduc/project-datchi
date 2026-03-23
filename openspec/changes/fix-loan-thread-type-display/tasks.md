## 1. Database — RPC function update

- [x] 1.1 Create migration to update `fn_loan_detail_by_thread_type`: add `LEFT JOIN suppliers s ON s.id = tt.supplier_id`, select `s.name AS supplier_name` and `tt.tex_number`
- [x] 1.2 Apply migration via psql ← (verify: RPC returns supplier_name and tex_number for each row) [MANUAL: DB not running]

## 2. Backend — Enrich /loans/all with summary_data (same pattern as deliveries/overview)

- [x] 2.1 Update `/loans/all` endpoint: after fetching loans, collect week_ids, fetch `thread_order_results.summary_data`, build summaryMap `(week_id, thread_type_id) → { supplier_name, tex_number, thread_color }`, enrich each loan with flat `supplier_name`, `tex_number`, `color_name` fields ← (verify: API response includes supplier_name, tex_number, color_name on each loan)
- [x] 2.2 Also update the per-week `/loans` endpoint and `/:id/reservations` endpoint with same enrichment pattern

## 3. TypeScript types

- [x] 3.1 Update `ThreadOrderLoan` in `src/types/thread/weeklyOrder.ts`: add `supplier_name`, `tex_number`, `color_name` flat fields (enriched by backend)
- [x] 3.2 Update `LoanDetailByType` in `src/types/thread/weeklyOrder.ts`: add `supplier_name` and `tex_number` fields

## 4. Frontend — Loan list display

- [x] 4.1 Update `loans.vue` template for `col.name === 'thread_type'`: replace `code + name` with `"NCC - TEX xxx - Màu"` format using `supplier_name`, `tex_number`, `color_name` with null fallback to `thread_type?.name`

## 5. Frontend — Detail-by-type columns

- [x] 5.1 Update `loans.vue` `detailColumns`: replace separate code/name/color columns with a combined "Loại chỉ" column showing `"NCC - TEX xxx - Màu"` format

## 6. Frontend — LoanDialog display

- [x] 6.1 Update `LoanDialog.vue` `MergedRow` interface: add `supplier_name`, `tex_number`, `color_name`
- [x] 6.2 Update `LoanDialog.vue` `loadMergedData`: fetch `thread_order_results.summary_data` for source week, enrich MergedRow with supplier/tex/color from summaryMap
- [x] 6.3 Update `LoanDialog.vue` table headers and body: replace "Mã chỉ" + "Tên chỉ" with single "Loại chỉ" column showing NCC-TEX-Màu format ← (verify: dialog shows correct NCC-TEX-Màu for each selectable thread type)

## 7. Verification

- [x] 7.1 Run `npm run type-check` — zero TS errors
- [x] 7.2 Run `npm run lint` — zero lint errors ← (verify: all changes pass type-check and lint, loan page displays thread types in NCC-TEX-Màu format across all 3 areas)
