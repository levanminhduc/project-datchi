## ADDED Requirements

### Requirement: Add item to PO
The system SHALL allow adding a new item (style + quantity) to an existing PO.

#### Scenario: Successfully add item to PO
- **WHEN** user sends POST `/api/purchase-orders/:id/items` with valid `style_id` and `quantity`
- **THEN** system creates `po_items` record with provided data
- **AND** system logs entry to `po_item_history` with change_type='CREATE'
- **AND** system returns the created item with status 201

#### Scenario: Add item with non-existent style
- **WHEN** user sends POST with `style_id` that doesn't exist in `styles` table
- **THEN** system returns error with status 400 and message indicating style not found

#### Scenario: Add duplicate style to same PO
- **WHEN** user sends POST with `style_id` that already exists for this PO (not deleted)
- **THEN** system returns error with status 409 and message indicating duplicate

### Requirement: Update item quantity
The system SHALL allow updating the quantity of an existing PO item.

#### Scenario: Successfully update quantity
- **WHEN** user sends PUT `/api/purchase-orders/:id/items/:itemId` with new `quantity`
- **THEN** system updates `po_items.quantity`
- **AND** system logs entry to `po_item_history` with change_type='UPDATE', previous_quantity, new_quantity
- **AND** system returns the updated item

#### Scenario: Update quantity below already ordered
- **WHEN** user sends PUT with quantity less than sum of existing weekly order quantities for this PO/style pair
- **THEN** system returns error with status 400 and message indicating minimum allowed quantity

#### Scenario: Update non-existent item
- **WHEN** user sends PUT for item that doesn't exist or is deleted
- **THEN** system returns error with status 404

### Requirement: Delete item from PO
The system SHALL allow soft-deleting an item from a PO.

#### Scenario: Successfully delete item
- **WHEN** user sends DELETE `/api/purchase-orders/:id/items/:itemId`
- **THEN** system sets `po_items.deleted_at` to current timestamp
- **AND** system logs entry to `po_item_history` with change_type='DELETE'
- **AND** system returns status 200

#### Scenario: Delete item with existing weekly orders
- **WHEN** user sends DELETE for item that has associated weekly order items
- **THEN** system returns error with status 400 and message indicating item has orders

### Requirement: View item history
The system SHALL allow viewing the change history for a PO item.

#### Scenario: Get history for item
- **WHEN** user sends GET `/api/purchase-orders/:id/items/:itemId/history`
- **THEN** system returns list of `po_item_history` records ordered by `created_at` DESC
- **AND** each record includes `changed_by` employee name

#### Scenario: Get history for non-existent item
- **WHEN** user sends GET for item that doesn't exist
- **THEN** system returns error with status 404

### Requirement: Soft delete support
The system SHALL support soft delete for PO items via `deleted_at` column.

#### Scenario: Deleted items excluded from queries
- **WHEN** user fetches PO with items (include=items)
- **THEN** system excludes items where `deleted_at` is not null

#### Scenario: Audit trigger logs all changes
- **WHEN** any INSERT, UPDATE, or DELETE occurs on `po_items`
- **THEN** system automatically logs to `thread_audit_log` via trigger
