## Context

The Weekly Order system validates ordering limits against `po_items.quantity`. Currently:
- `purchase_orders` table exists with full CRUD API
- `po_items` table exists but has NO API for management (read-only via PO include)
- No UI for managing PO items
- Import patterns exist: `import-tex.vue`, `import-colors.vue` with configurable mapping in Settings

Production planning users need to populate `po_items` from customer Excel files and occasionally edit quantities manually.

## Goals / Non-Goals

**Goals:**
- Enable import of PO items from Excel with preview and validation
- Provide UI for manual CRUD of PO items
- Track history of quantity changes (who, when, old/new values)
- Follow existing patterns (import-tex, soft delete, audit triggers)

**Non-Goals:**
- Changing existing `purchase_orders` API structure
- Bulk operations beyond Excel import
- Real-time sync with external ERP systems
- Changing Weekly Order validation logic

## Decisions

### 1. Soft Delete for `po_items`

**Decision**: Add `deleted_at` column to `po_items`

**Rationale**:
- Consistent with other tables (`purchase_orders`, `styles`, etc.)
- Allows item removal without cascade
- Preserves history for audit

**Alternatives considered**:
- Hard delete with CASCADE → Loses history, can't undo
- Rely only on PO cascade → Can't remove individual items

### 2. History Tracking: Dual Approach

**Decision**: Both audit trigger AND dedicated `po_item_history` table

**Rationale**:
- Audit trigger (`fn_thread_audit_trigger_func`) → full CDC for all changes
- Dedicated table → business-friendly UI display with explicit fields

**`po_item_history` schema**:
```sql
CREATE TYPE po_item_change_type AS ENUM ('CREATE', 'UPDATE', 'DELETE');

CREATE TABLE po_item_history (
  id SERIAL PRIMARY KEY,
  po_item_id INTEGER NOT NULL REFERENCES po_items(id),
  changed_by INTEGER NOT NULL REFERENCES employees(id),
  change_type po_item_change_type NOT NULL,
  previous_quantity INTEGER,
  new_quantity INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_po_item_history_po_item_id ON po_item_history(po_item_id);
```

**Alternatives considered**:
- Audit trigger only → Hard to query for specific business needs
- History table only → Misses trigger-based changes (direct SQL)

### 3. Import Strategy: ADDITIVE

**Decision**: Import only adds new items and updates existing quantities. Never deletes.

**Rationale**:
- Safe: Forgetting an item in Excel won't delete it from DB
- Users can delete manually via UI if needed
- Matches user expectation ("add more data")

**Import logic**:
```
For each Excel row:
1. Validate style_code exists in DB → Error if not found
2. Find or create PO by po_number
3. Find po_item by (po_id, style_id):
   - Not found → INSERT, log history (CREATE)
   - Found, quantity different → UPDATE, log history (UPDATE)
   - Found, quantity same → Skip (no change)
```

### 4. API Structure

**Decision**: Extend existing `purchaseOrders.ts` with nested item routes

**Routes**:
```
POST   /api/purchase-orders/:id/items           # Add item
PUT    /api/purchase-orders/:id/items/:itemId   # Update quantity
DELETE /api/purchase-orders/:id/items/:itemId   # Soft delete
GET    /api/purchase-orders/:id/items/:itemId/history  # Get changes

POST   /api/import/po-items/parse    # Parse Excel, return preview
POST   /api/import/po-items/execute  # Execute import
```

**Rationale**: Nested under PO maintains REST hierarchy, consistent with existing patterns.

### 5. Settings: Import Mapping Configuration

**Decision**: Add section to existing Settings page following `import-tex` pattern

**Config structure**:
```typescript
{
  sheet_index: number,
  header_row: number,
  data_start_row: number,
  columns: {
    po_number: string,      // required, e.g., 'A'
    style_code: string,     // required, e.g., 'B'
    quantity: string,       // required, e.g., 'C'
    customer_name: string,  // optional, e.g., 'D'
    order_date: string,     // optional, e.g., 'E'
    notes: string           // optional, e.g., 'F'
  }
}
```

### 6. Page Structure

**Decision**: Three pages under `/thread/purchase-orders/`

| Page | Purpose |
|------|---------|
| `index.vue` | List all POs with filters, create new PO button |
| `[id].vue` | PO detail with items table, add/edit/delete items, view history |
| `import.vue` | Stepper: Upload → Preview → Results |

**Rationale**: Separates concerns, matches existing patterns (styles, lots, suppliers).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Weekly order has items with old quantity | `validatePOQuantityLimits` checks current `po_items.quantity`, so editing is safe as long as new quantity >= already ordered |
| Import performance with large files | Row-by-row processing with skip tracking (matches existing pattern). For huge files, consider batch insert in future |
| User imports wrong file | Preview step shows validation errors before execute |
| History table grows large | Index on `po_item_id`, consider cleanup policy later |
| Concurrent edits | Last write wins (acceptable for this use case) |

## Migration Plan

1. **Database migration** (single file):
   - Add `deleted_at` to `po_items`
   - Create `po_item_history` table
   - Attach audit trigger to `po_items`

2. **Backend deployment**:
   - Add item routes to `purchaseOrders.ts`
   - Add import routes to `import.ts`
   - Add settings key for PO import mapping

3. **Frontend deployment**:
   - Add pages and components
   - Update Settings page
   - Update sidebar menu

**Rollback**: Remove migration (drop column, drop table, drop trigger). Frontend changes are additive and safe.
