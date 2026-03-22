## Context

The Thread Inventory Management System tracks thread issuance via Issue V2 flow: PO → Style → Color → Thread Types. Some styles (e.g., "KS L/S") have sub-articles that warehouse staff need to distinguish when issuing. Currently there is no sub-classification below the style level.

Relevant existing tables:
- `styles` (id, style_code, style_name, fabric_type)
- `thread_issue_lines` (issue_id, po_id, style_id, color_id, thread_type_id, quota_cones, issued_full/partial, ...)
- `po_items` (po_id, style_id, quantity)

Issue V2 cascading dropdown uses `GET /api/issues/v2/order-options` to load PO → Style → Color from confirmed weekly orders.

## Goals / Non-Goals

**Goals:**
- Store SubArt data linked to styles
- Allow Excel import of SubArt data (style_code + sub_art_code)
- Conditionally show SubArt dropdown in Issue V2 when the selected style has sub_arts
- Record sub_art_id on issue lines for traceability
- Display SubArt info in issue detail view

**Non-Goals:**
- SubArt does NOT affect quota calculation or stock availability logic
- No SubArt-level thread specs or BOM (Bill of Materials)
- No SubArt CRUD UI (management is import-only for now)
- No SubArt in weekly ordering flow or reports (future consideration)

## Decisions

### Decision 1: Data model — separate `sub_arts` table vs column on `styles`

**Chosen: Separate `sub_arts` table**

Rationale: One style can have 0..N sub_arts. A junction/child table is the natural model. Adding columns to `styles` would require array types or denormalization.

```
sub_arts
├── id SERIAL PK
├── style_id INTEGER FK → styles(id) ON DELETE CASCADE
├── sub_art_code VARCHAR(100) NOT NULL
├── created_at TIMESTAMPTZ DEFAULT NOW()
└── UNIQUE(style_id, sub_art_code)
```

### Decision 2: Detecting whether a style requires SubArt

**Chosen: Data-driven — if `sub_arts` rows exist for that style_id, show dropdown**

Rationale: Simplest approach. No config flags, no pattern matching. Import data = require selection. No data = skip. This avoids maintaining a separate "requires_subart" flag that could get out of sync.

Implementation: `order-options` endpoint, when returning styles for a PO, includes a `has_sub_arts: boolean` flag. Frontend checks this flag after style selection.

### Decision 3: SubArt position in cascading dropdown

**Chosen: PO → Style → SubArt → Color**

SubArt appears between Style and Color. When user selects a style:
1. Frontend checks `has_sub_arts` from the style option data
2. If true → show SubArt dropdown, fetch sub_arts for that style
3. If false → skip directly to Color (existing behavior)

Color loading is unchanged — still based on PO + Style from order-options.

### Decision 4: Excel import format

**Chosen: Dedicated import page with 2-column format**

| Column | Description |
|--------|-------------|
| style_code | Must match existing `styles.style_code` |
| sub_art_code | The sub-art identifier to create |

Import behavior:
- Match style_code → styles.id
- Skip rows where style_code not found (report as warnings)
- Skip duplicate (style_id, sub_art_code) pairs (upsert behavior)
- Report summary: imported count, skipped count, errors

### Decision 5: Issue line storage

**Chosen: Add nullable `sub_art_id` to `thread_issue_lines`**

```sql
ALTER TABLE thread_issue_lines
ADD COLUMN sub_art_id INTEGER REFERENCES sub_arts(id);
```

- NULL = style has no sub_arts (normal flow)
- NOT NULL = style has sub_arts and user selected one
- Backend validates: if style has sub_arts, sub_art_id is required

### Decision 6: API changes scope

**New endpoints:**
- `GET /api/sub-arts?style_id=X` — list sub_arts for a style
- `POST /api/sub-arts/import` — Excel import

**Modified endpoints:**
- `GET /api/issues/v2/order-options?po_id=X` — style results include `has_sub_arts` boolean
- `POST /api/issues/v2/:id/lines` — accept optional `sub_art_id`
- `POST /api/issues/v2/create-with-lines` — accept optional `sub_art_id`
- `GET /api/issues/v2/:id` — line response includes `sub_art_code` from join

## Risks / Trade-offs

- **[Data consistency]** If sub_arts are deleted after being referenced by issue lines → FK constraint prevents deletion. Mitigation: sub_arts referenced by issue lines cannot be deleted (ON DELETE RESTRICT on the FK from thread_issue_lines). Additionally, deleting a style with sub_arts referenced by issue lines will fail due to transitive FK constraint (styles CASCADE→sub_arts, but sub_arts RESTRICT←thread_issue_lines). This is desired behavior.
- **[Existing data]** Issue lines created before SubArt data import will not retroactively require sub_art_id. Only new lines created after import will have sub_art_id validation. This is acceptable for MVP.
- **[Import errors]** Style codes in Excel may not match DB → Mitigation: report unmatched rows as warnings, don't fail entire import.
- **[Performance]** Extra join on sub_arts when loading issue details → Mitigation: LEFT JOIN is negligible for current data volumes, add index on sub_arts.style_id. For has_sub_arts flag, use single batch query with `SELECT DISTINCT style_id FROM sub_arts WHERE style_id IN (...)` to avoid N+1.
