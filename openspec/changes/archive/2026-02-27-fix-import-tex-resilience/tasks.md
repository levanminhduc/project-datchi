## 1. Types

- [x] 1.1 Add `skipped_details` field to `ImportTexResponse` in `server/types/import.ts` — array of `{ row_number: number, supplier_name: string, tex_number: number, reason: string }`. Also add `row_number` to `ImportTexRow` for tracking.
- [x] 1.2 Add matching `skipped_details` type to `src/types/thread/import.ts` to keep backend/frontend types aligned

## 2. Backend Import Logic

- [x] 2.1 Refactor thread_type resolution in `server/routes/import.ts`: (a) fix preload cache query to filter `deleted_at IS NULL`, (b) when INSERT fails, fallback SELECT by `tex_number` (where `deleted_at IS NULL`), only skip if both fail
- [x] 2.2 Replace `thread_type_supplier` upsert with check-then-update/insert pattern: SELECT by `(thread_type_id, supplier_id)` first. If exists → UPDATE `unit_price`, `meters_per_cone`, `supplier_item_code`, `is_active = true`. If not → INSERT (handle `supplier_item_code` conflict by appending `-{thread_type_id}` suffix). On INSERT conflict for `(thread_type_id, supplier_id)`, retry with SELECT+UPDATE instead of skipping.
- [x] 2.3 Collect per-row skip reasons into `skipped_details` array and include in response ← (verify: ALL skip branches — early validation missing fields, supplier creation failure, thread_type resolution failure, supplier link failure — collect reasons with row_number; response includes skipped_details)

## 3. Frontend Result Display

- [x] 3.1 Update import result screen in `src/pages/thread/suppliers/import-tex.vue` to show skipped_details table when present (columns: Row#, NCC, Tex, Reason) ← (verify: skip details render correctly, table hidden when no skips, imported/skipped counts still show)
