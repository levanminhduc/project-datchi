## ADDED Requirements

### Requirement: Create a new bin
The system SHALL allow users to create a new bin with a mandatory color assignment. The system SHALL auto-generate a unique bin code in the format `BIN-NNNNN` (zero-padded, sequential). The bin SHALL have an optional `location` field (freeform string, e.g., "A-2-3") and optional `notes`.

#### Scenario: Create bin with color and location
- **WHEN** user submits a new bin with color_id=5 (Red) and location="A-2-3"
- **THEN** system creates a bin with auto-generated code (e.g., `BIN-00042`), color_id=5, location="A-2-3", status=ACTIVE

#### Scenario: Create bin without location
- **WHEN** user submits a new bin with color_id=5 and no location
- **THEN** system creates a bin with status=ACTIVE and location=NULL

#### Scenario: Create bin with duplicate color
- **WHEN** user creates a second bin with the same color_id as an existing bin
- **THEN** system creates the bin successfully (multiple bins per color are allowed)

### Requirement: View bin contents via QR scan
The system SHALL display the contents of a bin when its QR code is scanned. Contents SHALL show each thread type in the bin with its quantity (full cones and partial cones separately), and the estimated equivalent full cones.

#### Scenario: Scan bin QR code
- **WHEN** user scans a QR code containing "BIN-00042"
- **THEN** system navigates to the bin detail page showing: bin code, color, location, status, and a table of bin_items (thread type name, qty full cones, qty partial cones, estimated equivalent)

#### Scenario: Scan QR of empty bin
- **WHEN** user scans a QR code for a bin with no bin_items
- **THEN** system shows the bin detail page with an empty items list and a message indicating the bin is empty

### Requirement: List and filter bins
The system SHALL display a list of all active bins with filtering by color, location, and status.

#### Scenario: List all active bins
- **WHEN** user opens the bins management page
- **THEN** system shows all bins with status=ACTIVE, displaying: bin code, color name, location, total cone count, status

#### Scenario: Filter bins by color
- **WHEN** user selects a color filter (e.g., "Red")
- **THEN** system shows only bins with the matching color_id

### Requirement: Update bin location (relocate)
The system SHALL allow users to update a bin's location. The relocation SHALL be recorded in `bin_transactions` with operation=MOVE.

#### Scenario: Relocate bin
- **WHEN** user changes bin BIN-00042 location from "A-2-3" to "B-1-4"
- **THEN** system updates the bin's location and creates a bin_transaction with operation=MOVE, location_from="A-2-3", location_to="B-1-4"

### Requirement: Retire a bin
The system SHALL allow users to retire a bin (set status=RETIRED). A bin SHALL only be retired if it has no remaining stock (all bin_items qty_cones = 0 or no bin_items).

#### Scenario: Retire empty bin
- **WHEN** user retires bin BIN-00042 which has no items
- **THEN** system sets bin status to RETIRED

#### Scenario: Attempt to retire bin with stock
- **WHEN** user tries to retire bin BIN-00042 which still has 5 cones
- **THEN** system rejects with error message "Không thể hủy thùng còn chỉ"

### Requirement: Print bin QR labels
The system SHALL allow users to print QR labels for one or more bins. Labels SHALL display the bin code, color name, and a QR code encoding the bin_code string. The label format SHALL reuse the existing A4 grid layout (QrLabelGrid).

#### Scenario: Print single bin label
- **WHEN** user selects one bin and clicks print
- **THEN** system generates a printable label with QR code containing the bin_code

#### Scenario: Print multiple bin labels
- **WHEN** user selects 5 bins and clicks print
- **THEN** system generates an A4 sheet with 5 labels in grid layout
