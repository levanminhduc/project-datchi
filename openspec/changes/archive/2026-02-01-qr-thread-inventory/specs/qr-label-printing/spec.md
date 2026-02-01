## ADDED Requirements

### Requirement: Generate QR Code from Cone ID
The system SHALL generate QR codes containing the cone_id for printing on labels.

#### Scenario: Generate QR for single cone
- **WHEN** user views cone details or clicks "In QR" button
- **THEN** system generates a QR code image containing the cone_id
- **AND** displays the QR code in a preview

#### Scenario: QR code content format
- **WHEN** system generates a QR code
- **THEN** the QR content SHALL be the raw cone_id string only
- **AND** no prefix, suffix, or JSON wrapper is added

### Requirement: Label Layout Display
The system SHALL display labels with QR code and cone information in a standardized layout.

#### Scenario: Label shows required information
- **WHEN** user views a label preview
- **THEN** label displays QR code on the left side
- **AND** displays cone_id prominently
- **AND** displays lot_number
- **AND** displays thread_type code
- **AND** displays weight in grams

#### Scenario: Label fits standard size
- **WHEN** label is rendered for print
- **THEN** label fits within 50x30mm dimensions
- **AND** QR code is at least 15x15mm for reliable scanning

### Requirement: Print Single Label
The system SHALL allow printing a single label for one cone.

#### Scenario: Print from cone row action
- **WHEN** user clicks print icon on a cone row in inventory table
- **THEN** system opens print dialog with single label preview
- **AND** user can print using browser print function

#### Scenario: Print from StockReceiptDialog
- **WHEN** user completes stock receipt for a single cone
- **THEN** system offers option to print QR label
- **AND** clicking "In nhãn" opens print dialog

### Requirement: Batch Label Printing
The system SHALL support printing multiple labels at once after stock receipt.

#### Scenario: Print all labels after batch receipt
- **WHEN** user completes stock receipt with multiple cones
- **THEN** system offers "In tất cả nhãn" button
- **AND** clicking opens print dialog with all labels in grid layout

#### Scenario: Labels arranged in grid for A4 paper
- **WHEN** printing multiple labels on A4 paper
- **THEN** labels are arranged in a grid (e.g., 4 columns x 7 rows)
- **AND** each label maintains proper margins for cutting

#### Scenario: Select specific cones for printing
- **WHEN** user is in batch print mode
- **THEN** user can select/deselect individual cones to print
- **AND** only selected cones are included in print output

### Requirement: Print Preview
The system SHALL provide a print preview before actual printing.

#### Scenario: Preview shows accurate layout
- **WHEN** user opens print dialog
- **THEN** preview displays labels exactly as they will print
- **AND** user can see page breaks for multi-page prints

#### Scenario: Cancel print
- **WHEN** user closes print dialog without printing
- **THEN** no print job is sent
- **AND** user returns to previous screen

### Requirement: QR Code Component Reusability
The system SHALL provide a reusable ConeQrCode component for displaying QR codes.

#### Scenario: Use component in different contexts
- **WHEN** developer uses ConeQrCode component
- **THEN** component accepts cone_id as prop
- **AND** generates and displays QR code
- **AND** can be sized via props (small, medium, large)

#### Scenario: Component handles missing cone_id
- **WHEN** cone_id prop is null or undefined
- **THEN** component displays placeholder or empty state
- **AND** does not throw error
