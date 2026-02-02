## Context

Project đã có pattern chuẩn cho date input với Quasar DatePicker:
- `AppInput` làm text input hiển thị giá trị
- `q-popup-proxy` trong slot `#append` chứa `DatePicker` component
- `DatePicker` là wrapper của `q-date` với Vietnamese locale

Tuy nhiên, trong lần sửa UI consistency trước, đã dùng sai `<AppInput type="date">` (native HTML date) thay vì pattern chuẩn.

## Goals / Non-Goals

**Goals:**
- Thay thế native date inputs bằng Quasar DatePicker với Vietnamese locale
- Đảm bảo đồng nhất với các trang khác trong app (reports/allocations.vue pattern)

**Non-Goals:**
- Không tạo component wrapper mới (dùng pattern inline hiện có)
- Không thay đổi logic filter/search

## Decisions

### Decision 1: Dùng inline pattern thay vì tạo DateInput component mới

**Chosen**: Inline pattern (AppInput + q-popup-proxy + DatePicker)

**Rationale**: 
- Pattern đã được dùng ở 6+ nơi trong project
- Đơn giản, không cần thêm abstraction
- Giữ consistency với code hiện có

**Alternatives considered**:
- Tạo `DateInput.vue` wrapper → Thêm complexity không cần thiết cho fix nhỏ

### Decision 2: Format date string

**Chosen**: DD/MM/YYYY format (Vietnamese standard)

**Rationale**: 
- DatePicker đã có default mask `DD/MM/YYYY`
- Consistent với các form khác trong app

## Risks / Trade-offs

- [Minimal risk] Date format phải match giữa display và DatePicker mask → Dùng default mask đã có
