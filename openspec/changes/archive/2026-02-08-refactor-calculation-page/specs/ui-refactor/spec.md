## ADDED Requirements

### Requirement: Calculation page uses project UI components

Trang thread/calculation SHALL sử dụng các custom wrapper components từ `src/components/ui/` thay vì Quasar components trực tiếp, để đảm bảo nhất quán với convention của dự án.

#### Scenario: All Quasar direct usage replaced
- **WHEN** reviewing the calculation page source code
- **THEN** không còn direct usage của q-btn, q-select, q-input, q-card, q-table, q-dialog, q-badge, q-tooltip (ngoại trừ trong template slots như q-td, q-space, q-card-section, q-card-actions, q-item, q-item-section được phép vì chưa có wrapper)

#### Scenario: Visual behavior unchanged
- **WHEN** user thao tác trên trang calculation (chọn style, nhập số lượng, tính toán, xem kết quả, tạo phiếu phân bổ)
- **THEN** mọi tính năng và hiển thị hoạt động giống hệt như trước refactor

#### Scenario: Business logic unchanged
- **WHEN** so sánh script setup trước và sau refactor
- **THEN** không có thay đổi nào về composable usage, API calls, computed properties, handlers, hoặc reactive state
