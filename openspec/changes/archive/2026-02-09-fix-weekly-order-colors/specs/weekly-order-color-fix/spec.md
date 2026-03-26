## ADDED Requirements

### Requirement: Manual color addition for style entries
When a user adds a style (mã hàng) to the weekly order from a PO, the system SHALL create the style entry with an empty color list. Colors SHALL only be added when the user explicitly selects a color from the dropdown and clicks "Thêm".

#### Scenario: Add style without auto-adding colors
- **WHEN** user selects a style from the PO item dropdown and clicks "Thêm"
- **THEN** the system creates a style entry with zero colors, and the user sees the "Thêm màu" dropdown to manually add colors

#### Scenario: Add all styles without auto-adding colors
- **WHEN** user clicks "Thêm tất cả" to add all remaining styles from a PO
- **THEN** the system creates style entries for each unadded style, all with zero colors

### Requirement: Deduplicated color options from SKUs
The color options dropdown for a style entry SHALL display each unique color exactly once, regardless of how many SKU rows (size variants) share the same `color_id`.

#### Scenario: Style with multiple sizes per color
- **WHEN** a PO item has SKUs with color "Đỏ" in sizes S, M, L, XL (4 SKU rows with same color_id)
- **THEN** the "Thêm màu" dropdown shows "Đỏ" exactly once

#### Scenario: Style with multiple colors
- **WHEN** a PO item has SKUs for colors "Đỏ" and "Xanh", each with 4 sizes
- **THEN** the dropdown shows exactly 2 options: "Đỏ" and "Xanh"

#### Scenario: Style with no SKUs
- **WHEN** a PO item has no SKU records
- **THEN** the "Thêm màu" dropdown shows no options (empty state message)
