## ADDED Requirements

### Requirement: PO list page
The system SHALL display a paginated list of all Purchase Orders at `/thread/purchase-orders`.

#### Scenario: Display PO list
- **WHEN** user navigates to PO list page
- **THEN** system displays table with columns: Số PO, Khách hàng, Ngày đặt, SL Mã hàng, Status
- **AND** table is sorted by created_at DESC by default
- **AND** pagination controls are visible

#### Scenario: Filter by status
- **WHEN** user selects status filter
- **THEN** system filters list to show only POs with selected status

#### Scenario: Search by PO number or customer
- **WHEN** user enters text in search field
- **THEN** system filters list to POs matching po_number or customer_name

### Requirement: Create PO from list page
The system SHALL allow creating a new PO via dialog from the list page.

#### Scenario: Open create dialog
- **WHEN** user clicks "Tạo PO" button
- **THEN** system shows dialog with fields: Số PO (required), Khách hàng, Ngày đặt, Ngày giao, Ghi chú

#### Scenario: Submit valid PO
- **WHEN** user fills required fields and clicks Lưu
- **THEN** system creates PO via API
- **AND** system shows success toast
- **AND** system refreshes list

### Requirement: Navigate to PO detail
The system SHALL navigate to PO detail page when clicking a row in the list.

#### Scenario: Click PO row
- **WHEN** user clicks a PO row in the table
- **THEN** system navigates to `/thread/purchase-orders/:id`

### Requirement: PO detail page with items management
The system SHALL display PO details and manage items at `/thread/purchase-orders/[id]`.

#### Scenario: Display PO header info
- **WHEN** user navigates to PO detail page
- **THEN** system displays PO info: Số PO, Khách hàng, Ngày đặt, Ngày giao, Status, Ghi chú

#### Scenario: Display items table
- **WHEN** PO detail loads
- **THEN** system displays items table with columns: Mã hàng, Tên mã hàng, SL SP, Đã đặt, Actions
- **AND** "Đã đặt" shows sum of weekly order quantities for this PO/style

### Requirement: Add item manually
The system SHALL allow adding items to PO via dialog.

#### Scenario: Open add item dialog
- **WHEN** user clicks "Thêm" button in items section
- **THEN** system shows dialog with: Mã hàng (autocomplete select), Số lượng SP

#### Scenario: Submit valid item
- **WHEN** user selects style and enters quantity, clicks Lưu
- **THEN** system calls POST API to add item
- **AND** system refreshes items table
- **AND** system shows success toast

### Requirement: Edit item quantity inline
The system SHALL allow editing item quantity inline in the table.

#### Scenario: Edit quantity
- **WHEN** user clicks edit icon on item row
- **THEN** system shows editable input for quantity
- **WHEN** user changes value and confirms
- **THEN** system calls PUT API to update quantity
- **AND** system refreshes row

### Requirement: Delete item
The system SHALL allow soft-deleting items from PO.

#### Scenario: Delete item without orders
- **WHEN** user clicks delete icon on item row
- **THEN** system shows confirmation dialog
- **WHEN** user confirms
- **THEN** system calls DELETE API
- **AND** system removes row from table

#### Scenario: Delete item with orders (blocked)
- **WHEN** user tries to delete item that has weekly orders
- **THEN** system shows error toast indicating item has orders and cannot be deleted

### Requirement: View item history
The system SHALL display change history for each item.

#### Scenario: Open history dialog
- **WHEN** user clicks history icon on item row
- **THEN** system shows dialog with history entries
- **AND** each entry shows: Thời gian, Người thay đổi, Loại (CREATE/UPDATE/DELETE), SL cũ, SL mới

### Requirement: Import page with stepper
The system SHALL provide import workflow at `/thread/purchase-orders/import`.

#### Scenario: Step 1 - Upload file
- **WHEN** user navigates to import page
- **THEN** system shows file upload area
- **WHEN** user selects/drops Excel file
- **THEN** system calls parse API and moves to step 2

#### Scenario: Step 2 - Preview
- **WHEN** parse completes
- **THEN** system displays preview table with validation status per row
- **AND** system shows summary: X hợp lệ, Y lỗi, Z PO mới, W update
- **AND** error rows are highlighted in red

#### Scenario: Step 3 - Execute and results
- **WHEN** user clicks "Import" button
- **THEN** system calls execute API
- **WHEN** import completes
- **THEN** system shows results: created, updated, skipped counts
- **AND** system provides "Quay lại danh sách" button

### Requirement: Settings import mapping section
The system SHALL add PO import mapping configuration to Settings page.

#### Scenario: Display PO import settings
- **WHEN** user (ROOT only) views Settings page
- **THEN** system displays "Cài đặt Import Đơn Hàng (PO)" section
- **AND** section includes: Sheet, Dòng header, Dòng data, column selectors for each field

#### Scenario: Save mapping configuration
- **WHEN** user changes mapping and clicks Lưu
- **THEN** system saves to settings with key `import_po_items_mapping`
- **AND** system shows success toast

#### Scenario: Download template from settings
- **WHEN** user clicks "Tải file mẫu" button
- **THEN** system downloads Excel template file

### Requirement: Menu integration
The system SHALL add "Đơn Hàng (PO)" menu item under "Kế Hoạch".

#### Scenario: Menu visibility
- **WHEN** user views sidebar
- **THEN** "Đơn Hàng (PO)" appears under "Kế Hoạch" between "Tính Toán Chỉ" and "Đặt Hàng Chỉ Tuần"

#### Scenario: Menu navigation
- **WHEN** user clicks "Đơn Hàng (PO)" menu item
- **THEN** system navigates to `/thread/purchase-orders`
