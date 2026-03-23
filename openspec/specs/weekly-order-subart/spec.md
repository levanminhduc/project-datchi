## ADDED Requirements

### Requirement: Conditional sub-art dropdown on style entry
The system SHALL display a Sub-art dropdown (AppSelect) on each StyleOrderCard when the selected style has sub-arts configured in the `sub_arts` table. The system SHALL NOT display the dropdown when the style has zero sub-arts.

#### Scenario: Style with sub-arts shows dropdown
- **WHEN** user adds a style that has 3 sub-arts configured in `sub_arts` table
- **THEN** the StyleOrderCard displays an AppSelect dropdown with 3 sub-art options (showing `sub_art_code`)

#### Scenario: Style without sub-arts hides dropdown
- **WHEN** user adds a style that has zero sub-arts in `sub_arts` table
- **THEN** the StyleOrderCard does NOT display a Sub-art dropdown

#### Scenario: Sub-art fetched per style on mount
- **WHEN** StyleOrderCard mounts with a style_id
- **THEN** the component calls `subArtService.getByStyleId(styleId)` to determine if sub-arts exist

### Requirement: Mandatory sub-art selection before calculation
The system SHALL block the "Tính toán" (Calculate) button when any style entry that has sub-arts configured does NOT have a sub-art selected. The button SHALL be disabled with tooltip "Vui lòng chọn Sub-art cho tất cả mã hàng yêu cầu".

#### Scenario: All sub-art-required entries have selection — button enabled
- **WHEN** all style entries that have sub-arts have a sub-art selected AND at least one color has quantity > 0
- **THEN** the "Tính toán" button is enabled

#### Scenario: Some sub-art-required entries missing selection — button disabled
- **WHEN** style entry A has 2 sub-arts configured but no sub-art is selected
- **THEN** the "Tính toán" button is disabled with tooltip "Vui lòng chọn Sub-art cho tất cả mã hàng yêu cầu"

#### Scenario: Entries without sub-arts do not affect validation
- **WHEN** style entry B has zero sub-arts configured (no dropdown shown)
- **THEN** entry B does NOT block the "Tính toán" button regardless of sub-art state

### Requirement: Sub-art does not affect calculation logic
The system SHALL NOT pass sub_art_id to the calculation engine. Sub-art is informational only. The `buildBatchInputs` function SHALL continue grouping by `style_id` without considering sub_art_id.

#### Scenario: Two entries with same style different sub-arts
- **WHEN** style X has entry with sub-art A (red: 100, blue: 50) and entry with sub-art B (red: 200)
- **THEN** `buildBatchInputs` combines them into one calculation input: style X with red: 300, blue: 50

### Requirement: Persist sub_art_id in thread_order_items
The system SHALL save `sub_art_id` (nullable) in the `thread_order_items` table. The column SHALL be a foreign key to `sub_arts.id`. The unique constraint SHALL be `(week_id, po_id, style_id, color_id, COALESCE(sub_art_id, 0))`.

#### Scenario: Save order with sub-art
- **WHEN** user saves a weekly order containing an item with style_id=5, color_id=3, sub_art_id=12
- **THEN** `thread_order_items` row has sub_art_id=12

#### Scenario: Save order without sub-art
- **WHEN** user saves a weekly order containing an item with style_id=5, color_id=3, no sub-art (style has no sub-arts)
- **THEN** `thread_order_items` row has sub_art_id=NULL

#### Scenario: Same style+color with different sub-arts allowed
- **WHEN** user saves items: (style=5, color=3, sub_art=12) and (style=5, color=3, sub_art=15) in same week
- **THEN** both rows are saved successfully (unique constraint satisfied)

#### Scenario: Duplicate same style+color+sub_art rejected
- **WHEN** user attempts to save two items: (style=5, color=3, sub_art=12) and (style=5, color=3, sub_art=12) in same week
- **THEN** the unique constraint prevents the duplicate

### Requirement: Backend validates sub_art_id
The system SHALL validate that sub_art_id (when provided) references an existing row in `sub_arts` table and belongs to the correct style_id.

#### Scenario: Valid sub_art_id accepted
- **WHEN** POST /api/weekly-orders with item {style_id: 5, sub_art_id: 12} and sub_art 12 belongs to style 5
- **THEN** request succeeds

#### Scenario: Invalid sub_art_id rejected
- **WHEN** POST /api/weekly-orders with item {style_id: 5, sub_art_id: 99} and sub_art 99 does not exist
- **THEN** request returns 400 with error message

### Requirement: entryKey includes sub_art_id
The `entryKey` function SHALL generate keys as `${poId}_${styleId}_${subArtId}` to support multiple entries for the same PO+Style with different sub-arts.

#### Scenario: Different sub-arts create separate entries
- **WHEN** user adds style X with sub-art A, then adds style X with sub-art B (same PO)
- **THEN** two separate StyleOrderEntry rows exist in orderEntries

#### Scenario: Same sub-art prevents duplicate entry
- **WHEN** user adds style X with sub-art A, then attempts to add style X with sub-art A again (same PO)
- **THEN** the second add is ignored (duplicate key)

### Requirement: Load saved week restores sub-art selection
The `setFromWeekItems` function SHALL restore `sub_art_id` and `sub_art_code` from saved `ThreadOrderItem` data. The backend SELECT query SHALL join `sub_arts` to return sub-art info.

#### Scenario: Load week with sub-art items
- **WHEN** user loads a saved week containing items with sub_art_id=12 (sub_art_code="SA-001")
- **THEN** the StyleOrderEntry shows sub-art "SA-001" pre-selected in the dropdown

#### Scenario: Load week with deleted sub-art
- **WHEN** user loads a saved week containing sub_art_id=12, but sub_art 12 has been deleted from sub_arts table
- **THEN** the entry shows the sub-art as read-only text (not editable), preserving the historical record

### Requirement: Free-order entries follow same sub-art rules
Style entries without a PO (free-order, po_id=NULL) SHALL follow the same sub-art rules: if the style has sub-arts configured, sub-art selection is mandatory before calculation.

#### Scenario: Free-order style with sub-arts requires selection
- **WHEN** user adds style X (no PO) and style X has sub-arts configured
- **THEN** sub-art dropdown appears and selection is mandatory before "Tính toán"
