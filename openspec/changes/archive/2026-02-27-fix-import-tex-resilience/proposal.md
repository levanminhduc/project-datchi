## Why

The NCC-Tex import backend silently skips rows when DB constraints conflict, without fallback logic or error details. Three issues: (1) When creating a new thread_type fails (e.g., duplicate `code`), the entire row is skipped instead of falling back to find the existing record by `tex_number`. (2) The `thread_type_supplier` upsert only handles `UNIQUE(thread_type_id, supplier_id)` conflict but not `UNIQUE(supplier_id, supplier_item_code)`, causing silent failures. (3) Skipped rows return only a count with no detail — users cannot debug which rows failed or why.

## What Changes

- Backend import logic gets fallback lookup when thread_type insert fails — find existing by `tex_number` instead of skipping
- Backend `thread_type_supplier` upsert replaced with check-then-update/insert pattern to handle both unique constraints
- Backend collects per-row skip reasons and returns them in the response
- Response type extended with `skipped_details` array
- Frontend import result screen shows which rows were skipped and why

## Capabilities

### New Capabilities

### Modified Capabilities
- `import-supplier-tex`: Backend import resilience — fallback lookup for thread_type, handle dual unique constraints on thread_type_supplier, return per-row skip details in response, frontend displays skip reasons

## Impact

- `server/routes/import.ts` — Rewrite import loop logic (thread_type fallback, supplier link upsert, error collection)
- `src/types/thread/import.ts` — Extend `ImportTexResponse` with `skipped_details`
- `src/pages/thread/suppliers/import-tex.vue` — Display skip details in result step
