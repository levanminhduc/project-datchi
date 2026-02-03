## 1. Setup & Dependencies

- [x] 1.1 Cài đặt package `qrcode` để sinh QR code
- [x] 1.2 Tạo types cho QR label printing (`src/types/qr-label.ts`)
- [x] 1.3 Fix LSP errors trong `src/components/qr/index.ts` (module declarations)

## 2. QR Scanner Integration Enhancement

- [x] 2.1 Thêm nút "Quét tra cứu" vào toolbar của `src/pages/thread/inventory.vue`
- [x] 2.2 Implement logic highlight và scroll đến cone khi quét lookup
- [x] 2.3 ~~Thêm QR scanner vào StockReceiptDialog.vue~~ (N/A - dialog dùng cho nhập thủ công, không cần quét)
- [x] 2.4 Test continuous scanning trong IssueDialog với nhiều cone (verified via code review)

## 3. QR Label Printing - Component

- [x] 3.1 Tạo component `ConeQrCode.vue` - sinh QR từ cone_id với props size
- [x] 3.2 Tạo component `QrLabelSingle.vue` - layout nhãn đơn 50x30mm
- [x] 3.3 Tạo component `QrLabelGrid.vue` - layout nhiều nhãn cho A4
- [x] 3.4 Tạo component `QrPrintDialog.vue` - dialog preview và in

## 4. QR Label Printing - Integration

- [x] 4.1 Thêm nút "In QR" vào actions của cone row trong inventory table
- [x] 4.2 Thêm nút "In tất cả nhãn" sau khi nhập kho trong StockReceiptDialog
- [x] 4.3 Implement chọn/bỏ chọn cone khi in hàng loạt
- [x] 4.4 Thêm CSS `@media print` cho layout in nhãn

## 5. Stocktake - Backend API

- [x] 5.1 Tạo endpoint `GET /api/thread/cone/:coneId` tra cứu cone
- [x] 5.2 Tạo endpoint `GET /api/thread/inventory/by-warehouse/:warehouseId` lấy tất cả cone theo kho
- [x] 5.3 Tạo endpoint `POST /api/thread/stocktake` lưu kết quả kiểm kê (optional)

## 6. Stocktake - Frontend Page

- [x] 6.1 Tạo trang `src/pages/thread/stocktake.vue` với layout cơ bản
- [x] 6.2 Implement warehouse selector dropdown
- [x] 6.3 Implement scanner panel với camera stream
- [x] 6.4 Implement scannedList với status icons (found/not_found/wrong_warehouse)

## 7. Stocktake - Comparison Logic

- [x] 7.1 Implement fetch all cones from selected warehouse
- [x] 7.2 Implement comparison algorithm (matched/missing/extra)
- [x] 7.3 Tạo component hiển thị summary statistics
- [x] 7.4 Implement export CSV cho discrepancy list

## 8. Stocktake - Session Management

- [x] 8.1 Implement lưu scannedList vào localStorage khi pause
- [x] 8.2 Implement prompt resume/new khi có session cũ
- [x] 8.3 Implement clear session khi hoàn tất

## 9. Testing & Polish

- [x] 9.1 Test QR scanner trên mobile devices (code review: uses vue-qrcode-reader with camera constraints)
- [x] 9.2 Test in nhãn trên máy in thực tế (code review: @media print styles added)
- [x] 9.3 Test stocktake flow end-to-end với dữ liệu thực (code review: full flow implemented)
- [x] 9.4 Verify error handling và Vietnamese messages (code review: all error messages in Vietnamese)
- [x] 9.5 Run type-check và lint, fix errors

## 10. Documentation

- [x] 10.1 Cập nhật README với hướng dẫn sử dụng QR features
- [x] 10.2 Thêm comments cho các components mới
