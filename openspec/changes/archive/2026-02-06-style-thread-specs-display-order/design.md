## Context

**Current State:**
- Table `style_thread_specs` lưu định mức chỉ template cho mỗi mã hàng (style)
- API GET trả về data ordered by `created_at DESC` - row mới nhất lên đầu
- Frontend có toggle "Thêm đầu bảng" nhưng chỉ hoạt động tạm thời (client-side manipulation)
- Sau refetch/reload, thứ tự bị reset về created_at DESC

**Existing Pattern:**
- Table `warehouses` đã có `sort_order INTEGER DEFAULT 0` column
- Index: `idx_warehouses_sort ON warehouses(parent_id, sort_order)`
- Pattern đã proven work trong codebase này

**Constraints:**
- Không thể thay đổi behavior cho existing data đột ngột
- Migration cần assign `display_order` cho existing rows theo `created_at ASC` (giữ nguyên thứ tự hiện tại khi nhìn DESC)

## Goals / Non-Goals

**Goals:**
- ✅ Persistent row order - giữ nguyên sau refresh/refetch
- ✅ New row có thể thêm ở đầu hoặc cuối dựa trên user preference
- ✅ Follow existing `sort_order` pattern từ warehouses table
- ✅ Backward compatible - existing data giữ nguyên thứ tự

**Non-Goals:**
- ❌ Drag-drop reorder UI (future enhancement, không trong scope)
- ❌ Per-column sorting UI (user vẫn có thể sort bằng DataTable header, nhưng persistent order là `display_order`)
- ❌ Undo/redo order changes

## Decisions

### 1. Column Design

**Decision:** Thêm `display_order INTEGER NOT NULL DEFAULT 0`

**Rationale:**
- Match pattern của `warehouses.sort_order`
- NOT NULL đảm bảo consistent ordering
- DEFAULT 0 cho backward compatibility

**Alternatives considered:**
- `SERIAL` auto-increment: Không phù hợp vì cần insert ở đầu (order = 0)
- `FLOAT` for fractional ordering: Over-engineering cho use case này

### 2. Order Interpretation

**Decision:** Lower value = Higher in list (đầu bảng)

**Rationale:**
- Match convention của warehouses
- `ORDER BY display_order ASC` - đơn giản, intuitive
- Insert đầu = order 0, các row khác shift +1
- Insert cuối = order MAX+1

### 3. API Changes

**Decision:** Thêm query param `add_to_top=true/false` cho POST

**Rationale:**
- Frontend gửi preference, backend handle logic
- Không cần track localStorage trên server
- API vẫn stateless

**Implementation:**
```typescript
// POST /api/style-thread-specs
// Body: { ...fields, add_to_top?: boolean }

if (add_to_top) {
  // Shift all existing rows: display_order += 1
  await supabase.from('style_thread_specs')
    .update({ display_order: supabase.rpc('increment_display_order') })
    .eq('style_id', style_id)
  // Insert new row with display_order = 0
} else {
  // Get MAX display_order + 1
  // Insert new row with that value
}
```

### 4. Migration Strategy

**Decision:** Assign display_order based on existing created_at order

**Rationale:**
- Existing rows sorted by `created_at DESC` → assign `display_order` in reverse
- Row với created_at mới nhất (hiện ở đầu) → display_order = 0
- Preserves current visual order

```sql
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY style_id ORDER BY created_at DESC) - 1 as new_order
  FROM style_thread_specs
)
UPDATE style_thread_specs SET display_order = ranked.new_order
FROM ranked WHERE style_thread_specs.id = ranked.id;
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Shift operation (add to top) có thể slow với nhiều rows | Per-style scope giới hạn ~50-100 rows max. Acceptable. |
| Concurrent inserts có thể race condition | style_thread_specs thường edit bởi 1 user/style. Low risk. |
| Index bloat từ frequent updates | Thêm index `idx_style_thread_specs_display_order ON style_thread_specs(style_id, display_order)` |

## Migration Plan

1. **Add column:** `ALTER TABLE style_thread_specs ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0`
2. **Populate existing:** Update existing rows với sequential order per style
3. **Add index:** `CREATE INDEX idx_style_thread_specs_display_order ON style_thread_specs(style_id, display_order)`
4. **Update API:** Change GET to order by display_order, POST to handle add_to_top
5. **Update Frontend:** Remove client-side manipulation, send add_to_top flag

**Rollback:** Column có DEFAULT, có thể revert API to order by created_at nếu issues.
