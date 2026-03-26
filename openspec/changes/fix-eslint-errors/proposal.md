## Why

The codebase has 17 ESLint errors across 12 files that block clean CI/lint runs. These are unused imports, unused variables, empty interfaces, an empty template, and a multiline function call issue. Fixing them ensures `npm run lint` passes with zero errors.

## What Changes

- Remove unused imports and variables in 7 backend route files
- Remove unused imports in 4 Vue components
- Replace empty-extends interfaces with type aliases in `warehouses.ts`
- Add placeholder content to empty template in `ColorSelector.vue`
- Fix unexpected multiline function call in `reports.ts`

## Capabilities

### New Capabilities

_None — this is a cleanup change with no new functionality._

### Modified Capabilities

_None — no spec-level behavior changes._

## Impact

- **Backend routes**: `batch.ts`, `issuesV2.ts`, `notifications.ts`, `recovery.ts`, `reports.ts`, `warehouses.ts`
- **Frontend components**: `BarcodeScanField.vue`, `ScaleConnectionDialog.vue`, `ConflictDialog.vue`, `OfflineSyncBanner.vue`, `AllocationFormDialog.vue`, `ColorSelector.vue`
- **No behavior changes** — all fixes are removing dead code or fixing lint-only issues
- **No API changes** — no endpoints affected
- **No database changes**
