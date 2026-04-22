# Cone Warehouse Breakdown Dialog — Vertical Scroll Fix

**Date:** 2026-04-22
**Topic:** UI fix — dialog overflow
**Scope:** 1 file (`src/components/thread/ConeWarehouseBreakdownDialog.vue`)

## Problem

Trên trang `src/pages/thread/inventory.vue` tab "Tổng hợp theo cuộn", khi user click 1 row mở dialog `ConeWarehouseBreakdownDialog`, bảng "Reserve theo tuần đặt hàng" (`ConeReservedByWeekTable`) bị **đẩy tràn ngang sang phải** thay vì hiển thị dưới cùng và cho cuộn dọc.

Triệu chứng (xem screenshot user cung cấp):
- Header bảng "Reserve theo tuần đặt h..." bị cắt ở mép phải dialog
- Dialog xuất hiện scrollbar ngang ở đáy
- Phần bên trái (warehouse breakdown + supplier breakdown) bị thu hẹp lại
- Layout "mất đồng bộ" — các section không xếp dọc như mong đợi

## Root Cause

`.breakdown-dialog-card` có:
```css
width: 90vw;
max-width: 800px;
max-height: 90vh;
```
Không có `overflow-y: auto`. Khi tổng chiều cao 5 sections (header + summary cards + warehouse table + supplier table + reserved-by-week table) vượt `90vh`, q-card với `column` flex layout bị nội dung "đẩy" sang ngang thay vì cho phép cuộn dọc. Đặc biệt khi `ConeReservedByWeekTable` expand nhiều warehouse cùng lúc (mỗi warehouse có thể có 6+ tuần CONFIRMED) thì chiều cao tăng đột biến.

Ngoài ra, một số `q-card-section` đang dùng `class="col"` / `class="full-height"` khiến chúng tranh nhau chia flex space khi parent không có chiều cao xác định, làm vấn đề nặng thêm.

## Goal

Khi dialog mở và nội dung dài hơn 90vh:
- **Toàn bộ dialog cuộn dọc** — header, summary cards, các bảng đều cuộn cùng nhau
- Không có scrollbar ngang
- Bảng "Reserve theo tuần đặt hàng" hiển thị **bên dưới** bảng supplier breakdown, full-width
- Khi user expand nhiều warehouse trong bảng Reserve, dialog vẫn cuộn dọc bình thường

## Non-Goals

- KHÔNG thêm sticky header / sticky footer (user chọn phương án A — toàn bộ cuộn cùng nhau)
- KHÔNG đổi cấu trúc bảng `ConeReservedByWeekTable`
- KHÔNG đụng API, không đụng composable, không đụng types
- KHÔNG đụng các dialog cone summary của domain khác (loan, weekly-order...)

## Decision

Sửa CSS + class layout của `q-card.breakdown-dialog-card` trong `src/components/thread/ConeWarehouseBreakdownDialog.vue`:

1. Thêm `overflow-y: auto` và `overflow-x: hidden` vào `.breakdown-dialog-card`
2. Bỏ `class="column"` trên `<q-card>` (không cần flex column khi đã cuộn dọc tự nhiên theo block flow)
3. Bỏ `class="col"` trên `q-card-section` chứa warehouse breakdown table (không cần chiếm flex space)
4. Bỏ `class="full-height"` trên `q-table` warehouse breakdown bên trong section đó
5. Giữ nguyên cấu trúc DOM còn lại — chỉ thay đổi CSS và class

## Acceptance Criteria

- [ ] Mở dialog với loại chỉ có 2+ warehouses và 6+ tuần CONFIRMED → bảng Reserve hiển thị đầy đủ bên dưới, không tràn ngang
- [ ] Khi nội dung vượt 90vh → xuất hiện scrollbar dọc bên phải dialog (1 thanh duy nhất)
- [ ] Không xuất hiện scrollbar ngang ở đáy dialog
- [ ] Header "Phân bố kho: ..." và nút ✕ vẫn hoạt động bình thường (cuộn theo nội dung — chấp nhận theo phương án A)
- [ ] Expand/collapse warehouse trong bảng Reserve không gây giật layout
- [ ] Trên màn hình nhỏ (1024px chiều ngang): dialog vẫn cuộn dọc đúng, không tràn ngang
- [ ] Các trang khác dùng `ConeWarehouseBreakdownDialog` (nếu có) không bị regression

## Files Affected

- `src/components/thread/ConeWarehouseBreakdownDialog.vue` — chỉ sửa template class + scoped CSS
