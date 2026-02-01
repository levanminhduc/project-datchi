## 1. Setup & Dependencies

- [ ] 1.1 Cài đặt package `qrcode` để sinh QR code
- [ ] 1.2 Tạo types cho QR label printing (`src/types/qr-label.ts`)
- [ ] 1.3 Fix LSP errors trong `src/components/qr/index.ts` (module declarations)

## 2. QR Scanner Integration Enhancement

- [ ] 2.1 Thêm nút "Quét tra cứu" vào toolbar của `src/pages/thread/inventory.vue`
- [ ] 2.2 Implement logic highlight và scroll đến cone khi quét lookup
- [ ] 2.3 Thêm QR scanner vào `StockReceiptDialog.vue` (nếu cần quét mã nhà cung cấp)
- [ ] 2.4 Test continuous scanning trong IssueDialog với nhiều cone

## 3. QR Label Printing - Component

- [ ] 3.1 Tạo component `ConeQrCode.vue` - sinh QR từ cone_id với props size
- [ ] 3.2 Tạo component `QrLabelSingle.vue` - layout nhãn đơn 50x30mm
- [ ] 3.3 Tạo component `QrLabelGrid.vue` - layout nhiều nhãn cho A4
- [ ] 3.4 Tạo component `QrPrintDialog.vue` - dialog preview và in

## 4. QR Label Printing - Integration

- [ ] 4.1 Thêm nút "In QR" vào actions của cone row trong inventory table
- [ ] 4.2 Thêm nút "In tất cả nhãn" sau khi nhập kho trong StockReceiptDialog
- [ ] 4.3 Implement chọn/bỏ chọn cone khi in hàng loạt
- [ ] 4.4 Thêm CSS `@media print` cho layout in nhãn

## 5. Stocktake - Backend API

- [ ] 5.1 Tạo endpoint `GET /api/thread/cone/:coneId` tra cứu cone
- [ ] 5.2 Tạo endpoint `GET /api/thread/inventory/by-warehouse/:warehouseId` lấy tất cả cone theo kho
- [ ] 5.3 Tạo endpoint `POST /api/thread/stocktake` lưu kết quả kiểm kê (optional)

## 6. Stocktake - Frontend Page

- [ ] 6.1 Tạo trang `src/pages/thread/stocktake.vue` với layout cơ bản
- [ ] 6.2 Implement warehouse selector dropdown
- [ ] 6.3 Implement scanner panel với camera stream
- [ ] 6.4 Implement scannedList với status icons (found/not_found/wrong_warehouse)

## 7. Stocktake - Comparison Logic

- [ ] 7.1 Implement fetch all cones from selected warehouse
- [ ] 7.2 Implement comparison algorithm (matched/missing/extra)
- [ ] 7.3 Tạo component hiển thị summary statistics
- [ ] 7.4 Implement export CSV cho discrepancy list

## 8. Stocktake - Session Management

- [ ] 8.1 Implement lưu scannedList vào localStorage khi pause
- [ ] 8.2 Implement prompt resume/new khi có session cũ
- [ ] 8.3 Implement clear session khi hoàn tất

## 9. Testing & Polish

- [ ] 9.1 Test QR scanner trên mobile devices (Android/iOS)
- [ ] 9.2 Test in nhãn trên máy in thực tế
- [ ] 9.3 Test stocktake flow end-to-end với dữ liệu thực
- [ ] 9.4 Verify error handling và Vietnamese messages
- [ ] 9.5 Run type-check và lint, fix errors

## 10. Documentation

- [ ] 10.1 Cập nhật README với hướng dẫn sử dụng QR features
- [ ] 10.2 Thêm comments cho các components mới
