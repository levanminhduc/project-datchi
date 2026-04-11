## ADDED Requirements

### Requirement: Backend endpoint to remove PO from weekly order
The system SHALL provide a `POST /api/weekly-orders/:weekId/remove-po` endpoint that deletes all `thread_order_items` for a given PO within a weekly order. The endpoint SHALL require the `thread.allocations.manage` permission. The request body SHALL be validated with Zod and MUST contain `po_id` as a positive integer.

#### Scenario: Successfully remove PO from DRAFT week
- **WHEN** `POST /api/weekly-orders/5/remove-po` is called with `{ po_id: 12 }`
- **AND** week 5 exists with status DRAFT
- **AND** week 5 has 3 items with po_id=12
- **THEN** all 3 `thread_order_items` rows with week_id=5 AND po_id=12 SHALL be deleted
- **AND** the response SHALL return `{ data: { removed_count: 3 }, error: null, message: "Da xoa PO khoi don dat hang" }`

#### Scenario: Successfully remove PO from CONFIRMED week
- **WHEN** `POST /api/weekly-orders/5/remove-po` is called with `{ po_id: 12 }`
- **AND** week 5 exists with status CONFIRMED
- **THEN** the items SHALL be deleted and the response SHALL return the removed count

#### Scenario: Reject removal from COMPLETED week
- **WHEN** `POST /api/weekly-orders/5/remove-po` is called with `{ po_id: 12 }`
- **AND** week 5 has status COMPLETED
- **THEN** the response SHALL return HTTP 400 with `{ data: null, error: "Khong the xoa PO tu don da hoan thanh hoac da huy" }`

#### Scenario: Reject removal from CANCELLED week
- **WHEN** `POST /api/weekly-orders/5/remove-po` is called with `{ po_id: 12 }`
- **AND** week 5 has status CANCELLED
- **THEN** the response SHALL return HTTP 400

#### Scenario: Week not found
- **WHEN** `POST /api/weekly-orders/999/remove-po` is called
- **AND** week 999 does not exist
- **THEN** the response SHALL return HTTP 404 with `{ data: null, error: "Khong tim thay tuan dat hang" }`

#### Scenario: PO has no items in the week
- **WHEN** `POST /api/weekly-orders/5/remove-po` is called with `{ po_id: 99 }`
- **AND** no `thread_order_items` exist for week_id=5 AND po_id=99
- **THEN** the response SHALL return `{ data: { removed_count: 0 }, error: null }`

#### Scenario: Invalid po_id
- **WHEN** `POST /api/weekly-orders/5/remove-po` is called with `{ po_id: -1 }`
- **THEN** Zod validation SHALL reject the request with HTTP 400

---

### Requirement: Zod validation schema for remove-po
The system SHALL define a `RemovePOFromWeekSchema` in `server/validation/weeklyOrder.ts` that validates the request body. The schema SHALL require `po_id` as a positive integer.

#### Scenario: Valid body
- **WHEN** the request body is `{ po_id: 12 }`
- **THEN** validation SHALL pass

#### Scenario: Missing po_id
- **WHEN** the request body is `{}`
- **THEN** validation SHALL fail

#### Scenario: Non-positive po_id
- **WHEN** the request body is `{ po_id: 0 }`
- **THEN** validation SHALL fail with a message indicating po_id must be a positive integer

---

### Requirement: Frontend service method for PO removal
The `weeklyOrderService` SHALL provide a `removePOFromWeek(weekId: number, poId: number)` method that calls `POST /api/weekly-orders/:weekId/remove-po` with `{ po_id: poId }`. The method SHALL throw an error if the API returns an error.

#### Scenario: Successful removal
- **WHEN** `removePOFromWeek(5, 12)` is called
- **AND** the API returns `{ data: { removed_count: 3 }, error: null }`
- **THEN** the method SHALL return `{ removed_count: 3 }`

#### Scenario: API error
- **WHEN** `removePOFromWeek(5, 12)` is called
- **AND** the API returns `{ data: null, error: "Khong the xoa PO" }`
- **THEN** the method SHALL throw an Error with the message from the API

---

### Requirement: Frontend handleRemovePO calls backend for persisted weeks
The `handleRemovePO` function in the weekly order page SHALL call the backend `removePOFromWeek` service method when the current week is persisted (has a database ID). For unsaved weeks (no ID), the function SHALL retain its current client-side-only behavior.

#### Scenario: Remove PO from persisted week
- **WHEN** the user clicks the remove button on a PO card
- **AND** `selectedWeek.value.id` exists (week is persisted)
- **THEN** `weeklyOrderService.removePOFromWeek(weekId, poId)` SHALL be called
- **AND** on success, the PO SHALL be removed from `loadedPOs` and `orderEntries`
- **AND** a success snackbar SHALL be displayed

#### Scenario: Remove PO from unsaved week
- **WHEN** the user clicks the remove button on a PO card
- **AND** `selectedWeek.value` is null or has no ID
- **THEN** no API call SHALL be made
- **AND** the PO SHALL be removed from client state only (current behavior)

#### Scenario: Backend call fails
- **WHEN** the user removes a PO from a persisted week
- **AND** the backend call fails
- **THEN** the PO SHALL NOT be removed from client state
- **AND** an error snackbar SHALL be displayed

---

### Requirement: Route ordering for remove-po
The `POST /:id/remove-po` route SHALL be registered BEFORE the generic `PUT /:id` and `DELETE /:id` routes in `core.ts` to ensure Hono matches the specific path before the parameterized route.

#### Scenario: Route matching
- **WHEN** a POST request is sent to `/api/weekly-orders/5/remove-po`
- **THEN** the request SHALL be handled by the remove-po route handler, not the generic `/:id` route
