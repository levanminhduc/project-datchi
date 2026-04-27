## ADDED Requirements

### Requirement: Backend search-po endpoint
The system SHALL provide a `GET /api/weekly-order/search-po?q=<term>` endpoint that searches `purchase_orders.po_number` using case-insensitive partial match (ILIKE) and returns the weeks containing matching POs along with the count of RESERVED cones per week.

Response format:
```json
{
  "data": [
    {
      "po_id": 1,
      "po_number": "PO-001",
      "weeks": [
        { "week_id": 10, "week_name": "Tuần 10", "total_cones": 50 },
        { "week_id": 11, "week_name": "Tuần 11", "total_cones": 30 }
      ]
    }
  ],
  "error": null
}
```

The endpoint SHALL require the `thread.batch.transfer` permission.
The endpoint SHALL return empty `data: []` when no PO matches (not an error).
The `total_cones` field SHALL count `thread_inventory` rows where `reserved_week_id = week_id` AND `status = 'RESERVED_FOR_ORDER'` (across all warehouses).

#### Scenario: Search returns matching POs with weeks
- **WHEN** `GET /api/weekly-order/search-po?q=PO-001` is called and PO-001 exists in weeks 10 and 11
- **THEN** response has `data` array with 1 entry for PO-001, each entry has `weeks` array with 2 items, each item has `week_id`, `week_name`, `total_cones`

#### Scenario: Search with no matches returns empty array
- **WHEN** `GET /api/weekly-order/search-po?q=NONEXISTENT` is called
- **THEN** response is `{ data: [], error: null }` with HTTP 200

#### Scenario: Search with missing q param returns error
- **WHEN** `GET /api/weekly-order/search-po` is called without `q` param
- **THEN** response is `{ data: null, error: "Tham số tìm kiếm không hợp lệ" }` with HTTP 400

#### Scenario: Route order — search-po does not conflict with /:weekId routes
- **WHEN** `GET /api/weekly-order/search-po?q=PO` is called
- **THEN** Hono matches the `search-po` literal route, NOT `/:weekId/reserved-by-po`

### Requirement: PoSearchPopup component
The system SHALL provide a `PoSearchPopup.vue` component that:
- Renders a text input labeled "Tìm PO"
- Debounces input by 300ms before calling the search API
- Shows a dropdown/popup listing matching POs and their weeks
- Each week item shows: `<po_number> — <week_name> (<total_cones> cuộn)`
- Emits `select-week` event with `{ weekId: number, poNumber: string }` when user clicks a week item
- Shows a loading indicator while fetching
- Shows "Không tìm thấy PO" when results are empty and input is non-empty

#### Scenario: User types PO number and sees results
- **WHEN** user types "PO-001" in the search input and waits 300ms
- **THEN** popup appears showing weeks containing PO-001 with cone counts

#### Scenario: User selects a week from popup
- **WHEN** user clicks on "Tuần 10 (50 cuộn)" in the popup
- **THEN** component emits `select-week` with `{ weekId: 10, poNumber: "PO-001" }`

#### Scenario: User clears input
- **WHEN** user clears the search input
- **THEN** popup closes and no search is performed

#### Scenario: Empty results message
- **WHEN** search returns no matching POs for non-empty input
- **THEN** popup shows "Không tìm thấy PO" message

### Requirement: Page integrates PoSearchPopup with auto-fill and scroll
The page `transfer-reserved.vue` SHALL:
- Display `PoSearchPopup` next to the "Tuần đặt hàng" dropdown
- When `select-week` is emitted, set `weekId` to the received `weekId` and call `fetchData()`
- After data loads, scroll to the PoSection matching the searched `poNumber` using `scrollIntoView({ behavior: 'smooth' })`
- Clear the search input after successful week selection

#### Scenario: Auto-fill week on PO selection
- **WHEN** user selects a week from PoSearchPopup
- **THEN** the "Tuần đặt hàng" dropdown updates to that week and data is reloaded

#### Scenario: Scroll to PO section after data loads
- **WHEN** data finishes loading after a PO search selection
- **THEN** the page scrolls smoothly to the PoSection matching the searched PO number

#### Scenario: PoSearchPopup next to week dropdown
- **WHEN** user opens the transfer-reserved page
- **THEN** a "Tìm PO" input is visible alongside the "Tuần đặt hàng" dropdown in the filter card
