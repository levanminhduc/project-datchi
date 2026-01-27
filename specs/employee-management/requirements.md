# Employee Management

**Implementation Status: COMPLETED** ✅

## Overview

Employee management system for viewing, creating, editing, and deleting employee records. Provides a responsive data table with search/filter capabilities using Vietnamese UI labels. Features pagination with customizable page sizes (10, 25, 50, 100 rows) and inline editing capabilities for efficient data management of 1630+ employees.

## User Stories

### Story 1: View Employee List with Pagination (Priority: P1) 🎯 MVP

As an administrator, I want to view all employees in a paginated table with customizable page sizes so that I can efficiently browse the entire employee database (1630+ records) with traditional pagination controls.

**Independent Test**: Navigate to /employees page, verify table displays employees with pagination controls and page size selector.

**Acceptance Criteria**:
- [x] WHEN the user navigates to the employees page, THE SYSTEM SHALL display a data table with columns: Tên Nhân Viên, Mã NV, Phòng Ban, Chức Vụ.
- [x] WHEN the table is loading data, THE SYSTEM SHALL display a loading skeleton.
- [x] WHEN no employees exist in the database, THE SYSTEM SHALL display an empty state message "Chưa có nhân viên nào".
- [x] WHEN the user clicks a column header, THE SYSTEM SHALL sort the table by that column.
- [x] ~~WHEN the employees page loads, THE SYSTEM SHALL fetch all employees using `limit=0` parameter.~~ *(Replaced by pagination)*
- [x] ~~WHILE displaying more than 50 employees, THE SYSTEM SHALL use virtual-scroll to render only visible rows.~~ *(Replaced by pagination)*
- [x] ~~WHEN the user scrolls the table, THE SYSTEM SHALL render new rows dynamically without pagination controls.~~ *(Replaced by pagination)*

**AC7**: Pagination Display
- [x] WHEN user views employee list, THEN THE SYSTEM SHALL display pagination controls at bottom of table.
- [x] WHEN total records exceed page size, THEN THE SYSTEM SHALL show page navigation (previous/next, page numbers).

**AC8**: Page Size Selector
- [x] WHEN user views employee list, THEN a page size dropdown SHALL appear next to pagination controls.
- [x] WHEN user selects page size option (10, 25, 50, 100), THEN table SHALL immediately update to show selected number of rows.
- [x] WHEN page size changes, THEN pagination SHALL reset to page 1.
- Options: 10, 25, 50, 100 rows per page
- Default: 25 rows per page

**AC9**: Pagination State Persistence
- [x] WHEN user navigates between pages, THEN current page and page size SHALL be maintained.
- [x] WHEN user filters/searches, THEN pagination SHALL reset to page 1 while preserving page size.

**AC10**: Complete Data Fetch
- [x] WHEN user views employee list, THEN system SHALL fetch ALL employees from database without row limits.
- [x] WHEN database contains more than 1000 records, THEN system SHALL still display all records.
- [x] System SHALL use batch fetching to bypass Supabase's default 1000-row limit.

> **Spec Drift**: Column label "Mã Nhân Viên" abbreviated to "Mã NV" for better mobile fit.
> **Spec Update**: Virtual scroll replaced with traditional pagination mode (AC7-AC9) for better UX with page size control.

### Story 2: Search and Filter Employees (Priority: P1) 🎯 MVP

As an administrator, I want to search and filter employees by name, code, or department so that I can quickly find specific employees.

**Independent Test**: Enter search term in search box, verify table filters results in real-time.

**Acceptance Criteria**:
- [x] WHEN the user types in the search box, THE SYSTEM SHALL filter employees by full_name, employee_code, department, or position.
- [x] WHEN the search term matches no employees, THE SYSTEM SHALL display "Không tìm thấy nhân viên phù hợp".
- [x] WHEN the user clears the search box, THE SYSTEM SHALL display all employees.

> **Spec Drift**: Search also filters by `position` field (enhancement beyond original spec).

### Story 3: Create New Employee (Priority: P2)

As an administrator, I want to create a new employee record so that I can add new staff to the system.

**Independent Test**: Click add button, fill form, submit, verify new employee appears in table.

**Acceptance Criteria**:
- [x] WHEN the user clicks the "Thêm nhân viên" button, THE SYSTEM SHALL display a form dialog with fields: Tên Nhân Viên, Mã Nhân Viên, Phòng Ban, Chức Vụ.
- [x] WHEN the user submits a valid form, THE SYSTEM SHALL create the employee and display success message "Thêm nhân viên thành công".
- [x] IF required fields are empty, THEN THE SYSTEM SHALL display validation error "Vui lòng điền đầy đủ thông tin".
- [x] IF employee_code already exists, THEN THE SYSTEM SHALL display error "Mã nhân viên đã tồn tại".

### Story 4: Edit Employee via Modal (Priority: P2)

As an administrator, I want to edit an existing employee's information via a modal dialog so that I can make comprehensive changes to employee records.

**Independent Test**: Click edit button on a row, modify data, submit, verify changes persist.

**Acceptance Criteria**:
- [x] WHEN the user clicks the edit button on a row, THE SYSTEM SHALL display a pre-filled form dialog with employee_code field disabled.
- [x] WHEN the user submits valid changes, THE SYSTEM SHALL update the employee and display "Cập nhật thành công".
- [x] IF the update fails, THEN THE SYSTEM SHALL display error "Cập nhật thất bại. Vui lòng thử lại".

> **Spec Drift**: `employee_code` field is immutable during edit (business rule discovered during implementation).

### Story 7: Inline Edit Employee Fields (Priority: P1) 🎯 NEW

As an administrator, I want to quickly edit employee fields (name, department, position) directly in the table row so that I can make rapid updates without opening a modal.

**Independent Test**: Click on a cell in full_name/department/chuc_vu column, edit value inline, verify change saves to database.

**Acceptance Criteria**:
- [x] WHEN the user clicks on the full_name cell in any row, THE SYSTEM SHALL display a q-popup-edit input pre-filled with current value.
- [x] WHEN the user clicks on the department cell in any row, THE SYSTEM SHALL display a q-popup-edit input pre-filled with current value.
- [x] WHEN the user clicks on the chuc_vu cell in any row, THE SYSTEM SHALL display a q-popup-edit dropdown pre-filled with current value.
- [x] WHEN the user confirms the inline edit (Enter key or save button), THE SYSTEM SHALL call PUT /api/employees/:id with the updated field.
- [x] WHILE an inline edit is being saved, THE SYSTEM SHALL display a per-cell loading indicator.
- [x] WHEN the inline edit succeeds, THE SYSTEM SHALL update the cell value and display success notification.
- [x] IF the inline edit fails, THEN THE SYSTEM SHALL revert the cell to original value and display error notification.
- [x] WHEN the user presses Escape or clicks outside, THE SYSTEM SHALL cancel the edit without saving.
- [x] THE SYSTEM SHALL NOT allow inline editing of employee_id/employee_code (immutable field).

### Story 5: Delete Employee (Priority: P2)

As an administrator, I want to delete an employee record so that I can remove outdated entries.

**Independent Test**: Click delete button, confirm in dialog, verify employee removed from table.

**Acceptance Criteria**:
- [x] WHEN the user clicks the delete button, THE SYSTEM SHALL display a confirmation dialog "Bạn có chắc muốn xóa nhân viên này?".
- [x] WHEN the user confirms deletion, THE SYSTEM SHALL remove the employee and display "Xóa nhân viên thành công".
- [x] WHEN the user cancels deletion, THE SYSTEM SHALL close the dialog without changes.

### Story 6: Error Handling (Priority: P1) 🎯 MVP

As a user, I want clear error messages when operations fail so that I understand what went wrong.

**Independent Test**: Disconnect network, attempt action, verify Vietnamese error message displays.

**Acceptance Criteria**:
- [x] IF the API request fails due to network error, THEN THE SYSTEM SHALL display "Lỗi kết nối. Vui lòng kiểm tra mạng".
- [x] IF the API returns a 500 error, THEN THE SYSTEM SHALL display "Lỗi hệ thống. Vui lòng thử lại sau".
- [x] IF the API request times out after 10 seconds, THEN THE SYSTEM SHALL display "Yêu cầu quá thời gian. Vui lòng thử lại".

## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------| 
| Backend port | 3000 | Vite uses 5173, need separate port for API | 8080, 4000 |
| Pagination default | 25 rows | Balanced view for 1630+ records | 10, 50, 100 |
| Page size options | 10, 25, 50, 100 | Standard pagination options | Custom values |
| ~~Virtual scroll height~~ | ~~`calc(100vh - 200px)`~~ | Replaced by pagination | N/A |
| ~~Virtual scroll row height~~ | ~~48px~~ | Replaced by pagination | N/A |
| Search debounce | 300ms | Prevents excessive filtering on 1630+ rows | 200ms, 500ms |
| Delete confirmation | Required | Prevents accidental data loss | Soft delete only |
| Form validation | Client + Server | UX + data integrity | Client only |
| Inline edit fields | 3 fields | full_name, department, chuc_vu editable | All fields |
| Inline save trigger | Enter/blur | Standard UX for popup edit | Button only |

> These assumptions were made autonomously based on codebase patterns and industry standards.
> Override in spec if different behavior is required.

## Non-Functional Requirements

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| API response time (paginated) | < 500ms | P95 latency per page |
| Page navigation response | < 100ms | Client-side page change |
| Initial table render | < 200ms | First contentful paint |
| Inline edit response | < 500ms | Save to database |
| Mobile responsive | 375px+ | Viewport width |
| Tablet responsive | 768px+ | Viewport width |
| Desktop responsive | 1200px+ | Viewport width |

## Out of Scope

- Employee profile photos/avatars
- Employee import/export (CSV, Excel)
- Role-based access control
- Audit logging
- Employee hierarchy/org chart
- Bulk operations (delete multiple)

## Implementation Enhancements

These features were added during implementation beyond original spec:

| Enhancement | Description |
|-------------|-------------|
| `/health` endpoint | Added for server monitoring and health checks |
| Position search | Search now includes `position` field |
| Immutable employee_code | Code cannot be changed during edit (data integrity) |
| Mobile column labels | "Mã Nhân Viên" → "Mã NV" for mobile responsiveness |

## Implementation Notes

**Status**: Completed
**Files**: `src/pages/employees.vue`, `src/composables/useEmployees.ts`, `src/services/employeeService.ts`, `server/routes/employees.ts`
**Deviations**:
- chuc_vu field uses q-select dropdown with predefined ChucVu options
- Per-cell loading state tracks individual field editing status
**Limitations**: None

**AC7-AC9 Implementation (2026-01-27)**:
- Removed virtual scroll in favor of Quasar's built-in pagination
- Added pagination ref with default rowsPerPage: 25
- Options: 10, 25, 50, 100 rows per page
- Added watch on searchQuery to reset page to 1

**AC10 Implementation (2026-01-27)**:
- Implemented batch fetching in server/routes/employees.ts
- BATCH_SIZE = 1000 to match Supabase's default max_rows
- Uses .range() pagination to fetch all records when limit=0
- Optimized with push() instead of spread for memory efficiency

**RLS Fix (2026-01-27)**:
- Added `supabaseAdmin` client using `SERVICE_ROLE_KEY` for backend CRUD operations
- US-004 (Edit Employee) and US-007 (Inline Edit) now fully operational
- Backend routes use `supabaseAdmin` to bypass RLS for server-side operations
