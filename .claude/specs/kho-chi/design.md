# Thiết Kế Kỹ Thuật - Quản Lý Kho Chỉ

> **Phân loại:** Level 3 (Complex)
> **Phiên bản:** 1.0.0
> **Cập nhật lần cuối:** 2026-02-02

## 1. Kiến Trúc Tổng Quan

### 1.1 Data Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Supabase   │ ←── │  Hono API   │ ←── │   Service   │ ←── │  Composable │
│  (Database) │     │  (Backend)  │     │   Layer     │     │   (State)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   ↑
                                                            ┌─────────────┐
                                                            │  Vue Page   │
                                                            │ (Component) │
                                                            └─────────────┘
```

### 1.2 Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 + Quasar 2 + TypeScript |
| State Management | Vue Composables (reactive refs) |
| API Client | fetch with wrapper (fetchApi) |
| Backend | Hono (Node.js) + @hono/node-server |
| Database | Supabase (PostgreSQL) |
| Routing | unplugin-vue-router (file-based) |

---

## 2. Cấu Trúc Thư Mục

### 2.1 Frontend
```
src/
├── pages/
│   ├── kho.vue                     # Main warehouse hub
│   └── thread/
│       ├── inventory.vue           # Inventory list & receive
│       ├── stocktake.vue           # QR stocktake
│       ├── lots/
│       │   └── index.vue           # Lot management
│       ├── batch/
│       │   ├── receive.vue         # Batch receive wizard
│       │   ├── transfer.vue        # Batch transfer wizard
│       │   ├── issue.vue           # Batch issue wizard
│       │   └── history.vue         # Transaction history
│       └── mobile/
│           └── receive.vue         # Mobile receive page
├── components/
│   ├── ui/
│   │   └── inputs/
│   │       └── AppWarehouseSelect.vue   # Grouped warehouse selector
│   ├── thread/
│   │   ├── LotStatusBadge.vue
│   │   ├── LotFormDialog.vue
│   │   └── LotSelector.vue
│   ├── qr/
│   │   ├── QrScannerDialog.vue
│   │   ├── QrScannerStream.vue
│   │   └── QrPrintDialog.vue
│   └── offline/
│       ├── OfflineSyncBanner.vue
│       └── ConflictDialog.vue
├── composables/
│   ├── useWarehouses.ts            # Warehouse state & options
│   ├── useLots.ts                  # Lot management
│   ├── useBatchOperations.ts       # Batch receive/transfer/issue
│   └── thread/
│       └── useInventory.ts         # Inventory CRUD
├── services/
│   ├── warehouseService.ts         # Warehouse API client
│   ├── inventoryService.ts         # Inventory API client
│   └── api.ts                      # Base fetch wrapper
└── types/
    └── thread/
        ├── inventory.ts            # Cone, InventoryFilters, etc.
        ├── lot.ts                  # Lot types
        ├── batch.ts                # Batch operation types
        └── enums.ts                # ConeStatus, etc.
```

### 2.2 Backend
```
server/
├── index.ts                        # Hono app entry
├── routes/
│   ├── warehouses.ts               # Warehouse CRUD
│   ├── inventory.ts                # Inventory CRUD + stocktake
│   ├── batch.ts                    # Batch operations
│   └── lots.ts                     # Lot management
├── db/
│   └── supabase.ts                 # Supabase clients (anon + admin)
└── types/
    ├── thread.ts                   # Thread-related types
    └── batch.ts                    # Batch operation types
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram
```
┌─────────────────┐       ┌─────────────────┐
│   warehouses    │       │   thread_types  │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ code            │       │ code            │
│ name            │       │ name            │
│ location        │       │ color_code      │
│ parent_id (FK)──┼──┐    │ material        │
│ type            │  │    │ density_...     │
│ sort_order      │  │    │ meters_per_cone │
│ is_active       │  │    │ ...             │
│ created_at      │  │    └────────┬────────┘
│ updated_at      │  │             │
└───────┬─────────┘  │             │
        │            │             │
        │  ┌─────────┘             │
        │  │                       │
        ▼  ▼                       │
┌─────────────────┐       ┌────────▼────────┐
│ thread_inventory│       │      lots       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ cone_id (UQ)    │       │ lot_number (UQ) │
│ thread_type_id──┼───────┤ thread_type_id  │
│ warehouse_id────┼───┐   │ warehouse_id    │
│ quantity_cones  │   │   │ production_date │
│ quantity_meters │   │   │ expiry_date     │
│ weight_grams    │   │   │ supplier        │
│ is_partial      │   │   │ total_cones     │
│ status          │   │   │ available_cones │
│ lot_number      │   │   │ status          │
│ lot_id (FK)─────┼───┼───│ notes           │
│ expiry_date     │   │   │ created_at      │
│ received_date   │   │   │ updated_at      │
│ location        │   │   └─────────────────┘
│ created_at      │   │
│ updated_at      │   │
└────────┬────────┘   │
         │            │
         ▼            │
┌─────────────────────┼───────────────────┐
│   batch_transactions│                   │
├─────────────────────┴───────────────────┤
│ id (PK)                                 │
│ operation_type (RECEIVE|TRANSFER|...)   │
│ lot_id (FK) ────────────────────────────┤
│ from_warehouse_id (FK) ─────────────────┤
│ to_warehouse_id (FK) ───────────────────┤
│ cone_ids (int[])                        │
│ cone_count                              │
│ reference_number                        │
│ recipient                               │
│ notes                                   │
│ performed_by                            │
│ performed_at                            │
└─────────────────────────────────────────┘
```

### 3.2 Table: warehouses
```sql
CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  location TEXT,
  parent_id INTEGER REFERENCES warehouses(id),
  type VARCHAR(20) NOT NULL DEFAULT 'STORAGE' CHECK (type IN ('LOCATION', 'STORAGE')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 Table: thread_inventory
```sql
CREATE TABLE thread_inventory (
  id SERIAL PRIMARY KEY,
  cone_id VARCHAR(100) UNIQUE NOT NULL,
  thread_type_id INTEGER NOT NULL REFERENCES thread_types(id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  quantity_cones INTEGER DEFAULT 1,
  quantity_meters DECIMAL(10,2) NOT NULL,
  weight_grams DECIMAL(10,2),
  is_partial BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'RECEIVED',
  lot_number VARCHAR(100),
  lot_id INTEGER REFERENCES lots(id),
  expiry_date DATE,
  received_date DATE DEFAULT CURRENT_DATE,
  location VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_warehouse ON thread_inventory(warehouse_id);
CREATE INDEX idx_inventory_status ON thread_inventory(status);
CREATE INDEX idx_inventory_lot ON thread_inventory(lot_id);
CREATE INDEX idx_inventory_cone_id ON thread_inventory(cone_id);
```

### 3.4 Table: lots
```sql
CREATE TABLE lots (
  id SERIAL PRIMARY KEY,
  lot_number VARCHAR(100) UNIQUE NOT NULL,
  thread_type_id INTEGER NOT NULL REFERENCES thread_types(id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  production_date DATE,
  expiry_date DATE,
  supplier VARCHAR(255),
  total_cones INTEGER DEFAULT 0,
  available_cones INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DEPLETED', 'EXPIRED', 'QUARANTINE')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lots_status ON lots(status);
CREATE INDEX idx_lots_warehouse ON lots(warehouse_id);
```

### 3.5 Table: batch_transactions
```sql
CREATE TABLE batch_transactions (
  id SERIAL PRIMARY KEY,
  operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('RECEIVE', 'TRANSFER', 'ISSUE', 'RETURN')),
  lot_id INTEGER REFERENCES lots(id),
  from_warehouse_id INTEGER REFERENCES warehouses(id),
  to_warehouse_id INTEGER REFERENCES warehouses(id),
  cone_ids INTEGER[] NOT NULL,
  cone_count INTEGER NOT NULL,
  reference_number VARCHAR(100),
  recipient VARCHAR(255),
  notes TEXT,
  performed_by VARCHAR(255),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_type ON batch_transactions(operation_type);
CREATE INDEX idx_transactions_lot ON batch_transactions(lot_id);
CREATE INDEX idx_transactions_date ON batch_transactions(performed_at);
```

---

## 4. API Design

### 4.1 Warehouse Routes (server/routes/warehouses.ts)

```typescript
// GET /api/warehouses
// Query: format=flat|tree
// Returns: Warehouse[] or WarehouseTreeNode[]
// - flat (default): backward compatible list
// - tree: LOCATION nodes with children STORAGE

// GET /api/warehouses/locations
// Returns: Warehouse[] where type = 'LOCATION'

// GET /api/warehouses/storage
// Query: location_id (optional)
// Returns: Warehouse[] where type = 'STORAGE'
```

### 4.2 Inventory Routes (server/routes/inventory.ts)

```typescript
// GET /api/inventory
// Query: search, thread_type_id, warehouse_id, status, is_partial, limit
// Note: limit=0 triggers batch fetching

// GET /api/inventory/:id
// Returns single cone with joins

// GET /api/inventory/by-barcode/:coneId
// Lookup by cone_id string

// GET /api/inventory/by-warehouse/:warehouseId
// All cones in warehouse (for stocktake)

// GET /api/inventory/available/summary
// Aggregated stats

// POST /api/inventory/receive
// Body: ReceiveStockDTO
// Creates cones with auto-generated cone_ids

// POST /api/inventory/stocktake
// Body: StocktakeDTO
// Returns StocktakeResult with comparison
```

### 4.3 Batch Routes (server/routes/batch.ts)

```typescript
// POST /api/batch/receive
// Body: BatchReceiveRequest
// - Creates lot if lot_number provided and not exists
// - Validates no duplicate cone_ids
// - Creates cone records
// - Logs transaction

// POST /api/batch/transfer
// Body: BatchTransferRequest
// - Validates source warehouse and status
// - Updates warehouse_id for cones
// - Logs transaction

// POST /api/batch/issue
// Body: BatchIssueRequest
// - Validates AVAILABLE status
// - Updates status to HARD_ALLOCATED
// - Logs transaction with recipient

// POST /api/batch/return
// Body: BatchReturnRequest
// - Updates status to AVAILABLE
// - Logs transaction

// GET /api/batch/transactions
// Query: operation_type, lot_id, warehouse_id, from_date, to_date
// Joins: lot, from_warehouse, to_warehouse

// GET /api/batch/transactions/:id
// Returns transaction detail
```

### 4.4 Lot Routes (server/routes/lots.ts)

```typescript
// GET /api/lots
// Query: status, warehouse_id, thread_type_id, search

// GET /api/lots/:id
// With thread_type and warehouse joins

// POST /api/lots
// Body: CreateLotRequest
// Validates unique lot_number

// PATCH /api/lots/:id
// Body: UpdateLotRequest
// Partial update

// GET /api/lots/:id/cones
// All cones belonging to lot

// GET /api/lots/:id/transactions
// Transaction history for lot
```

---

## 5. Component Architecture

### 5.1 Page Components

#### kho.vue (Hub Page)
```vue
<template>
  <q-page padding>
    <PageHeader title="Quản lý Kho" />
    <div class="row q-col-gutter-md">
      <div v-for="module in threadModules" class="col-12 col-sm-6 col-md-4">
        <AppCard>
          <router-link :to="module.to">
            <!-- icon, title, description -->
          </router-link>
        </AppCard>
      </div>
    </div>
  </q-page>
</template>
```

#### batch/receive.vue (Stepper Wizard)
```
Step 1: Chọn Kho (AppWarehouseSelect)
Step 2: Lô Hàng (existing lot OR create new)
Step 3: Quét Cuộn (QrScannerStream + manual input)
Step 4: Xác Nhận (review + submit)
```

#### stocktake.vue
```
┌─────────────────────────────────────────┐
│ Header: Warehouse Select + Actions      │
├────────────────────┬────────────────────┤
│ Scanner Panel      │ Scanned List       │
│ - QrScannerStream  │ - realtime updates │
│ - Stats chips      │ - remove items     │
├────────────────────┴────────────────────┤
│ Comparison Results (when shown)         │
│ - In DB / Matched / Missing / Extra     │
│ - Export CSV / Complete buttons         │
└─────────────────────────────────────────┘
```

### 5.2 Reusable Components

#### AppWarehouseSelect
```vue
<script setup>
// Props
defineProps<{
  modelValue: number | null
  label?: string
  required?: boolean
  storageOnly?: boolean
}>()

// Uses grouped options with LOCATION as disabled headers
// Indented STORAGE under parent LOCATION
</script>
```

#### LotSelector
```vue
<script setup>
// Props
defineProps<{
  modelValue: number | null
  warehouseId?: number  // Filter by warehouse
  label?: string
}>()

// Emits: lot-selected with full Lot object
</script>
```

---

## 6. Composable Architecture

### 6.1 useWarehouses

```typescript
export function useWarehouses() {
  const warehouses = ref<Warehouse[]>([])
  const warehouseTree = ref<WarehouseTreeNode[]>([])
  const loading = ref(false)

  // Computed
  const locations = computed(() => warehouses.value.filter(w => w.type === 'LOCATION'))
  const storageWarehouses = computed(() => warehouses.value.filter(w => w.type === 'STORAGE'))
  const warehouseOptions = computed(() => /* select options format */)
  const groupedWarehouseOptions = computed(() => /* with disabled LOCATION headers */)

  // Methods
  async function fetchWarehouses() { /* GET /api/warehouses */ }
  async function fetchWarehouseTree() { /* GET /api/warehouses?format=tree */ }
  function getWarehouseById(id: number) { /* lookup */ }
  function getLocationName(warehouseId: number) { /* get parent LOCATION name */ }
  function getStoragesForLocation(locationId: number) { /* filter by parent */ }

  return {
    warehouses, warehouseTree, loading,
    locations, storageWarehouses,
    warehouseOptions, groupedWarehouseOptions,
    fetchWarehouses, fetchWarehouseTree,
    getWarehouseById, getLocationName, getStoragesForLocation
  }
}
```

### 6.2 useBatchOperations

```typescript
export function useBatchOperations() {
  // Cone buffer for scanning
  const coneBuffer = ref<string[]>([])
  const loading = ref(false)
  const lastResult = ref<BatchOperationResult | null>(null)
  const transactions = ref<BatchTransaction[]>([])

  // Computed
  const bufferCount = computed(() => coneBuffer.value.length)
  const hasBuffer = computed(() => coneBuffer.value.length > 0)

  // Buffer methods
  function addToBuffer(coneId: string) { /* with duplicate check */ }
  function addMultipleToBuffer(ids: string[]) { /* bulk add */ }
  function removeFromBuffer(coneId: string) { /* remove */ }
  function clearBuffer() { /* clear all */ }
  function parseInput(input: string) { /* split by comma/newline */ }

  // API methods
  async function batchReceive(request: BatchReceiveRequest) { /* POST /api/batch/receive */ }
  async function batchTransfer(request: BatchTransferRequest) { /* POST /api/batch/transfer */ }
  async function batchIssue(request: BatchIssueRequest) { /* POST /api/batch/issue */ }
  async function batchReturn(request: BatchReturnRequest) { /* POST /api/batch/return */ }
  async function fetchTransactions(filters?: TransactionFilters) { /* GET /api/batch/transactions */ }

  return {
    coneBuffer, bufferCount, hasBuffer, loading, lastResult, transactions,
    addToBuffer, addMultipleToBuffer, removeFromBuffer, clearBuffer, parseInput,
    batchReceive, batchTransfer, batchIssue, batchReturn, fetchTransactions
  }
}
```

### 6.3 useLots

```typescript
export function useLots() {
  const lots = ref<Lot[]>([])
  const currentLot = ref<Lot | null>(null)
  const currentCones = ref<Cone[]>([])
  const loading = ref(false)

  async function fetchLots(filters?: LotFilters) { /* GET /api/lots */ }
  async function fetchLot(id: number) { /* GET /api/lots/:id */ }
  async function createLot(data: CreateLotRequest) { /* POST /api/lots */ }
  async function updateLot(id: number, data: UpdateLotRequest) { /* PATCH /api/lots/:id */ }
  async function fetchLotCones(id: number) { /* GET /api/lots/:id/cones */ }
  async function quarantineLot(id: number) { /* PATCH status=QUARANTINE */ }
  async function releaseLot(id: number) { /* PATCH status=ACTIVE */ }

  return {
    lots, currentLot, currentCones, loading,
    fetchLots, fetchLot, createLot, updateLot,
    fetchLotCones, quarantineLot, releaseLot
  }
}
```

---

## 7. Service Layer

### 7.1 warehouseService.ts

```typescript
export const warehouseService = {
  async getAll(): Promise<Warehouse[]> {
    const response = await fetchApi<ApiResponse<Warehouse[]>>('/api/warehouses')
    return response.data || []
  },

  async getTree(): Promise<WarehouseTreeNode[]> {
    const response = await fetchApi<ApiResponse<WarehouseTreeNode[]>>(
      '/api/warehouses?format=tree'
    )
    return response.data || []
  },

  async getStorageOnly(locationId?: number): Promise<Warehouse[]> {
    const url = locationId
      ? `/api/warehouses/storage?location_id=${locationId}`
      : '/api/warehouses/storage'
    const response = await fetchApi<ApiResponse<Warehouse[]>>(url)
    return response.data || []
  },

  async getLocations(): Promise<Warehouse[]> {
    const response = await fetchApi<ApiResponse<Warehouse[]>>('/api/warehouses/locations')
    return response.data || []
  }
}
```

### 7.2 inventoryService.ts

```typescript
export const inventoryService = {
  async getAll(filters?: InventoryFilters): Promise<ApiResponse<Cone[]>> {
    const params = new URLSearchParams()
    // Build query params from filters
    if (filters?.limit === 0) params.set('limit', '0')  // Batch fetch
    return fetchApi<ApiResponse<Cone[]>>(`/api/inventory?${params}`)
  },

  async getById(id: number): Promise<ApiResponse<Cone>> {
    return fetchApi<ApiResponse<Cone>>(`/api/inventory/${id}`)
  },

  async getByBarcode(coneId: string): Promise<ApiResponse<Cone>> {
    return fetchApi<ApiResponse<Cone>>(`/api/inventory/by-barcode/${encodeURIComponent(coneId)}`)
  },

  async getByWarehouse(warehouseId: number): Promise<ApiResponse<Partial<Cone>[]>> {
    return fetchApi<ApiResponse<Partial<Cone>[]>>(
      `/api/inventory/by-warehouse/${warehouseId}`
    )
  },

  async receiveStock(data: ReceiveStockDTO): Promise<ApiResponse<Cone[]>> {
    return fetchApi<ApiResponse<Cone[]>>('/api/inventory/receive', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  async saveStocktake(
    warehouseId: number,
    scannedConeIds: string[],
    notes?: string
  ): Promise<ApiResponse<StocktakeResult>> {
    return fetchApi<ApiResponse<StocktakeResult>>('/api/inventory/stocktake', {
      method: 'POST',
      body: JSON.stringify({
        warehouse_id: warehouseId,
        scanned_cone_ids: scannedConeIds,
        notes
      })
    })
  }
}
```

---

## 8. State Flow Diagrams

### 8.1 Batch Receive Flow
```
┌──────────────────┐
│ Select Warehouse │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Select/Create Lot│──┐
└────────┬─────────┘  │ If new lot
         ▼            ▼
┌──────────────────┐ ┌──────────────────┐
│ Scan/Enter Cones │ │ Create Lot (API) │
│ - QR Scanner     │ └────────┬─────────┘
│ - Manual Input   │◄─────────┘
│ - Buffer display │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Review & Confirm │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ POST /batch/rec  │
│ - Check dupes    │
│ - Insert cones   │
│ - Update lot cnt │
│ - Log transaction│
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Success Dialog   │
│ - Print labels   │
│ - Continue       │
└──────────────────┘
```

### 8.2 Stocktake Flow
```
┌──────────────────┐
│ Select Warehouse │
└────────┬─────────┘
         ▼
┌──────────────────┐    ┌──────────────────┐
│ Load DB Cones    │───▶│ warehouseCones   │
│ (Map<coneId,Cone>│    │ (for comparison) │
└────────┬─────────┘    └──────────────────┘
         ▼
┌──────────────────┐
│ Start Scanning   │◄──┐
└────────┬─────────┘   │
         ▼             │
┌──────────────────┐   │
│ On QR Detect     │   │
│ - Check in Map   │   │
│ - Add to list    │   │
│ - Show feedback  │   │
│ - Save session   │───┘
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Compare Results  │
│ - Matched        │
│ - Missing        │
│ - Extra          │
│ - Match Rate     │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Export CSV OR    │
│ POST stocktake   │
│ Clear session    │
└──────────────────┘
```

---

## 9. Mobile & Offline Architecture

### 9.1 Mobile Receive Page
```
┌────────────────────────────────────┐
│ OfflineSyncBanner (if has queue)   │
├────────────────────────────────────┤
│ Scan Thread Type Code              │
│ ┌────────────────────────────────┐ │
│ │ [Input] [Search]               │ │
│ └────────────────────────────────┘ │
├────────────────────────────────────┤
│ Selected: [Color] Thread Name      │
│           Code: XXX                │
├────────────────────────────────────┤
│ Quantity                           │
│       [-]  [   5   ]  [+]          │
├────────────────────────────────────┤
│ Weight (Optional)                  │
│ [Connect Scale] OR [Manual Entry]  │
│         [1234 g] [Stable]          │
├────────────────────────────────────┤
│ [Warehouse ▼] [Location: ____]     │
├────────────────────────────────────┤
│ [      Nhập 5 Cuộn       ]         │
└────────────────────────────────────┘
```

### 9.2 Offline Operation Flow
```typescript
// useOfflineOperation composable
async function execute(options: {
  type: 'stock_receipt' | 'transfer' | 'issue'
  onlineExecutor: () => Promise<any>
  payload: any
  successMessage: string
  queuedMessage: string
}) {
  if (navigator.onLine) {
    // Execute immediately
    const result = await options.onlineExecutor()
    return { success: true, data: result }
  } else {
    // Queue for later sync
    await queueOperation({
      type: options.type,
      payload: options.payload,
      timestamp: Date.now()
    })
    return { success: false, queued: true }
  }
}

// On reconnect
async function syncQueuedOperations() {
  const queue = getQueue()
  for (const op of queue) {
    try {
      await executeOperation(op)
      removeFromQueue(op.id)
    } catch (error) {
      if (isConflict(error)) {
        addToConflicts(op)
      }
    }
  }
}
```

---

## 10. Error Handling

### 10.1 API Error Responses
```typescript
// All API responses use standard format
interface ApiResponse<T> {
  data: T | null
  error: string | null  // Vietnamese error message
  message?: string      // Vietnamese success message
}

// HTTP Status Codes
// 200 - Success
// 201 - Created
// 400 - Bad Request (validation error)
// 404 - Not Found
// 409 - Conflict (duplicate)
// 500 - Server Error
```

### 10.2 Common Error Messages
```typescript
const errorMessages = {
  // Validation
  'MISSING_FIELDS': 'Thiếu thông tin bắt buộc',
  'INVALID_WAREHOUSE': 'Kho không hợp lệ',
  'SAME_WAREHOUSE': 'Kho nguồn và kho đích không được trùng nhau',

  // Duplicates
  'DUPLICATE_CONE_ID': 'Mã cuộn đã tồn tại',
  'DUPLICATE_LOT_NUMBER': 'Mã lô đã tồn tại',

  // Status
  'INVALID_STATUS': 'Cuộn không hợp lệ để thao tác',
  'NOT_AVAILABLE': 'Cuộn không khả dụng để xuất',

  // Limits
  'BATCH_LIMIT_EXCEEDED': 'Vượt quá giới hạn 500 cuộn mỗi lần',

  // System
  'DATABASE_ERROR': 'Lỗi khi truy vấn database',
  'SYSTEM_ERROR': 'Lỗi hệ thống'
}
```

---

## 11. Performance Considerations

### 11.1 Batch Fetching
```typescript
// server/routes/inventory.ts
if (limit === '0') {
  const allData: ConeRow[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('thread_inventory')
      .select('*')
      .range(offset, offset + BATCH_SIZE - 1)

    if (data && data.length > 0) {
      allData.push(...data)
      offset += BATCH_SIZE
      hasMore = data.length === BATCH_SIZE
    } else {
      hasMore = false
    }
  }

  return c.json({ data: allData, error: null })
}
```

### 11.2 Indexes
- `idx_inventory_warehouse` - Filter by warehouse
- `idx_inventory_status` - Filter by status
- `idx_inventory_lot` - Filter by lot
- `idx_inventory_cone_id` - Lookup by barcode
- `idx_lots_status` - Filter active lots
- `idx_transactions_date` - Sort by date

### 11.3 QR Scanning Optimization
- Use `QrScannerStream` with 60fps video
- Debounce same code detection (500ms)
- Audio/haptic feedback for responsiveness
- Local buffer update before API call
