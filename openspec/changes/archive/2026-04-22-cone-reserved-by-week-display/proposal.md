## Why

Trong dialog `ConeWarehouseBreakdownDialog` (mở từ trang `thread/inventory` tab tổng hợp theo cuộn), người dùng hiện chỉ thấy phân bổ tồn kho theo Kho. Khi muốn biết "loại chỉ này đang được giữ cho tuần đặt hàng nào, kho nào còn khả dụng bao nhiêu", họ phải đi tra cứu thủ công ở trang weekly-order. Việc bổ sung breakdown theo Kho × Tuần (chỉ tuần CONFIRMED) ngay trong dialog giúp ra quyết định cấp phát/điều chuyển nhanh hơn mà không phải rời khỏi flow.

## What Changes

- Thêm component mới `ConeReservedByWeekTable.vue` mount BÊN DƯỚI bảng warehouse breakdown trong `ConeWarehouseBreakdownDialog`.
- Cấu trúc bảng: group theo Kho (parent), expand ra Tuần (child) — chỉ hiện tuần có `status = 'CONFIRMED'`.
- Hiển thị 2 nhóm số: "Khả dụng" (status `AVAILABLE`) ở dòng kho, "Reserve" (status `RESERVED_FOR_ORDER`) ở dòng tuần. Mỗi nhóm gồm: cuộn nguyên / cuộn lẻ / mét lẻ.
- Thêm route backend mới `GET /api/thread/cone-summary/by-warehouse-week` trả về dữ liệu group sẵn theo cấu trúc trên.
- Sửa route warehouse breakdown CŨ: thêm optional `warehouse_id` param để khi user filter kho ở trang ngoài thì cả 2 bảng (cũ + mới) đồng bộ chỉ hiện 1 kho.
- Trang `thread/inventory.vue` truyền `filters.warehouse_id` xuống dialog; dialog hiển thị badge "Đang lọc theo kho: [tên]" khi có filter.
- KHÔNG cần migration mới — dùng schema sẵn có (`thread_inventory.reserved_week_id`, `thread_order_weeks`, `warehouses`).

## Capabilities

### New Capabilities

- `cone-reserved-by-week`: Hiển thị breakdown cone giữ chỗ theo Kho × Tuần đặt hàng (chỉ CONFIRMED) trong dialog warehouse breakdown, kèm số khả dụng theo từng kho.

### Modified Capabilities

- `warehouse-breakdown-rpc`: Endpoint warehouse breakdown nhận thêm optional `warehouse_id` filter để đồng bộ với filter trang ngoài.

## Impact

- **Backend (`server/`):**
  - Thêm route mới `server/routes/thread/cone-summary.ts` (hoặc file tương đương) cho endpoint `by-warehouse-week`.
  - Sửa route breakdown cũ thêm optional param `warehouse_id`.
  - Zod schema mới trong `server/validation/`.
- **Frontend (`src/`):**
  - Component mới: `src/components/thread/ConeReservedByWeekTable.vue`.
  - Sửa: `src/components/thread/ConeWarehouseBreakdownDialog.vue` (mount component mới + badge filter).
  - Sửa: `src/composables/thread/useConeSummary.ts` (truyền warehouse_id).
  - Sửa: `src/services/threadService.ts` (hoặc service tương đương) thêm function fetch + sửa function breakdown.
  - Sửa: `src/pages/thread/inventory.vue` (truyền `warehouse_id` xuống dialog).
  - Sửa: `src/types/thread/inventory.ts` thêm types mới.
- **Database:** KHÔNG có migration mới. Dùng `thread_inventory`, `thread_order_weeks`, `warehouses`, `thread_types`.
- **Permission:** Tái sử dụng `thread.allocations.view` (giống endpoint breakdown cũ).
- **Không breaking change** — endpoint cũ thêm optional param, không bỏ field nào.
