## Context

The `thread/loans` page displays thread types using legacy `code + name` fields from `thread_types` table. Per CLAUDE.md business rules, thread type identity is `Supplier (NCC) + Tex Number + Color (Màu)`, displayed as `"NCC - TEX xxx - Màu"`.

**CRITICAL DISCOVERY**: `thread_types.color_id` is NULL for ALL 78 records. Color data is NOT stored in `thread_types` — it comes from `style_color_thread_specs.thread_color_id` during weekly-order calculation. The calculated color is stored in `thread_order_results.summary_data` (AggregatedRow JSON) with fields `thread_color`, `thread_color_code`, `supplier_name`, `tex_number`.

The deliveries page already solved this: `/deliveries/overview` endpoint fetches `thread_order_results.summary_data` and enriches each delivery row with `color_name` from `summaryInfo.thread_color` as fallback.

Current data flow:
- `/loans/all` endpoint selects `thread_type:thread_types(id, code, name)` — missing supplier, tex, color
- `fn_loan_detail_by_thread_type` RPC joins `colors c ON c.id = tt.color_id` — always NULL for color
- `LoanDialog` gets thread info from reservation cones with only `(id, code, name)` — missing all identity fields

Reference patterns:
- `deliveries/overview` endpoint enriches from `thread_order_results.summary_data` (lines 436-479 of weeklyOrder.ts)
- `ThreadSummaryTable.vue` displays `supplier_name · tex_number · thread_color` from AggregatedRow

## Goals / Non-Goals

**Goals:**
- Display thread types as `"NCC full name - TEX xxx - Màu"` across all loans UI
- Ensure backend provides supplier name, tex number, and color name for all loan-related queries
- Maintain consistency with CLAUDE.md Thread Type Identity rule

**Non-Goals:**
- Refactoring other pages' thread type display (only loans page scope)
- Changing the thread_types table schema
- Adding new indexes or performance optimization

## Decisions

### 1. Backend `/loans/all` — Enrich from thread_order_results.summary_data

**Decision**: After fetching loans, collect all week_ids (from both `from_week_id` and `to_week_id`), fetch `thread_order_results.summary_data` for those weeks, build a map `(week_id, thread_type_id) → { supplier_name, tex_number, thread_color }`, then enrich each loan row with flat fields `supplier_name`, `tex_number`, `color_name`.

**Rationale**: Same proven pattern used by `deliveries/overview`. `thread_types.color_id` is NULL, so PostgREST nested select `colors!color_id` returns nothing. The only reliable color source is `summary_data`.

**Nested select change**: Also expand to `thread_type:thread_types(id, code, name, tex_number, supplier:suppliers(name))` — supplier IS available via FK (unlike color).

### 2. RPC `fn_loan_detail_by_thread_type` — Add supplier JOIN + keep color from existing join

**Decision**: Add `LEFT JOIN suppliers s ON s.id = tt.supplier_id`, select `s.name AS supplier_name` and `tt.tex_number`. Keep existing `LEFT JOIN colors c ON c.id = tt.color_id` — it returns empty string when NULL, which is acceptable as the detail columns will show `supplier_name - TEX xxx - color_name` format.

**Note**: The RPC's `color_name` from `colors c` will be empty for current data. The frontend can use the enriched data from loans endpoint or show the format without color segment when empty.

### 3. Frontend display format

**Decision**: Use format function: `[supplier, tex ? 'TEX ' + tex : null, color].filter(Boolean).join(' - ')` with fallback to `thread_type.name` when supplier is missing.

**Rationale**: Handles null segments gracefully. When no color: "Coats Epic - TEX 40". When no supplier: falls back to legacy name.

### 4. LoanDialog thread data source

**Decision**: After fetching reservation cones (source week) and target summary, also fetch `thread_order_results.summary_data` for the source week to get supplier/tex/color. Enrich `MergedRow` with `supplier_name`, `tex_number`, `color_name` for display.

**Rationale**: Reservation cones only have `thread_type_id` + basic `code`/`name`. The full identity (NCC-TEX-Màu) requires `summary_data` lookup.

## Risks / Trade-offs

- **[Missing summary_data]** → Old weeks without calculation results won't have color. Mitigation: fall back to `thread_type.name`.
- **[Breaking existing search/filter]** → The loan list DataTable has a text filter. Changing displayed text may affect filter behavior. Mitigation: The filter searches across all visible text, so the new format will naturally be searchable.
- **[Additional DB query]** → Each loan fetch now also fetches `thread_order_results`. Mitigation: small table, single query, same pattern deliveries use successfully.
