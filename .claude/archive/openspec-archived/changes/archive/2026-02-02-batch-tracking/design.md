## Context

Hệ thống quản lý kho chỉ hiện tại theo dõi từng cuộn (cone) riêng lẻ qua bảng `thread_inventory` với:
- `cone_id` (barcode), `thread_type_id`, `warehouse_id`
- `quantity_meters`, `weight_grams`, `status` (cone lifecycle)
- `lot_number` (string field - chỉ là text, không phải FK)
- `expiry_date`, `received_date`

**Vấn đề hiện tại:**
1. `lot_number` chỉ là string - không có thông tin chi tiết về lô (ngày SX, NCC, trạng thái lô)
2. Nhập/xuất/chuyển kho từng cone một - tốn thời gian với số lượng lớn
3. Không có lịch sử thao tác theo lô cho truy xuất nguồn gốc

**Stakeholders:** Thủ kho, Quản lý sản xuất, QC

## Goals / Non-Goals

**Goals:**
- Quản lý lô hàng như entity độc lập với thông tin đầy đủ (ngày SX, NCC, trạng thái)
- Thao tác hàng loạt: nhập/xuất/chuyển nhiều cone cùng lúc
- Truy xuất nguồn gốc theo lot_number
- Backward compatible - không break existing cone tracking

**Non-Goals:**
- Quản lý supplier/vendor (dùng string field đơn giản)
- Production order integration (phase sau)
- Barcode/QR generation cho lot (dùng existing cone QR)
- Multi-warehouse lot (1 lot chỉ ở 1 warehouse tại 1 thời điểm)

## Decisions

### Decision 1: Lots Table Schema

Tạo bảng `lots` để quản lý lô hàng như first-class entity:

```sql
CREATE TABLE lots (
  id SERIAL PRIMARY KEY,
  lot_number VARCHAR(50) UNIQUE NOT NULL,    -- Mã lô (e.g., LOT-2026-001)
  thread_type_id INTEGER NOT NULL REFERENCES thread_types(id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  
  -- Lot metadata
  production_date DATE,                       -- Ngày sản xuất
  expiry_date DATE,                           -- Ngày hết hạn
  supplier VARCHAR(200),                      -- Nhà cung cấp
  
  -- Quantities (denormalized for performance)
  total_cones INTEGER DEFAULT 0,              -- Tổng số cuộn trong lô
  available_cones INTEGER DEFAULT 0,          -- Số cuộn còn available
  
  -- Status
  status VARCHAR(20) DEFAULT 'ACTIVE' 
    CHECK (status IN ('ACTIVE', 'DEPLETED', 'EXPIRED', 'QUARANTINE')),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link existing cones to lot
ALTER TABLE thread_inventory 
  ADD COLUMN lot_id INTEGER REFERENCES lots(id);

-- Index for lot lookup
CREATE INDEX idx_lots_lot_number ON lots(lot_number);
CREATE INDEX idx_lots_status ON lots(status);
CREATE INDEX idx_thread_inventory_lot_id ON thread_inventory(lot_id);
```

**Rationale:** 
- Tách lot thành entity riêng để quản lý lifecycle và metadata
- Giữ `lot_number` string trên cone cho backward compatibility
- `lot_id` FK cho join và batch operations
- Denormalized counts để UI không cần aggregate query

**Alternatives considered:**
- JSON metadata trên cone → Không query được, không normalize
- Chỉ dùng lot_number string → Không quản lý được lifecycle

### Decision 2: Batch Transaction Log

Ghi log tất cả thao tác batch để audit và truy xuất:

```sql
CREATE TYPE batch_operation_type AS ENUM (
  'RECEIVE',      -- Nhập kho
  'TRANSFER',     -- Chuyển kho
  'ISSUE',        -- Xuất kho
  'RETURN'        -- Trả lại
);

CREATE TABLE batch_transactions (
  id SERIAL PRIMARY KEY,
  operation_type batch_operation_type NOT NULL,
  
  -- Source/destination
  lot_id INTEGER REFERENCES lots(id),
  from_warehouse_id INTEGER REFERENCES warehouses(id),
  to_warehouse_id INTEGER REFERENCES warehouses(id),
  
  -- What was moved
  cone_ids INTEGER[] NOT NULL,                -- Array of cone IDs in batch
  cone_count INTEGER NOT NULL,
  
  -- Context
  reference_number VARCHAR(50),               -- PO number, DO number, etc.
  recipient VARCHAR(200),                     -- Người nhận (for ISSUE)
  notes TEXT,
  
  -- Audit
  performed_by VARCHAR(100),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_batch_transactions_lot ON batch_transactions(lot_id);
CREATE INDEX idx_batch_transactions_date ON batch_transactions(performed_at);
```

**Rationale:**
- Audit trail cho tất cả batch operations
- `cone_ids` array cho phép track chính xác cone nào trong mỗi thao tác
- Reference number để link với external documents (PO, DO)

### Decision 3: API Endpoints

```
POST /api/lots                    -- Tạo lô mới
GET  /api/lots                    -- Danh sách lô (filter by status, warehouse)
GET  /api/lots/:id                -- Chi tiết lô + cones
PATCH /api/lots/:id               -- Cập nhật metadata lô

POST /api/batch/receive           -- Nhập kho hàng loạt
POST /api/batch/transfer          -- Chuyển kho hàng loạt  
POST /api/batch/issue             -- Xuất kho hàng loạt

GET  /api/batch/transactions      -- Lịch sử thao tác batch
GET  /api/batch/transactions/:id  -- Chi tiết transaction
```

**Request format cho batch operations:**
```typescript
// Batch Receive
interface BatchReceiveRequest {
  lot_id?: number              // Existing lot, or create new
  lot_number?: string          // For new lot
  thread_type_id: number
  warehouse_id: number
  cone_ids: string[]           // Scanned/entered cone IDs
  production_date?: string
  expiry_date?: string
  supplier?: string
  notes?: string
}

// Batch Transfer
interface BatchTransferRequest {
  cone_ids?: number[]          // Specific cones
  lot_id?: number              // Or entire lot
  from_warehouse_id: number
  to_warehouse_id: number
  notes?: string
}

// Batch Issue
interface BatchIssueRequest {
  cone_ids?: number[]          // Specific cones
  lot_id?: number              // Or entire lot
  warehouse_id: number
  recipient: string            // Người nhận
  reference_number?: string    // Số phiếu xuất
  notes?: string
}
```

### Decision 4: Frontend Flow

**Batch Receive:**
1. Chọn warehouse đích
2. Chọn/tạo lot (nhập lot_number, thread_type, metadata)
3. Quét liên tục hoặc nhập danh sách cone_ids
4. Review danh sách → Xác nhận nhập kho

**Batch Transfer:**
1. Chọn warehouse nguồn
2. Chọn theo lot hoặc quét từng cone
3. Chọn warehouse đích
4. Review → Xác nhận chuyển

**Batch Issue:**
1. Chọn warehouse xuất
2. Chọn theo lot hoặc quét từng cone
3. Nhập thông tin người nhận, số phiếu
4. Review → Xác nhận xuất

**UI Components:**
- `LotSelector` - Dropdown chọn lot với search
- `BatchConeScanner` - Continuous scan with buffer list (reuse từ stocktake)
- `BatchOperationDialog` - Modal cho confirm batch operation
- `BatchTransactionHistory` - Lịch sử thao tác

### Decision 5: Lot Status Lifecycle

```
ACTIVE → DEPLETED (khi available_cones = 0)
ACTIVE → EXPIRED (khi quá expiry_date)
ACTIVE → QUARANTINE (manual, khi có vấn đề QC)
QUARANTINE → ACTIVE (manual, sau khi resolve)
```

**Trigger cho status update:**
- `DEPLETED`: Trigger khi cone cuối cùng xuất kho
- `EXPIRED`: Scheduled job hoặc check khi query
- `QUARANTINE`: Manual action qua API

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Denormalized counts out of sync | Recalculate on demand, periodic reconciliation job |
| Large batch operations slow | Chunked processing, background job cho >100 cones |
| Migration existing lot_number | Migration script tạo lot records từ existing distinct lot_number |
| cone_ids array grows large | Archive old transactions, limit query range |

## Migration Plan

1. **Create tables** - lots, batch_transactions (non-breaking)
2. **Add lot_id column** - nullable FK to thread_inventory
3. **Migrate existing data** - Create lot records từ distinct lot_number/thread_type combinations
4. **Update lot_id** - Link existing cones to newly created lots
5. **Deploy API** - New endpoints, keep existing endpoints unchanged
6. **Frontend rollout** - New pages/components, optional until stable

**Rollback:** Drop new tables và column. Existing lot_number string vẫn hoạt động.

## Open Questions

1. ~~Có cần approval workflow cho batch operations?~~ → Phase sau
2. ~~Có limit số cone per batch?~~ → 500 cones max per operation
3. Có cần print batch receiving receipt? → TBD với user
