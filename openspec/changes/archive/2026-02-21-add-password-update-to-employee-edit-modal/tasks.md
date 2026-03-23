## 1. Service Layer

- [x] 1.1 Add `resetPassword(id: number, newPassword: string)` method to `src/services/employeeService.ts` that calls `POST /api/auth/reset-password/:id` with `{ newPassword }`

## 2. Employee Edit Modal

- [x] 2.1 Add `newPassword` reactive ref to `src/pages/employees.vue` form state, cleared on modal open
- [x] 2.2 Add "Mật khẩu mới" `AppInput` field (type=password) to FormDialog, visible only when `formDialog.mode === 'edit'`
- [x] 2.3 Update save handler: after successful employee update, if `newPassword` has a value, call `employeeService.resetPassword()` with employee ID and show appropriate success/error messages ← (verify: password field appears only in edit mode, save calls reset-password API correctly, error handling works for partial success)
