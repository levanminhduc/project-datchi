## Context

Hệ thống quản lý kho chỉ (Thread Warehouse Management) hiện có bảng `warehouses` với cấu trúc phẳng:
- `id`, `code`, `name`, `location`, `is_active`, timestamps

**Cấu trúc thực tế của công ty:**
```
CÔNG TY
├── ĐIỆN BÀN (Kho sở hữu)
│   ├── Kho Dệt Kim (xưởng sản xuất)
│   ├── Kho Xưởng Nhật (xưởng sản xuất)
│   └── Kho Xưởng Trước (xưởng sản xuất)
│
└── PHÚ TƯỜNG (Kho thuê)
    └── Kho Phú Tường (kho duy nhất)
```

**Constraints:**
- Backward compatible: `warehouse_id` trong `thread_inventory`, `thread_allocations` vẫn hoạt động
- Chỉ 2 cấp: LOCATION → STORAGE (không cần recursive tree phức tạp)
- Tương lai: Có thể đóng Phú Tường và dồn về Điện Bàn

## Goals / Non-Goals

**Goals:**
- Thêm cấu trúc phân cấp 2 level vào bảng warehouses
- API trả về cả flat list (backward compatible) và tree structure
- UI selector hiển thị grouped hoặc indented
- Báo cáo có thể group theo LOCATION

**Non-Goals:**
- Không xây dựng recursive tree sâu hơn 2 cấp
- Không thay đổi logic nhập/xuất/phân bổ hiện tại
- Không thêm permissions/access control theo kho (phase sau)

## Decisions

### Decision 1: Schema Changes

**Thêm 3 cột vào bảng `warehouses`:**

```sql
ALTER TABLE warehouses 
  ADD COLUMN parent_id INTEGER REFERENCES warehouses(id),
  ADD COLUMN type VARCHAR(20) DEFAULT 'STORAGE' CHECK (type IN ('LOCATION', 'STORAGE')),
  ADD COLUMN sort_order INTEGER DEFAULT 0;

CREATE INDEX idx_warehouses_parent ON warehouses(parent_id);
CREATE INDEX idx_warehouses_type ON warehouses(type);
```

**Rationale:** Self-referencing FK là pattern chuẩn cho tree structure. `type` enum đơn giản vì chỉ có 2 loại. `sort_order` cho phép sắp xếp tùy ý.

**Alternatives considered:**
- Separate `locations` table → Rejected: Thêm complexity, phải join nhiều
- Closure table → Rejected: Overkill cho 2 cấp

### Decision 2: API Response Format

**Option A (Chosen): Dual format với query param**

```typescript
// GET /api/warehouses - Flat list (backward compatible)
// GET /api/warehouses?format=tree - Tree structure

interface WarehouseWithHierarchy extends Warehouse {
  parent_id: number | null
  type: 'LOCATION' | 'STORAGE'
  sort_order: number
  children?: WarehouseWithHierarchy[]  // Only in tree format
}
```

**Rationale:** Không breaking change cho existing code. Frontend mới dùng `?format=tree`.

### Decision 3: Seed Data

```sql
-- Locations (parent_id = NULL)
INSERT INTO warehouses (code, name, type, parent_id, sort_order) VALUES
('DB', 'Điện Bàn', 'LOCATION', NULL, 1),
('PT', 'Phú Tường', 'LOCATION', NULL, 2);

-- Storage under Điện Bàn (parent_id = 1)
INSERT INTO warehouses (code, name, type, parent_id, sort_order) VALUES
('DB-DK', 'Kho Dệt Kim', 'STORAGE', 1, 1),
('DB-XN', 'Kho Xưởng Nhật', 'STORAGE', 1, 2),
('DB-XT', 'Kho Xưởng Trước', 'STORAGE', 1, 3);

-- Storage under Phú Tường (parent_id = 2)
INSERT INTO warehouses (code, name, type, parent_id, sort_order) VALUES
('PT-01', 'Kho Phú Tường', 'STORAGE', 2, 1);
```

### Decision 4: UI Component Strategy

**Sử dụng Quasar QSelect với option-group:**

```vue
<q-select
  :options="groupedWarehouses"
  option-label="name"
  option-value="id"
>
  <template #option="{ opt }">
    <q-item v-if="opt.type === 'LOCATION'" class="text-weight-bold bg-grey-2">
      {{ opt.name }}
    </q-item>
    <q-item v-else class="q-pl-lg">
      {{ opt.name }}
    </q-item>
  </template>
</q-select>
```

**Rationale:** Quasar QSelect đã có sẵn grouped options. Không cần custom tree component.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Existing data không có parent_id/type | Migration script set STORAGE cho tất cả existing, user manually assign sau |
| LOCATION type không thể chứa inventory | Frontend disable selection of LOCATION type trong inventory forms |
| Circular reference (A → B → A) | DB constraint + API validation: parent_id không thể = id hoặc tạo cycle |
| Sort order conflicts | Default 0, UI cho phép drag-drop reorder sau |

## Migration Plan

1. **Schema migration** - Add columns với defaults, non-breaking
2. **Seed locations** - Insert 2 LOCATION records
3. **Update existing** - Set parent_id cho existing STORAGE records (manual hoặc script)
4. **Deploy API** - New endpoint với dual format
5. **Update UI** - Warehouse selectors dùng grouped display
6. **Rollback** - Drop columns nếu cần (data loss acceptable vì mới)
