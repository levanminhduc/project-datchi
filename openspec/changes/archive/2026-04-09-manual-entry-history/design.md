## Context

The inventory page (`src/pages/thread/inventory.vue`) has a "Nhap Thu Cong" button that opens a dialog for manual stock entry. This creates lots with the prefix `MC-LOT-{YYYYMMDD}-{HHmmss}` in the `lots` table and individual cones in `thread_inventory`. Currently there is no way to view past manual entries, making auditing and troubleshooting impossible.

The `lots` table already has `thread_type_id`, `warehouse_id`, `supplier_id`, `total_cones`, `created_at`, but lacks a `created_by_employee_id` column to track who performed the entry.

Existing patterns to follow:
- Server-side pagination: `GET /api/inventory` with `page`, `pageSize`, `sortBy`, `descending` query params, `.range()` + `{ count: 'exact' }` (see `server/routes/inventory.ts`)
- Service pattern: `inventoryService.getPaginated()` in `src/services/inventoryService.ts`
- Dialog pattern: `FormDialog` wrapper or `AppDialog` in `src/components/ui/dialogs/`
- Permission guard: `requirePermission('thread.batch.receive')` in Hono routes

## Goals / Non-Goals

**Goals:**
- Allow users to view a paginated list of past manual stock entries
- Track which employee created each manual entry going forward
- Reuse existing pagination, dialog, and permission patterns

**Non-Goals:**
- Editing or deleting past manual entries (read-only view)
- Retroactively populating `created_by_employee_id` for existing lots (existing rows will show NULL)
- Filtering/searching within the history dialog (keep initial implementation simple)
- Viewing history for return entries (`RTN-LOT-%`) -- only manual entries (`MC-LOT-%`)

## Decisions

### 1. Query lots table directly (not a view or RPC)

**Decision**: Query `lots` table with `lot_number LIKE 'MC-LOT-%'` filter and join related tables.

**Rationale**: The query is straightforward -- a single filtered query with joins. Creating a database view or RPC function would add unnecessary complexity for a simple read operation. If performance becomes an issue later, a view can be added.

**Alternative considered**: Create a `v_manual_entry_history` database view. Rejected because the query is simple enough to express directly in the route handler, and adding a view increases migration complexity for minimal benefit.

### 2. Use AppDialog (not FormDialog) for the history dialog

**Decision**: Use `q-dialog` directly (or `AppDialog`) since this is a read-only data display dialog, not a form submission dialog.

**Rationale**: `FormDialog` wraps content in a `<q-form>` with submit/cancel actions, which is inappropriate for a read-only paginated table. A plain dialog with just a close button is more suitable.

**Alternative considered**: FormDialog with hidden submit button. Rejected as semantically wrong and adds unnecessary form handling.

### 3. New endpoint on stock routes (not lots routes)

**Decision**: Add `GET /api/stock/manual-history` to `server/routes/stock.ts`.

**Rationale**: Manual stock entry is managed through the stock routes (`POST /api/stock`). Keeping the history endpoint co-located with the creation endpoint maintains cohesion. The lots routes (`server/routes/lots.ts`) are for general lot CRUD management.

**Alternative considered**: `GET /api/lots?prefix=MC-LOT` on the lots router. Rejected because it conflates lot management with manual entry history, and the lots router uses a different permission (`thread.lots.manage`).

### 4. Nullable created_by_employee_id column

**Decision**: Add `created_by_employee_id INTEGER REFERENCES employees(id)` as nullable to the `lots` table.

**Rationale**: Existing lots were created without this information. Making the column nullable avoids a backfill migration and keeps the migration simple and safe. The UI will display an empty cell for older entries.

### 5. Reuse thread.batch.receive permission

**Decision**: Gate the history endpoint and UI button with the existing `thread.batch.receive` permission.

**Rationale**: Viewing manual entry history is closely related to performing manual entries. Creating a new permission would add unnecessary configuration overhead. Users who can create manual entries should be able to see their history.

## Risks / Trade-offs

- **[Risk] Large number of manual entries could slow pagination**: The `LIKE 'MC-LOT-%'` filter on `lot_number` (VARCHAR with UNIQUE index) should be efficient for prefix matching. If needed, add a partial index `CREATE INDEX idx_lots_manual ON lots(created_at DESC) WHERE lot_number LIKE 'MC-LOT-%'`. Mitigation: start without the index, monitor query performance.

- **[Risk] Partial cone count requires subquery on thread_inventory**: Counting partial cones per lot requires a join/subquery to `thread_inventory WHERE lot_id = lots.id AND is_partial = true`. This adds query complexity. Mitigation: use a single aggregation query or compute partial count as `total_cones - full_count` on the frontend.

- **[Trade-off] No retroactive employee tracking**: Existing manual entries will show "N/A" for the employee column. This is acceptable since the feature is new and historical data cannot be recovered.
