# Pages Layer

File-based routing với `unplugin-vue-router`. Mỗi `.vue` file = 1 route.

Pages đánh dấu ★ có mặt trong sidebar (`src/composables/useSidebar.ts`) — đây là các nghiệp vụ chính công ty đang dùng hàng ngày. Pages không có ★ được truy cập qua điều hướng nội bộ (nút, link chi tiết) hoặc URL trực tiếp.

## STRUCTURE

```
pages/
├── index.vue                        # / ★ Trang Chủ
├── login.vue                        # /login (Public)
├── forbidden.vue                    # /forbidden (403 page)
├── employees.vue                    # /employees (HR management)
├── announcements.vue                # /announcements ★ Thông Báo Hệ Thống
├── phan-quyen.vue                   # /phan-quyen ★ Phân Quyền
├── settings.vue                     # /settings ★ Cài Đặt
├── notification-channels.vue        # /notification-channels
├── kho.vue                          # /kho ★ Kho
├── ke-hoach.vue                     # /ke-hoach ★ (landing nhóm Kế Hoạch)
├── ky-thuat.vue                     # /ky-thuat ★ (landing nhóm Kỹ Thuật)
├── nhan-su.vue                      # /nhan-su ★ (landing nhóm Nhân Sự)
├── components.vue                   # /components (UI demo)
├── qr-demo.vue                      # /qr-demo (QR demo)
├── nhan-su/
│   └── danh-sach.vue                # /nhan-su/danh-sach ★ Danh Sách Nhân Viên
├── guides/
│   ├── index.vue                    # /guides ★ Hướng Dẫn
│   ├── [slug].vue                   # /guides/:slug
│   └── editor.vue                   # /guides/editor
├── g/
│   └── [slug].vue                   # /g/:slug (public guide link)
├── reports/
│   └── allocations.vue              # /reports/allocations
└── thread/                          # Thread management (main module)
    ├── index.vue                    # /thread ★ Loại Chỉ
    ├── dashboard.vue                # /thread/dashboard ★ Dashboard
    ├── inventory.vue                # /thread/inventory ★ Tồn Kho
    ├── loans.vue                    # /thread/loans Mượn Chỉ (tạm ẩn khỏi sidebar/hub)
    ├── transfer-reserved.vue        # /thread/transfer-reserved ★ Chuyển kho theo Tuần
    ├── colors.vue                   # /thread/colors ★ Màu Sắc
    ├── suppliers.vue                # /thread/suppliers ★ Nhà Cung Cấp
    ├── chat-assistant.vue           # /thread/chat-assistant ★ Trợ Lý Tra Cứu
    ├── allocations.vue              # /thread/allocations
    ├── recovery.vue                 # /thread/recovery
    ├── requests.vue                 # /thread/requests
    ├── stocktake.vue                # /thread/stocktake
    ├── over-quota-analysis.vue      # /thread/over-quota-analysis
    ├── suppliers/
    │   ├── import-colors.vue        # /thread/suppliers/import-colors
    │   └── import-tex.vue           # /thread/suppliers/import-tex
    ├── styles/
    │   ├── index.vue                # /thread/styles ★ Mã Hàng
    │   ├── with-specs.vue           # /thread/styles/with-specs ★ D/S Style đã có Định Mức
    │   └── [id].vue                 # /thread/styles/:id
    ├── weekly-order/
    │   ├── index.vue                # /thread/weekly-order ★ Tính Toán & Đặt Hàng
    │   ├── history.vue              # /thread/weekly-order/history ★ Lịch Sử Đặt Hàng
    │   ├── leader-review.vue        # /thread/weekly-order/leader-review ★ Lãnh Đạo Ký Duyệt
    │   ├── deliveries.vue           # /thread/weekly-order/deliveries ★ Theo Dõi & Nhập Kho
    │   └── [id].vue                 # /thread/weekly-order/:id
    ├── issues/
    │   ├── v2/index.vue             # /thread/issues/v2 ★ Xuất Kho
    │   ├── v2/[id].vue              # /thread/issues/v2/:id
    │   ├── export-history.vue       # /thread/issues/export-history ★ Lịch Sử Xuất Chỉ
    │   └── reconciliation.vue       # /thread/issues/reconciliation
    ├── return/
    │   ├── index.vue                # /thread/return Trả Kho (tạm ẩn khỏi sidebar/hub)
    │   └── [id].vue                 # /thread/return/:id
    ├── purchase-orders/
    │   ├── index.vue                # /thread/purchase-orders ★ Đơn Hàng (PO)
    │   ├── [id].vue                 # /thread/purchase-orders/:id
    │   └── import.vue               # /thread/purchase-orders/import
    ├── sub-arts/
    │   └── index.vue                # /thread/sub-arts ★ Import Sub-Art
    ├── calculation/
    │   └── index.vue                # /thread/calculation
    ├── batch/
    │   ├── receive.vue              # /thread/batch/receive
    │   ├── issue.vue                # /thread/batch/issue
    │   ├── transfer.vue             # /thread/batch/transfer ★ Chuyển Kho
    │   ├── history.vue              # /thread/batch/history
    │   └── transfer-history.vue     # /thread/batch/transfer-history
    ├── lots/
    │   ├── index.vue                # /thread/lots
    │   └── [id].vue                 # /thread/lots/:id
    └── mobile/                      # Mobile-optimized cho kho
        ├── issue.vue                # /thread/mobile/issue
        ├── receive.vue              # /thread/mobile/receive
        └── recovery.vue             # /thread/mobile/recovery
```

## CONVENTIONS

### Route Meta

Mọi route yêu cầu đăng nhập MẶC ĐỊNH (`src/router/guards.ts`). Trang public phải khai `public: true`. Trang nhạy cảm quyền phải khai `permissions`:

```typescript
definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.weekly-order.view'],  // OR logic; allPermissions = AND
  }
})
```

Trang không có `definePage` vẫn bắt đăng nhập nhưng KHÔNG gate quyền — thêm trang mới có nghiệp vụ nhạy cảm thì luôn khai `meta.permissions`.

### Thêm trang vào sidebar

Thêm `NavItem` vào `navItems` trong `src/composables/useSidebar.ts` (label tiếng Việt, icon `o_*` outlined, `to` path). Sidebar KHÔNG filter theo permission — guard chặn khi navigate.

### Dynamic Routes
- `[id].vue` → `:id` param
- Access via `useRoute().params.id`

### Page Structure Pattern
```vue
<template>
  <q-page padding>
    <!-- Page Header: Title + Filters + Actions -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12 col-md-3">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Page Title
        </h1>
      </div>
      <div class="col-12 col-md-9">
        <!-- Filters & Actions (responsive) -->
      </div>
    </div>

    <!-- Main Content -->
    <AppCard>
      <!-- DataTable or Form -->
    </AppCard>

    <!-- Dialogs -->
    <FormDialog v-model="showDialog" ... />
  </q-page>
</template>

<script setup lang="ts">
definePage({
  meta: { requiresAuth: true }
})

// Composables for data & actions
const { items, loading, fetchItems, createItem, ... } = useDomainData()
</script>
```

### Responsive Layout (MANDATORY)
```vue
<!-- Mobile-first: col-12 base, then responsive up -->
<div class="row q-col-gutter-md">
  <!-- Stats cards: 1 col mobile → 2 tablet → 4 desktop -->
  <div class="col-12 col-sm-6 col-md-3">Stat 1</div>

  <!-- Form fields: full mobile → 2 cols tablet+ -->
  <div class="col-12 col-sm-6">Field 1</div>

  <!-- Sidebar + content -->
  <div class="col-12 col-md-3">Sidebar</div>
  <div class="col-12 col-md-9">Main content</div>
</div>
```

## AUTH PAGES

| Page | Auth Required | Notes |
|------|--------------|-------|
| `login.vue` | No | Redirect if already logged in |
| `forbidden.vue` | No | 403 unauthorized page |
| `g/[slug].vue` | No | Public guide share link |
| All others | Yes | Redirect to login if not authenticated |

## ANTI-PATTERNS

| Forbidden | Correct |
|-----------|---------|
| `$q.notify()` direct | `useSnackbar().success()` |
| `$q.dialog()` direct | `useConfirm().show()` |
| Hardcode API calls | Use services from `@/services/` |
| Query database from frontend | Backend Hono API via services |
| `<q-btn>` direct | `<AppButton>` wrapper (context-dependent) |
| `<q-select>` direct | `<AppSelect>` wrapper (strict) |

## WHERE TO LOOK

| Need | Location |
|------|----------|
| Add new page | Create `.vue` file here (auto-routing) |
| Add page to sidebar menu | `src/composables/useSidebar.ts` |
| Route guard / permission logic | `src/router/guards.ts` |
| Add page to thread module | `thread/` subdirectory |
| Mobile-optimized page | `thread/mobile/` |
| Shared page logic | Create composable in `src/composables/` |
| Page types | `src/types/` |
