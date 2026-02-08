# Cải Thiện Bảng Kết Quả Tính Toán Định Mức Chỉ

## TL;DR

> **Quick Summary**: Modify the thread calculation results table to convert "Tổng mét" (total meters) to "Tổng cuộn" (total cones) and add a thread color display column at the end.
>
> **Deliverables**:
> - Backend API returns meters_per_cone, color, color_code from thread_types table
> - Frontend displays "Tổng cuộn" column (computed from total_meters / meters_per_cone)
> - Frontend displays thread color as the last column with colored visual indicator
>
> **Estimated Effort**: Quick (3 files, ~30 lines changed)
> **Parallel Execution**: NO - sequential (types → backend → frontend)
> **Critical Path**: Task 1 (Backend + Types) → Task 2 (Frontend)

---

## Context

### Original Request
> Ở Tính Toán Định Mức Chỉ trong bảng có cột Tổng mét nên quy đổi sang là tổng cuộn dựa trên số m mỗi cuộn là bao nhiêu và so sánh với định mức bao nhiêu m 1sp. Và cho hiển thị màu chỉ ở cột cuối cùng.

### Interview Summary
- User wants to see cones (cuộn) instead of meters (mét) since cones are the purchasing unit
- Thread color should be visible in the table for quick reference
- The thread_types table already has meters_per_cone, color, and color_code fields
- Both calculation modes (style and PO) use the same resultColumns and must be updated

### Research Findings
- Backend Supabase select already joins thread_types:tex_id (id, tex_number, name) — just needs 3 more fields
- Both /calculate (line 83) and /calculate-by-po (line 213) need identical changes
- Frontend q-table currently uses self-closing tags — must convert to open/close for body-cell slots
- No test infrastructure exists in the project

### Self-Review (Gap Analysis)
- Rounding strategy for cones: Applied Math.ceil() (can't buy partial cones)
- Null handling for meters_per_cone: Show "—" when null/0
- Null handling for color/color_code: Show "—" when null
- total_meters still needed as tooltip for reference

---

## Work Objectives

### Core Objective
Convert the "Tổng mét" column to "Tổng cuộn" and add a thread color column in the calculation results table on /thread/calculation.

### Must Have
- "Tổng cuộn" computed as Math.ceil(total_meters / meters_per_cone)
- "Mét/SP" column stays (meters_per_unit — user explicitly wants this for reference)
- Color column as the LAST column with visual color indicator
- Both /calculate and /calculate-by-po endpoints updated consistently
- Vietnamese labels: "Tổng cuộn", "Màu chỉ"

### Must NOT Have (Guardrails)
- Do NOT modify summaryColumns or allocation-related code
- Do NOT modify color_breakdown logic
- Do NOT refactor existing q-btn, q-input etc. to App* wrappers
- Do NOT add sorting/filtering on new columns
- Do NOT change the total_meters field in the API response — ADD meters_per_cone alongside it
- Do NOT change style_color_thread_specs queries

---

## Verification Strategy

- **Infrastructure exists**: NO
- **Automated tests**: None
- **Agent-Executed QA**: ALWAYS (primary verification method)

---

## Execution Strategy

Task 1 (Start Immediately) → Task 2 (After Task 1)

| Task | Depends On | Blocks |
|------|------------|--------|
| 1 | None | 2 |
| 2 | 1 | None |

| Order | Task | Recommended Agent |
|-------|------|-------------------|
| 1 | Backend + Types | task(category="business-logic", load_skills=["hono-routing"]) |
| 2 | Frontend Table | task(category="visual-engineering", load_skills=["vue-best-practices"]) |

---

## TODOs

- [x] 1. Backend API + TypeScript Types: Add thread cone and color data

  **What to do**:

  **A. Update TypeScript types** (src/types/thread/threadCalculation.ts):
  Add 3 new optional fields to CalculationItem interface (line 22-30):
  - meters_per_cone?: number (from thread_types table)
  - thread_color?: string (from thread_types.color)
  - thread_color_code?: string (from thread_types.color_code)

  **B. Update /calculate endpoint** (server/routes/threadCalculation.ts, lines 77-84):
  Expand the thread_types:tex_id select to include meters_per_cone, color, color_code:
  `thread_types:tex_id (id, tex_number, name, meters_per_cone, color, color_code)`

  Add new fields to baseCalculation object (lines 117-124):
  ```
  meters_per_cone: spec.thread_types?.meters_per_cone || null,
  thread_color: spec.thread_types?.color || null,
  thread_color_code: spec.thread_types?.color_code || null,
  ```

  **C. Update /calculate-by-po endpoint** (server/routes/threadCalculation.ts, lines 205-214):
  SAME change to the thread_types:tex_id select (line 213)
  Add new fields to return object (lines 265-273) — same 3 fields as above.

  **Must NOT do**:
  - Do NOT modify style_color_thread_specs queries
  - Do NOT change the color_breakdown calculation logic
  - Do NOT modify summaryColumns or allocation endpoints
  - Do NOT remove total_meters from the response

  **Recommended Agent**: category="business-logic", skills=["hono-routing"]
  **Blocks**: Task 2 | **Blocked By**: None

  **References**:
  - server/routes/threadCalculation.ts:77-84 — Supabase select for /calculate
  - server/routes/threadCalculation.ts:116-124 — baseCalculation object
  - server/routes/threadCalculation.ts:205-214 — Supabase select for /calculate-by-po
  - server/routes/threadCalculation.ts:265-273 — Return object for /calculate-by-po
  - src/types/thread/threadCalculation.ts:22-30 — CalculationItem interface

  **Acceptance Criteria**:
  - [ ] CalculationItem interface has meters_per_cone?, thread_color?, thread_color_code?
  - [ ] Both Supabase selects include meters_per_cone, color, color_code in thread_types join
  - [ ] Both calculation response objects include the 3 new fields with null fallbacks
  - [ ] npm run type-check passes

  **Commit**: feat(thread-calc): add meters_per_cone and thread color to calculation response
  **Files**: server/routes/threadCalculation.ts, src/types/thread/threadCalculation.ts

---

- [x] 2. Frontend Table: Display "Tổng cuộn" and "Màu chỉ" columns

  **What to do**:

  **A. Update resultColumns array** (src/pages/thread/calculation/index.vue, lines 322-328):
  Replace total_meters column with total_cones:
  - name: 'total_cones', label: 'Tổng cuộn'
  - field: function that computes Math.ceil(row.total_meters / row.meters_per_cone) or null
  - format: show integer with toLocaleString('vi-VN') or "—" for null
  Add thread_color column at end:
  - name: 'thread_color', label: 'Màu chỉ', align: 'center'

  **B. Convert self-closing q-table tags to open/close** and add body-cell slots:
  For Style mode table (line 118-126) AND PO mode table (line 160-168):

  body-cell-total_cones slot: Show value with tooltip containing original total_meters and meters_per_cone
  body-cell-thread_color slot: Show q-badge with backgroundColor from thread_color_code, label from thread_color. Use text-dark class for light colors. Show "—" when null.

  **C. Add isLightColor helper** in script setup:
  Takes hex string, returns boolean. Uses brightness formula: (r*299 + g*587 + b*114) / 1000 > 155

  **D. Import CalculationItem type** for the column field function.

  **Must NOT do**:
  - Do NOT modify summaryColumns (line 330-336)
  - Do NOT modify handleCreateAllocations or allocation logic
  - Do NOT replace existing q-btn, q-select with App* wrappers
  - Do NOT modify hasColorBreakdown computed

  **Recommended Agent**: category="visual-engineering", skills=["vue-best-practices"]
  **Blocks**: None | **Blocked By**: Task 1

  **References**:
  - src/pages/thread/calculation/index.vue:322-328 — Current resultColumns array
  - src/pages/thread/calculation/index.vue:118-126 — Style mode q-table (self-closing → open/close)
  - src/pages/thread/calculation/index.vue:160-168 — PO mode q-table (same change)
  - src/types/thread/threadCalculation.ts:CalculationItem — Type interface with new fields

  **Acceptance Criteria**:
  - [ ] resultColumns has 6 columns: Công đoạn, NCC, Tex, Mét/SP, Tổng cuộn, Màu chỉ
  - [ ] "Tổng cuộn" shows Math.ceil(total_meters / meters_per_cone) as integer
  - [ ] "Tổng cuộn" shows "—" when meters_per_cone is null or 0
  - [ ] Hovering "Tổng cuộn" shows tooltip with original total meters and m/cuộn
  - [ ] "Màu chỉ" shows colored badge with thread color name
  - [ ] "Màu chỉ" text has proper contrast (dark on light, white on dark)
  - [ ] "Màu chỉ" shows "—" when thread_color is null
  - [ ] Both style mode and PO mode tables render identically
  - [ ] npm run type-check passes

  **Commit**: feat(thread-calc): display total cones and thread color in results table
  **Files**: src/pages/thread/calculation/index.vue

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | feat(thread-calc): add meters_per_cone and thread color to calculation response | server/routes/threadCalculation.ts, src/types/thread/threadCalculation.ts |
| 2 | feat(thread-calc): display total cones and thread color in results table | src/pages/thread/calculation/index.vue |

---

## Success Criteria

### Verification Commands
npm run type-check — Expected: exit code 0

### Final Checklist
- [ ] "Tổng cuộn" column shows integer cone count (Math.ceil)
- [ ] "Mét/SP" column still visible for reference
- [ ] "Màu chỉ" column is the LAST column with colored badge
- [ ] Tooltip on "Tổng cuộn" shows original meters
- [ ] Both style mode and PO mode work correctly
- [ ] No TypeScript errors
- [ ] No "Tổng mét" column visible (replaced by "Tổng cuộn")
- [ ] Null handling: "—" displayed for missing data
