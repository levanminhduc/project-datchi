## MODIFIED Requirements

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

### Requirement: Excel export includes new columns
The Excel export SHALL include all inventory columns and the delivery date column with their values.

#### Scenario: Export with inventory and delivery columns
- **WHEN** user exports aggregated results to Excel
- **THEN** the exported file SHALL include columns: Ton kho KD, SL can dat, Dat them, Tong chot
- **AND** values SHALL match what is displayed in the table
- **AND** 0 values SHALL be exported as empty cells
