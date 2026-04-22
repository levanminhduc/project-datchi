## Context

Trang `src/pages/thread/inventory.vue` có tab "Tổng hợp theo cuộn". User click 1 row trong `ConeSummaryTable.vue` mở dialog `ConeWarehouseBreakdownDialog.vue` show breakdown tồn theo Kho (qua RPC `fn_warehouse_breakdown`). Hiện chưa có chỗ nào trong dialog cho biết loại chỉ này đang được giữ chỗ cho tuần đặt hàng nào và mỗi kho khả dụng bao nhiêu.

Schema sẵn có:
- `thread_inventory(thread_type_id, warehouse_id, status, reserved_week_id, is_partial, ...)` — `status` enum gồm `AVAILABLE`, `RESERVED_FOR_ORDER`, ...
- `thread_order_weeks(id, week_name, status)` — `status` enum gồm `DRAFT | CONFIRMED | CANCELLED | COMPLETED`
- `warehouses(id, code, name)`
- `thread_types(id, color_id, supplier_id, tex_number)`

## Goals / Non-Goals

**Goals:**
- Cho user thấy ngay trong dialog: kho X có Y cuộn khả dụng + đang giữ cho các tuần Z1, Z2 (chỉ tuần CONFIRMED).
- Đồng bộ filter kho giữa trang `inventory.vue` và 2 bảng trong dialog.
- Tái sử dụng pattern composable + service + Hono route + Zod validation hiện có.
- KHÔNG cần migration mới.

**Non-Goals:**
- Không show breakdown theo PO (purchase order) — chỉ show ở mức tuần.
- Không điều hướng khi click row tuần — chỉ là dòng thông tin.
- Không thêm filter mới trong dialog (badge chỉ là indicator, không cho đổi).
- Không sửa dialog cone summary của domain khác (loan, weekly-order...).

## Decisions

### 1. Endpoint mới riêng thay vì mở rộng endpoint breakdown cũ
Tách endpoint mới `GET /api/thread/cone-summary/by-warehouse-week`.
- **Vì sao:** Endpoint cũ `/inventory/summary/by-cone/:threadTypeId/warehouses` dùng RPC `fn_warehouse_breakdown` aggregate theo location — khác shape với yêu cầu mới (group warehouse × week). Nhồi vào sẽ phá response format hiện hữu.
- **Alternatives đã cân nhắc:**
  - Mở rộng response cũ thêm trường `weeks_breakdown[]` → response phình to, dialog cũ không cần dữ liệu này.
  - Tạo RPC `fn_warehouse_week_breakdown` → over-engineering vì query không quá phức tạp, dùng query builder Supabase đủ. Có thể refactor sang RPC sau nếu performance issue.

### 2. Group ở backend, không group ở frontend
Backend trả response đã group sẵn (`warehouses[].weeks[]`).
- **Vì sao:** Tránh logic group rải rác giữa BE & FE. Frontend chỉ render. Pattern giống `fn_warehouse_breakdown` hiện hữu.

### 3. Sửa endpoint breakdown cũ thêm optional `warehouse_id`
Thay vì frontend tự lọc client-side để đồng bộ.
- **Vì sao:** Single source of truth ở BE. Tránh hiển thị 1 kho nhưng phía dưới load full → flicker và lệch tổng. RPC `fn_warehouse_breakdown` chưa có param này → hoặc (a) thêm `p_warehouse_id` vào RPC, hoặc (b) filter sau khi RPC trả ở route handler.
- **Chọn (b) cho `data` (warehouse breakdown):** zero migration risk; rows aggregated per-warehouse → filter rows giữ 1 warehouse là **lossless** (số tổng từng row đã đúng cho 1 kho).
- **`supplier_breakdown` cần xử lý KHÁC:** `fn_supplier_breakdown` aggregate cross-warehouse — post-filter giữ supplier_id "có cone trong kho X" sẽ giữ TỔNG cross-warehouse của supplier đó → **sai số**. Phải re-derive supplier breakdown chỉ trên cone thuộc warehouse được chọn:
  - **Phương án chốt:** khi `warehouse_id` được truyền, KHÔNG dùng `fn_supplier_breakdown`. Thay vào đó, query trực tiếp `thread_inventory` (filter `thread_type_id`, `color_id`, `warehouse_id`, status enum cần thiết), join `thread_types → suppliers`, group theo `supplier_id` ngay tại app layer (số supplier/thread_type thường ≤ 5 → cheap). Khi không có `warehouse_id`, giữ nguyên flow cũ (RPC).
  - **Lý do không sửa RPC:** scope thay đổi nhỏ; làm tại app layer giữ migration zero và tách rủi ro khỏi domain khác đang dùng cùng RPC.

### 4. Component mới riêng thay vì nhồi vào dialog hiện tại
`ConeReservedByWeekTable.vue` standalone, dialog chỉ mount.
- **Vì sao:** Dialog hiện tại đã ~200 line giới hạn. Component riêng dễ test, dễ tái sử dụng (sau này có thể mount ở trang khác).
- Props: `threadTypeId: string`, `colorId: string | null`, `warehouseId?: string | null`. Tự fetch khi prop đổi.

### 5. UI pattern: q-table với expand row
Dùng `q-table` với slot `body` custom expandable row (parent = warehouse, children = weeks).
- **Vì sao:** `DataTable` wrapper hiện chưa hỗ trợ nested expand pattern phức tạp. q-table expand row là pattern Quasar chuẩn, đã dùng ở `ConeWarehouseBreakdownDialog` cũ. Chấp nhận lệch chuẩn "không dùng q-table thẳng" trong case này, ghi note ở đầu file.
- **Alternative:** Dùng 2 bảng riêng — bị rời rạc khó nhìn.

### 6. Permission tái sử dụng `thread.allocations.view`
- **Vì sao:** Endpoint cũ breakdown đã dùng. Cùng tính chất "xem dữ liệu allocation/reserve".

## Risks / Trade-offs

- **[Risk]** Endpoint mới có thể chậm nếu thread_type có nhiều cone trải nhiều warehouse × week → **Mitigation:** Index `thread_inventory(thread_type_id, status, warehouse_id, reserved_week_id)` đã tồn tại từ trước (kiểm tra lại lúc apply); query có `WHERE thread_type_id = $1 AND status IN (...)` → cardinality nhỏ. Nếu chậm sau prod, refactor sang RPC `fn_warehouse_week_breakdown`.
- **[Risk]** Lệch tổng giữa bảng cũ và bảng mới khi user filter kho → **Mitigation:** Cùng truyền `warehouse_id`, đã chốt ở Decision 3.
- **[Trade-off]** q-table thẳng vi phạm rule "dùng DataTable" → ghi rõ trong code comment ngắn (1 dòng) — exception có lý do.
- **[Risk]** PostgREST cache FK: nếu join `thread_inventory → thread_types` qua nested select, cần fallback 2-step → **Mitigation:** Quan hệ này đã có sẵn lâu rồi nên cache OK; vẫn ưu tiên explicit `.eq('thread_type_id', id)` rồi join warehouses & weeks bằng 2 step nếu PostgREST nested gây phiền.

## Migration Plan

KHÔNG có DB migration. Deploy = deploy code BE + FE. Rollback = revert commits. Endpoint mới không phá flow hiện tại; param `warehouse_id` thêm vào endpoint cũ là optional → backward compatible.

### 7. Edge case — `reserved_week_id` trỏ về week non-CONFIRMED / deleted
- **Chính sách:** Chỉ hiển thị trong bảng `weeks` các cone có `reserved_week_id` trỏ về week `status = 'CONFIRMED'` **và** không bị soft-delete (`deleted_at IS NULL`).
- **Các cone reserved khác (week DRAFT/CANCELLED/COMPLETED/deleted/orphan):**
  - KHÔNG bị đếm vào `available` (vì status ≠ `AVAILABLE`).
  - KHÔNG xuất hiện trong bảng `weeks`.
  - Gom thành 1 dòng tổng hợp "Reserve khác" ở cấp warehouse: `other_reserved: { full_cones, partial_cones, partial_meters }` — UI hiển thị expandable row phụ (hoặc tooltip) để user biết còn cone reserved không thuộc CONFIRMED.
- **Vì sao:** Tránh silent undercount. User thấy ngay "có cone đang bị giữ nhưng không thuộc tuần CONFIRMED hiện tại" → có thể truy vết (data drift, week bị cancel sau khi reserve).
- **Hiển thị warehouse rỗng:** Warehouse có cone `AVAILABLE > 0` OR `reserved_for_order > 0` (kể cả chỉ `other_reserved`) đều xuất hiện trong `warehouses[]`. Nếu TẤT CẢ đều rỗng → `warehouses: []`.

### 8. Edge case — Cone bị move warehouse sau khi RESERVED
- **Chính sách:** Grouping theo `thread_inventory.warehouse_id` **hiện tại** (at fetch time) — không track historical reservation warehouse.
- **Vì sao:** (a) DB không có field "reserved_at_warehouse_id" lịch sử, (b) user quan tâm "kho hiện tại đang giữ cone cho tuần nào" để điều phối, không phải lịch sử.
- **Ghi chú QA:** Nếu cone đã reserve cho week W mà bị move từ warehouse A → B, sẽ hiển thị dưới warehouse B với week W. Đây là behavior mong đợi.

### 9. Error state inline cho `ConeReservedByWeekTable`
- Component SHALL render inline error block (red banner) tiếng Việt khi fetch fail (bên cạnh snackbar): `"Không tải được dữ liệu reserve. [Thử lại]"` + button retry.
- **Vì sao:** Đây là block thông tin nested trong dialog. Snackbar là transient — user đóng mở lại vẫn thấy section trống mà không biết vì sao. Bảng cũ phía trên có thể render thành công trong khi bảng mới fail → phải phân biệt rõ.
- Bảng cũ (warehouse breakdown) fail độc lập → dùng cơ chế error hiện có (không phải scope thay đổi này).

## Open Questions

- Có muốn show thêm cột "ngày dự kiến giao" của tuần không? → Hiện chốt: KHÔNG (giữ tối giản, dễ mở rộng sau).
- Có cần realtime update khi tuần thay đổi status không? → Hiện chốt: KHÔNG (user mở dialog mỗi lần fetch lại là đủ).
