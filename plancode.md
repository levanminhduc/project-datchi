# Kế Hoạch Refactor Modal "Chỉnh Sửa Nhân Viên"

## 1. Mục Tiêu Refactor

### Lý do cần refactor:
- **Tuân thủ quy tắc `vue.md`**: Luôn sử dụng UI components từ `src/components/ui/` thay vì sử dụng trực tiếp Quasar components
- **Tính nhất quán**: Đảm bảo toàn bộ dự án sử dụng cùng một pattern cho forms và dialogs
- **Giảm code boilerplate**: Wrapper components đã xử lý sẵn các logic phổ biến (validation, layout, actions)
- **Dễ bảo trì**: Thay đổi style/behavior tại một nơi sẽ áp dụng cho toàn bộ ứng dụng

### Phạm vi thay đổi:
- **File**: [`src/pages/employees.vue`](src/pages/employees.vue)
- **Dòng**: 249-348 (Add/Edit Dialog section)

---

## 2. Các Thay Đổi Cụ Thể

### 2.1. Thay thế Dialog Container

| Trước (Quasar trực tiếp) | Sau (Wrapper Component) |
|--------------------------|------------------------|
| `q-dialog` + `q-card` + `q-form` + nút hành động thủ công | `FormDialog` |

**Chi tiết mapping:**

| Thuộc tính cũ | Thuộc tính mới |
|---------------|----------------|
| `v-model="formDialog.isOpen"` | `v-model="formDialog.isOpen"` |
| `persistent` | `persistent` (mặc định `true`) |
| `style="width: 100%; max-width: 500px"` | `max-width="500px"` |
| Title text trong `q-card-section` | `title` prop |
| `@submit.prevent="handleSubmit"` | `@submit="handleSubmit"` |
| Nút "Hủy" `@click="closeFormDialog"` | `@cancel="closeFormDialog"` |
| `loading` prop trên submit button | `loading` prop |

### 2.2. Thay thế Input Fields

| Trước (Quasar trực tiếp) | Sau (Wrapper Component) |
|--------------------------|------------------------|
| `q-input` với slot `#prepend` và `:rules` thủ công | `AppInput` với `prepend-icon` và `required` props |

**Chi tiết mapping cho từng field:**

#### Mã Nhân Viên
| Thuộc tính cũ | Thuộc tính mới |
|---------------|----------------|
| `label="Mã Nhân Viên *"` | `label="Mã Nhân Viên"` + `required` |
| `:rules="[(val) => !!val?.trim() \|\| '...']"` | `required` (tự động thêm validation) |
| `<template #prepend><q-icon name="badge" /></template>` | `prepend-icon="badge"` |
| `:disable="formDialog.mode === 'edit'"` | `:disable="formDialog.mode === 'edit'"` |

#### Tên Nhân Viên
| Thuộc tính cũ | Thuộc tính mới |
|---------------|----------------|
| `label="Tên Nhân Viên *"` | `label="Tên Nhân Viên"` + `required` |
| `:rules="[(val) => !!val?.trim() \|\| '...']"` | `required` (tự động thêm validation) |
| `<template #prepend><q-icon name="person" /></template>` | `prepend-icon="person"` |

#### Phòng Ban
| Thuộc tính cũ | Thuộc tính mới |
|---------------|----------------|
| `label="Phòng Ban"` | `label="Phòng Ban"` |
| `<template #prepend><q-icon name="business" /></template>` | `prepend-icon="business"` |

#### Chức Vụ
| Thuộc tính cũ | Thuộc tính mới |
|---------------|----------------|
| `label="Chức Vụ"` | `label="Chức Vụ"` |
| `<template #prepend><q-icon name="work" /></template>` | `prepend-icon="work"` |

---

## 3. Code Mẫu Sau Khi Refactor

### 3.1. Template Section (thay thế dòng 249-348)

```vue
<!-- Add/Edit Dialog -->
<FormDialog
  v-model="formDialog.isOpen"
  :title="formDialog.mode === 'create' ? 'Thêm Nhân Viên Mới' : 'Chỉnh Sửa Nhân Viên'"
  submit-text="Lưu"
  cancel-text="Hủy"
  :loading="loading"
  persistent
  max-width="500px"
  @submit="handleSubmit"
  @cancel="closeFormDialog"
>
  <div class="q-gutter-md">
    <!-- Mã Nhân Viên -->
    <AppInput
      v-model="formData.employee_id"
      label="Mã Nhân Viên"
      prepend-icon="badge"
      required
      :disable="formDialog.mode === 'edit'"
    />

    <!-- Tên Nhân Viên -->
    <AppInput
      v-model="formData.full_name"
      label="Tên Nhân Viên"
      prepend-icon="person"
      required
    />

    <!-- Phòng Ban -->
    <AppInput
      v-model="formData.department"
      label="Phòng Ban"
      prepend-icon="business"
    />

    <!-- Chức Vụ -->
    <AppInput
      v-model="formData.chuc_vu"
      label="Chức Vụ"
      prepend-icon="work"
    />
  </div>
</FormDialog>
```

### 3.2. Script Section - Import Statement

Thêm import cho wrapper components:

```typescript
import { FormDialog } from '@/components/ui/dialogs'
import { AppInput } from '@/components/ui/inputs'
```

**Hoặc sử dụng named imports từ barrel file:**

```typescript
import { FormDialog, AppInput } from '@/components/ui'
```

### 3.3. Code Hoàn Chỉnh Cho Section Template (có thể copy-paste)

```vue
<!-- Add/Edit Dialog - Refactored với Wrapper Components -->
<FormDialog
  v-model="formDialog.isOpen"
  :title="formDialog.mode === 'create' ? 'Thêm Nhân Viên Mới' : 'Chỉnh Sửa Nhân Viên'"
  submit-text="Lưu"
  cancel-text="Hủy"
  :loading="loading"
  persistent
  max-width="500px"
  @submit="handleSubmit"
  @cancel="closeFormDialog"
>
  <div class="q-gutter-md">
    <AppInput
      v-model="formData.employee_id"
      label="Mã Nhân Viên"
      prepend-icon="badge"
      required
      :disable="formDialog.mode === 'edit'"
    />

    <AppInput
      v-model="formData.full_name"
      label="Tên Nhân Viên"
      prepend-icon="person"
      required
    />

    <AppInput
      v-model="formData.department"
      label="Phòng Ban"
      prepend-icon="business"
    />

    <AppInput
      v-model="formData.chuc_vu"
      label="Chức Vụ"
      prepend-icon="work"
    />
  </div>
</FormDialog>
```

---

## 4. Những Điểm Cần Lưu Ý

### 4.1. Giữ nguyên logic hiện có
- **`handleSubmit`**: Không thay đổi, FormDialog sẽ emit event `@submit` khi form được submit
- **`closeFormDialog`**: Không thay đổi, được gọi từ event `@cancel`
- **`formData`**: Reactive object giữ nguyên cấu trúc
- **`formDialog` state**: Giữ nguyên các properties `isOpen`, `mode`, `employeeId`

### 4.2. Sử dụng `required` prop thay vì `:rules` thủ công
- `AppInput` với `required` prop sẽ tự động thêm validation rule
- Message validation mặc định: "Trường này là bắt buộc"
- Nếu cần message tùy chỉnh, có thể truyền `:rules` kèm theo:
  ```vue
  <AppInput
    v-model="formData.employee_id"
    label="Mã Nhân Viên"
    :rules="[(val: string) => !!val?.trim() || 'Vui lòng nhập mã nhân viên']"
  />
  ```

### 4.3. Sử dụng `prepend-icon` thay vì slot
- **Cũ**: `<template #prepend><q-icon name="badge" /></template>`
- **Mới**: `prepend-icon="badge"`
- Giảm đáng kể số dòng code và dễ đọc hơn

### 4.4. FormDialog events
| Event | Mô tả | Handler hiện tại |
|-------|-------|-----------------|
| `@submit` | Khi form được submit (button "Lưu") | `handleSubmit` |
| `@cancel` | Khi nhấn nút "Hủy" hoặc close icon | `closeFormDialog` |
| `@hide` | Khi dialog ẩn đi (optional) | Không sử dụng |

### 4.5. FormDialog tự động xử lý
- Close button (X) ở góc phải header
- Nút Cancel với `v-close-popup`
- Submit button với `type="submit"` và loading state
- Form wrapper với `@submit.prevent`

---

## 5. Checklist Thực Hiện

- [ ] Thêm import cho `FormDialog` và `AppInput`
- [ ] Thay thế block code dòng 249-348 bằng code mẫu mới
- [ ] Xóa các import không cần thiết (nếu có)
- [ ] Test chức năng thêm nhân viên mới
- [ ] Test chức năng chỉnh sửa nhân viên
- [ ] Kiểm tra validation hoạt động đúng
- [ ] Kiểm tra loading state hiển thị đúng
- [ ] Kiểm tra dialog đóng đúng cách khi cancel

---

## 6. So Sánh Trước và Sau

### Số dòng code

| Phần | Trước | Sau | Giảm |
|------|-------|-----|------|
| Dialog template | ~100 dòng | ~30 dòng | ~70% |
| Complexity | Cao (nhiều nested components) | Thấp (flat structure) | Đáng kể |

### Lợi ích

1. **Code ngắn gọn hơn**: Từ ~100 dòng xuống ~30 dòng
2. **Dễ đọc**: Cấu trúc flat, không nested templates
3. **Nhất quán**: Tuân thủ chuẩn dự án
4. **Bảo trì**: Thay đổi wrapper sẽ apply toàn app
5. **Type-safe**: Props được định nghĩa rõ ràng trong wrapper

---

*Tài liệu này được tạo để hướng dẫn refactor modal "Chỉnh Sửa Nhân Viên" trong file `src/pages/employees.vue`. Developer có thể copy-paste trực tiếp code mẫu ở Section 3.*
