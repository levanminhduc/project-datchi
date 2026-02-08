## Context

Trang tính toán hiện tại (`src/pages/thread/calculation/index.vue`) cho phep tinh dinh muc chi cho **1 ma hang** (style mode) hoac **1 don hang** (PO mode) tai mot thoi diem. Phong Ke Hoach thuc te dat hang chi theo **tuan hang** - moi tuan gom nhieu ma hang, moi ma hang co nhieu mau, can tinh gop tong luong chi can dat.

### Existing infrastructure that we reuse

| Asset | Location | What it provides |
|-------|----------|-----------------|
| Calculation API | `server/routes/threadCalculation.ts` POST `/api/thread-calculation/calculate` | Tinh dinh muc cho 1 style voi `color_breakdown` optional |
| CalculationResult type | `src/types/thread/threadCalculation.ts` | `CalculationResult`, `CalculationItem`, `ColorCalculationResult` |
| threadCalculationService | `src/services/threadCalculationService.ts` | `calculate(input)` goi API, tra ve `CalculationResult` |
| useStyles composable | `src/composables/thread/useStyles.ts` | `styles`, `fetchStyles()` - lay danh sach ma hang |
| useColors composable | `src/composables/thread/useColors.ts` | `colors`, `fetchColors()`, `activeColors` - lay danh sach mau |
| allocationService | `src/services/allocationService.ts` | `create(dto: CreateAllocationDTO)` - tao phieu phan bo |
| CreateAllocationDTO | `src/types/thread/allocation.ts` | `order_id`, `thread_type_id`, `requested_meters`, `priority`, `notes` |
| Sidebar nav | `src/composables/useSidebar.ts` | "Ke Hoach" group da co "Tinh Toan Chi" |

### Data model context

```
styles (id, style_code, style_name)
  └── style_thread_specs (id, style_id, supplier_id, process_name, tex_id, meters_per_unit)
        └── style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id)
              ├── colors (id, name, hex_code)
              └── thread_types (id, name, tex_number, meters_per_cone, color, color_code, supplier_id)
```

API `calculate` nhan `{ style_id, quantity, color_breakdown?: [{ color_id, quantity }] }` va tra ve `CalculationResult` voi `calculations[].color_breakdown[]` chua `thread_type_id`, `thread_type_name`, `total_meters` cho tung mau.

### What's missing

- Khong co cach chon nhieu ma hang + nhieu mau cung luc
- Khong co lich su dat hang chi (tuan hang nao, da dat gi)
- Khong co view tong hop gom nhieu style

## Goals / Non-Goals

**Goals:**
- Tao trang moi cho phep chon nhieu ma hang, moi ma hang chon nhieu mau voi so luong rieng
- Tinh toan gop multi-style bang cach goi API hien co nhieu lan, gom ket qua
- Hien thi ket qua 2 dang: chi tiet per-style va tong hop (gom theo thread_type)
- Luu lich su tuan hang vao DB moi (thread_order_weeks + thread_order_items)
- Luu ket qua tinh toan (JSONB) de tra cuu lai khong can tinh lai
- Tao phieu phan bo (allocation) tu ket qua tinh toan
- Nut Export Excel (placeholder UI, chua co chuc nang)

**Non-Goals:**
- Chuc nang export Excel thuc te (giai doan sau)
- Workflow duyet don dat hang
- Tich hop ERP ben ngoai
- Thay the trang tinh toan hien tai (`/thread/calculation` giu nguyen)
- Batch API endpoint moi (dung strategy goi API nhieu lan truoc)

## Decisions

### 1. Page location and routing

Trang moi dat tai `src/pages/thread/weekly-order/index.vue` -> route `/thread/weekly-order`.

Them vao sidebar trong group "Ke Hoach" (file `src/composables/useSidebar.ts`):

```typescript
{ label: 'Dat Hang Chi Tuan', icon: 'o_shopping_cart', to: '/thread/weekly-order' }
```

Ly do: Tach biet voi trang calculation hien tai. "weekly-order" mo ta ro chuc nang dat hang theo tuan, khong trung voi "calculation" la tinh toan don le.

### 2. Database schema

Hai bang moi, mot bang optional cho cache ket qua:

```sql
-- Bang tuan hang
CREATE TABLE thread_order_weeks (
    id SERIAL PRIMARY KEY,
    week_name VARCHAR(50) NOT NULL,              -- VD: "Tuan 06/2026"
    start_date DATE,                              -- Ngay bat dau tuan
    end_date DATE,                                -- Ngay ket thuc tuan
    status VARCHAR(20) DEFAULT 'draft',           -- draft | confirmed | cancelled
    notes TEXT,
    created_by VARCHAR(50),                       -- employee_id cua nguoi tao
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bang chi tiet dong dat hang (style + mau + so luong)
CREATE TABLE thread_order_items (
    id SERIAL PRIMARY KEY,
    week_id INTEGER NOT NULL REFERENCES thread_order_weeks(id) ON DELETE CASCADE,
    style_id INTEGER NOT NULL REFERENCES styles(id) ON DELETE RESTRICT,
    color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(week_id, style_id, color_id)           -- Mot mau trong 1 style chi xuat hien 1 lan moi tuan
);

-- Bang cache ket qua tinh toan (optional, tranh tinh lai)
CREATE TABLE thread_order_results (
    id SERIAL PRIMARY KEY,
    week_id INTEGER NOT NULL REFERENCES thread_order_weeks(id) ON DELETE CASCADE,
    calculation_data JSONB NOT NULL,               -- Toan bo ket qua CalculationResult[]
    summary_data JSONB NOT NULL,                   -- Ket qua da gom nhom (aggregated summary)
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(week_id)                                -- 1 tuan chi co 1 ket qua moi nhat
);
```

Ly do:
- `thread_order_weeks` don gian, chi can ten tuan va trang thai. Khong can relationship phuc tap.
- `thread_order_items` luu chi tiet: moi dong la 1 cap (style_id, color_id, quantity). UNIQUE constraint dam bao khong trung.
- `thread_order_results` luu JSONB de user xem lai lich su ma khong can tinh lai. Khi user nhan "Tinh toan" lai thi ghi de.
- Status don gian: `draft` (dang soan), `confirmed` (da xac nhan), `cancelled` (huy). Khong can workflow duyet phuc tap.

### 3. Calculation strategy: call existing API per style

**Quyet dinh:** Goi `/api/thread-calculation/calculate` nhieu lan (1 lan cho moi style), truyen `color_breakdown` cho tung style. Gom ket qua tren frontend.

Ly do:
- API hien tai da ho tro `color_breakdown` day du, logic da duoc kiem chung
- Khong can viet/test batch endpoint moi
- So luong style moi tuan thuong 5-15, khong qua nhieu
- Co the goi `Promise.allSettled()` de song song hoa

Cach goi:

```typescript
// Voi moi style da chon, tao 1 request
const requests = selectedStyles.map(style => {
  const colorBreakdown = style.colors.map(c => ({
    color_id: c.color_id,
    quantity: c.quantity,
  }))
  return threadCalculationService.calculate({
    style_id: style.style_id,
    quantity: colorBreakdown.reduce((sum, c) => sum + c.quantity, 0),
    color_breakdown: colorBreakdown,
  })
})

const results = await Promise.allSettled(requests)
```

### 4. Frontend aggregation logic

Sau khi co `CalculationResult[]` cho tung style, gom ket qua thanh bang tong hop:

```typescript
interface AggregatedRow {
  thread_type_id: number
  thread_type_name: string
  supplier_name: string
  tex_number: string
  total_meters: number
  total_cones: number     // Math.ceil(total_meters / meters_per_cone)
  meters_per_cone: number | null
  thread_color: string | null
  thread_color_code: string | null
}
```

Grouping key: `thread_type_id` (so, duy nhat). Khong dung `thread_type_name` lam key vi co the bi trung ten nhung khac id.

Logic gom:
1. Duyet qua moi `CalculationResult.calculations[].color_breakdown[]`
2. Group theo `thread_type_id`
3. Cong don `total_meters`
4. Tinh `total_cones = Math.ceil(tong_meters / meters_per_cone)`

Ly do dung `thread_type_id`: Thread types la bang master data co id duy nhat. Moi thread_type da bao gom thong tin NCC + Tex + Mau chi. Khi 2 style khac nhau cung can cung 1 thread_type thi se duoc gom lai thanh 1 dong.

### 5. State management: new composable `useWeeklyOrder`

File: `src/composables/thread/useWeeklyOrder.ts`

State chinh:

```typescript
interface StyleOrderEntry {
  style_id: number
  style_code: string
  style_name: string
  colors: Array<{
    color_id: number
    color_name: string
    hex_code: string
    quantity: number
  }>
}

interface WeeklyOrderState {
  // Week info
  weekName: string              // VD: "Tuan 06/2026"
  startDate: string | null
  endDate: string | null
  notes: string

  // Style selections
  orderEntries: StyleOrderEntry[]

  // Results
  perStyleResults: CalculationResult[]
  aggregatedResults: AggregatedRow[]

  // Loading
  isCalculating: boolean
  isSaving: boolean
}
```

Composable cung cap:
- `addStyle(styleId)` - them 1 style vao danh sach
- `removeStyle(styleId)` - xoa 1 style
- `addColorToStyle(styleId, colorId)` - them mau vao style
- `removeColorFromStyle(styleId, colorId)` - xoa mau
- `updateColorQuantity(styleId, colorId, qty)` - cap nhat so luong
- `calculateAll()` - goi API cho tung style, gom ket qua
- `saveWeek()` - luu tuan hang vao DB
- `loadWeek(weekId)` - tai tuan hang da luu
- `clearAll()` - xoa toan bo

### 6. Component structure

```
src/pages/thread/weekly-order/
  index.vue                     -- Trang chinh

src/components/thread/weekly-order/
  WeekInfoCard.vue              -- Form nhap ten tuan, ngay, ghi chu
  StyleSelector.vue             -- Dropdown chon style, nut them
  StyleOrderCard.vue            -- 1 card cho 1 style: hien thi mau da chon, them mau, nhap so luong
  ColorChipSelector.vue         -- Multi-select mau bang chips (checkbox list hoac autocomplete)
  ResultsDetailView.vue         -- Hien thi ket qua per-style (nhieu card giong trang calculation hien tai)
  ResultsSummaryTable.vue       -- Bang tong hop gom theo thread_type
  WeekHistoryDialog.vue         -- Dialog xem lich su tuan hang da luu
```

**index.vue** layout:

```
+------------------------------------------+
| PageHeader: "Dat Hang Chi Theo Tuan"     |
+------------------------------------------+
| WeekInfoCard                              |
|   [Ten tuan] [Ngay BD] [Ngay KT] [Notes] |
+------------------------------------------+
| StyleSelector + [Them ma hang]            |
+------------------------------------------+
| StyleOrderCard (style A)                  |
|   Mau chips: [Do x200] [Xanh x150] [+]  |
| StyleOrderCard (style B)                  |
|   Mau chips: [Trang x300] [+]            |
+------------------------------------------+
| [Tinh toan]  [Luu]  [Lich su]  [Export]  |
+------------------------------------------+
| Tab: [Chi tiet] [Tong hop]               |
|   ResultsDetailView hoac                 |
|   ResultsSummaryTable                     |
+------------------------------------------+
| [Tao phieu phan bo]                      |
+------------------------------------------+
```

### 7. Backend API endpoints

File: `server/routes/weeklyOrder.ts`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/weekly-orders` | Lay danh sach tuan hang (phan trang, loc status) |
| GET | `/api/weekly-orders/:id` | Lay chi tiet 1 tuan hang (items + results) |
| POST | `/api/weekly-orders` | Tao tuan hang moi (week info + items) |
| PUT | `/api/weekly-orders/:id` | Cap nhat tuan hang (week info + items) |
| DELETE | `/api/weekly-orders/:id` | Xoa tuan hang (chi khi status = draft) |
| POST | `/api/weekly-orders/:id/results` | Luu ket qua tinh toan (JSONB) |
| PATCH | `/api/weekly-orders/:id/status` | Doi trang thai (draft -> confirmed, confirmed -> cancelled) |

Dang ky route trong `server/index.ts`:

```typescript
import weeklyOrder from './routes/weeklyOrder'
app.route('/api/weekly-orders', weeklyOrder)
```

### 8. Frontend service

File: `src/services/weeklyOrderService.ts`

Theo pattern giong `allocationService.ts`: dung `fetchApi`, throw Error neu co loi.

### 9. Type definitions

File: `src/types/thread/weeklyOrder.ts`

```typescript
export interface ThreadOrderWeek {
  id: number
  week_name: string
  start_date: string | null
  end_date: string | null
  status: 'draft' | 'confirmed' | 'cancelled'
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  items?: ThreadOrderItem[]
}

export interface ThreadOrderItem {
  id: number
  week_id: number
  style_id: number
  color_id: number
  quantity: number
  created_at: string
  // Joined
  style?: { id: number; style_code: string; style_name: string }
  color?: { id: number; name: string; hex_code: string }
}

export interface CreateWeeklyOrderDTO {
  week_name: string
  start_date?: string
  end_date?: string
  notes?: string
  items: Array<{
    style_id: number
    color_id: number
    quantity: number
  }>
}

export interface UpdateWeeklyOrderDTO {
  week_name?: string
  start_date?: string
  end_date?: string
  notes?: string
  items?: Array<{
    style_id: number
    color_id: number
    quantity: number
  }>
}

export interface WeeklyOrderResults {
  calculation_data: CalculationResult[]
  summary_data: AggregatedRow[]
  calculated_at: string
}

export interface AggregatedRow {
  thread_type_id: number
  thread_type_name: string
  supplier_name: string
  tex_number: string
  total_meters: number
  total_cones: number
  meters_per_cone: number | null
  thread_color: string | null
  thread_color_code: string | null
}
```

Export tu `src/types/thread/index.ts`.

### 10. Allocation creation from results

Tan dung pattern hien co trong calculation page. Tu `aggregatedResults` hoac `perStyleResults`, tao `CreateAllocationDTO` cho tung dong co `color_breakdown`:

```typescript
const dto: CreateAllocationDTO = {
  order_id: weekName,                    // VD: "Tuan 06/2026"
  order_reference: `${styleName} - ${colorName}`,
  thread_type_id: row.thread_type_id,
  requested_meters: row.total_meters,
  priority: AllocationPriority.NORMAL,
  notes: `Dat hang chi tuan - ${weekName}`,
}
await allocationService.create(dto)
```

User co the chon tao allocation tu view chi tiet (per-style) hoac view tong hop. Hien dialog xac nhan giong calculation page hien tai.

### 11. Export Excel placeholder

Nut "Export Excel" hien thi voi `disable` state va tooltip "Chuc nang dang phat trien". Khi click khong lam gi. Dat icon `o_file_download`. Giai doan sau se implement bang thu vien `xlsx` hoac `exceljs`.

## Risks / Trade-offs

### 1. Multiple API calls co the cham (Medium)

Goi 1 API call moi style. Neu 15 style -> 15 calls.

**Mitigation:**
- Dung `Promise.allSettled()` de goi song song
- Hien progress bar/counter ("Dang tinh 5/15 ma hang...")
- Moi call hien tai mat ~100-200ms (chi query DB), 15 calls song song ~500ms tong
- Neu can toi uu sau: tao batch endpoint `/api/thread-calculation/calculate-batch`

### 2. Frontend aggregation logic can test ky (Low-Medium)

Grouping theo `thread_type_id` phai chinh xac. Neu thread_type_id null (edge case khi tex_id = null) thi can xu ly rieng.

**Mitigation:**
- Dung `thread_type_id` lam key (numeric, duy nhat)
- Filter bo cac dong khong co `thread_type_id` truoc khi aggregate
- Test voi du lieu co nhieu style dung chung thread_type

### 3. JSONB results co the lon (Low)

Neu 1 tuan co 20 styles x 10 mau x 5 cong doan = 1000 dong ket qua. JSONB ~50-100KB, PostgreSQL xu ly tot.

**Mitigation:**
- JSONB cho phep query linh hoat neu can
- Chi luu 1 ban ket qua moi nhat per week (UNIQUE constraint)
- Pagination tren danh sach tuan hang

### 4. Khong co conflict detection giua cac tuan (Low)

2 tuan khac nhau co the dat cung loai chi. Hien tai khong check overlap.

**Mitigation:**
- Giai doan dau chap nhan, vi allocation system da co conflict detection rieng
- Sau nay co the them warning khi thread_type da duoc dat trong tuan khac

### 5. UX: nhieu thao tac truoc khi thay ket qua (Medium)

User phai: (1) chon style, (2) chon mau, (3) nhap so luong, (4) nhan tinh toan. Nhieu buoc.

**Mitigation:**
- StyleOrderCard hien thi compact voi color chips, so luong inline
- Auto-suggest ten tuan tu ngay hien tai (VD: "Tuan 06/2026")
- Cho phep luu draft de quay lai tiep tuc sau
- Load week da luu de sua va tinh lai
