## Why

Warehouse staff need more granular identification when issuing thread for certain styles (e.g., "KS L/S"). SubArt provides a sub-classification within a style, helping staff distinguish which sub-article they are issuing for. Currently the system only tracks PO → Style → Color, which is insufficient for styles that have multiple sub-articles.

## What Changes

- New `sub_arts` table linking sub-art codes to styles (1 style → 0..N sub_arts)
- New `sub_art_id` nullable column on `thread_issue_lines` to record which sub-art was selected
- New Excel import flow for SubArt data (2 columns: style_code, sub_art_code)
- Modified issue V2 cascading dropdown: PO → Style → **SubArt (if exists)** → Color
- SubArt displayed in issue detail view when present
- SubArt is **informational only** — does NOT affect quota calculation or stock logic

## Capabilities

### New Capabilities
- `sub-art-management`: SubArt data model, CRUD API, and Excel import
- `sub-art-issue-integration`: SubArt selection in issue V2 flow and display in issue detail

### Modified Capabilities
(none — existing quota/stock logic unchanged)

## Impact

### Database
- New table: `sub_arts` with FK to `styles`
- Altered table: `thread_issue_lines` adds nullable `sub_art_id` FK

### Backend (Hono API)
- New routes: `/api/sub-arts` (list by style, import)
- Modified route: `/api/issues/v2/order-options` returns sub_art availability flag per style
- Modified route: `/api/issues/v2/:id/lines` and `/create-with-lines` accept optional `sub_art_id`
- Modified route: `GET /api/issues/v2/:id` includes sub_art info in line response

### Frontend
- New page: SubArt import (Excel upload)
- Modified page: Issue V2 creation — conditional SubArt dropdown between Style and Color
- Modified page: Issue V2 detail — SubArt column in lines table
