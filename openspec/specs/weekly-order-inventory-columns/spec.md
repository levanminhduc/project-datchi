## ADDED Requirements

### Requirement: Backend inventory enrichment endpoint
The system SHALL provide a `POST /api/weekly-orders/enrich-inventory` endpoint that accepts an array of summary rows and returns them enriched with current inventory data. The endpoint SHALL query the `thread_inventory` table for cones with status `AVAILABLE`, aggregate by `thread_type_id`, and compute deficit values. The endpoint SHALL also compute `delivery_date` for each row by looking up the supplier's `lead_time_days` from the `suppliers` table using the `supplier_id` field in each summary row.

#### Scenario: Successful enrichment with mixed inventory
- **WHEN** the endpoint receives summary_rows containing thread_type_ids [42, 55] where thread_type_id 42 has total_cones=191 and thread_type_id 55 has total_cones=80
- **AND** thread_inventory has 50 full cones + 9 partial cones for thread_type_id 42 (status=AVAILABLE) and 100 full cones for thread_type_id 55
- **THEN** the response SHALL return enriched rows where thread_type_id 42 has inventory_cones=59, sl_can_dat=132, additional_order=0, total_final=132
- **AND** thread_type_id 55 has inventory_cones=100, sl_can_dat=0, additional_order=0, total_final=0

#### Scenario: Thread type with no inventory records
- **WHEN** the endpoint receives a summary row with thread_type_id=99 that has no matching records in thread_inventory with status=AVAILABLE
- **THEN** the response SHALL return that row with inventory_cones=0, sl_can_dat=total_cones, additional_order=0, total_final=total_cones

#### Scenario: Invalid request body
- **WHEN** the endpoint receives a request without valid summary_rows array
- **THEN** the response SHALL return HTTP 400 with a validation error message

#### Scenario: Passthrough of original fields
- **WHEN** the endpoint receives summary rows with fields like thread_type_name, supplier_name, tex_number, supplier_id, delivery_date, etc.
- **THEN** the response SHALL preserve all original fields and add the computed fields

---

### Requirement: Display available inventory cones per thread type
The summary table SHALL display a "Ton kho KD" column showing the number of available cones for each thread type as returned by the backend enrichment endpoint.

#### Scenario: Inventory data displayed after calculation
- **WHEN** calculation completes and the enrich endpoint returns enriched rows
- **THEN** each row SHALL display inventory_cones value in the "Ton kho KD" column
- **AND** when inventory_cones is 0, the column SHALL display "—"

#### Scenario: Positive inventory value formatting
- **WHEN** inventory_cones is greater than 0
- **THEN** the value SHALL be formatted with Vietnamese locale number formatting

---

### Requirement: Auto-calculate required order quantity
The summary table SHALL display a "SL can dat" column showing the deficit between required cones and available inventory. This value is computed by the backend enrichment endpoint.

#### Scenario: Deficit when inventory is insufficient
- **WHEN** total_cones is 191 and inventory_cones is 59
- **THEN** sl_can_dat SHALL be 132 (= max(0, 191 - 59))

#### Scenario: No deficit when inventory is sufficient
- **WHEN** total_cones is 50 and inventory_cones is 80
- **THEN** sl_can_dat SHALL be 0 and the column SHALL display "—"

---

### Requirement: Manual additional order input
The summary table SHALL display a "Dat them" column where users can manually enter additional/buffer quantities per row via q-popup-edit.

#### Scenario: User enters additional order quantity
- **WHEN** user clicks on the "Dat them" cell for a row
- **THEN** a popup editor SHALL appear with a number input
- **AND** upon confirmation the value SHALL update the row's additional_order field
- **AND** total_final SHALL be recalculated as sl_can_dat + additional_order

#### Scenario: Default additional order value
- **WHEN** enrichment returns rows for the first time
- **THEN** all rows SHALL have additional_order=0
- **AND** the column SHALL display "—" for 0 values

#### Scenario: Additional order persisted on save
- **WHEN** user saves weekly order results
- **THEN** additional_order values SHALL be included in the summary_data JSONB
- **AND** when loading saved results, additional_order values SHALL restore from JSONB

---

### Requirement: Auto-calculate final order total
The summary table SHALL display a "Tong chot" column showing sl_can_dat + additional_order.

#### Scenario: Final total with additional order
- **WHEN** sl_can_dat is 132 and additional_order is 20
- **THEN** total_final SHALL display 152

#### Scenario: Final total when both are zero
- **WHEN** sl_can_dat is 0 and additional_order is 0
- **THEN** total_final SHALL display "—"

#### Scenario: Final total when only additional order exists
- **WHEN** sl_can_dat is 0 and additional_order is 10
- **THEN** total_final SHALL display 10

---

### Requirement: History displays snapshot (Option A)
When loading saved weekly order results, the system SHALL display the inventory data exactly as it was saved, without re-querying current inventory.

#### Scenario: Load saved results with inventory data
- **WHEN** user loads a previously saved weekly order that has inventory_cones, sl_can_dat, additional_order, and total_final in summary_data
- **THEN** the system SHALL display those saved values as-is
- **AND** SHALL NOT call the enrich-inventory endpoint

#### Scenario: Load old results without inventory data
- **WHEN** user loads a weekly order saved before this feature existed (no inventory fields in summary_data)
- **THEN** the inventory columns SHALL display "—" for all rows

#### Scenario: User recalculates to refresh inventory
- **WHEN** user presses "Tinh lai" (recalculate) on a loaded weekly order
- **THEN** the system SHALL run calculateAll() which calls the enrich endpoint
- **AND** the inventory data SHALL be updated with current stock levels

---

### Requirement: Excel export includes new columns
The Excel export SHALL include all inventory columns and the delivery date column with their values.

#### Scenario: Export with inventory and delivery columns
- **WHEN** user exports aggregated results to Excel
- **THEN** the exported file SHALL include columns: Ton kho KD, SL can dat, Dat them, Tong chot
- **AND** values SHALL match what is displayed in the table
- **AND** 0 values SHALL be exported as empty cells
