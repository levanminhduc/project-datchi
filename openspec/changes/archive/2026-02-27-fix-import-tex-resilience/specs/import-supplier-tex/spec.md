## MODIFIED Requirements

### Requirement: Auto-create thread_type during import
The system SHALL auto-create a new thread_type when no existing thread_type has the matching tex_number. The new thread_type SHALL have: code = `T-TEX{number}`, name = `Chỉ TEX {number}`, tex_number from Excel, density_grams_per_meter = tex_number / 1000, meters_per_cone from Excel row, is_active = true. When the insert fails (e.g., code uniqueness violation), the system SHALL fallback to SELECT from thread_types by `tex_number` (where `deleted_at IS NULL`) and use the existing record. The row SHALL only be skipped if both insert and fallback lookup fail.

#### Scenario: Auto-create thread_type
- **WHEN** import processes a row with tex_number 24 and no thread_type with tex_number 24 exists
- **THEN** system creates a new thread_type with code "T-TEX24", density 0.024000

#### Scenario: Thread_type insert fails but record exists
- **WHEN** import processes a row with tex_number 24 and INSERT fails due to code conflict, but a thread_type with tex_number 24 exists in DB
- **THEN** system uses the existing thread_type record and continues to upsert the supplier link
- **AND** the row is NOT skipped

#### Scenario: Thread_type insert fails and no record found
- **WHEN** import processes a row with tex_number 24, INSERT fails, and no thread_type with tex_number 24 exists (deleted_at IS NULL)
- **THEN** system skips the row and records the skip reason

### Requirement: Bulk import NCC-Tex data
The system SHALL send all valid rows to the backend API for processing. The backend SHALL process each row: create missing suppliers, create or find missing thread_types (with fallback lookup), and upsert thread_type_supplier links handling both unique constraints. The response SHALL include per-row skip details.

#### Scenario: Successful import with all new data
- **WHEN** user confirms import of 10 valid rows with 2 new suppliers and 3 new Tex values
- **THEN** system creates 2 suppliers, 3 thread_types, and 10 thread_type_supplier links, then shows success message with counts

#### Scenario: Successful import with existing data (upsert)
- **WHEN** a row matches an existing (supplier_id, thread_type_id) in thread_type_supplier
- **THEN** system updates the existing row's unit_price, meters_per_cone, and supplier_item_code instead of creating a duplicate

#### Scenario: Supplier_item_code conflict with different thread_type
- **WHEN** a row would create a thread_type_supplier link where the supplier_item_code already exists for the same supplier but a different thread_type
- **THEN** system updates the supplier_item_code to resolve the conflict (append thread_type_id suffix) and proceeds with the upsert
- **AND** the row is NOT skipped

#### Scenario: Import with skipped rows returns details
- **WHEN** import completes with some rows skipped
- **THEN** response includes `skipped_details` array with `{ row_number, supplier_name, tex_number, reason }` for each skipped row

#### Scenario: Frontend displays skip details
- **WHEN** import result contains skipped_details with entries
- **THEN** the result screen shows a table listing each skipped row with its row number, supplier name, tex number, and reason for skipping
