# Employee Management

**Implementation Status: COMPLETED** ✅

## Overview

Employee management system for viewing, creating, editing, and deleting employee records. Provides a responsive data table with search/filter capabilities using Vietnamese UI labels.

## User Stories

### Story 1: View Employee List (Priority: P1) 🎯 MVP

As an administrator, I want to view a list of all employees in a paginated table so that I can quickly browse employee information.

**Independent Test**: Navigate to /employees page, verify table displays with columns and pagination controls.

**Acceptance Criteria**:
- [x] WHEN the user navigates to the employees page, THE SYSTEM SHALL display a data table with columns: Tên Nhân Viên, Mã NV, Phòng Ban, Chức Vụ.
- [x] WHEN the table is loading data, THE SYSTEM SHALL display a loading skeleton.
- [x] WHEN no employees exist in the database, THE SYSTEM SHALL display an empty state message "Chưa có nhân viên nào".
- [x] WHEN the user clicks a column header, THE SYSTEM SHALL sort the table by that column.
- [x] WHERE more than 10 employees exist, THE SYSTEM SHALL paginate results with page size options (10, 25, 50).

> **Spec Drift**: Column label "Mã Nhân Viên" abbreviated to "Mã NV" for better mobile fit.

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

### Story 4: Edit Employee (Priority: P2)

As an administrator, I want to edit an existing employee's information so that I can keep records up to date.

**Independent Test**: Click edit button on a row, modify data, submit, verify changes persist.

**Acceptance Criteria**:
- [x] WHEN the user clicks the edit button on a row, THE SYSTEM SHALL display a pre-filled form dialog with employee_code field disabled.
- [x] WHEN the user submits valid changes, THE SYSTEM SHALL update the employee and display "Cập nhật thành công".
- [x] IF the update fails, THEN THE SYSTEM SHALL display error "Cập nhật thất bại. Vui lòng thử lại".

> **Spec Drift**: `employee_code` field is immutable during edit (business rule discovered during implementation).

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
| Pagination default | 10 rows | Standard UX, balances load vs scrolling | 20, 25 rows |
| Search debounce | 300ms | Prevents excessive API calls | 200ms, 500ms |
| Delete confirmation | Required | Prevents accidental data loss | Soft delete only |
| Form validation | Client + Server | UX + data integrity | Client only |

> These assumptions were made autonomously based on codebase patterns and industry standards.
> Override in spec if different behavior is required.

## Non-Functional Requirements

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| API response time | < 500ms | P95 latency |
| Table render time | < 100ms | First contentful paint |
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
**Deviations**: None (all spec drift documented above)
**Limitations**: None
