## ADDED Requirements

### Requirement: Surplus preview returns per-thread-type breakdown
The system SHALL return a `breakdown` array in the surplus preview response, grouped by `thread_type_id`. Each entry SHALL include supplier name, tex number, color name, count of own cones (released to AVAILABLE), and count of borrowed cones (returned to original week or released).

#### Scenario: Preview with mixed own and borrowed cones
- **WHEN** user requests surplus preview for a week that has 15 own cones of type "Coats/60/Đỏ" and 3 borrowed cones of type "Coats/60/Đỏ" from Week 5 (CONFIRMED)
- **THEN** the response includes a breakdown entry with `supplier_name: "Coats"`, `tex_number: "60"`, `color_name: "Đỏ"`, `own_cones: 15`, `borrowed_cones: 3`

#### Scenario: Preview with borrowed cones from non-CONFIRMED original week
- **WHEN** user requests surplus preview AND a borrowed cone's original week has status COMPLETED or CANCELLED
- **THEN** that cone is counted as `own_cones` in the breakdown (since it will be released to AVAILABLE, not re-reserved)

#### Scenario: Preview with only own cones
- **WHEN** user requests surplus preview for a week with no borrowed cones
- **THEN** the breakdown entries all have `borrowed_cones: 0`

#### Scenario: Preview returns empty breakdown when no reserved cones
- **WHEN** user requests surplus preview AND the week has zero RESERVED_FOR_ORDER cones
- **THEN** the breakdown array is empty and `total_cones` is 0

### Requirement: Surplus preview dialog displays breakdown table
The system SHALL display a table in the surplus preview dialog showing NCC (supplier), Tex, Màu (color), Cuộn riêng (own cones), and Cuộn mượn (borrowed cones) per thread type row.

#### Scenario: Dialog shows breakdown table with data
- **WHEN** user opens the "Trả dư" dialog AND the preview response contains a non-empty breakdown array
- **THEN** the dialog displays a table with columns: NCC, Tex, Màu, Cuộn riêng, Cuộn mượn, and a summary line below showing total own cones released and total borrowed cones returned

#### Scenario: Dialog shows zero for borrowed column when none exist
- **WHEN** user opens "Trả dư" AND a thread type row has `borrowed_cones: 0`
- **THEN** the Cuộn mượn column displays `0` for that row

#### Scenario: Dialog falls back to simple display on breakdown failure
- **WHEN** user opens "Trả dư" AND the preview response has no `breakdown` field (query error, fallback)
- **THEN** the dialog displays the existing simple message: "Sẽ trả X cuộn về Khả dụng. Bạn chắc chắn?"

### Requirement: Surplus preview breakdown includes borrowed cone destination info
The system SHALL include per-thread-type borrowed cone groups with destination details: original week ID, original week name, cone count, and action (re-reserve or release).

#### Scenario: Borrowed cones going back to CONFIRMED original week
- **WHEN** the preview breakdown includes borrowed cones whose original week is CONFIRMED
- **THEN** the borrowed group entry shows `action: "re-reserve"` and the original week's name

#### Scenario: Borrowed cones from non-CONFIRMED original week counted as own
- **WHEN** the preview includes borrowed cones whose original week is COMPLETED or CANCELLED
- **THEN** those cones are counted in `own_cones` (not in borrowed groups), matching `fn_complete_week_and_release` behavior
