## 1. Replace data source in manual entry

- [x] 1.1 Change `manualEntryThreadTypes` ref type from `ThreadTypeSupplierWithRelations[]` to `ThreadType[]`
- [x] 1.2 Replace `threadTypeSupplierService.getAll({ supplier_id })` call in `onManualSupplierChange` with `threadService.getAll({ supplier_id })` (using existing `fetchThreadTypes` or direct service call with supplier_id filter)
- [x] 1.3 Update `manualTexOptions` computed: change `link.thread_type?.tex_number` to `tt.tex_number` (direct ThreadType access)
- [x] 1.4 Update `manualColorOptions` computed: change `link.thread_type?.color_data` to `tt.color_data` and `link.thread_type!.id` to `tt.id` ← (verify: tex dropdown shows all tex numbers for selected supplier, color dropdown shows correct colors per tex, thread_type_id is set correctly on color selection)

## 2. Cleanup

- [x] 2.1 Remove `threadTypeSupplierService` import from `inventory.vue` if no other usage remains on the page
- [x] 2.2 Verify `threadService` is already imported (via `useThreadTypes` composable or direct import); add import if missing ← (verify: no TypeScript errors, no lint errors, manual entry dialog functions end-to-end with supplier→tex→color cascade)
