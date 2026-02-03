# Danh Sách Task - Quản Lý Kho Chỉ

> **Phân loại:** Level 3 (Complex)
> **Trạng thái:** ĐÃ HOÀN THÀNH (tất cả features đã triển khai)
> **Cập nhật lần cuối:** 2026-02-02

---

## Tổng Quan Trạng Thái

| Module | Tasks | Hoàn thành | Trạng thái |
|--------|-------|------------|------------|
| Backend - Warehouses | 4 | 4 | DONE |
| Backend - Inventory | 6 | 6 | DONE |
| Backend - Batch | 6 | 6 | DONE |
| Backend - Lots | 6 | 6 | DONE |
| Frontend - Types | 4 | 4 | DONE |
| Frontend - Services | 2 | 2 | DONE |
| Frontend - Composables | 4 | 4 | DONE |
| Frontend - Components | 6 | 6 | DONE |
| Frontend - Pages | 9 | 9 | DONE |
| **TỔNG** | **47** | **47** | **100%** |

---

## 1. Backend - Warehouse Routes

### Task 1.1: GET /api/warehouses với format tree
**Trạng thái:** DONE
**File:** `server/routes/warehouses.ts`

**Mô tả:**
Implement endpoint lấy danh sách kho với hỗ trợ format tree hoặc flat.

**Checklist:**
- [x] Lấy tất cả kho active
- [x] Sắp xếp theo parent_id, sort_order
- [x] Nếu format=tree, build cấu trúc cây LOCATION → STORAGE
- [x] Nếu format=flat (default), trả về flat list

**Definition of Done:**
- API trả về đúng format theo query param
- Tree có LOCATION chứa children STORAGE
- Chỉ kho active được trả về

---

### Task 1.2: GET /api/warehouses/storage
**Trạng thái:** DONE
**File:** `server/routes/warehouses.ts`

**Mô tả:**
Endpoint lấy chỉ kho STORAGE, có thể lọc theo location.

**Checklist:**
- [x] Lọc type='STORAGE'
- [x] Hỗ trợ query param location_id
- [x] Sắp xếp theo sort_order

**Definition of Done:**
- Chỉ trả về kho STORAGE
- Lọc được theo location_id

---

### Task 1.3: GET /api/warehouses/locations
**Trạng thái:** DONE
**File:** `server/routes/warehouses.ts`

**Mô tả:**
Endpoint lấy chỉ kho LOCATION.

**Checklist:**
- [x] Lọc type='LOCATION'
- [x] Sắp xếp theo sort_order

**Definition of Done:**
- Chỉ trả về kho LOCATION

---

### Task 1.4: Tree Building Logic
**Trạng thái:** DONE
**File:** `server/routes/warehouses.ts`

**Mô tả:**
Logic chuyển đổi flat list thành tree structure.

**Checklist:**
- [x] Tách LOCATION và STORAGE từ flat list
- [x] Group STORAGE theo parent_id
- [x] Gán children cho mỗi LOCATION
- [x] Handle STORAGE không có parent

**Definition of Done:**
- Tree structure đúng format WarehouseTreeNode[]

---

## 2. Backend - Inventory Routes

### Task 2.1: GET /api/inventory với filters
**Trạng thái:** DONE
**File:** `server/routes/inventory.ts`

**Mô tả:**
Endpoint lấy danh sách tồn kho với filters và batch support.

**Checklist:**
- [x] Lọc theo search, thread_type_id, warehouse_id, status, is_partial
- [x] Join với thread_types và warehouses
- [x] Batch fetching khi limit=0
- [x] BATCH_SIZE = 1000

**Definition of Done:**
- Filters hoạt động đúng
- Batch fetching xử lý >1000 records

---

### Task 2.2: GET /api/inventory/by-barcode/:coneId
**Trạng thái:** DONE
**File:** `server/routes/inventory.ts`

**Mô tả:**
Tra cứu cuộn theo barcode.

**Checklist:**
- [x] Tìm theo cone_id (exact match)
- [x] Join với thread_type, warehouse, lot
- [x] Trả về 404 nếu không tìm thấy

**Definition of Done:**
- Tra cứu chính xác theo barcode
- Trả về đầy đủ thông tin với joins

---

### Task 2.3: GET /api/inventory/by-warehouse/:warehouseId
**Trạng thái:** DONE
**File:** `server/routes/inventory.ts`

**Mô tả:**
Lấy tất cả cuộn trong một kho (cho stocktake).

**Checklist:**
- [x] Lọc theo warehouse_id
- [x] Loại trừ CONSUMED và WRITTEN_OFF
- [x] Trả về cone_id và thông tin cần thiết

**Definition of Done:**
- Trả về tất cả cuộn còn trong kho

---

### Task 2.4: POST /api/inventory/receive
**Trạng thái:** DONE
**File:** `server/routes/inventory.ts`

**Mô tả:**
Nhập kho đơn lẻ với auto-generate cone_ids.

**Checklist:**
- [x] Validate required fields
- [x] Generate unique cone_ids
- [x] Tính quantity_meters từ thread_type
- [x] Insert vào thread_inventory
- [x] Trả về danh sách cuộn vừa tạo

**Definition of Done:**
- Tạo cuộn mới với cone_id unique
- Trả về cuộn để in QR

---

### Task 2.5: POST /api/inventory/stocktake
**Trạng thái:** DONE
**File:** `server/routes/inventory.ts`

**Mô tả:**
Lưu kết quả kiểm kê và tính toán comparison.

**Checklist:**
- [x] Nhận warehouse_id và scanned_cone_ids
- [x] Lấy danh sách cuộn trong DB (loại trừ CONSUMED, WRITTEN_OFF)
- [x] Tính matched, missing, extra
- [x] Tính match_rate
- [x] Trả về StocktakeResult

**Definition of Done:**
- Trả về thống kê kiểm kê chính xác

---

### Task 2.6: GET /api/inventory/available/summary
**Trạng thái:** DONE
**File:** `server/routes/inventory.ts`

**Mô tả:**
API lấy thống kê tổng hợp tồn kho.

**Checklist:**
- [x] Đếm total_cones, available_cones
- [x] Tính total_meters, available_meters
- [x] Đếm allocated_cones, partial_cones

**Definition of Done:**
- Trả về InventorySummary object

---

## 3. Backend - Batch Routes

### Task 3.1: POST /api/batch/receive
**Trạng thái:** DONE
**File:** `server/routes/batch.ts`

**Mô tả:**
Nhập kho hàng loạt với lot management.

**Checklist:**
- [x] Validate cone_ids không rỗng
- [x] Validate limit 500 cuộn
- [x] Check duplicate cone_ids trong system
- [x] Tạo lot mới nếu lot_number mới
- [x] Insert cone records
- [x] Update lot counts
- [x] Log transaction

**Definition of Done:**
- Nhập được 500 cuộn/lần
- Tự động tạo lot nếu cần
- Log transaction đầy đủ

---

### Task 3.2: POST /api/batch/transfer
**Trạng thái:** DONE
**File:** `server/routes/batch.ts`

**Mô tả:**
Chuyển kho hàng loạt.

**Checklist:**
- [x] Validate kho nguồn và đích khác nhau
- [x] Lấy cuộn theo lot_id hoặc cone_ids
- [x] Validate cuộn ở kho nguồn với status hợp lệ
- [x] Update warehouse_id cho cuộn
- [x] Update lot.warehouse_id nếu chuyển cả lô
- [x] Log transaction

**Definition of Done:**
- Chuyển được cuộn giữa các kho
- Validate đầy đủ

---

### Task 3.3: POST /api/batch/issue
**Trạng thái:** DONE
**File:** `server/routes/batch.ts`

**Mô tả:**
Xuất kho hàng loạt.

**Checklist:**
- [x] Validate warehouse_id và recipient
- [x] Lấy cuộn theo lot_id hoặc cone_ids
- [x] Chỉ xuất cuộn AVAILABLE
- [x] Update status = HARD_ALLOCATED
- [x] Update lot counts
- [x] Log transaction với recipient, reference_number

**Definition of Done:**
- Xuất được cuộn cho người nhận
- Cập nhật status và lot

---

### Task 3.4: POST /api/batch/return
**Trạng thái:** DONE
**File:** `server/routes/batch.ts`

**Mô tả:**
Trả lại hàng loạt.

**Checklist:**
- [x] Validate cone_ids và warehouse_id
- [x] Update status = AVAILABLE
- [x] Update warehouse_id
- [x] Log transaction

**Definition of Done:**
- Trả được cuộn về kho
- Cập nhật status

---

### Task 3.5: GET /api/batch/transactions
**Trạng thái:** DONE
**File:** `server/routes/batch.ts`

**Mô tả:**
Lấy lịch sử giao dịch với filters.

**Checklist:**
- [x] Join với lot, from_warehouse, to_warehouse
- [x] Lọc theo operation_type, lot_id, warehouse_id
- [x] Lọc theo date range (from_date, to_date)
- [x] Sắp xếp theo performed_at DESC

**Definition of Done:**
- Filters hoạt động đúng
- Join đầy đủ thông tin

---

### Task 3.6: GET /api/batch/transactions/:id
**Trạng thái:** DONE
**File:** `server/routes/batch.ts`

**Mô tả:**
Chi tiết một giao dịch.

**Checklist:**
- [x] Lấy theo id
- [x] Join đầy đủ
- [x] Trả về 404 nếu không tìm thấy

**Definition of Done:**
- Trả về chi tiết transaction

---

## 4. Backend - Lot Routes

### Task 4.1: POST /api/lots
**Trạng thái:** DONE
**File:** `server/routes/lots.ts`

**Mô tả:**
Tạo lô mới.

**Checklist:**
- [x] Validate required: lot_number, thread_type_id, warehouse_id
- [x] Check duplicate lot_number (409)
- [x] Insert với status = ACTIVE
- [x] total_cones = 0, available_cones = 0

**Definition of Done:**
- Tạo được lô mới
- Kiểm tra trùng

---

### Task 4.2: GET /api/lots
**Trạng thái:** DONE
**File:** `server/routes/lots.ts`

**Mô tả:**
Danh sách lô với filters.

**Checklist:**
- [x] Lọc theo status, warehouse_id, thread_type_id
- [x] Tìm kiếm theo lot_number (ilike)
- [x] Join với thread_type, warehouse
- [x] Sắp xếp theo created_at DESC

**Definition of Done:**
- Filters và search hoạt động đúng

---

### Task 4.3: GET /api/lots/:id
**Trạng thái:** DONE
**File:** `server/routes/lots.ts`

**Mô tả:**
Chi tiết lô.

**Checklist:**
- [x] Lấy theo id
- [x] Join với thread_type, warehouse
- [x] Trả về 404 nếu không tìm thấy

**Definition of Done:**
- Trả về đầy đủ thông tin lô

---

### Task 4.4: PATCH /api/lots/:id
**Trạng thái:** DONE
**File:** `server/routes/lots.ts`

**Mô tả:**
Cập nhật lô (partial update).

**Checklist:**
- [x] Chỉ update fields được cung cấp
- [x] Hỗ trợ: production_date, expiry_date, supplier, status, notes
- [x] Trả về lô đã update

**Definition of Done:**
- Partial update hoạt động đúng

---

### Task 4.5: GET /api/lots/:id/cones
**Trạng thái:** DONE
**File:** `server/routes/lots.ts`

**Mô tả:**
Danh sách cuộn trong lô.

**Checklist:**
- [x] Lọc theo lot_id
- [x] Join với thread_type, warehouse
- [x] Sắp xếp theo cone_id

**Definition of Done:**
- Trả về tất cả cuộn của lô

---

### Task 4.6: GET /api/lots/:id/transactions
**Trạng thái:** DONE
**File:** `server/routes/lots.ts`

**Mô tả:**
Lịch sử thao tác của lô.

**Checklist:**
- [x] Lọc theo lot_id
- [x] Join với warehouse
- [x] Sắp xếp theo performed_at DESC

**Definition of Done:**
- Trả về lịch sử đầy đủ

---

## 5. Frontend - Types

### Task 5.1: Inventory Types
**Trạng thái:** DONE
**File:** `src/types/thread/inventory.ts`

**Checklist:**
- [x] Cone interface với đầy đủ fields
- [x] InventoryFilters interface
- [x] ReceiveStockDTO interface
- [x] InventorySummary interface

---

### Task 5.2: Lot Types
**Trạng thái:** DONE
**File:** `src/types/thread/lot.ts`

**Checklist:**
- [x] Lot interface
- [x] LotStatus type
- [x] LotFilters interface
- [x] CreateLotRequest, UpdateLotRequest

---

### Task 5.3: Batch Types
**Trạng thái:** DONE
**File:** `src/types/thread/batch.ts`

**Checklist:**
- [x] BatchOperationType type
- [x] BatchReceiveRequest, BatchTransferRequest, BatchIssueRequest, BatchReturnRequest
- [x] BatchOperationResult interface
- [x] BatchTransaction interface

---

### Task 5.4: Enum Types
**Trạng thái:** DONE
**File:** `src/types/thread/enums.ts`

**Checklist:**
- [x] ConeStatus enum
- [x] Export từ các files khác

---

## 6. Frontend - Services

### Task 6.1: warehouseService
**Trạng thái:** DONE
**File:** `src/services/warehouseService.ts`

**Checklist:**
- [x] getAll() - flat list
- [x] getTree() - tree structure
- [x] getStorageOnly(locationId?) - chỉ STORAGE
- [x] getLocations() - chỉ LOCATION
- [x] Export Warehouse, WarehouseTreeNode types

---

### Task 6.2: inventoryService
**Trạng thái:** DONE
**File:** `src/services/inventoryService.ts`

**Checklist:**
- [x] getAll(filters?) với limit=0 support
- [x] getById(id)
- [x] getByBarcode(coneId)
- [x] getByWarehouse(warehouseId)
- [x] receiveStock(data)
- [x] saveStocktake(warehouseId, scannedConeIds, notes?)

---

## 7. Frontend - Composables

### Task 7.1: useWarehouses
**Trạng thái:** DONE
**File:** `src/composables/useWarehouses.ts`

**Checklist:**
- [x] State: warehouses, warehouseTree, loading, error
- [x] Computed: locations, storageWarehouses, warehousesByLocation
- [x] Computed: warehouseOptions, groupedWarehouseOptions, storageOptions
- [x] Methods: fetchWarehouses, fetchWarehouseTree
- [x] Helpers: getWarehouseLabel, getWarehouseById, getLocationName, getStoragesForLocation

---

### Task 7.2: useInventory
**Trạng thái:** DONE
**File:** `src/composables/thread/useInventory.ts`

**Checklist:**
- [x] State: inventory, isLoading
- [x] Methods: fetchInventory, receiveStock
- [x] Filters handling

---

### Task 7.3: useBatchOperations
**Trạng thái:** DONE
**File:** `src/composables/useBatchOperations.ts`

**Checklist:**
- [x] Buffer: coneBuffer, bufferCount, hasBuffer
- [x] Buffer methods: addToBuffer, addMultipleToBuffer, removeFromBuffer, clearBuffer, parseInput
- [x] API: batchReceive, batchTransfer, batchIssue, batchReturn
- [x] API: fetchTransactions
- [x] State: loading, lastResult, transactions

---

### Task 7.4: useLots
**Trạng thái:** DONE
**File:** `src/composables/useLots.ts`

**Checklist:**
- [x] State: lots, currentLot, currentCones, loading
- [x] Methods: fetchLots, fetchLot, createLot, updateLot
- [x] Methods: fetchLotCones, quarantineLot, releaseLot

---

## 8. Frontend - Components

### Task 8.1: AppWarehouseSelect
**Trạng thái:** DONE
**File:** `src/components/ui/inputs/AppWarehouseSelect.vue`

**Checklist:**
- [x] Grouped display với LOCATION headers
- [x] LOCATION disabled, không chọn được
- [x] STORAGE indented dưới parent
- [x] Props: storageOnly để lọc

---

### Task 8.2: LotSelector
**Trạng thái:** DONE
**File:** `src/components/thread/LotSelector.vue`

**Checklist:**
- [x] Dropdown chọn lô
- [x] Lọc theo warehouse_id
- [x] Emit lot-selected với full object

---

### Task 8.3: LotStatusBadge
**Trạng thái:** DONE
**File:** `src/components/thread/LotStatusBadge.vue`

**Checklist:**
- [x] Badge với màu theo status
- [x] ACTIVE=green, DEPLETED=grey, EXPIRED=orange, QUARANTINE=red

---

### Task 8.4: LotFormDialog
**Trạng thái:** DONE
**File:** `src/components/thread/LotFormDialog.vue`

**Checklist:**
- [x] Form tạo/sửa lô
- [x] Fields: lot_number, thread_type, warehouse, dates, supplier, notes
- [x] Validation

---

### Task 8.5: QrScannerStream
**Trạng thái:** DONE
**File:** `src/components/qr/QrScannerStream.vue`

**Checklist:**
- [x] Camera stream continuous
- [x] Detect QR/barcode
- [x] Emit detect event
- [x] v-model cho active state

---

### Task 8.6: OfflineSyncBanner
**Trạng thái:** DONE
**File:** `src/components/offline/OfflineSyncBanner.vue`

**Checklist:**
- [x] Hiển thị khi có queue
- [x] Hiển thị số items pending
- [x] Button show conflicts

---

## 9. Frontend - Pages

### Task 9.1: kho.vue (Hub Page)
**Trạng thái:** DONE
**File:** `src/pages/kho.vue`

**Checklist:**
- [x] Header với title, subtitle
- [x] Grid cards cho các modules
- [x] Cards: Tồn Kho, Kiểm Kê, Lô Hàng, Nhập Kho, Chuyển Kho, Xuất Kho, Lịch Sử
- [x] Responsive layout

---

### Task 9.2: inventory.vue
**Trạng thái:** DONE
**File:** `src/pages/thread/inventory.vue`

**Checklist:**
- [x] Filters: search, thread_type, warehouse, status
- [x] Data table với pagination
- [x] Columns: cone_id, thread_type, warehouse, quantity, status, lot, actions
- [x] QR scan button tra cứu
- [x] Nhập kho dialog
- [x] Chi tiết cuộn dialog
- [x] Print QR dialog

---

### Task 9.3: stocktake.vue
**Trạng thái:** DONE
**File:** `src/pages/thread/stocktake.vue`

**Checklist:**
- [x] Warehouse selector
- [x] QrScannerStream panel
- [x] Scanned items list với stats
- [x] Comparison results section
- [x] Session persistence (localStorage)
- [x] Resume session dialog
- [x] Export CSV
- [x] Complete stocktake API call

---

### Task 9.4: lots/index.vue
**Trạng thái:** DONE
**File:** `src/pages/thread/lots/index.vue`

**Checklist:**
- [x] Filters: search, status, warehouse
- [x] Data table với pagination
- [x] Columns: lot_number, thread_type, status, cones, warehouse, expiry, actions
- [x] Create lot dialog
- [x] Edit lot
- [x] Quarantine/Release actions
- [x] Link to lot detail

---

### Task 9.5: batch/receive.vue
**Trạng thái:** DONE
**File:** `src/pages/thread/batch/receive.vue`

**Checklist:**
- [x] Step 1: Chọn kho (AppWarehouseSelect)
- [x] Step 2: Lô hàng (existing/new mode)
- [x] Step 3: Quét cuộn (QrScannerStream + manual)
- [x] Step 4: Xác nhận (review + submit)
- [x] Cone buffer display
- [x] Success dialog với continue option

---

### Task 9.6: batch/transfer.vue
**Trạng thái:** DONE
**File:** `src/pages/thread/batch/transfer.vue`

**Checklist:**
- [x] Step 1: Chọn nguồn + cuộn (by lot or scan)
- [x] Step 2: Chọn đích
- [x] Step 3: Xác nhận
- [x] Validation kho nguồn != đích
- [x] Success dialog

---

### Task 9.7: batch/issue.vue
**Trạng thái:** DONE
**File:** `src/pages/thread/batch/issue.vue`

**Checklist:**
- [x] Step 1: Chọn kho + cuộn (by lot or scan)
- [x] Step 2: Thông tin người nhận
- [x] Step 3: Xác nhận
- [x] Print slip option
- [x] Success dialog

---

### Task 9.8: batch/history.vue
**Trạng thái:** DONE
**File:** `src/pages/thread/batch/history.vue`

**Checklist:**
- [x] Filters: operation_type, warehouse, date range
- [x] Data table với transactions
- [x] Columns: ID, type, cone_count, warehouses, recipient, date, actions
- [x] Detail dialog với cone_ids
- [x] Export CSV

---

### Task 9.9: mobile/receive.vue
**Trạng thái:** DONE
**File:** `src/pages/thread/mobile/receive.vue`

**Checklist:**
- [x] Mobile-optimized layout
- [x] Scan thread type code
- [x] Quantity +/- controls
- [x] Weight section (scale connection or manual)
- [x] Warehouse + location select
- [x] Offline support với OfflineSyncBanner
- [x] useOfflineOperation integration

---

## Maintenance Tasks (Future)

### MAINT-001: Thêm báo cáo tồn kho theo thời gian
**Trạng thái:** PLANNED
**Ưu tiên:** Medium

**Mô tả:**
Thêm báo cáo trend tồn kho theo ngày/tuần/tháng.

---

### MAINT-002: Thêm QR code generation cho cuộn
**Trạng thái:** PLANNED
**Ưu tiên:** Medium

**Mô tả:**
Tích hợp in QR code sau khi nhập kho batch.

---

### MAINT-003: Thêm user tracking cho transactions
**Trạng thái:** PLANNED
**Ưu tiên:** Low

**Mô tả:**
Lưu performed_by với user ID từ auth session.

---

### MAINT-004: Thêm expiry notifications
**Trạng thái:** PLANNED
**Ưu tiên:** Low

**Mô tả:**
Gửi thông báo khi lô sắp hết hạn (30 ngày).

---

### MAINT-005: Optimize batch operations với parallel processing
**Trạng thái:** PLANNED
**Ưu tiên:** Low

**Mô tả:**
Sử dụng Promise.all cho các operations độc lập.

---

## Definition of Done Chung

Tất cả tasks phải đáp ứng:

1. **Code Quality**
   - TypeScript không có lỗi (type-check pass)
   - Lint pass (npm run lint)
   - Không có console.log trong production code

2. **API Response**
   - Sử dụng format chuẩn: `{ data, error, message }`
   - Error messages bằng tiếng Việt
   - HTTP status codes đúng (200, 201, 400, 404, 409, 500)

3. **Frontend**
   - Responsive trên mobile/tablet/desktop
   - Loading states hiển thị đúng
   - Error handling với snackbar

4. **Testing**
   - API có thể test với curl/Postman
   - UI có thể test thủ công

5. **Documentation**
   - JSDoc comments cho public functions
   - Type definitions đầy đủ
