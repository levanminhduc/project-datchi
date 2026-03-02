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
| Frontend | Vue 3.5 + Quasar 2.17 + TypeScript 5.9 + Vite 7.1 |
| Backend | Hono 4.11 (Node.js) |
| Database | Supabase (PostgreSQL) + supabase-js 2.91 |
| Routing | unplugin-vue-router (file-based) |
| State | Pinia 3 + Composables |
| Validation | Zod 4.3 (backend + shared schemas) |
| Utilities | date-fns, ExcelJS, VueUse, qrcode |

## 📁 Cấu trúc dự án

```
project-datchi/
├── server/                    # Hono API backend (port 3000)
│   ├── routes/               # 25 API route handlers
│   ├── db/                   # Supabase clients (admin)
│   ├── middleware/           # Auth JWT verification
│   ├── types/                # 11 backend-specific types
│   ├── validation/           # 6 Zod validation schemas
│   ├── utils/                # Error helpers, sanitize, notification
│   └── scripts/              # Utility scripts
├── src/
│   ├── components/
│   │   ├── ui/               # 67 UI components (13 categories)
│   │   ├── thread/           # 41 domain-specific components
│   │   ├── qr/               # QR scanning components
│   │   └── hardware/         # Scanner/scale integration
│   ├── composables/          # 46 composables
│   │   ├── thread/           # 20 domain composables
│   │   └── hardware/         # Scanner, scale, audio feedback
│   ├── services/             # 28 API clients (fetchApi pattern)
│   ├── pages/                # 41 pages (file-based routing)
│   │   ├── thread/           # Thread management module
│   │   │   ├── batch/        # Batch operations (4 pages)
│   │   │   ├── calculation/  # Thread calculation
│   │   │   ├── issues/       # Issue management
│   │   │   │   └── v2/       # Issue V2 flow
│   │   │   ├── lots/         # Lot tracking
│   │   │   ├── mobile/       # Mobile-optimized (3 pages)
│   │   │   ├── styles/       # Style/SKU management
│   │   │   └── weekly-order/ # Weekly ordering & deliveries
│   │   ├── nhan-su/          # HR module
│   │   └── reports/          # Reporting module
│   ├── types/                # 40 TypeScript definitions
│   │   ├── ui/               # 13 UI component interfaces
│   │   ├── thread/           # 18 thread domain types
│   │   └── auth/             # Authentication types
│   ├── stores/               # Pinia stores
│   └── utils/                # Shared utilities
├── .claude/
│   └── agents/               # 9 AI agent definitions
└── supabase/                 # 55 migrations + seed data
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
npm run e2e        # Playwright end-to-end tests
```

Lần đầu chạy Playwright cần cài browser:
```bash
npx playwright install
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

### 🧵 Quản lý Chỉ
- Quản lý loại chỉ (thread types) với mã màu
- Quản lý màu chỉ và nhà cung cấp
- Định nghĩa styles/SKUs và thread specs cho từng style
- Tính toán định mức chỉ (thread calculation)

### 📦 Quản lý Lô (Lots)
- Theo dõi lô chỉ nhập kho chi tiết
- Trang chi tiết lô (`/thread/lots/[id]`)
- Quản lý trạng thái lô hàng

### 📋 Phiếu xuất V2
- Quy trình xuất chỉ mới (Issue V2)
- Trả chỉ và ghi nhận return logs
- Đối chiếu (reconciliation) xuất - trả

### 📅 Đặt hàng tuần
- Tính toán nhu cầu chỉ hàng tuần
- Tạo và theo dõi đơn đặt hàng (purchase orders)
- Quản lý giao hàng (deliveries)

### 📶 Hỗ trợ Offline
- Hoạt động offline cho mobile
- Đồng bộ tự động khi có kết nối
- Giải quyết xung đột dữ liệu (conflict resolution)

### 🔔 Thông báo
- Hệ thống thông báo trong ứng dụng
- Notification bell real-time

### 📱 QR Code Features
- **Tra cứu nhanh**: Quét mã QR/barcode để tìm cuộn chỉ
- **Xuất chỉ**: Quét liên tục nhiều cuộn khi xuất chỉ
- **Kiểm kê**: Trang kiểm kê chuyên dụng (`/thread/stocktake`)
- **In nhãn QR**: In đơn (50x30mm) hoặc hàng loạt (A4)

### 📊 Báo cáo & Dashboard
- Tổng quan tồn kho theo loại chỉ, theo kho
- Dashboard thống kê: nhập/xuất/tồn, phân bổ, thu hồi
- Cảnh báo hết hàng, sắp hết hạn (FEFO)
- Báo cáo đặt hàng tuần và tiến độ giao hàng
- Báo cáo đối chiếu xuất - trả chỉ
- Export Excel (ExcelJS) với định dạng chuyên nghiệp

### 👥 Quản lý Nhân sự
- Quản lý nhân viên và chức vụ
- Phân quyền theo vai trò (RBAC)
- JWT authentication với refresh token

## 🔧 Development Guidelines

### UI Components
Sử dụng thư viện UI wrappers trong `src/components/ui/`:
- **Buttons**: AppButton, IconButton, ButtonGroup, ButtonToggle, ButtonDropdown
- **Cards**: AppCard, AppBadge, AppChip, InfoCard, StatCard
- **Inputs**: AppInput, AppSelect, AppTextarea, AppCheckbox, AppToggle, AppRange, AppSlider, SearchInput, AppWarehouseSelect, ColorSelector, SupplierSelector
- **Dialogs**: AppDialog, FormDialog, ConfirmDialog, DeleteDialog, AppMenu, AppTooltip, PopupEdit
- **Feedback**: AppSpinner, AppProgress, AppSkeleton, EmptyState, AppBanner, CircularProgress, InnerLoading
- **Layout**: AppDrawer, AppSeparator, AppSpace, AppToolbar, PageHeader, SectionHeader
- **Lists**: AppList, ListItem
- **Navigation**: AppTabs, AppStepper, AppPagination, AppBreadcrumbs, SidebarItem, StepperStep, TabPanel
- **Pickers**: DatePicker, ColorPicker, FilePicker, TimePicker, AppEditor
- **Media**: AppCarousel, AppImage, AppParallax, AppVideo
- **Scroll**: ScrollArea, InfiniteScroll, PullToRefresh, VirtualScroll, Timeline, TimelineEntry
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
