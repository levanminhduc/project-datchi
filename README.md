# Hệ thống Quản lý Kho Chỉ (Thread Inventory Management System)

Ứng dụng quản lý kho chỉ cho ngành may mặc, xây dựng với Vue 3 + Quasar + Hono + Supabase.

## 🎯 Tổng quan

Hệ thống quản lý toàn diện cho:
- **Quản lý kho chỉ**: Nhập kho, xuất kho, chuyển kho theo FEFO
- **Phân bổ chỉ**: Theo dõi phân bổ chỉ cho sản xuất
- **Thu hồi cuộn lẻ**: Cân và thu hồi cuộn chỉ còn dư
- **Kiểm kê**: Đối chiếu tồn kho thực tế với hệ thống
- **Quản lý nhân sự**: Phân quyền theo vai trò

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 + Quasar 2 + TypeScript + Vite |
| Backend | Hono (Node.js) |
| Database | Supabase (PostgreSQL) |
| Routing | unplugin-vue-router (file-based) |
| State | Pinia + Composables |

## 📁 Cấu trúc dự án

```
project-datchi/
├── server/                    # Hono API backend (port 3000)
│   ├── routes/               # 14 API route handlers
│   ├── db/                   # Supabase clients (anon + admin)
│   ├── middleware/           # Auth JWT verification
│   └── types/                # Backend-specific types
├── src/
│   ├── components/
│   │   ├── ui/               # 66 Quasar wrapper components (12 categories)
│   │   ├── thread/           # 30 domain-specific components
│   │   ├── qr/               # QR scanning components
│   │   └── hardware/         # Scanner/scale integration
│   ├── composables/          # 32 composables
│   │   ├── thread/           # Domain: inventory, allocations, recovery
│   │   └── hardware/         # Scanner, scale, audio feedback
│   ├── services/             # 14 API clients (fetchApi pattern)
│   ├── pages/                # 31 pages (file-based routing)
│   │   ├── thread/           # Thread management module
│   │   │   ├── batch/        # Batch operations
│   │   │   └── mobile/       # Mobile-optimized pages
│   │   ├── nhan-su/          # HR module
│   │   └── reports/          # Reporting module
│   ├── types/                # TypeScript definitions
│   │   ├── ui/               # UI component interfaces
│   │   ├── thread/           # Thread domain types
│   │   └── auth/             # Authentication types
│   ├── stores/               # Pinia stores
│   └── utils/                # Shared utilities
└── supabase/                 # 28 migrations + seed data
```

## 💻 Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development
npm run dev        # Frontend (port 5173)
npm run server     # Backend (port 3000)
npm run dev:all    # Cả hai cùng lúc

# Build production
npm run build      # Includes type-check
npm run type-check # vue-tsc only
npm run lint       # ESLint fix
```

## ✨ Tính năng chính

### 📦 Quản lý Kho Chỉ
- Nhập kho theo lô (batch receive)
- Xuất kho cho sản xuất (batch issue)
- Chuyển kho giữa các kho (batch transfer)
- Theo dõi tồn kho theo FEFO (First Expired First Out)
- Quản lý cuộn lẻ (partial cones)

### 📋 Phân bổ & Thu hồi
- Tạo và quản lý phiếu yêu cầu chỉ
- Phân bổ tự động theo FEFO
- Thu hồi cuộn chỉ còn dư
- Cân và ghi nhận trọng lượng

### 📱 QR Code Features
- **Tra cứu nhanh**: Quét mã QR/barcode để tìm cuộn chỉ
- **Xuất chỉ**: Quét liên tục nhiều cuộn khi xuất chỉ
- **Kiểm kê**: Trang kiểm kê chuyên dụng (`/thread/stocktake`)
- **In nhãn QR**: In đơn (50x30mm) hoặc hàng loạt (A4)

### 📊 Báo cáo & Dashboard
- Tổng quan tồn kho theo loại chỉ
- Cảnh báo hết hàng, sắp hết hàng
- Thống kê phân bổ và thu hồi
- Export Excel

### 👥 Quản lý Nhân sự
- Quản lý nhân viên và chức vụ
- Phân quyền theo vai trò (RBAC)
- JWT authentication với refresh token

## 🔧 Development Guidelines

### UI Components
Sử dụng thư viện UI wrappers trong `src/components/ui/`:
- **Buttons**: AppButton, IconButton, ButtonGroup, ButtonToggle, ButtonDropdown
- **Inputs**: AppInput, AppSelect, AppTextarea, AppCheckbox, AppToggle, SearchInput
- **Dialogs**: AppDialog, FormDialog, ConfirmDialog, DeleteDialog
- **Feedback**: AppSpinner, AppProgress, AppSkeleton, EmptyState
- **Navigation**: AppTabs, AppStepper, AppPagination, AppBreadcrumbs
- **Tables**: DataTable

```vue
<!-- ✅ ĐÚNG: Sử dụng wrappers -->
<AppButton label="Lưu" @click="save" />
<AppInput v-model="name" label="Tên" />

<!-- ❌ SAI: Dùng Quasar trực tiếp -->
<q-btn label="Lưu" @click="save" />
<q-input v-model="name" label="Tên" />
```

### Composables
Sử dụng composables thay vì truy cập Quasar trực tiếp:

```typescript
// ✅ ĐÚNG
const snackbar = useSnackbar()
snackbar.success('Lưu thành công')

// ❌ SAI
$q.notify({ message: 'Lưu thành công' })
```

### API Response Format
```typescript
{ data: T | null, error: string | null, message?: string }
```

### Responsive Design (Mobile First)
```vue
<div class="row q-col-gutter-md">
  <div class="col-12 col-sm-6 col-md-4">Card 1</div>
  <div class="col-12 col-sm-6 col-md-4">Card 2</div>
</div>
```

## 📌 Lưu ý quan trọng

### Database Safety
- ⚠️ **KHÔNG** chạy `supabase db reset` mà không có backup
- Kiểm tra nội dung migration trước khi chạy
- Backup dữ liệu trước các migration có DROP/TRUNCATE

### Coding Standards
- Tất cả messages hiển thị cho user bằng tiếng Việt
- Không dùng `as any`, `@ts-ignore`
- Không commit trực tiếp vào main

## 📑 License
[MIT](http://opensource.org/licenses/MIT)
