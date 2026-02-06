## Context

Trang chi tiết mã hàng (`/thread/styles/[id].vue`) có bảng định mức chỉ với chức năng inline editing. Hiện tại hàm `addEmptyRow()` luôn thêm dòng mới vào cuối mảng `localSpecs`. User muốn có tùy chọn thêm dòng đầu hoặc cuối.

## Goals / Non-Goals

**Goals:**
- Thêm switch toggle để user chọn vị trí thêm dòng (đầu/cuối)
- Mặc định: cuối bảng (giữ behavior hiện tại)
- Persist preference vào localStorage
- UI đơn giản, không phức tạp hóa workflow

**Non-Goals:**
- Không thay đổi logic save/update của row
- Không thêm setting này vào user profile (chỉ localStorage local)
- Không áp dụng cho các trang khác

## Decisions

### Decision 1: Vị trí switch UI
**Choice**: Đặt switch bên trái nút "Thêm định mức", cùng hàng
**Rationale**: Gần với action liên quan, user dễ thấy và hiểu context

### Decision 2: localStorage key
**Choice**: `datchi_addRowPosition` với giá trị `"top"` hoặc `"bottom"`
**Rationale**: Prefix `datchi_` để namespace, giá trị rõ ràng dễ debug

### Decision 3: Default value
**Choice**: `"bottom"` (cuối bảng)
**Rationale**: Giữ behavior hiện tại, không breaking change cho existing users

### Decision 4: Component sử dụng
**Choice**: Dùng `AppToggle` có sẵn trong UI library
**Rationale**: Consistent với design system, không cần tạo component mới

## Risks / Trade-offs

- [Risk] User có thể confuse switch làm gì → Mitigation: Label rõ ràng "Thêm đầu bảng"
- [Trade-off] localStorage chỉ lưu per-browser, không sync across devices → Acceptable cho preference nhỏ này
