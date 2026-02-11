## Context

The Issue V2 feature was recently implemented to allow issuing thread from confirmed weekly orders. The backend query joins `style_color_thread_specs` → `style_thread_specs` → `thread_types` to get thread specifications. However:

1. Multiple `style_color_thread_specs` records can exist with the same `thread_type_id` (different processes/specs)
2. The deduplication was added but server needs restart to apply
3. Frontend initializes `lineInputs` object before API response arrives

**Current flow:**
```
User selects PO → Style → Color
  ↓
loadFormData() called
  ↓
Backend queries style_color_thread_specs
  ↓
Returns thread_types array (may have duplicates)
  ↓
Vue tries to render with duplicate row-key → crash
```

## Goals / Non-Goals

**Goals:**
- Fix thread data loading to work without errors
- Ensure unique thread types returned from API
- Fix race condition in frontend initialization
- Add defensive null checks in template

**Non-Goals:**
- Database schema changes (schema is correct)
- Performance optimization of N+1 queries (separate concern)
- Adding new features to Issue V2

## Decisions

### D1: Deduplication Strategy
**Decision**: Deduplicate by `thread_type_id` on backend, taking first matching spec.

**Rationale**: The `thread_type_id` uniquely identifies a thread. Multiple specs with same `thread_type_id` represent same thread used in different processes - for issuing purposes, we need one entry per thread type.

**Alternative considered**: Frontend deduplication - rejected because it wastes bandwidth and adds complexity to Vue.

### D2: Race Condition Fix
**Decision**: Initialize `lineInputs` from the returned data directly, not from computed property.

**Rationale**: The computed `threadTypes` may not be updated yet when the code tries to iterate. Using the direct return value from `loadFormData()` ensures data is available.

**Code pattern**:
```typescript
const data = await loadFormData(poId, styleId, colorId)
if (data) {
  for (const tt of data.thread_types) {
    lineInputs.value[tt.thread_type_id] = { ... }
  }
}
```

### D3: Null Check Strategy
**Decision**: Use optional chaining and default values in template bindings.

**Rationale**: Defensive coding prevents crashes even if initialization has edge cases.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| First-match deduplication may lose `meters_per_unit` variants | For issuing, any matching spec suffices. Document this behavior. |
| Template changes may affect styling | Test visually after changes |
