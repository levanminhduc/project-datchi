## Context

The thread spec system uses a 2-level design:
- `style_thread_specs` stores TEX-level thread type (renamed from `tex_id` → `thread_type_id`) — represents generic thread without specific color
- `style_color_thread_specs` overrides per garment color → full thread type (NCC + Tex + Color)

When `buildCalculation()` resolves `thread_type_id` for weekly order:
```
resolvedThreadTypeId = colorSpec?.thread_type_id || spec.thread_type_id
```
Missing `style_color_thread_specs` entries cause fallback to TEX base type, merging all colors.

Inventory `v_cone_summary` groups by `thread_type_id + color_id` → shows per-color rows correctly.
Weekly order `aggregateResults()` groups by `thread_type_id` only → merges when base type used.

## Goals / Non-Goals

**Goals:**
- Ensure every style_thread_spec + garment color has a `style_color_thread_specs` entry
- Weekly order "Tổng hợp" matches inventory "Tổng hợp theo cuộn" granularity
- Warn users when color specs are incomplete during calculation

**Non-Goals:**
- Changing the aggregation key in `aggregateResults()` (current logic is correct when data is complete)
- Modifying `v_cone_summary` or inventory display
- Changing thread_types data model

## Decisions

### 1. Backfill strategy: Copy parent thread_type_id as default

When `style_color_thread_specs` is missing for a color, backfill using `style_thread_specs.thread_type_id` as default value. This preserves existing behavior while making the data explicit.

**Alternative considered**: Auto-resolve from thread_type name pattern → too fragile, depends on naming convention.

### 2. Validation at spec management UI, not at calculation time

Enforce completeness when creating/editing style thread specs rather than blocking calculation. Calculation will show warnings but still proceed.

**Rationale**: Blocking calculation would break existing workflows. Warnings give users time to fix data.

### 3. Backend warning in calculation response

Add `warnings: string[]` to `CalculationResult` when any color falls back to base thread_type. Frontend displays these in the results table.

**Alternative considered**: Separate validation endpoint → adds complexity without benefit.

## Risks / Trade-offs

- **Risk**: Backfill assigns wrong thread_type to some colors → **Mitigation**: Backfill uses parent's thread_type as safe default; users can correct via UI
- **Risk**: Existing style specs without any color thread specs → **Mitigation**: Warning-only approach, no breaking changes
- **Trade-off**: UI enforcement adds friction to spec creation → Acceptable since correct data is essential for accurate ordering
