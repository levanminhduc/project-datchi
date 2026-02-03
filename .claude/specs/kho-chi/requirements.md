# Đặc Tả Yêu Cầu - Quản Lý Kho Chỉ

> **Phân loại:** Level 3 (Complex)
> **Phiên bản:** 1.0.0
> **Cập nhật lần cuối:** 2026-02-02
> **Trạng thái:** ĐÃ TRIỂN KHAI

## Tổng Quan

Hệ thống quản lý kho chỉ hoàn chỉnh bao gồm:
- Quản lý phân cấp kho (LOCATION → STORAGE)
- Theo dõi tồn kho theo cuộn (cone) với mã barcode
- Các thao tác hàng loạt: nhập, chuyển, xuất, trả
- Quản lý lô hàng (lot)
- Kiểm kê bằng quét QR
- Hỗ trợ mobile và offline

---

## 1. Quản Lý Kho (Warehouse Management)

### REQ-WH-001: Phân Cấp Kho 2 Cấp
**EARS Format:** The system SHALL support a two-level warehouse hierarchy with LOCATION (địa điểm) as parent and STORAGE (kho lưu trữ) as child.

#### User Story
```
AS A quản lý kho
I WANT TO tổ chức kho theo địa điểm và kho con
SO THAT tôi có thể quản lý hàng hóa theo vùng địa lý
```

#### Acceptance Criteria
- [x] AC1: Hệ thống hỗ trợ 2 loại kho: LOCATION và STORAGE
- [x] AC2: Kho STORAGE phải thuộc một LOCATION cha
- [x] AC3: Chỉ kho STORAGE được phép lưu trữ tồn kho
- [x] AC4: Kho LOCATION hiển thị như nhóm header, không chọn được cho inventory
- [x] AC5: API hỗ trợ format=tree để lấy cấu trúc cây

#### Scenarios
| Scenario | Given | When | Then |
|----------|-------|------|------|
| Hiển thị danh sách kho dạng cây | Có LOCATION và STORAGE | Gọi GET /api/warehouses?format=tree | Trả về cây với LOCATION chứa children STORAGE |
| Chỉ lấy kho STORAGE | Cần chọn kho cho nhập/xuất | Gọi GET /api/warehouses/storage | Trả về chỉ các kho type=STORAGE |
| Lấy kho theo địa điểm | Cần lọc theo LOCATION | Gọi GET /api/warehouses/storage?location_id=X | Trả về STORAGE thuộc LOCATION đó |

---

### REQ-WH-002: Quản Lý Trạng Thái Kho
**EARS Format:** The system SHALL support active/inactive status for warehouses, WHERE only active warehouses are available for operations.

#### User Story
```
AS A quản lý hệ thống
I WANT TO vô hiệu hóa kho không sử dụng
SO THAT chúng không hiển thị trong các form chọn kho
```

#### Acceptance Criteria
- [x] AC1: Mỗi kho có trường is_active (boolean)
- [x] AC2: Mặc định chỉ trả về kho active
- [x] AC3: Kho inactive không hiển thị trong dropdown

---

## 2. Quản Lý Tồn Kho (Inventory Management)

### REQ-INV-001: Theo Dõi Cuộn Chỉ (Cone Tracking)
**EARS Format:** The system SHALL track each cone individually by unique barcode (cone_id), recording thread type, warehouse location, quantity, and status.

#### User Story
```
AS A nhân viên kho
I WANT TO theo dõi từng cuộn chỉ bằng mã barcode
SO THAT tôi biết chính xác vị trí và trạng thái từng cuộn
```

#### Acceptance Criteria
- [x] AC1: Mỗi cuộn có cone_id duy nhất (barcode)
- [x] AC2: Cuộn lưu thông tin: thread_type_id, warehouse_id, lot_id, status
- [x] AC3: Hỗ trợ tra cứu cuộn theo barcode: GET /api/inventory/by-barcode/:coneId
- [x] AC4: Hỗ trợ lọc theo kho, loại chỉ, trạng thái

#### Data Model: Cone
```typescript
interface Cone {
  id: number
  cone_id: string           // Barcode ID - unique
  thread_type_id: number
  warehouse_id: number
  quantity_cones: number    // Usually 1
  quantity_meters: number
  weight_grams: number | null
  is_partial: boolean
  status: ConeStatus
  lot_number: string | null
  lot_id: number | null
  expiry_date: string | null
  received_date: string
  location: string | null
  created_at: string
  updated_at: string
}
```

---

### REQ-INV-002: Workflow Trạng Thái Cuộn
**EARS Format:** The system SHALL enforce a status workflow for cones, transitioning through predefined states from receipt to consumption.

#### User Story
```
AS A quản lý kho
I WANT TO theo dõi cuộn qua các giai đoạn
SO THAT tôi biết cuộn nào sẵn sàng để xuất
```

#### Acceptance Criteria
- [x] AC1: Hỗ trợ các trạng thái: RECEIVED, INSPECTED, AVAILABLE, SOFT_ALLOCATED, HARD_ALLOCATED, IN_PRODUCTION, PARTIAL_RETURN, PENDING_WEIGH, CONSUMED, WRITTEN_OFF, QUARANTINE
- [x] AC2: Cuộn mới nhập có status = RECEIVED
- [x] AC3: Chỉ cuộn AVAILABLE mới được xuất
- [x] AC4: Cuộn CONSUMED hoặc WRITTEN_OFF không tính trong tồn kho

#### Status Flow
```
RECEIVED → INSPECTED → AVAILABLE → SOFT_ALLOCATED → HARD_ALLOCATED → IN_PRODUCTION → CONSUMED
                ↓                        ↓
           QUARANTINE              PARTIAL_RETURN → PENDING_WEIGH → AVAILABLE
```

---

### REQ-INV-003: Nhập Kho (Receive Stock)
**EARS Format:** WHEN receiving new stock, the system SHALL create cone records with auto-generated barcode IDs and initial status RECEIVED.

#### User Story
```
AS A nhân viên nhập kho
I WANT TO nhập nhiều cuộn chỉ cùng lúc
SO THAT tôi tiết kiệm thời gian nhập liệu
```

#### Acceptance Criteria
- [x] AC1: Nhập kho tạo bản ghi mới trong thread_inventory
- [x] AC2: Tự động tạo cone_id duy nhất nếu không cung cấp
- [x] AC3: Liên kết với lot nếu có lot_number
- [x] AC4: Trả về danh sách cuộn vừa tạo để in QR
- [x] AC5: Ghi log vào batch_transactions

#### API: POST /api/inventory/receive
```typescript
interface ReceiveStockDTO {
  thread_type_id: number
  warehouse_id: number
  quantity_cones: number
  weight_per_cone_grams?: number
  lot_number?: string
  expiry_date?: string
  location?: string
}
```

---

### REQ-INV-004: Lọc và Tìm Kiếm Tồn Kho
**EARS Format:** The system SHALL support filtering inventory by warehouse, thread type, status, and partial status, with search by cone_id or lot_number.

#### User Story
```
AS A nhân viên kho
I WANT TO tìm kiếm và lọc tồn kho
SO THAT tôi nhanh chóng tìm được cuộn cần thiết
```

#### Acceptance Criteria
- [x] AC1: Lọc theo warehouse_id
- [x] AC2: Lọc theo thread_type_id
- [x] AC3: Lọc theo status
- [x] AC4: Lọc theo is_partial
- [x] AC5: Tìm kiếm theo cone_id (contains)
- [x] AC6: Hỗ trợ batch fetching cho dataset lớn (>1000 records)

---

### REQ-INV-005: Batch Fetching cho Dataset Lớn
**EARS Format:** WHEN limit=0 query parameter is provided, the system SHALL fetch all records in batches to handle datasets exceeding 1000 rows.

#### User Story
```
AS A hệ thống
I WANT TO lấy toàn bộ dữ liệu với batch
SO THAT không bị giới hạn 1000 records của Supabase
```

#### Acceptance Criteria
- [x] AC1: Với limit=0, API sử dụng batch fetching
- [x] AC2: Batch size = 1000 records
- [x] AC3: Loop với .range(offset, offset + BATCH_SIZE - 1)
- [x] AC4: Gộp tất cả batch thành một response

---

## 3. Thao Tác Hàng Loạt (Batch Operations)

### REQ-BATCH-001: Nhập Kho Hàng Loạt
**EARS Format:** The system SHALL support batch receiving of multiple cones with the same lot and thread type, limiting to 500 cones per operation.

#### User Story
```
AS A nhân viên kho
I WANT TO nhập 500 cuộn cùng lúc từ một lô hàng
SO THAT tôi không phải nhập từng cuộn một
```

#### Acceptance Criteria
- [x] AC1: Nhận danh sách cone_ids (mã barcode)
- [x] AC2: Giới hạn tối đa 500 cuộn/lần
- [x] AC3: Tự động tạo lot mới nếu lot_number mới
- [x] AC4: Kiểm tra trùng cone_id trước khi insert
- [x] AC5: Trả về 409 nếu có cone_id đã tồn tại
- [x] AC6: Cập nhật lot counts sau khi nhập
- [x] AC7: Ghi log vào batch_transactions

#### API: POST /api/batch/receive
```typescript
interface BatchReceiveRequest {
  lot_id?: number
  lot_number?: string
  thread_type_id: number
  warehouse_id: number
  cone_ids: string[]
  production_date?: string
  expiry_date?: string
  supplier?: string
  notes?: string
  quantity_meters_per_cone?: number
  weight_per_cone_grams?: number
}
```

---

### REQ-BATCH-002: Chuyển Kho Hàng Loạt
**EARS Format:** The system SHALL support batch transfer of cones between warehouses, validating source warehouse and cone status.

#### User Story
```
AS A nhân viên kho
I WANT TO chuyển nhiều cuộn từ kho này sang kho khác
SO THAT tôi có thể phân phối hàng hóa
```

#### Acceptance Criteria
- [x] AC1: Chọn kho nguồn và kho đích (phải khác nhau)
- [x] AC2: Chọn cuộn theo lot hoặc quét/nhập riêng
- [x] AC3: Chỉ chuyển cuộn có status: AVAILABLE, RECEIVED, INSPECTED
- [x] AC4: Validate tất cả cuộn đang ở kho nguồn
- [x] AC5: Cập nhật warehouse_id cho các cuộn
- [x] AC6: Cập nhật lot.warehouse_id nếu chuyển cả lô
- [x] AC7: Ghi log vào batch_transactions với operation_type=TRANSFER

#### API: POST /api/batch/transfer
```typescript
interface BatchTransferRequest {
  cone_ids?: number[]
  lot_id?: number
  from_warehouse_id: number
  to_warehouse_id: number
  notes?: string
}
```

---

### REQ-BATCH-003: Xuất Kho Hàng Loạt
**EARS Format:** The system SHALL support batch issuing of cones to recipients, updating status to HARD_ALLOCATED and recording recipient information.

#### User Story
```
AS A nhân viên kho
I WANT TO xuất nhiều cuộn cho một đơn hàng
SO THAT tôi có thể giao hàng nhanh chóng
```

#### Acceptance Criteria
- [x] AC1: Yêu cầu thông tin người nhận (recipient)
- [x] AC2: Chọn cuộn theo lot hoặc quét/nhập
- [x] AC3: Chỉ xuất cuộn có status = AVAILABLE
- [x] AC4: Cập nhật status thành HARD_ALLOCATED
- [x] AC5: Ghi reference_number (số phiếu xuất) nếu có
- [x] AC6: Cập nhật lot.available_cones và status nếu hết

#### API: POST /api/batch/issue
```typescript
interface BatchIssueRequest {
  cone_ids?: number[]
  lot_id?: number
  warehouse_id: number
  recipient: string
  reference_number?: string
  notes?: string
}
```

---

### REQ-BATCH-004: Trả Lại Hàng Loạt
**EARS Format:** The system SHALL support returning issued cones back to inventory, updating status to AVAILABLE.

#### User Story
```
AS A nhân viên kho
I WANT TO nhận lại cuộn đã xuất
SO THAT tôi cập nhật lại tồn kho chính xác
```

#### Acceptance Criteria
- [x] AC1: Nhận danh sách cone_ids cần trả
- [x] AC2: Cập nhật status thành AVAILABLE
- [x] AC3: Cập nhật warehouse_id về kho nhận
- [x] AC4: Ghi log vào batch_transactions với operation_type=RETURN

#### API: POST /api/batch/return
```typescript
interface BatchReturnRequest {
  cone_ids: number[]
  warehouse_id: number
  notes?: string
}
```

---

### REQ-BATCH-005: Lịch Sử Giao Dịch
**EARS Format:** The system SHALL log all batch operations and provide a searchable transaction history with filters and CSV export.

#### User Story
```
AS A quản lý kho
I WANT TO xem lịch sử tất cả thao tác nhập/xuất/chuyển
SO THAT tôi có thể kiểm tra và báo cáo
```

#### Acceptance Criteria
- [x] AC1: Lưu transaction với: operation_type, cone_ids, cone_count, lot_id, from/to_warehouse, recipient, reference_number, notes, performed_at
- [x] AC2: Lọc theo operation_type, warehouse_id, lot_id, date range
- [x] AC3: Hiển thị chi tiết transaction với danh sách cone_ids
- [x] AC4: Xuất CSV với header tiếng Việt

#### Data Model: BatchTransaction
```typescript
interface BatchTransactionRow {
  id: number
  operation_type: 'RECEIVE' | 'TRANSFER' | 'ISSUE' | 'RETURN'
  lot_id: number | null
  from_warehouse_id: number | null
  to_warehouse_id: number | null
  cone_ids: number[]
  cone_count: number
  reference_number: string | null
  recipient: string | null
  notes: string | null
  performed_by: string | null
  performed_at: string
}
```

---

## 4. Quản Lý Lô Hàng (Lot Management)

### REQ-LOT-001: Tạo và Quản Lý Lô
**EARS Format:** The system SHALL support creating lots with metadata (lot_number, thread_type, warehouse, dates, supplier) and track cone counts.

#### User Story
```
AS A nhân viên kho
I WANT TO quản lý hàng theo lô
SO THAT tôi có thể truy xuất nguồn gốc và hạn sử dụng
```

#### Acceptance Criteria
- [x] AC1: Tạo lô với lot_number duy nhất
- [x] AC2: Lô liên kết với thread_type và warehouse
- [x] AC3: Lưu production_date, expiry_date, supplier
- [x] AC4: Tự động đếm total_cones và available_cones
- [x] AC5: Tự động tạo lô khi batch receive với lot_number mới
- [x] AC6: Kiểm tra trùng lot_number trước khi tạo (409)

#### Data Model: Lot
```typescript
interface LotRow {
  id: number
  lot_number: string
  thread_type_id: number
  warehouse_id: number
  production_date: string | null
  expiry_date: string | null
  supplier: string | null
  total_cones: number
  available_cones: number
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'QUARANTINE'
  notes: string | null
  created_at: string
  updated_at: string
}
```

---

### REQ-LOT-002: Trạng Thái Lô
**EARS Format:** The system SHALL manage lot status (ACTIVE, DEPLETED, EXPIRED, QUARANTINE) based on cone availability and manual actions.

#### User Story
```
AS A quản lý kho
I WANT TO cách ly lô có vấn đề
SO THAT không xuất nhầm hàng lỗi
```

#### Acceptance Criteria
- [x] AC1: Lô mới có status = ACTIVE
- [x] AC2: Lô tự động chuyển DEPLETED khi available_cones = 0
- [x] AC3: Hỗ trợ quarantine/release lô thủ công
- [x] AC4: Cảnh báo lô sắp hết hạn (30 ngày)

---

### REQ-LOT-003: Xem Chi Tiết Lô
**EARS Format:** The system SHALL provide lot details including cone list and transaction history.

#### User Story
```
AS A nhân viên kho
I WANT TO xem tất cả cuộn trong một lô
SO THAT tôi biết trạng thái từng cuộn
```

#### Acceptance Criteria
- [x] AC1: GET /api/lots/:id trả về thông tin lô
- [x] AC2: GET /api/lots/:id/cones trả về danh sách cuộn
- [x] AC3: GET /api/lots/:id/transactions trả về lịch sử thao tác

---

## 5. Kiểm Kê (Stocktake)

### REQ-STK-001: Quét QR Liên Tục
**EARS Format:** The system SHALL support continuous QR scanning during stocktake, buffering scanned items and comparing with database records.

#### User Story
```
AS A nhân viên kiểm kê
I WANT TO quét liên tục các cuộn trong kho
SO THAT tôi không phải dừng sau mỗi lần quét
```

#### Acceptance Criteria
- [x] AC1: Chọn kho trước khi bắt đầu quét
- [x] AC2: Quét liên tục với camera stream
- [x] AC3: Phát hiện trùng lặp và cảnh báo
- [x] AC4: Hiển thị danh sách đã quét realtime
- [x] AC5: Phản hồi âm thanh/haptic khi quét

---

### REQ-STK-002: So Sánh với Database
**EARS Format:** The system SHALL compare scanned items with database records, calculating matched, missing, and extra counts.

#### User Story
```
AS A nhân viên kiểm kê
I WANT TO so sánh kết quả quét với database
SO THAT tôi biết hàng khớp, thiếu, thừa
```

#### Acceptance Criteria
- [x] AC1: Tải danh sách cuộn trong kho từ database
- [x] AC2: Tính số khớp (matched): quét được và có trong DB
- [x] AC3: Tính số thiếu (missing): trong DB nhưng không quét được
- [x] AC4: Tính số thừa (extra): quét được nhưng không trong DB
- [x] AC5: Tính tỷ lệ khớp (match rate %)

---

### REQ-STK-003: Lưu Phiên Kiểm Kê
**EARS Format:** The system SHALL persist stocktake session to localStorage and offer resume option on page reload.

#### User Story
```
AS A nhân viên kiểm kê
I WANT TO tiếp tục phiên kiểm kê sau khi refresh trang
SO THAT tôi không mất dữ liệu đã quét
```

#### Acceptance Criteria
- [x] AC1: Lưu session vào localStorage sau mỗi lần quét
- [x] AC2: Session chứa: warehouseId, scannedItems, startedAt
- [x] AC3: Hiển thị dialog hỏi tiếp tục khi có session cũ
- [x] AC4: Xóa session khi hoàn tất kiểm kê

---

### REQ-STK-004: Xuất Kết Quả
**EARS Format:** The system SHALL allow exporting stocktake results to CSV and saving to backend.

#### User Story
```
AS A quản lý kho
I WANT TO xuất kết quả kiểm kê ra file
SO THAT tôi có thể báo cáo và lưu trữ
```

#### Acceptance Criteria
- [x] AC1: Xuất CSV với cột: Cone ID, Trạng thái, Loại chỉ, Số lô
- [x] AC2: Gọi POST /api/inventory/stocktake để lưu kết quả
- [x] AC3: Backend trả về StocktakeResult với thống kê

#### API: POST /api/inventory/stocktake
```typescript
interface StocktakeDTO {
  warehouse_id: number
  scanned_cone_ids: string[]
  notes?: string
  performed_by?: string
}

interface StocktakeResult {
  stocktake_id: number
  warehouse_id: number
  total_in_db: number
  total_scanned: number
  matched: number
  missing: string[]
  extra: string[]
  match_rate: number
  performed_at: string
}
```

---

## 6. Mobile Support

### REQ-MOB-001: Nhập Kho Di Động
**EARS Format:** The system SHALL provide a mobile-optimized interface for receiving stock with barcode scanning and optional scale integration.

#### User Story
```
AS A nhân viên kho
I WANT TO nhập kho bằng điện thoại
SO THAT tôi có thể làm việc tại chỗ
```

#### Acceptance Criteria
- [x] AC1: Giao diện tối ưu cho mobile
- [x] AC2: Quét mã loại chỉ bằng camera hoặc scanner cầm tay
- [x] AC3: Chọn số lượng với nút +/-
- [x] AC4: Kết nối cân USB (optional)
- [x] AC5: Nhập tay nếu không có cân
- [x] AC6: Chọn kho và vị trí

---

### REQ-MOB-002: Hỗ Trợ Offline
**EARS Format:** WHEN network is unavailable, the system SHALL queue operations locally and sync when connection is restored.

#### User Story
```
AS A nhân viên kho
I WANT TO tiếp tục nhập kho khi mất mạng
SO THAT công việc không bị gián đoạn
```

#### Acceptance Criteria
- [x] AC1: Phát hiện trạng thái offline
- [x] AC2: Queue thao tác vào local storage
- [x] AC3: Hiển thị banner sync status
- [x] AC4: Tự động sync khi có mạng
- [x] AC5: Xử lý conflict với dialog

---

## 7. Giao Diện Trang Chính

### REQ-UI-001: Trang Hub Kho
**EARS Format:** The system SHALL provide a dashboard page (/kho) with navigation cards to all warehouse modules.

#### User Story
```
AS A người dùng
I WANT TO có một trang trung tâm quản lý kho
SO THAT tôi có thể truy cập nhanh các chức năng
```

#### Acceptance Criteria
- [x] AC1: Hiển thị các module dạng card grid
- [x] AC2: Các module: Tồn Kho, Kiểm Kê, Lô Hàng, Nhập Kho, Chuyển Kho, Xuất Kho, Lịch Sử
- [x] AC3: Mỗi card có icon, title, description, link
- [x] AC4: Responsive 1/2/3 cột theo screen size

---

## 8. Non-Functional Requirements

### REQ-NF-001: Performance
- Batch fetching cho dataset > 1000 records
- API response < 2 seconds cho danh sách tồn kho
- QR scanning 60fps với detect < 100ms

### REQ-NF-002: Security
- Validate input trước khi insert
- Kiểm tra duplicate trước khi insert (409 Conflict)
- Sử dụng supabaseAdmin (service_role) cho backend operations

### REQ-NF-003: Localization
- Tất cả error messages bằng tiếng Việt
- Date format: DD/MM/YYYY hoặc vi-VN locale
- Currency/number format theo locale Việt Nam

---

## Appendix: API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/warehouses | Danh sách kho (flat) |
| GET | /api/warehouses?format=tree | Danh sách kho (tree) |
| GET | /api/warehouses/locations | Chỉ LOCATION |
| GET | /api/warehouses/storage | Chỉ STORAGE |
| GET | /api/inventory | Danh sách tồn kho |
| GET | /api/inventory/:id | Chi tiết cuộn |
| GET | /api/inventory/by-barcode/:coneId | Tra cứu theo barcode |
| GET | /api/inventory/by-warehouse/:id | Tồn kho theo kho |
| POST | /api/inventory/receive | Nhập kho đơn |
| POST | /api/inventory/stocktake | Lưu kiểm kê |
| POST | /api/batch/receive | Nhập kho hàng loạt |
| POST | /api/batch/transfer | Chuyển kho hàng loạt |
| POST | /api/batch/issue | Xuất kho hàng loạt |
| POST | /api/batch/return | Trả lại hàng loạt |
| GET | /api/batch/transactions | Lịch sử giao dịch |
| GET | /api/batch/transactions/:id | Chi tiết giao dịch |
| GET | /api/lots | Danh sách lô |
| GET | /api/lots/:id | Chi tiết lô |
| POST | /api/lots | Tạo lô mới |
| PATCH | /api/lots/:id | Cập nhật lô |
| GET | /api/lots/:id/cones | Cuộn trong lô |
| GET | /api/lots/:id/transactions | Lịch sử lô |
