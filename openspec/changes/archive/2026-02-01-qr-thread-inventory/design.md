## Context

Hệ thống quản lý kho chỉ hiện tại đã có:
- Các dialog CRUD: nhập kho (StockReceiptDialog), phân bổ (AllocationDialog), xuất kho (IssueDialog)
- Composable `useQrScanner` và components `QrScannerStream`, `QrScannerDialog` đã được tạo
- IssueDialog đã tích hợp QR scanner cơ bản với feedback snackbar
- Database có trường `cone_id` unique trong bảng `thread_inventory`

**Stakeholders:** Nhân viên kho (quét QR bằng điện thoại), Quản lý kho (kiểm kê, báo cáo)

**Constraints:**
- Camera cần HTTPS (localhost được miễn)
- Điện thoại cần hỗ trợ MediaDevices API
- QR code cần đọc được từ khoảng cách 20-30cm

## Goals / Non-Goals

**Goals:**
- Tích hợp QR scanner vào tất cả dialog liên quan đến cone_id
- Cho phép in nhãn QR sau khi nhập kho (đơn lẻ và hàng loạt)
- Cung cấp trang kiểm kê kho với quét QR liên tục
- API tra cứu cone nhanh theo mã quét

**Non-Goals:**
- Không xử lý QR từ nhà cung cấp (dùng cone_id nội bộ)
- Không tích hợp máy quét USB chuyên dụng (chỉ camera)
- Không làm mobile app riêng (dùng responsive web)
- Không làm báo cáo phức tạp (chỉ xuất danh sách chênh lệch)

## Decisions

### 1. QR Code Content Format

**Decision:** Chỉ encode `cone_id` thuần (không thêm prefix/metadata)

**Rationale:**
- `cone_id` đã unique trong hệ thống
- Mã ngắn gọn, QR code nhỏ hơn, dễ in
- Tương thích với barcode scanner USB nếu cần sau này

**Alternatives considered:**
- JSON object `{"cone_id":"xxx","type":"thread"}` - phức tạp, QR lớn hơn
- URL format `https://app.com/cone/xxx` - cần domain, không cần thiết cho internal

### 2. QR Generation Library

**Decision:** Sử dụng `qrcode` package (npm)

**Rationale:**
- Nhẹ, không dependency Vue
- Hỗ trợ output SVG/Canvas/DataURL
- Có thể dùng ở cả frontend và backend (nếu cần generate server-side)

**Alternatives considered:**
- `vue-qrcode` - wrapper Vue, thêm dependency không cần thiết
- `qrcode.react` - chỉ cho React

### 3. Label Print Layout

**Decision:** Sử dụng CSS `@media print` với layout nhãn 50x30mm

**Rationale:**
- Không cần thư viện in chuyên dụng
- Người dùng có thể in trên giấy A4 (nhiều nhãn/trang) hoặc máy in nhãn
- Dễ customize kích thước theo nhu cầu

**Layout nhãn:**
```
┌─────────────────────────┐
│  [QR]   CONE_ID         │
│         Lot: xxx        │
│         Type: xxx       │
│         Weight: xxx g   │
└─────────────────────────┘
```

### 4. Stocktake Flow

**Decision:** Quét liên tục với buffer, submit manual

**Flow:**
1. Mở trang stocktake, chọn kho
2. Quét liên tục các cone → thêm vào `scannedList[]`
3. Hệ thống realtime hiển thị: found/not found/duplicate
4. Hoàn tất → so sánh với database → hiển thị chênh lệch
5. Confirm → lưu stocktake record

**Rationale:**
- Cho phép quét nhanh không gián đoạn
- Có thể review trước khi submit
- Dễ xử lý trường hợp quét nhầm (xóa khỏi list)

### 5. API Endpoint Design

**Decision:** RESTful endpoints đơn giản

```
GET  /api/thread/cone/:coneId     → Tra cứu thông tin cone
POST /api/thread/stocktake        → Lưu kết quả kiểm kê
GET  /api/thread/stocktake/:id    → Xem chi tiết kiểm kê
```

**Rationale:**
- Consistent với API hiện có trong `server/routes/thread.ts`
- Sử dụng pattern response `{ data, error, message }` đã có

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Camera không hoạt động trên một số thiết bị cũ | Fallback nhập tay luôn available, hiển thị hướng dẫn cấp quyền camera |
| In nhãn không khớp máy in | Cung cấp preview và tùy chọn kích thước nhãn |
| QR bị mờ/hỏng không quét được | Hỗ trợ tìm kiếm bằng lot_number hoặc nhập cone_id thủ công |
| Nhân viên quét sai kho | Bắt buộc chọn kho trước khi bắt đầu kiểm kê, hiển thị tên kho rõ ràng |
| Performance khi quét nhiều | Debounce detect event, virtualize list nếu >100 items |

## Component Architecture

```
src/components/qr/
├── QrScannerStream.vue      # Camera stream (đã có)
├── QrScannerDialog.vue      # Dialog wrapper (đã có)
├── ConeQrCode.vue           # Generate QR từ cone_id (NEW)
├── QrLabelPrint.vue         # Layout in nhãn (NEW)
└── index.ts                 # Barrel export

src/components/thread/
├── IssueDialog.vue          # Đã tích hợp QR
├── StockReceiptDialog.vue   # Thêm button in QR
└── StocktakePanel.vue       # Panel kiểm kê (NEW)

src/pages/thread/
├── inventory.vue            # Thêm quick lookup
└── stocktake.vue            # Trang kiểm kê (NEW)
```

## Open Questions

1. **Kích thước nhãn chuẩn?** - Cần xác nhận với người dùng về máy in và kích thước nhãn họ đang dùng
2. **Lưu lịch sử kiểm kê?** - Có cần bảng `stocktake_records` trong database không, hay chỉ xuất file?
3. **Quyền truy cập?** - Ai được phép kiểm kê? Cần role-based access không?
