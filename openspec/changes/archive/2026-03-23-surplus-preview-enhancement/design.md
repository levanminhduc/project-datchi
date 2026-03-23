## Context

The weekly order detail page (`thread/weekly-order/[id]`) has a "Trạng thái xuất chỉ" section showing PO-Style-Color items with completion checkboxes, and a "Trả dư" dialog for releasing surplus cones. Two issues exist: (1) color names always display "-" because the frontend reads `item.color?.name` but the backend JOIN returns data via `style_color:style_colors`, and (2) the surplus preview only shows a total cone count without per-thread-type breakdown.

The existing `fn_complete_week_and_release` RPC already handles the atomic release with own/borrowed cone distinction. The preview endpoint just needs to mirror that logic as a read-only query.

## Goals / Non-Goals

**Goals:**
- Fix color display in "Trạng thái xuất chỉ" checklist to show actual color name from `style_colors`
- Enhance surplus preview endpoint to return per-thread-type breakdown with own vs borrowed cone counts
- Display breakdown table in surplus dialog so users know exactly what will happen

**Non-Goals:**
- Changing the actual release logic (`fn_complete_week_and_release` is unchanged)
- Adding new database tables or columns
- Modifying the surplus release POST endpoint response

## Decisions

### D1: Use `style_color` instead of adding a `color` JOIN

**Choice**: Fix frontend to read `item.style_color?.color_name` instead of adding a new `color:colors` JOIN to the backend query.

**Rationale**: The backend GET `/:id` query already JOINs `style_color:style_colors (id, color_name, hex_code)` and `thread_order_items` stores `style_color_id` (not `color_id` directly). Adding a separate `color:colors` JOIN would be redundant and require tracing back through `style_colors → colors` FK. The data is already available.

**Alternative considered**: Add `color:colors` JOIN via `style_colors.color_id` — unnecessary since `color_name` is already denormalized in `style_colors`.

### D2: Inline breakdown query in existing endpoint (no new RPC)

**Choice**: Enhance the existing `GET /surplus-preview` endpoint with a grouped query on `thread_inventory` + JOINs, rather than creating a new RPC function.

**Rationale**: This is a read-only aggregation query. The existing `fn_complete_week_and_release` RPC handles the write-side atomicity. The preview is purely informational — no transaction safety needed. A simple grouped Supabase query with `.select()` is sufficient and keeps the codebase simpler.

**Alternative considered**: New RPC `fn_surplus_preview_breakdown` — overkill for a read-only query.

### D3: Fallback to total-only display on breakdown query failure

**Choice**: If the breakdown query fails, return the existing response (total_cones, can_release) without breakdown field. Frontend checks `surplusPreview.breakdown` existence and falls back to current simple display.

**Rationale**: The breakdown is informational — users should still be able to confirm the release even if the detailed view fails. Graceful degradation over hard failure.

### D4: Borrowed cones from CANCELLED/COMPLETED original weeks shown as "Trả về KD"

**Choice**: In the preview breakdown, borrowed cones whose original week is not CONFIRMED are grouped into own cones count (since they'll be released to AVAILABLE anyway).

**Rationale**: Matches `fn_complete_week_and_release` behavior exactly. If original week isn't CONFIRMED, the cone goes AVAILABLE — same as own cone. Simpler UI, no confusing "borrowed from cancelled week" entries.

## Risks / Trade-offs

- **N+1 query risk** → Mitigated: single grouped query with JOINs, not per-cone lookups. For borrowed cones needing original week status, batch-fetch all distinct `original_week_id` values in one query.
- **Stale preview** → Accepted: Between preview load and confirm click, cone counts could change (e.g., concurrent receive). This is acceptable since the actual release uses `FOR UPDATE` locking in the RPC.
