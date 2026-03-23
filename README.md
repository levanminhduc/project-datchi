# Hệ thống Quản lý Kho Chỉ (Thread Inventory Management System)

Ứng dụng quản lý kho chỉ cho ngành may mặc — Vue 3 + Quasar + Hono + Supabase.

**Last updated:** 2026-03-14

---

## Tổng quan

Hệ thống quản lý toàn diện cho kho chỉ trong nhà máy may:

- **Kho chỉ:** Nhập/xuất/chuyển kho theo FEFO, dual UoM (kg + mét)
- **Phân bổ:** FEFO allocation, split fulfillment, conflict detection
- **Xuất chỉ V2:** Multi-line, confirm, return, reconciliation
- **Đặt hàng tuần:** Loans, reservations, deliveries, sub-art selection
- **Thu hồi:** Cân, ghi nhận, xác nhận cuộn chỉ còn dư
- **Đơn mua hàng:** PO import với SSE streaming progress
- **Tính toán chỉ:** Thread requirements per style/quantity
- **HR & RBAC:** Nhân viên, vai trò, phân quyền chi tiết
- **Mobile:** Trang mobile cho receive/issue/recovery + QR scanning

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3.5.21 + Quasar 2.17.10 + TypeScript 5.9 + Vite 7.1.5 |
| Backend | Hono 4.11.5 (Node.js via tsx 4.21.0) |
| Database | Supabase (PostgreSQL) + supabase-js 2.91.1 |
| Auth | jose 6.1.3 (JWT HS256/RS256 on backend) |
| Routing | unplugin-vue-router 0.15.0 (file-based) |
| State | Pinia 3.0.4 + Composables |
| Validation | Zod 4.3.6 (backend) |
| Utilities | date-fns 4.1.0, ExcelJS 4.4.0, VueUse 14.2.1, qrcode 1.5.4 |
| Drag & Drop | vuedraggable 4.1.0 |
| Testing | Playwright (e2e) |

---

## Cài đặt & Chạy

```bash
# Cài đặt dependencies
npm install

# Development
npm run dev        # Frontend only (port 5173)
npm run server     # Backend only (port 3000)
npm run dev:all    # Frontend + Backend concurrently
```

### Env setup

```bash
cp .env.example .env
# Điền: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#        SUPABASE_JWT_SECRET, VITE_API_URL
```

### Lệnh khác

| Lệnh | Mục đích |
|------|---------|
| `npm run build` | Type-check + Vite build |
| `npm run type-check` | vue-tsc --build --force |
| `npm run lint` | ESLint --fix |
| `npm run e2e` | Playwright headless |
| `npm run e2e:ui` | Playwright UI mode |
| `npm run e2e:headed` | Playwright headed |
| `supabase migration up` | Apply migrations (SAFE) |
| `psql -h 127.0.0.1 -p 54322 -U postgres -d postgres` | DB trực tiếp |

---

## Cấu trúc dự án

```
project-datchi/
├── server/                        # Hono API backend (port 3000)
│   ├── routes/                   # 28 route handlers (~19,800 LOC)
│   ├── db/supabase.ts            # supabaseAdmin (service_role, bypasses RLS)
│   ├── middleware/auth.ts        # JWT verify + requirePermission()
│   ├── validation/               # 8 Zod validation schemas
│   └── utils/                   # errorHelper, notificationService, sanitize
├── src/
│   ├── components/
│   │   ├── ui/                   # 67 base components (13 categories)
│   │   │   ├── buttons/          # AppButton, IconButton, ButtonGroup...
│   │   │   ├── inputs/           # AppInput, AppSelect, AppTextarea...
│   │   │   ├── dialogs/          # AppDialog, ConfirmDialog, FormDialog...
│   │   │   ├── pickers/          # DatePicker (DD/MM/YYYY), ColorPicker...
│   │   │   └── ...               # cards, feedback, layout, navigation, etc.
│   │   ├── thread/               # 48+ domain-specific components
│   │   ├── qr/                   # QR scanning (QrScannerStream)
│   │   ├── hardware/             # BarcodeScanField
│   │   └── auth/                 # Auth guard
│   ├── composables/              # 48 composables (infrastructure + domain + hardware)
│   ├── services/                 # 32 API clients (fetchApi pattern)
│   ├── pages/                    # 50 pages (file-based routing)
│   │   ├── thread/               # Thread module (35+ pages)
│   │   │   ├── weekly-order/     # Weekly ordering cycle
│   │   │   ├── issues/v2/        # Issue V2 workflow
│   │   │   ├── batch/            # Batch operations
│   │   │   ├── mobile/           # Mobile-optimized (3 pages)
│   │   │   ├── styles/           # Style + sub-arts management
│   │   │   └── purchase-orders/  # PO + import
│   │   ├── nhan-su/              # HR module
│   │   └── reports/              # Reporting
│   ├── types/                    # 43 TypeScript type files
│   ├── stores/                   # Pinia stores
│   └── lib/supabase.ts           # Frontend Supabase client (anon key)
├── supabase/
│   ├── migrations/               # 97 SQL migrations
│   └── schema/                   # Full schema snapshots
├── docker-compose.yml            # 2 containers: frontend + backend
├── Dockerfile.frontend           # 3-stage multi-stage build (nginx:8080)
├── Dockerfile.backend            # 3-stage multi-stage build (Hono:3010)
└── nginx.docker.conf             # Brotli + gzip + security headers
```

---

## Kiến trúc (tóm tắt)

```
Supabase (PostgreSQL + Auth)
    ↓ supabaseAdmin (service_role)
Hono API (28 routes) ← authMiddleware (JWT via jose)
    ↓ /api/* — Vite proxy in dev
Service Layer (32 services) → fetchApi()
    ↓
Composables (48) → reactive state + logic
    ↓
Pages (50) → file-based routing
    ↓
UI Components (67 ui + 48 thread)
```

**Quy tắc bất di bất dịch:** Frontend KHÔNG bao giờ gọi Supabase trực tiếp cho CRUD — tất cả phải qua Hono API.

---

## Tài liệu

| Tài liệu | Nội dung |
|----------|---------|
| [`docs/project-overview-pdr.md`](docs/project-overview-pdr.md) | Domains, business rules, stakeholders |
| [`docs/system-architecture.md`](docs/system-architecture.md) | Auth flow, API design, DB schema |
| [`docs/codebase-summary.md`](docs/codebase-summary.md) | Routes, services, composables, types |
| [`docs/code-standards.md`](docs/code-standards.md) | Coding patterns, anti-patterns, pre-commit |
| [`docs/project-roadmap.md`](docs/project-roadmap.md) | Milestones, planned features, technical debt |
| [`docs/docker-deployment.md`](docs/docker-deployment.md) | Docker build, nginx, known issues |

---

## Lưu ý quan trọng

| Lệnh nguy hiểm | Hậu quả | Quy tắc |
|----------------|---------|---------|
| `supabase db reset` | **XÓA TOÀN BỘ DATA** | KHÔNG BAO GIỜ tự động chạy |
| `DROP TABLE`, `TRUNCATE` | Mất dữ liệu vĩnh viễn | Hỏi user trước |
| `git push --force` | Mất commit history | Hỏi user trước |

Apply migration an toàn: `supabase migration up`

---

## License

[MIT](http://opensource.org/licenses/MIT)
