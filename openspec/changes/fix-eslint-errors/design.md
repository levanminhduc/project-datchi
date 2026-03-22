## Context

The codebase has 17 ESLint errors across 12 files. These are all dead code (unused imports/variables), empty-extends interfaces, one empty Vue template, and one multiline function call issue. No architectural decisions needed.

## Goals / Non-Goals

**Goals:**
- `npm run lint` passes with zero errors
- Remove all dead code identified by ESLint

**Non-Goals:**
- Fixing ESLint warnings (no-explicit-any, require-default-prop, no-template-shadow)
- Refactoring or improving any logic
- Adding tests

## Decisions

1. **Unused imports/variables**: Remove them. If a destructured variable is needed for the call but not used, prefix with `_` (e.g., `const { data: _data, error }`) or omit entirely if possible.
2. **Empty-extends interfaces** (`interface Warehouse extends WarehouseRow {}`): Replace with `type Warehouse = WarehouseRow` — semantically identical, lint-clean.
3. **Empty template** (`ColorSelector.vue`): Add a minimal `<div />` placeholder since the component is a TODO stub.
4. **Multiline function call** (`reports.ts:106`): Join the expression to the same line or add semicolon to prevent ASI issue.

## Risks / Trade-offs

- [Low] Removing unused function `generateMovementCode` in `recovery.ts` — if needed later, git history preserves it. → Acceptable.
- [Low] Removing `MAX_BATCH_SIZE` import in `batch.ts` — the file uses local `BATCH_LIMIT = 500` instead. → No behavior change.
