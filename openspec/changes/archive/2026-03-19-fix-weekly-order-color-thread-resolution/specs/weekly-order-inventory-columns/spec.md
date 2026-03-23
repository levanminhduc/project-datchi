## ADDED Requirements

### Requirement: Display calculation warnings for incomplete color specs
The weekly order results table SHALL display warnings when calculation detects thread specs falling back to TEX-level base types due to missing color thread specs.

#### Scenario: Warnings shown after calculation
- **WHEN** calculation completes and response contains warnings about missing color specs
- **THEN** a warning banner SHALL appear above the results table listing affected styles and colors
- **AND** each warning SHALL display: "Mã hàng {style_code}: màu {color_name} chưa có định mức chỉ chi tiết"

#### Scenario: No warnings when all specs complete
- **WHEN** calculation completes and all color specs resolve to color-specific thread_types
- **THEN** no warning banner SHALL appear

#### Scenario: Warning row highlighting
- **WHEN** an aggregated row's thread_type_id corresponds to a TEX-level base type (from fallback)
- **THEN** that row SHALL be visually highlighted with an amber/warning background
- **AND** a tooltip SHALL explain: "Loại chỉ chung (chưa phân theo màu cuộn) — cần cập nhật định mức chi tiết"
