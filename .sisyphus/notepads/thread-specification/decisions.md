# Thread Specification Feature - Decisions Log

## 2026-02-06 - Initial Planning

### Database Design Decisions
1. **Purchase Orders Table**: Full-featured with status, priority, delivery tracking
2. **Styles Table**: Simple structure - code, name, description, fabric_type
3. **PO Items**: Junction table linking PO to Styles with quantity
4. **SKUs**: Detail table for Style + Color + Size combinations
5. **Style Thread Specs**: Template with NCC + Tex (no color) - FK to thread_types
6. **Style Color Thread Specs**: Detail with specific color - FK to thread_types

### UI Decisions
1. **Styles Page**: 2-page structure (list + detail with tabs)
2. **Specs Management**: 2 tabs - template specs + color-specific specs
3. **Filtering**: Cascade NCC → Tex → Màu in color specs tab
4. **Calculation**: Separate page, semi-automatic (show table, user confirms)

### Integration Decisions
1. **Allocation Integration**: Link calculation results to allocation creation
2. **Use thread_type_id**: Leverage existing allocation system workflow

## Open Questions Resolved

### Q: How to structure style_thread_specs FK?
**A**: FK to thread_types which already has NCC + Tex + meters_per_cone. This reuses existing data.

### Q: How to handle color selection?
**A**: In color-specific specs, filter available colors by the NCC + Tex already selected in template.

### Q: Cascade filtering implementation?
**A**: UI will cascade: Select NCC → filter Tex options → filter Color options based on thread_types table.
