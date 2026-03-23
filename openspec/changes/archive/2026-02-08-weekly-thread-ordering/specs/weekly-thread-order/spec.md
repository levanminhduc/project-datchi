## ADDED Requirements

### Requirement: CRUD tuần hàng (Weekly Order)
User SHALL be able to create, view, edit, and delete weekly thread orders. Each weekly order SHALL have a required week name (e.g. "Tuan 06/2026"), optional start_date, optional end_date, optional notes, and a status field. The system SHALL store weekly orders in table `thread_order_weeks`.

#### Scenario: Tao tuan hang moi
- **WHEN** user clicks "Tao tuan hang" button and fills in week name (e.g. "Tuan 06/2026") with optional start/end dates and notes
- **THEN** system SHALL create a new record in `thread_order_weeks` with status "draft" and display it in the weekly orders list

#### Scenario: Xem danh sach tuan hang
- **WHEN** user navigates to the weekly thread ordering page
- **THEN** system SHALL display a list of all weekly orders sorted by created_at descending, showing week name, status, number of styles, and created date

#### Scenario: Chinh sua thong tin tuan hang
- **WHEN** user clicks edit on an existing weekly order
- **THEN** system SHALL allow editing week name, start_date, end_date, and notes
- **AND** system SHALL save changes and display updated info in the list

#### Scenario: Xoa tuan hang
- **WHEN** user clicks delete on a weekly order that has status "draft"
- **THEN** system SHALL show a confirmation dialog
- **AND** upon confirmation, system SHALL delete the weekly order and all its associated order items

#### Scenario: Khong cho xoa tuan hang da luu ket qua
- **WHEN** user attempts to delete a weekly order that has saved calculation results
- **THEN** system SHALL prevent deletion and show a warning message "Khong the xoa tuan hang da co ket qua tinh toan"

---

### Requirement: Chon nhieu ma hang (Multi-Style Selection)
User SHALL be able to add multiple styles (ma hang) to a weekly order. When a style is selected, system SHALL load and display its thread specs (dinh muc chi) from `style_thread_specs`. User SHALL be able to remove styles from the order.

#### Scenario: Them mot ma hang
- **WHEN** user selects a style from the style dropdown (AppSelect with search)
- **THEN** system SHALL add the style to the selected styles list
- **AND** system SHALL fetch and display the style's thread specs (`style_thread_specs` with joined supplier and thread_type data)
- **AND** the style SHALL no longer appear in the dropdown to prevent duplicate selection

#### Scenario: Them nhieu ma hang
- **WHEN** user adds a second style while one style is already selected
- **THEN** system SHALL display both styles in the selected list, each with its own thread specs section
- **AND** the order of styles SHALL match the order they were added

#### Scenario: Xoa ma hang khoi danh sach
- **WHEN** user clicks remove button on a selected style
- **THEN** system SHALL remove the style and its associated color selections from the order
- **AND** the style SHALL reappear in the dropdown for future selection

#### Scenario: Hien thi dinh muc khi chon style
- **WHEN** a style is added to the selection
- **THEN** system SHALL display the style's thread specs showing: Cong doan (process_name), NCC (supplier name), Tex (tex_number), Met/SP (meters_per_unit)

---

### Requirement: Chon nhieu mau hang va nhap so luong (Multi-Color with Quantity)
For each selected style, user SHALL be able to select one or more colors (mau hang). Available colors SHALL come from `style_color_thread_specs` for that style's specs. User SHALL enter a quantity (so luong SP) for each selected color.

#### Scenario: Chon mau hang cho style
- **WHEN** user clicks to add colors for a selected style
- **THEN** system SHALL display available colors fetched from `style_color_thread_specs` (joined with `colors` table for color name and hex_code)
- **AND** user SHALL be able to select one or more colors via checkboxes or multi-select

#### Scenario: Nhap so luong cho tung mau
- **WHEN** user selects a color for a style
- **THEN** system SHALL display an input field for quantity (so luong SP) next to the color
- **AND** the quantity input SHALL accept only positive integers with min value of 1

#### Scenario: Thay doi so luong
- **WHEN** user changes the quantity for an already-selected color
- **THEN** system SHALL update the quantity value immediately in the UI
- **AND** if calculation results exist, they SHALL be marked as outdated (stale)

#### Scenario: Bo chon mau hang
- **WHEN** user deselects a color from a style
- **THEN** system SHALL remove the color and its quantity from the order items for that style

#### Scenario: Style khong co dinh muc mau
- **WHEN** a selected style has no records in `style_color_thread_specs`
- **THEN** system SHALL display a notice "Ma hang nay chua co dinh muc mau chi" and disable the color selection for that style
- **AND** the style SHALL still allow calculation using default thread specs (without color_breakdown)

---

### Requirement: Tinh toan gop (Batch Calculation)
User SHALL trigger calculation for all selected styles and colors at once. System SHALL use existing calculation logic (`POST /api/thread-calculation/calculate`) with `color_breakdown` parameter for each style. System SHALL calculate thread requirements as `meters_per_unit * quantity` per color per spec.

#### Scenario: Tinh toan cho tat ca styles/colors
- **WHEN** user clicks "Tinh toan" button with at least one style selected and at least one color with quantity > 0
- **THEN** system SHALL call the calculation API for each selected style, passing `style_id`, `quantity` (sum of all color quantities for that style), and `color_breakdown` array (each entry with `color_id` and `quantity`)
- **AND** system SHALL aggregate all results and display them in two views

#### Scenario: Tinh toan voi style khong co mau
- **WHEN** a style has no color selections but has a manually entered total quantity
- **THEN** system SHALL calculate using the basic calculation (without `color_breakdown`)
- **AND** results SHALL display total_meters based on total quantity * meters_per_unit

#### Scenario: Tinh toan voi color_breakdown
- **WHEN** a style has multiple colors selected with different quantities
- **THEN** system SHALL send `color_breakdown: [{ color_id, quantity }]` to the API
- **AND** results SHALL include per-color thread_type_id mapping from `style_color_thread_specs`
- **AND** each color's total_meters SHALL equal `meters_per_unit * color_quantity`

#### Scenario: Xu ly loi tinh toan
- **WHEN** calculation fails for one style (e.g. style has no thread specs)
- **THEN** system SHALL display an error message for that specific style
- **AND** system SHALL continue calculating for remaining styles
- **AND** partial results SHALL still be displayed for styles that succeeded

#### Scenario: Nut tinh toan bi disable khi khong du dieu kien
- **WHEN** no styles are selected, or all selected styles have no colors with quantity > 0
- **THEN** the "Tinh toan" button SHALL be disabled

---

### Requirement: Hien thi ket qua chi tiet theo style (Per-Style Detail View)
System SHALL display calculation results grouped by style. Each style SHALL show a DataTable with columns: Cong doan, NCC, Tex, Met/SP, Tong met, Tong cuon, Mau chi. This view follows the same display pattern as the existing calculation page (`/thread/calculation`).

#### Scenario: Hien thi ket qua cho mot style
- **WHEN** calculation completes for a single style
- **THEN** system SHALL display a card with style header (style_code - style_name) and total quantity
- **AND** a DataTable SHALL show each spec row with: process_name, supplier_name, tex_number, meters_per_unit, total_meters, total_cones (calculated as `ceil(total_meters / meters_per_cone)` when meters_per_cone exists), and thread_color (displayed as a colored badge)

#### Scenario: Hien thi ket qua cho nhieu styles
- **WHEN** calculation completes for multiple styles
- **THEN** system SHALL display one card per style, each with its own DataTable
- **AND** cards SHALL be displayed in the same order as styles were added to the order

#### Scenario: Tong cuon hien thi tooltip
- **WHEN** a result row has meters_per_cone value
- **THEN** the total_cones cell SHALL show the cone count with a tooltip displaying the formula: "X met / Y m/cuon"
- **AND** when meters_per_cone is null or 0, the cell SHALL display "—"

---

### Requirement: Hien thi ket qua tong hop (Aggregated Summary View)
System SHALL display an aggregated summary table combining results from all styles. Summary SHALL group rows by the combination of: Mau chi (thread color name) + NCC (supplier name) + Tex (tex_number). When the same thread type appears across multiple styles, their meters and cones SHALL be summed together.

#### Scenario: Tong hop ket qua tu nhieu styles
- **WHEN** calculation results exist for multiple styles
- **THEN** system SHALL display a summary DataTable with columns: Mau chi, NCC, Tex, Tong met (sum of total_meters), Tong cuon (calculated from aggregated total_meters / meters_per_cone)
- **AND** rows SHALL be grouped by unique combination of thread_color + supplier_name + tex_number

#### Scenario: Gop cung loai chi tu nhieu styles
- **WHEN** Style A and Style B both use the same thread type (same supplier, same tex, same thread color)
- **THEN** the summary SHALL show a single row for that thread type
- **AND** Tong met SHALL equal sum of total_meters from both styles
- **AND** Tong cuon SHALL be recalculated from the aggregated Tong met

#### Scenario: Hien thi ca hai view cung luc
- **WHEN** calculation results are available
- **THEN** system SHALL display a tab or toggle allowing user to switch between "Chi tiet theo ma hang" and "Tong hop" views
- **AND** the default view SHALL be "Tong hop" (aggregated summary)

---

### Requirement: Luu ket qua tinh toan (Save Results)
User SHALL be able to save calculation results linked to the weekly order. Saved results SHALL include both the order items (style + color + quantity) and the calculated thread requirements. Saved results SHALL be retrievable when viewing order history.

#### Scenario: Luu ket qua
- **WHEN** user clicks "Luu ket qua" button after calculation completes
- **THEN** system SHALL save the order items to `thread_order_items` table (weekly_order_id, style_id, color_id, quantity)
- **AND** system SHALL save the aggregated calculation results linked to the weekly order
- **AND** system SHALL update the weekly order status from "draft" to "calculated"
- **AND** system SHALL display a success notification "Da luu ket qua tinh toan"

#### Scenario: Xem ket qua da luu
- **WHEN** user opens a weekly order that has saved calculation results
- **THEN** system SHALL restore the saved order items (styles, colors, quantities)
- **AND** system SHALL display the saved calculation results in both per-style detail and aggregated summary views
- **AND** user SHALL be able to re-calculate by modifying selections and clicking "Tinh toan" again

#### Scenario: Luu de cap nhat ket qua
- **WHEN** user modifies selections on a weekly order that already has saved results and clicks "Luu ket qua"
- **THEN** system SHALL replace the existing order items and calculation results with the new data
- **AND** system SHALL display a confirmation dialog "Ban co muon cap nhat ket qua tinh toan?" before overwriting

---

### Requirement: Tao phieu phan bo tu ket qua (Create Allocations from Results)
User SHALL be able to create allocation orders from the aggregated calculation results. System SHALL reuse the existing allocation creation flow via `allocationService.create()` with `CreateAllocationDTO`.

#### Scenario: Tao phan bo tu ket qua tong hop
- **WHEN** user clicks "Tao phieu phan bo" button from the results view
- **THEN** system SHALL display a confirmation dialog showing a summary table of allocations to be created
- **AND** each row SHALL show: order_id (week name), thread_type_name, requested_meters, color_name
- **AND** system SHALL only include rows that have `color_breakdown` data with valid `thread_type_id`

#### Scenario: Xac nhan tao phan bo
- **WHEN** user confirms the allocation creation in the dialog
- **THEN** system SHALL create one allocation per unique thread_type_id + color combination using `allocationService.create()`
- **AND** each allocation SHALL have: `order_id` = week name, `order_reference` = style info, `thread_type_id` from color_breakdown, `requested_meters` = aggregated total_meters, `priority` = NORMAL, `notes` including process_name and color_name
- **AND** upon success, system SHALL display "Da tao N phieu phan bo thanh cong" and navigate to `/thread/allocations`

#### Scenario: Xu ly loi tao phan bo
- **WHEN** some allocations fail during creation (e.g. invalid thread_type_id)
- **THEN** system SHALL continue creating remaining allocations
- **AND** system SHALL display a summary "Da tao X thanh cong, Y loi"

#### Scenario: Nut tao phan bo bi disable
- **WHEN** calculation results have no color_breakdown data (no color specs configured)
- **THEN** the "Tao phieu phan bo" button SHALL be disabled
- **AND** a tooltip SHALL display "Can co du lieu dinh muc mau chi"

---

### Requirement: Nut xuat Excel (Export Excel Placeholder)
Page SHALL display an "Xuat Excel" button in the results section. This button SHALL be a placeholder for future export functionality.

#### Scenario: Click nut xuat Excel
- **WHEN** user clicks the "Xuat Excel" button
- **THEN** system SHALL display a notification "Tinh nang xuat Excel se som duoc ho tro" using snackbar.info()
- **AND** the button SHALL remain visible but no file download SHALL occur

#### Scenario: Nut xuat Excel chi hien khi co ket qua
- **WHEN** no calculation results are available
- **THEN** the "Xuat Excel" button SHALL NOT be visible
- **WHEN** calculation results are displayed
- **THEN** the "Xuat Excel" button SHALL be visible in the results action bar alongside "Luu ket qua" and "Tao phieu phan bo"
