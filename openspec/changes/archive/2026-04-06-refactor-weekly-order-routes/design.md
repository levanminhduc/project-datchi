## Context

`server/routes/weeklyOrder.ts` is the largest route file in the project at 3500 lines, containing 28 routes across 5 distinct functional areas (CRUD/status, calculations, deliveries, loans, reservations). The project convention targets ~200 lines per file, and the existing `issuesV2.ts` demonstrates the Hono sub-router pattern (`router.route('/', subRouter)`) for splitting large route files.

The file is currently stable with no pending feature work against it, making this an ideal time for the structural refactor.

## Goals / Non-Goals

**Goals:**
- Split into 5 focused route files + 1 helpers module + 1 index re-export, each under ~800 lines
- Follow the established Hono sub-router pattern from `issuesV2.ts`
- Extract `getPerformerName()` helper to DRY up 4 duplicated auth-to-employee lookup patterns
- Clean up stale task-reference comments (`// Task 6.1:`, `// ISSUE-2 FIX:`)
- Maintain zero API surface changes (all 28 endpoints remain identical from the client's perspective)

**Non-Goals:**
- Changing any business logic, validation, or response format
- Refactoring validation schemas (`server/validation/weeklyOrder.ts`) or types (`server/types/weeklyOrder.ts`)
- Renaming API endpoints
- Adding tests (existing E2E coverage remains valid)

## Decisions

### 1. Directory structure: `server/routes/weekly-order/` (kebab-case folder with index.ts)

**Choice:** Kebab-case directory with `index.ts` re-export, matching project naming conventions.

**Alternative considered:** Keep `weeklyOrder/` (camelCase) to match the original filename. Rejected because project convention uses kebab-case for all new files.

**Import change:** `server/index.ts` changes from `'./routes/weeklyOrder'` to `'./routes/weekly-order'` (resolves to `weekly-order/index.ts`).

### 2. Sub-router mounting via `router.route('/', subRouter)`

**Choice:** Each file exports its own `new Hono<AppEnv>()` instance with routes registered locally. The index.ts mounts all sub-routers on `'/'`.

**Rationale:** This is the exact pattern used by `issuesV2.ts` with `returnGroupedRoutes`. Each sub-router is self-contained and testable independently.

**Alternative considered:** Passing the parent router to each module as a function parameter. Rejected because the sub-router pattern is already established and provides better isolation.

### 3. Mount order in index.ts determines route priority

**Choice:** Mount sub-routers in this order: core -> calculation -> deliveries -> loans-reservations.

**Rationale:** Hono matches routes in registration order. Within each sub-router, static paths (e.g., `/check-name`, `/deliveries/overview`, `/loans/summary`) are already registered before parameterized `/:id` paths. By mounting core first, the static routes in core (`/check-name`, `/assignment-summary`) are matched before any `/:id` route in later sub-routers.

**Critical constraint:** Each sub-router must internally order its own routes with static paths before `/:id` paths.

### 4. File split by functional domain

**Choice:** Split into 5 domain-focused files:

| File | Routes | Lines (~) | Domain |
|------|--------|-----------|--------|
| `helpers.ts` | 0 | 150 | Shared validators + `getPerformerName()` |
| `core.ts` | 8 | 700 | CRUD, status transitions, check-name, assignment-summary |
| `calculation.ts` | 6 | 700 | Results, enrichment, quota, live summaries |
| `deliveries.ts` | 5 | 750 | Delivery CRUD, receiving, overview, history |
| `loans-reservations.ts` | 18 | 800 | Loans, reservations, completions, surplus |

**Alternative considered:** Splitting loans and reservations into separate files. Rejected because they share significant context (both operate on the same weekly order items, surplus involves both) and the combined file stays within the ~800 line target.

### 5. `getPerformerName()` extraction (DRY)

**Choice:** Extract the repeated pattern of reading JWT claims to get `employee_id`, querying the `employees` table for `full_name`, and falling back to a default. This appears in at least 4 route handlers (status update, delivery receive, loan creation, surplus release).

**Signature:**
```typescript
async function getPerformerName(c: Context<AppEnv>): Promise<string>
```

Returns the employee's full_name or `'Hệ thống'` as fallback.

### 6. Each sub-router file imports what it needs directly

**Choice:** Each file has its own import statements for Hono, supabase, middleware, validation schemas, and helpers.

**Rationale:** Avoids creating a barrel file of shared imports that would couple the modules. Each file is self-documenting about its dependencies.

## Risks / Trade-offs

- **[Route order regression]** If a future developer adds a new route to a sub-router without considering mount order, it could shadow an existing route in another sub-router. Mitigation: The index.ts file will have a comment documenting the mount order constraint.

- **[Import duplication]** Each sub-router repeats common imports (Hono, supabase, middleware). Trade-off: Accepted for module independence. The duplication is limited to import statements, not logic.

- **[Merge conflicts during refactor]** If other branches touch `weeklyOrder.ts` concurrently, the refactor will conflict. Mitigation: This is a pure refactor on a feature branch; merge the latest main before starting implementation.
