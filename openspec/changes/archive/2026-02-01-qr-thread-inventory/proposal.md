## Why

Quy trình xuất kho chỉ hiện tại dựa vào nhập tay mã cone, dễ xảy ra sai sót (xuất nhầm cuộn, nhập sai mã). Việc kiểm kê kho thủ công tốn thời gian và thiếu chính xác. Tích hợp QR code giúp giảm 90% sai sót xuất kho, tăng tốc kiểm kê x3 lần, và cho phép truy xuất nguồn gốc cuộn chỉ theo thời gian thực.

## What Changes

- Thêm nút quét QR camera vào dialog xuất kho (IssueDialog) - **đã hoàn thành cơ bản**
- Tạo component sinh mã QR từ cone_id để in nhãn dán lên cuộn chỉ
- Thêm chức năng in QR hàng loạt sau khi nhập kho mới
- Thêm nút quét QR tra cứu nhanh trên trang tồn kho
- Tạo trang kiểm kê kho bằng QR với đối chiếu số liệu
- Tạo API endpoint tra cứu thông tin cone theo mã QR

## Capabilities

### New Capabilities

- `qr-scanner-integration`: Tích hợp QR scanner vào các dialog và trang inventory, xử lý quét liên tục, feedback người dùng
- `qr-label-printing`: Sinh mã QR từ cone_id, layout nhãn in, hỗ trợ in đơn lẻ và hàng loạt
- `inventory-stocktake`: Kiểm kê kho bằng QR - quét hàng loạt, đối chiếu với database, báo cáo chênh lệch

### Modified Capabilities

(Không có capability hiện tại cần thay đổi requirements)

## Impact

**Frontend:**
- `src/components/thread/IssueDialog.vue` - đã tích hợp QrScannerDialog
- `src/components/thread/StockReceiptDialog.vue` - cần thêm in QR sau nhập kho
- `src/pages/thread/inventory.vue` - cần thêm nút quét tra cứu
- Tạo mới: `src/pages/thread/stocktake.vue` - trang kiểm kê

**Components mới:**
- `src/components/qr/ConeQrCode.vue` - sinh QR từ cone_id
- `src/components/qr/QrLabelPrint.vue` - layout in nhãn
- `src/components/thread/StocktakeScanner.vue` - scanner cho kiểm kê

**Backend:**
- `server/routes/thread.ts` - thêm endpoint `GET /api/thread/cone/:coneId` tra cứu
- `server/routes/thread.ts` - thêm endpoint `POST /api/thread/stocktake` lưu kết quả kiểm kê

**Dependencies:**
- `vue-qrcode-reader` - đã cài đặt
- `qrcode` hoặc `vue-qrcode` - cần cài để sinh QR image
