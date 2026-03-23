## ADDED Requirements

### Requirement: Manual stock entry creates individual cone records
The system SHALL create individual `thread_inventory` records when stock is added via `POST /api/stock`, with one record per physical cone (full or partial).

#### Scenario: Add full cones only
- **WHEN** user submits manual stock entry with `qty_full_cones: 5` and `qty_partial_cones: 0`
- **THEN** system creates 5 `thread_inventory` records, each with `quantity_cones: 1`, `is_partial: false`, and `quantity_meters` equal to `thread_types.meters_per_cone`

#### Scenario: Add full and partial cones
- **WHEN** user submits manual stock entry with `qty_full_cones: 3` and `qty_partial_cones: 2`
- **THEN** system creates 3 full cone records (`is_partial: false`, `quantity_meters: meters_per_cone`) and 2 partial cone records (`is_partial: true`, `quantity_meters: meters_per_cone * partial_cone_ratio`)

#### Scenario: Add partial cones only
- **WHEN** user submits manual stock entry with `qty_full_cones: 0` and `qty_partial_cones: 4`
- **THEN** system creates 4 `thread_inventory` records, each with `is_partial: true` and `quantity_meters: meters_per_cone * partial_cone_ratio`

### Requirement: Auto-generate unique cone IDs
The system SHALL generate a unique `cone_id` for each created cone record using the format `MC-{timestamp}-{NNN}` where timestamp is milliseconds and NNN is a zero-padded sequence number.

#### Scenario: Cone ID generation for a batch
- **WHEN** user adds 5 cones in a single manual entry
- **THEN** system generates cone_ids like `MC-1740500000000-0001`, `MC-1740500000000-0002`, ..., `MC-1740500000000-0005`

#### Scenario: Cone ID uniqueness across entries
- **WHEN** two separate manual entries are made seconds apart
- **THEN** each entry uses a different timestamp, ensuring all cone_ids are globally unique

### Requirement: Auto-create lot record for traceability
The system SHALL create a `lots` record for each manual stock entry to enable batch tracking and traceability.

#### Scenario: Auto-generated lot number
- **WHEN** user submits manual stock entry without providing a lot_number
- **THEN** system generates lot_number as `MC-LOT-{YYYYMMDD}-{HHmmss}` and inserts a `lots` record with status `ACTIVE`, total_cones = qty_full + qty_partial, available_cones = total_cones

#### Scenario: User-provided lot number
- **WHEN** user submits manual stock entry with a specific lot_number value
- **THEN** system uses the provided lot_number for the `lots` record and all cone records

### Requirement: Cones enter at AVAILABLE status
The system SHALL set the `status` of all manually entered cones to `AVAILABLE` so they are immediately visible to FEFO allocation and the Inventory page.

#### Scenario: Immediate FEFO visibility
- **WHEN** cones are created via manual stock entry
- **THEN** all cone records have `status: 'AVAILABLE'` and appear in `fn_allocate_thread` queries that filter `WHERE status = 'AVAILABLE'`

### Requirement: Calculate quantity_meters from thread type metadata
The system SHALL look up `meters_per_cone` from the `thread_types` table for the given `thread_type_id` and use it to set `quantity_meters` on each cone record.

#### Scenario: Full cone meters calculation
- **WHEN** a full cone is created for a thread type with `meters_per_cone = 5000`
- **THEN** the cone record has `quantity_meters: 5000`

#### Scenario: Partial cone meters calculation
- **WHEN** a partial cone is created for a thread type with `meters_per_cone = 5000` and `partial_cone_ratio = 0.3`
- **THEN** the cone record has `quantity_meters: 1500` (5000 * 0.3)

#### Scenario: Thread type not found
- **WHEN** manual stock entry references a non-existent thread_type_id
- **THEN** system returns 404 error with message indicating thread type not found

### Requirement: Populate received_date and expiry_date on cone records
The system SHALL set `received_date` from the request body and `expiry_date` from the request body (if provided) on all created cone records.

#### Scenario: Both dates provided
- **WHEN** request includes `received_date: "2026-02-25"` and `expiry_date: "2027-02-25"`
- **THEN** all cone records have `received_date: '2026-02-25'` and `expiry_date: '2027-02-25'`

#### Scenario: No expiry date
- **WHEN** request includes `received_date: "2026-02-25"` and no expiry_date
- **THEN** all cone records have `received_date: '2026-02-25'` and `expiry_date: null`

### Requirement: Return response with cone count and lot number
The system SHALL return a response containing the number of cones created, the lot number used, and the list of generated cone_ids.

#### Scenario: Successful manual entry response
- **WHEN** manual stock entry creates 5 full cones and 2 partial cones
- **THEN** response has `data: { cones_created: 7, lot_number: "MC-LOT-20260225-143022", cone_ids: [...] }` and `message` indicating success

### Requirement: Validate warehouse exists
The system SHALL verify that the provided `warehouse_id` references an existing warehouse before creating cone records.

#### Scenario: Invalid warehouse
- **WHEN** request contains a warehouse_id that does not exist in the `warehouses` table
- **THEN** system returns 404 error with message indicating warehouse not found

### Requirement: Existing validation schema unchanged
The system SHALL continue to use the existing `AddStockSchema` Zod validation for request body validation, requiring no changes to the frontend payload.

#### Scenario: Valid payload passes validation
- **WHEN** request body contains valid `thread_type_id`, `warehouse_id`, `qty_full_cones`, `received_date`
- **THEN** validation passes and processing continues

#### Scenario: Missing required field
- **WHEN** request body is missing `thread_type_id`
- **THEN** system returns 400 error from Zod validation
