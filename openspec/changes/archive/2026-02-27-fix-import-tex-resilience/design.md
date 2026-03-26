## Context

The NCC-Tex import feature (`server/routes/import.ts` POST `/supplier-tex`) processes Excel rows to create/link thread types with suppliers. The current implementation has three resilience issues:

1. **Thread type creation failure = row skip**: When `INSERT INTO thread_types` fails (e.g., `code` UNIQUE violation), the code skips the entire row instead of looking up the existing record by `tex_number`.
2. **Dual unique constraint on `thread_type_supplier`**: Table has `UNIQUE(thread_type_id, supplier_id)` AND `UNIQUE(supplier_id, supplier_item_code)`. The upsert uses `onConflict: 'thread_type_id,supplier_id'` but doesn't handle the second constraint — causing silent failures.
3. **No skip details**: Backend returns `{ imported: N, skipped: M }` with no per-row breakdown.

Affected files: `server/routes/import.ts`, `src/types/thread/import.ts`, `src/pages/thread/suppliers/import-tex.vue`.

## Goals / Non-Goals

**Goals:**
- Import never silently skips a row when a usable thread_type exists in DB
- Handle both unique constraints on `thread_type_supplier` gracefully
- Return per-row skip reasons so users can debug failed rows
- Display skip details on the frontend result screen

**Non-Goals:**
- Wrapping the entire import in a DB transaction (current row-by-row approach is acceptable)
- Changing the Excel parsing logic or validation rules
- Handling Vietnamese number format (`25.000` → `25000`) — this is an Excel formatting concern, not a backend issue

## Decisions

### Decision 1: Fallback lookup when thread_type insert fails

**Chosen**: After insert failure, SELECT by `tex_number` (with `deleted_at IS NULL`) to find existing record.

**Rationale**: The insert can fail because `code` (e.g., `T-TEX24`) already exists from a previous import or manual creation with a different naming pattern. The `tex_number` is the semantic key — if a thread_type with that tex exists, we should use it regardless of code format.

**Alternative considered**: Use `upsert` with `onConflict: 'code'` on thread_types. Rejected because it would overwrite existing thread_type names/properties, which may have been customized by the user.

### Decision 2: Check-then-upsert for thread_type_supplier

**Chosen**: Before upsert, SELECT existing record by `(thread_type_id, supplier_id)`. If exists → UPDATE. If not → check for `supplier_item_code` conflict, resolve, then INSERT.

**Rationale**: Supabase client `upsert()` with `onConflict` only handles one unique constraint. The table has two: `(thread_type_id, supplier_id)` and `(supplier_id, supplier_item_code)`. A check-then-update/insert pattern handles both constraints explicitly and avoids opaque Postgres errors.

**Alternative considered**: Raw SQL with `ON CONFLICT (thread_type_id, supplier_id) DO UPDATE`. Rejected because it still doesn't prevent the second unique constraint violation if `supplier_item_code` conflicts with a different thread_type's link.

### Decision 3: Per-row error collection

**Chosen**: Collect `{ row_number, supplier_name, tex_number, reason }` for each skipped row and return in response as `skipped_details` array.

**Rationale**: Users need to know which rows failed and why, to fix their Excel file and re-import. A simple count is not actionable.

## Risks / Trade-offs

- **More DB queries per row**: Check-then-update adds 1 SELECT per row vs the current single upsert. For typical import sizes (10-100 rows), this is negligible. → Acceptable for correctness.
- **Race condition on concurrent imports**: Two simultaneous imports could both SELECT "not found" and then both INSERT, causing one to fail. → Mitigated by the fallback pattern (failure leads to retry lookup, not skip). Concurrent imports are rare in this application.
