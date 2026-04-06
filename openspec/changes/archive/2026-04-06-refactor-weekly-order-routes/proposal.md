## Why

`server/routes/weeklyOrder.ts` has grown to ~3500 lines with 28 routes, making it the largest single route file in the project. This size makes navigation, code review, and maintenance difficult. Splitting it into focused sub-modules follows the existing pattern established by `issuesV2.ts` (which uses Hono sub-routers) and keeps each file within the project's ~200-line soft limit (targeting ~700-800 lines per route file given the density of route handlers).

## What Changes

- Split `server/routes/weeklyOrder.ts` into a `server/routes/weekly-order/` directory with 5 focused files:
  - `helpers.ts` — shared validators, utilities, and a new `getPerformerName()` helper extracted from 4 duplicated auth-to-employee lookup patterns (DRY improvement)
  - `core.ts` — CRUD operations, status transitions, check-name, assignment-summary (8 routes)
  - `calculation.ts` — calculation results, enrichment, quota, live summaries, ordered quantities (6 routes)
  - `deliveries.ts` — delivery CRUD, receiving, overview, per-week listing, history (5 routes)
  - `loans-reservations.ts` — loans, reservations, completions, surplus preview/release (18 routes, but loan and reservation logic is tightly coupled)
  - `index.ts` — creates the main Hono router, mounts sub-routers in correct order, re-exports
- Update `server/index.ts` import path from `'./routes/weeklyOrder'` to `'./routes/weekly-order'`
- Delete the original `server/routes/weeklyOrder.ts`
- Clean up task-reference comments (e.g., `// Task 6.1:`, `// ISSUE-2 FIX:`) during the move
- No business logic changes whatsoever — all route handler bodies remain identical

## Capabilities

### New Capabilities

(none — this is a structural refactor with no new behavior)

### Modified Capabilities

(none — no requirement-level changes to any existing capability)

## Impact

- **Files created**: 6 new files under `server/routes/weekly-order/`
- **Files modified**: `server/index.ts` (1 import path change)
- **Files deleted**: `server/routes/weeklyOrder.ts`
- **APIs**: Zero changes to any API endpoint, request/response format, or route path
- **Dependencies**: No new packages. Validation schemas (`server/validation/weeklyOrder.ts`) and types (`server/types/weeklyOrder.ts`) remain unchanged
- **Risk**: Route ordering must be preserved when mounting sub-routers (Hono matches routes in registration order). Static paths must come before parameterized `/:id` paths within each sub-router and across mount order
