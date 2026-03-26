## Context

Weekly Order page (`src/pages/thread/weekly-order/index.vue`) has UX issues:
1. "Lưu" button is in WeekInfoCard header, far from "Xác nhận tuần" in Result Actions
2. After creating new week, `selectedWeek.value` is not set → "Xác nhận tuần" stays disabled
3. User must reload from History to confirm a newly created week
4. Duplicate week name causes error at save time instead of early warning

Current flow: Nhập → Tính → Lưu (creates week) → **Load từ History** → Xác nhận

Target flow: Nhập → Tính → Lưu (creates week + sets selectedWeek) → Xác nhận **ngay**

## Goals / Non-Goals

**Goals:**
- Move "Lưu tuần" button next to "Xác nhận tuần" in Result Actions
- Enable "Xác nhận tuần" immediately after save (no reload needed)
- Check duplicate week name on input blur, show dialog if exists
- Improve UX flow from input to confirmation

**Non-Goals:**
- Change DB schema
- Add unit tests (manual testing only)
- Major WeekInfoCard restructure (minor event emit changes allowed)

## Decisions

### D1: Check-name endpoint design
**Decision**: `GET /weekly-orders/check-name?name=<encoded_name>`
**Returns**: `{ exists: boolean, week?: { id, week_name, status } }`
**Rationale**: Simple GET, returns minimal info needed for dialog. Alternative was POST with body, but GET is more semantic for read-only check.

### D2: When to check duplicate name
**Decision**: On input blur (not on every keystroke)
**Rationale**: Reduces API calls, provides early feedback. Alternative was check on save (simpler but worse UX).

### D3: Dialog options when duplicate found
**Decision**: Two options:
1. "Tải và cập nhật" → Load existing week into UI (clears current data)
2. "Đổi tên mới" → Close dialog, focus on name input

**Rationale**: User decides whether to work with existing week or rename. Loading clears current data because mixing old+new data is confusing.

### D4: Set selectedWeek after create
**Decision**: After `createWeek()` returns, assign result to `selectedWeek.value`
**Rationale**: This is the root cause of the bug. Simple fix enables immediate confirm.

### D5: Button disable conditions
**Decision**:
- "Lưu tuần": disabled when `!hasResults` (must calculate first)
- "Xác nhận tuần": disabled when `!selectedWeek || !resultsSaved || selectedWeek.status === CONFIRMED`

**Behavior on CONFIRMED week**:
1. User loads a CONFIRMED week → confirm button disabled (status === CONFIRMED)
2. User edits any field → `resultsSaved = false` (data changed, unsaved)
3. User clicks "Lưu tuần" → `updateWeek()` called, `resultsSaved = true`
4. **Status remains CONFIRMED** (no transition) → confirm button still disabled
5. User must manually change status via separate action if re-confirmation needed

**Rationale**: Keeping status unchanged after save is simpler and safer. Re-confirmation is a future enhancement, not part of this change.

### D6: Name normalization (applies to ALL name operations)
**Decision**: Trim whitespace on both check-name AND save operations. Case-sensitive match (DB UNIQUE constraint).
**Applies to**:
- `GET /check-name` endpoint: trim query param before lookup
- `POST /` create: trim week_name before insert
- `PUT /:id` update: trim week_name before update
**Rationale**: Consistent normalization prevents whitespace-variant duplicates.

### D7: Self-match bypass
**Decision**: Skip duplicate check if `matchedWeek.id === selectedWeek.id`
**Rationale**: User editing current week shouldn't see duplicate warning for themselves.

## Risks / Trade-offs

- **Risk**: Extra API call on every blur → **Mitigation**: Debounce not needed (blur is single event), API is lightweight query
- **Risk**: User loses current data when loading existing week → **Mitigation**: Dialog clearly states this; user chose this option
- **Trade-off**: Keeping edit enabled after CONFIRMED (per user request) may cause confusion → Future improvement: add reconfirm flow if needed
- **Risk**: Blur check API fails → **Mitigation**: Silent fail, let save-time validation catch duplicates (graceful degradation)
