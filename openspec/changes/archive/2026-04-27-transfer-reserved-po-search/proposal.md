## Why

Trang "Chuyển kho theo tuần" hiện chỉ cho phép chọn tuần từ dropdown — nhân viên kho không thể tìm nhanh theo số PO, dẫn đến phải dò tay từng tuần để tìm cuộn chỉ cần chuyển. Khi lượng tuần đặt hàng tích lũy, thao tác này tốn nhiều thời gian và dễ nhầm.

## What Changes

- **New**: Thêm ô search PO trên trang `transfer-reserved` — nhập số PO → popup danh sách tuần chứa PO đó kèm số cuộn.
- **New**: Click vào tuần trong popup → auto-fill dropdown "Tuần đặt hàng" và tải dữ liệu tương ứng.
- **New**: Scroll tự động đến section PO vừa search sau khi dữ liệu tải xong.
- **New**: Mỗi dòng chỉ trong bảng hiển thị thêm summary: "Gán: X | Đã chuyển: Y | Còn: Z cuộn".
- **New**: Backend endpoint `GET /api/weekly-order/search-po?q=` trả về danh sách tuần chứa PO và số cuộn tương ứng.
- **Modified**: Backend endpoint `GET /:weekId/reserved-by-po` bổ sung thêm 2 field per line: `total_reserved_for_week` và `already_at_destination`.

## Capabilities

### New Capabilities

- `po-search`: Tìm kiếm PO number và hiển thị danh sách tuần chứa PO đó kèm số cuộn — gồm backend search endpoint và component PoSearchPopup.
- `transfer-line-summary`: Mỗi dòng chỉ trong bảng transfer-reserved hiển thị tóm tắt Gán/Đã chuyển/Còn để nhân viên biết tiến độ chuyển kho.

### Modified Capabilities

_(không có thay đổi spec-level cho capability hiện tại)_

## Impact

- **Backend**: Thêm 1 route mới vào `server/routes/weekly-order/transfer-reserved.ts` — phải đặt trước route generic `/:weekId/reserved-by-po`. Sửa handler `/:weekId/reserved-by-po` để tính thêm `total_reserved_for_week` và `already_at_destination`.
- **Frontend types**: `src/types/transferReserved.ts` — thêm field mới vào `ReservedThreadLine` và thêm interface cho search response.
- **Frontend service**: `src/services/transferReservedService.ts` — thêm method `searchPo()`.
- **Frontend component**: Thêm mới `src/components/thread/transfer-reserved/PoSearchPopup.vue`.
- **Frontend component**: Sửa `src/components/thread/transfer-reserved/PoSection.vue` — thêm cột summary.
- **Frontend page**: Sửa `src/pages/thread/transfer-reserved.vue` — tích hợp PoSearchPopup, xử lý auto-fill tuần và scroll.
- **No DB migration**: Chỉ query dữ liệu hiện có — không thêm bảng hay cột mới.
