# Excel-like Inline Editing cho Định mức chỉ

## TL;DR

> **Quick Summary**: Thay đổi bảng định mức chỉ từ readonly + dialog sang inline editable với `q-popup-edit`, theo pattern đã có trong codebase (`employees.vue`, `thread/index.vue`).
> 
> **Deliverables**:
> - Bảng định mức có thể edit inline (4 cột: Công đoạn, NCC, Tex, Định mức)
> - Tab di chuyển giữa các ô
> - Dropdown cho NCC và Tex
> - Nút Delete xóa từng dòng
> - Rollback on API failure
> 
> **Estimated Effort**: Medium (3-4 giờ)
> **Parallel Execution**: NO - sequential (4 tasks)
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4

---

## Context

### Original Request
User muốn UI nhập định mức chỉ theo kiểu bảng Excel:
- Click vào ô để edit trực tiếp
- Tab để di chuyển giữa các ô
- Dropdown cho NCC và Tex
- Nút Delete để xóa dòng
- Giữ nút "Thêm định mức" hiện có

### Interview Summary
**Key Discussions**:
- 4 cột: Tên công đoạn, NCC, Tex, Định mức (theo ảnh Excel user gửi)
- Cho phép trùng tên công đoạn trong cùng 1 mã hàng
- Enter chỉ lưu ô hiện tại, không tự động thêm dòng mới
- Nút "Thêm định mức" thêm dòng trống vào bảng (KHÔNG mở dialog)

**Research Findings**:
- Pattern `q-popup-edit` đã được dùng trong `employees.vue:93-126` và `thread/index.vue:165-232`
- Composable `useStyleThreadSpecs()` đã xử lý CRUD hoàn chỉnh
- Không cần thay đổi API hay database

### Metis Review
**Identified Gaps** (addressed):
- Tab navigation: Dùng Quasar native focus handling
- Empty row handling: Validation required fields khi blur
- Rollback pattern: Áp dụng từ `employees.vue` handleInlineUpdate

---

## Work Objectives

### Core Objective
Chuyển đổi bảng định mức từ readonly sang inline editable, sử dụng `q-popup-edit` theo pattern codebase hiện có.

### Concrete Deliverables
- File: `src/pages/thread/styles/[id].vue` - Tab "Định mức chỉ" với editable table
- Cells editable: process_name (input), supplier_id (dropdown), tex_id (dropdown), meters_per_unit (number input)

### Definition of Done
- [x] Mỗi cell trong bảng có thể click để edit inline
- [x] Tab di chuyển focus sang ô tiếp theo
- [x] NCC và Tex hiển thị dropdown options
- [x] API call on save with rollback on failure
- [x] Nút Delete xóa dòng với confirm dialog

### Must Have
- Inline edit với `q-popup-edit`
- Dropdown cho NCC (suppliers) và Tex (thread_types)
- Tab navigation giữa các ô
- API save on blur/confirm
- Rollback nếu API fail

### Must NOT Have (Guardrails)
- ❌ KHÔNG tạo component `EditableTable` mới - dùng `q-popup-edit` trực tiếp
- ❌ KHÔNG implement copy/paste, undo/redo
- ❌ KHÔNG cell selection highlighting kiểu Excel
- ❌ KHÔNG thay đổi API endpoints hay database schema
- ❌ KHÔNG validate unique process_name (cho phép trùng theo yêu cầu)
- ✅ XÓA dialog form cũ hoàn toàn (thay bằng inline add row)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (bun test configured)
- **Automated tests**: NO - QA scenarios only (frontend UI)
- **Agent-Executed QA**: ALWAYS via Playwright

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
└── Task 1: Convert cells to popup-edit

Wave 2 (After Wave 1):
└── Task 2: Implement dropdown cells

Wave 3 (After Wave 2):
├── Task 3: Add inline new row functionality
└── Task 4: Keyboard navigation + cleanup

Critical Path: Task 1 → Task 2 → Task 3 → Task 4
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | None |
| 2 | 1 | 3, 4 | None |
| 3 | 2 | 4 | None |
| 4 | 3 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | delegate_task(category="visual-engineering", load_skills=["vue-best-practices"]) |
| 2 | 2 | delegate_task(category="visual-engineering", load_skills=["vue-best-practices"]) |
| 3 | 3 | delegate_task(category="visual-engineering", load_skills=["vue-best-practices"]) |
| 4 | 4 | delegate_task(category="quick", load_skills=["vue-best-practices"]) |

---

## TODOs

- [x] 1. Convert định mức table cells to inline editable ✅ DONE

  **What to do**:
  - Thay thế readonly display trong `q-table` template slots bằng `q-popup-edit`
  - Áp dụng pattern từ `employees.vue:93-126` cho text input
  - Implement `handleInlineUpdate(row, field, val, initialVal)` function
  - Add optimistic update with rollback on API failure
  - Giữ cột Thao tác với nút Delete (đã có)
  - Ẩn/comment cột Ghi chú (không có trong Excel user)

  **Must NOT do**:
  - KHÔNG tạo component riêng
  - KHÔNG thay đổi composable useStyleThreadSpecs

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Frontend UI modification với Vue/Quasar
  - **Skills**: [`vue-best-practices`]
    - `vue-best-practices`: Vue 3 reactivity, template patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (sequential)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `src/pages/employees.vue:93-126` - q-popup-edit pattern với input, auto-save, rollback
  - `src/pages/employees.vue:643-705` - handleInlineUpdate function pattern
  - `src/pages/thread/index.vue:165-232` - q-popup-edit với dropdown select

  **API/Type References**:
  - `src/composables/thread/useStyleThreadSpecs.ts` - createSpec, updateSpec, deleteSpec methods
  - `src/types/thread/styleThreadSpec.ts` - StyleThreadSpec interface

  **Target Files**:
  - `src/pages/thread/styles/[id].vue:127-183` - Current q-table implementation to modify

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios (MANDATORY):**

  ```
  Scenario: Click cell opens popup edit
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, navigate to /thread/styles/1, at least 1 spec exists
    Steps:
      1. Navigate to: http://localhost:5173/thread/styles/1
      2. Click tab: "Định mức chỉ"
      3. Wait for: table rows visible (timeout: 5s)
      4. Click: First cell in "Tên công đoạn" column
      5. Assert: q-popup-edit dialog visible
      6. Assert: Input field inside popup has current value
    Expected Result: Popup opens with editable input
    Evidence: .sisyphus/evidence/task-1-popup-opens.png

  Scenario: Edit cell and save
    Tool: Playwright (playwright skill)
    Preconditions: Popup is open from previous scenario
    Steps:
      1. Clear input and type: "Test công đoạn"
      2. Click: Save button (icon "check" or label "Lưu")
      3. Wait for: Popup closes
      4. Assert: Cell now displays "Test công đoạn"
      5. Reload page
      6. Assert: Cell still displays "Test công đoạn" (persisted)
    Expected Result: Value saved to database
    Evidence: .sisyphus/evidence/task-1-cell-saved.png

  Scenario: Edit meters_per_unit (number input)
    Tool: Playwright (playwright skill)
    Steps:
      1. Click: Cell in "Mét/SP" column
      2. Assert: Popup with number input visible
      3. Clear and type: "150.5"
      4. Click Save
      5. Assert: Cell displays "150.50"
    Expected Result: Number formatted and saved
    Evidence: .sisyphus/evidence/task-1-number-edit.png
  ```

  **Evidence to Capture:**
  - [ ] Screenshots in .sisyphus/evidence/ for each scenario
  - [ ] Console logs if any errors

  **Commit**: YES
  - Message: `feat(styles): convert định mức table to inline editable cells`
  - Files: `src/pages/thread/styles/[id].vue`
  - Pre-commit: `npm run type-check`

---

- [x] 2. Implement dropdown cells for NCC and Tex ✅ DONE

  **What to do**:
  - Thay thế popup input bằng `q-select` cho cột NCC (supplier_id)
  - Thay thế popup input bằng `q-select` cho cột Tex (tex_id) 
  - Sử dụng `supplierOptions` và `texOptions` đã computed trong file
  - Display: Tên NCC / Tex number. Value: ID
  - Filter/search trong dropdown để dễ tìm

  **Must NOT do**:
  - KHÔNG tạo component SupplierSelector riêng (đã có sẵn options)
  - KHÔNG filter tex theo supplier (không có business rule này)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Frontend dropdown implementation
  - **Skills**: [`vue-best-practices`]
    - `vue-best-practices`: Vue 3 select handling

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/pages/thread/index.vue:182-210` - q-popup-edit với q-select dropdown pattern
  - `src/components/ui/inputs/AppSelect.vue` - Select wrapper (optional, có thể dùng q-select trực tiếp trong popup)

  **API/Type References**:
  - `src/pages/thread/styles/[id].vue:464-466` - supplierOptions computed (đã có)
  - `src/composables/useSuppliers.ts` - suppliers data source
  - `src/composables/useThreadTypes.ts` - threadTypes for tex options

  **Target Files**:
  - `src/pages/thread/styles/[id].vue` - Add dropdown popups for supplier_id, tex_id cells

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios (MANDATORY):**

  ```
  Scenario: NCC dropdown shows supplier options
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, on styles detail page with specs
    Steps:
      1. Navigate to: http://localhost:5173/thread/styles/1
      2. Click tab: "Định mức chỉ"
      3. Click: Cell in "NCC" column
      4. Assert: q-popup-edit visible with q-select inside
      5. Click: q-select to open options
      6. Assert: Options list contains supplier names (e.g., "COATS")
      7. Select: First option
      8. Click: Save
      9. Assert: Cell displays selected supplier name
    Expected Result: Dropdown works and saves
    Evidence: .sisyphus/evidence/task-2-ncc-dropdown.png

  Scenario: Tex dropdown shows thread type options
    Tool: Playwright (playwright skill)
    Steps:
      1. Click: Cell in "Tex" column
      2. Assert: q-popup-edit visible with q-select inside
      3. Click: q-select to open options
      4. Assert: Options list contains tex numbers (e.g., "tex 60", "tex 40")
      5. Type in filter: "60"
      6. Assert: Filtered to show only tex 60
      7. Select: tex 60
      8. Click Save
      9. Assert: Cell displays "tex 60"
    Expected Result: Dropdown with filter works
    Evidence: .sisyphus/evidence/task-2-tex-dropdown.png

  Scenario: Clear dropdown value (nullable)
    Tool: Playwright (playwright skill)
    Steps:
      1. Click: Cell in "Tex" column with existing value
      2. Click clear button in q-select
      3. Click Save
      4. Assert: Cell displays "-" (null value)
    Expected Result: Can clear optional field
    Evidence: .sisyphus/evidence/task-2-clear-dropdown.png
  ```

  **Commit**: YES
  - Message: `feat(styles): add dropdown selects for NCC and Tex columns`
  - Files: `src/pages/thread/styles/[id].vue`
  - Pre-commit: `npm run type-check`

---

- [x] 3. Implement inline add new row functionality ✅ DONE

  **What to do**:
  - Thay đổi nút "Thêm định mức" từ mở dialog sang thêm dòng trống
  - Implement `addEmptyRow()` function:
    - Tạo object với id tạm (negative hoặc UUID temp)
    - Thêm vào đầu array `styleThreadSpecs`
    - Gọi API `createSpec()` với empty/default values
    - Focus vào cell đầu tiên của dòng mới
  - Handle validation: không cho lưu nếu thiếu required fields (process_name, supplier_id)
  - Visual indicator cho new row chưa lưu (optional: background color nhạt)
  - Xóa dialog form code hoàn toàn (lines 294-370)
  - Clean up: showSpecDialog, specForm, openAddSpecDialog, handleSaveSpec refs/functions

  **Must NOT do**:
  - KHÔNG giữ dialog code
  - KHÔNG validate tex_id (optional field)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Frontend logic + UI changes
  - **Skills**: [`vue-best-practices`]
    - `vue-best-practices`: Vue 3 reactivity, array manipulation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 4
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/composables/thread/useStyleThreadSpecs.ts` - createSpec method
  - Existing inline add patterns in other pages (if any)

  **API/Type References**:
  - `src/types/thread/styleThreadSpec.ts` - default values for new record

  **Target Files**:
  - `src/pages/thread/styles/[id].vue:116-123` - Change button behavior
  - `src/pages/thread/styles/[id].vue:294-370` - DELETE dialog code

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios (MANDATORY):**

  ```
  Scenario: Add button creates empty row
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, on styles detail page
    Steps:
      1. Navigate to: http://localhost:5173/thread/styles/1
      2. Click tab: "Định mức chỉ"
      3. Count: Number of rows (store as initialCount)
      4. Click: Button "Thêm định mức"
      5. Assert: New row appears at TOP of table
      6. Assert: Row count is initialCount + 1
      7. Assert: First cell of new row is editable/focused
    Expected Result: Empty row added at top
    Evidence: .sisyphus/evidence/task-3-empty-row.png

  Scenario: Fill new row and save
    Tool: Playwright (playwright skill)
    Preconditions: New empty row exists
    Steps:
      1. Click: First cell (Tên công đoạn) of new row
      2. Type: "Công đoạn test"
      3. Tab to NCC cell
      4. Select: First supplier
      5. Tab to Tex cell
      6. Select: Any tex
      7. Tab to Định mức cell
      8. Type: "99.5"
      9. Click outside table
      10. Reload page
      11. Assert: Row persisted with all values
    Expected Result: Row saved to database
    Evidence: .sisyphus/evidence/task-3-row-saved.png

  Scenario: Validation prevents empty required fields
    Tool: Playwright (playwright skill)
    Steps:
      1. Click: "Thêm định mức"
      2. Leave all fields empty
      3. Click outside / try to save
      4. Assert: Validation message shows for process_name
      5. Assert: Row not saved (check API call failed or row marked invalid)
    Expected Result: Cannot save without required fields
    Evidence: .sisyphus/evidence/task-3-validation.png
  ```

  **Commit**: YES
  - Message: `feat(styles): implement inline add row, remove dialog form`
  - Files: `src/pages/thread/styles/[id].vue`
  - Pre-commit: `npm run type-check`

---

- [x] 4. Add keyboard navigation and cleanup ✅ DONE

  **What to do**:
  - Ensure Tab key moves to next editable cell after popup closes
  - Test Enter key closes popup (Quasar default behavior)
  - Add `data-testid` attributes for QA verification
  - Update column định nghĩa: ẩn Ghi chú column
  - Final cleanup: remove any unused imports/refs from dialog removal

  **Must NOT do**:
  - KHÔNG custom keyboard event handlers phức tạp (dùng Quasar native)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Minor cleanup and refinements
  - **Skills**: [`vue-best-practices`]
    - `vue-best-practices`: Vue cleanup patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (final)
  - **Blocks**: None
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `src/pages/employees.vue` - How dialog code is organized alongside inline edit
  - Quasar q-popup-edit docs for keyboard behavior

  **Target Files**:
  - `src/pages/thread/styles/[id].vue:294-370` - Dialog to comment out
  - `src/pages/thread/styles/[id].vue:127-183` - Add data-testid

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios (MANDATORY):**

  ```
  Scenario: Tab navigation between cells
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, on styles detail page
    Steps:
      1. Navigate to: http://localhost:5173/thread/styles/1
      2. Click tab: "Định mức chỉ"
      3. Click: First cell (Tên công đoạn)
      4. Type: "Test"
      5. Press: Tab key
      6. Assert: Popup closes
      7. Assert: Next cell (NCC) receives focus or its popup opens
    Expected Result: Tab moves to next cell
    Evidence: .sisyphus/evidence/task-3-tab-navigation.png

  Scenario: Delete button removes row
    Tool: Playwright (playwright skill)
    Steps:
      1. Count: Number of rows in table (store as initialCount)
      2. Click: Delete button (icon "delete") on first row
      3. Assert: Confirm dialog appears with "Xóa" text
      4. Click: Confirm button
      5. Wait for: Table updates
      6. Count: Number of rows (should be initialCount - 1)
    Expected Result: Row deleted after confirmation
    Evidence: .sisyphus/evidence/task-3-delete-row.png

  Scenario: Add new row via button (inline)
    Tool: Playwright (playwright skill)
    Steps:
      1. Count: Number of rows in table (store as initialCount)
      2. Click: Button "Thêm định mức"
      3. Assert: New empty row appears at TOP of table
      4. Assert: First cell (Tên công đoạn) of new row has focus/popup open
      5. Type: "Công đoạn mới"
      6. Press: Tab to move to NCC
      7. Select: First supplier option
      8. Tab to Tex, select an option
      9. Tab to Định mức, type "100"
      10. Click outside to save
      11. Reload page
      12. Assert: New row persisted with entered values
    Expected Result: New row added and saved inline
    Evidence: .sisyphus/evidence/task-3-add-row.png

  Scenario: Dialog code removed (no functionality break)
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate through all tab panels
      2. Assert: No JavaScript errors in console
      3. Assert: Page renders correctly
      4. Assert: No orphan dialog references in DevTools
    Expected Result: Cleanup doesn't break anything
    Evidence: .sisyphus/evidence/task-3-no-errors.png
  ```

  **Commit**: YES
  - Message: `refactor(styles): add keyboard nav, cleanup dialog code, add testids`
  - Files: `src/pages/thread/styles/[id].vue`
  - Pre-commit: `npm run type-check`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(styles): convert định mức table to inline editable cells` | [id].vue | type-check |
| 2 | `feat(styles): add dropdown selects for NCC and Tex columns` | [id].vue | type-check |
| 3 | `feat(styles): implement inline add row, remove dialog form` | [id].vue | type-check |
| 4 | `refactor(styles): add keyboard nav, cleanup, add testids` | [id].vue | type-check + QA |

---

## Success Criteria

### Verification Commands
```bash
npm run type-check  # Expected: No errors
npm run dev:all     # Expected: App runs without console errors
```

### Final Checklist
- [x] Click vào ô → popup edit mở
- [x] Tab di chuyển sang ô tiếp theo
- [x] NCC dropdown hiển thị danh sách suppliers
- [x] Tex dropdown hiển thị danh sách tex numbers
- [x] Nút Delete xóa dòng với confirm
- [x] Nút "Thêm định mức" vẫn hoạt động
- [x] API save hoạt động, rollback nếu fail
- [x] Không có console errors
