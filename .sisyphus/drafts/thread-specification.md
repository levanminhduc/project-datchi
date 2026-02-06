# Draft: Thread Specification Feature (Định Mức Chỉ)

## Requirements (confirmed)

### Workflow
1. Bộ phận Kỹ Thuật chọn Mã Hàng (Style) → Hiển thị bảng Định Mức Chỉ
2. Nhập bảng định mức với: Tên Công Đoạn, NCC, Tex, Định Mức mét chỉ/1 SP (nhiều công đoạn)
3. Lưu template → Chọn Màu Hàng
4. Bảng chi tiết: Tên Công Đoạn, NCC, Tex, Chiều dài/cuộn (mét), Định Mức, Mã Màu (chọn màu chỉ cụ thể)
5. Dữ liệu dùng để tính toán cấp chỉ cho sản xuất

### Hierarchy
- NCC → bao quát Tex → bao quát Màu chỉ
- Meaning: 1 NCC có nhiều Tex, 1 Tex có nhiều Màu

## Technical Decisions

### User Decisions (confirmed)
1. **Styles table**: Đơn giản - code, name, description (không cần thêm nhiều fields)
2. **PO Management**: Đầy đủ - có status, priority, delivery tracking
3. **Thread filtering**: Cascade - NCC → Tex → Màu (từ template đã có NCC + Tex, lọc màu phù hợp)
4. **Allocation Integration**: Bán tự động - hiển thị bảng tính toán, user confirm để tạo allocation
5. **style_thread_specs**: FK đến thread_types (đã có NCC + Tex + meters_per_cone)
6. **style_color_thread_specs**: FK đến thread_types (đã có đầy đủ NCC + Tex + Màu)
7. **UI Structure**: 2 pages - styles list + style detail (có tabs cho specs)
8. **Calculation**: Trang tính toán riêng (PO → calculate → confirm → allocations)

### Database Schema Design (finalized)
1. `purchase_orders` - Đơn hàng (số PO, khách hàng, ngày đặt/giao)
2. `styles` - Mã hàng gốc (code, name, mô tả, loại vải)
3. `po_items` - Trung gian PO ↔ Style
4. `skus` - Chi tiết: Style + Màu + Size + số lượng (thuộc po_item)
5. `style_thread_specs` - Template định mức (công đoạn, NCC, Tex, mét/SP)
6. `style_color_thread_specs` - Chi tiết định mức với màu chỉ cụ thể (FK to thread_types)

### Existing Tables to Leverage
- `suppliers` - NCC
- `colors` - Màu sắc
- `thread_types` - Loại chỉ (tex, meters_per_cone, supplier_id, color_id)
- `thread_type_supplier` - Junction table
- `color_supplier` - Junction table

## Research Findings

### Database Patterns (Confirmed)
- **Migration format**: `YYYYMMDDHHMMSS_description.sql` in `supabase/migrations/`
- **Table creation**: SERIAL PRIMARY KEY, TIMESTAMPTZ for dates, Vietnamese COMMENT
- **FK pattern**: `REFERENCES table(id) ON DELETE CASCADE/RESTRICT/SET NULL`
- **Junction tables**: `thread_type_supplier`, `color_supplier` - with UNIQUE constraints
- **Existing tables**: `thread_types` has `tex_number`, `meters_per_cone`, `supplier_id`, `color_id`

### Hono API Patterns (Confirmed)
- **Route structure**: `server/routes/{domain}.ts` → exported router
- **Registration**: `app.route('/api/{domain}', domainRouter)` in `server/index.ts`
- **Response format**: `{ data: T | null, error: string | null, message?: string }`
- **Validation**: Manual check in handler, return 400 with Vietnamese message
- **Error handling**: try/catch, Vietnamese error messages
- **Backend types**: `server/types/{domain}.ts`

### Frontend Patterns (Confirmed)
- **Services**: `src/services/{domain}Service.ts` with `fetchApi` pattern
- **Composables**: `src/composables/thread/use{Entity}.ts` - state + CRUD
- **Pages**: File-based routing, `definePage()` for meta
- **Types**: `src/types/thread/{entity}.ts`
- **Form pattern**: `reactive<FormData>({})`, validation before submit

### Allocation System (Confirmed)
- **Key table**: `thread_allocations` - order_id, thread_type_id, requested_meters, allocated_meters
- **Junction**: `thread_allocation_cones` - links allocation to specific cones
- **RPC function**: `allocate_thread()` - atomic allocation with FEFO logic
- **Workflow**: PENDING → ALLOCATED → ISSUED (via execute/issue endpoints)
- **Integration point**: Uses `thread_type_id` to determine which thread to allocate

## Open Questions
1. Cấu trúc chi tiết của các bảng mới?
2. UI flow cụ thể cho việc tạo/edit định mức?
3. Cách tích hợp với allocation system hiện có?
4. Phân quyền cho bộ phận Kỹ Thuật?

## Scope Boundaries
- INCLUDE: Database schema, API endpoints, UI pages for specification management
- INCLUDE: Integration with allocation calculation
- EXCLUDE: [TBD after research]
