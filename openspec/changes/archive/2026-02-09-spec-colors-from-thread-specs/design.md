## Context

The weekly thread order page allows users to select PO → Style → Colors → Quantities. Currently, color options for the dropdown come from `skus` table (via `po_items`), which lists ALL colors in a PO item regardless of whether thread specifications exist for them. The correct source is `style_color_thread_specs` joined through `style_thread_specs` — only colors with pre-configured thread specs are meaningful for thread ordering.

Database relationship:
```
styles
  → style_thread_specs (process_name, tex_id, meters_per_unit)
    → style_color_thread_specs (color_id, thread_type_id)
      → colors (id, name, hex_code)
```

### Current code flow

```
POOrderCard.getColorOptionsForStyle(styleId)
  → props.po.items.find(style_id).skus  ← reads from PO response
    → dedup by color_id via Map
    → returns all SKU colors (includes colors without thread specs)
```

## Goals / Non-Goals

**Goals:**
- Add backend endpoint to return unique colors that have thread specs for a style
- Replace the color options source in POOrderCard from SKU-based to spec-based
- Cache fetched colors per style to avoid redundant API calls

**Non-Goals:**
- Changing how StyleOrderCard works (it already receives colorOptions as a prop)
- Modifying the SKU data model or PO query
- Adding color options from the full `colors` table
- Changing the thread calculation logic

## Decisions

### Decision 1: New endpoint on styles router (`GET /api/styles/:id/spec-colors`)

Add the endpoint to `server/routes/styles.ts` since it's style-scoped data. Query joins `style_thread_specs` → `style_color_thread_specs` → `colors` with `DISTINCT` on `color_id`.

**Alternative considered**: Adding to `styleThreadSpecs` router — rejected because the consumer queries by `style_id`, not `style_thread_spec_id`.

### Decision 2: Reactive Map cache in POOrderCard

Store fetched spec-colors in a `ref<Map<number, Array<ColorOption>>>` keyed by `style_id`. When a `StyleOrderCard` needs color options, look up the cache. Fetch on-demand when a style entry exists but cache is empty.

**Alternative considered**: Fetching in parent `index.vue` and passing down — rejected because POOrderCard already owns the color-options logic and this keeps the change localized.

### Decision 3: Fetch colors when PO entries change

Use a `watch` on `poEntries` to detect when new styles are added and fetch their spec-colors. This ensures colors are available by the time the user opens the dropdown.

**Alternative considered**: Fetch on dropdown open — rejected because it would cause visible loading delay on user interaction.

## Risks / Trade-offs

- **[Behavior change]** Styles with SKU colors but no thread specs will show an empty color dropdown → This is the desired behavior. Users should configure thread specs first.
- **[Extra API calls]** Each unique style triggers an API call → Mitigated by caching per style_id in the component. A PO with 5 styles = 5 small queries, only once each.
- **[Empty state UX]** If a style has zero configured spec-colors, the dropdown shows no options → The existing `AppSelect` no-option slot can show a helpful message.
