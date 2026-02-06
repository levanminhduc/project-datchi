## Context

Trang chi tiết mã hàng (`/thread/styles/:id`) vừa được implement Excel-like inline editing. Flow "Thêm định mức":
1. User click "Thêm định mức" → `addEmptyRow()` được gọi
2. Frontend gửi POST `/api/style-thread-specs` với `process_name: ''`
3. Backend validate → reject vì `process_name` required
4. User thấy lỗi "Lỗi hệ thống"

**Current state:**
- Frontend: `src/pages/thread/styles/[id].vue` line 550-555 - gửi empty string
- Backend: `server/routes/styleThreadSpecs.ts` line 98-100 - validate `!body.process_name`

## Goals / Non-Goals

**Goals:**
- Cho phép tạo định mức với `process_name` rỗng để support inline edit flow
- User có thể thêm dòng trống rồi điền thông tin sau

**Non-Goals:**
- Không thay đổi database schema
- Không validate completeness khi save (user tự chịu trách nhiệm)

## Decisions

### Decision 1: Bỏ validation `process_name` required ở backend

**Rationale:**
- Database `style_thread_specs.process_name` đã nullable
- Flow inline edit yêu cầu tạo row trước, user điền sau
- Validation required không phù hợp với UX mới

**Alternatives considered:**
- Frontend gửi placeholder "Công đoạn mới" → User phải xóa rồi nhập lại, bad UX
- Validate khi user rời trang → Phức tạp, không cần thiết

### Decision 2: Giữ nguyên frontend code

**Rationale:**
- `addEmptyRow()` đã gửi đúng data structure
- Chỉ cần backend accept empty string

## Risks / Trade-offs

- **[Risk]** User có thể tạo nhiều row rỗng không hoàn chỉnh
  → **Mitigation:** Acceptable - user tự quản lý data, có nút Delete để xóa

- **[Trade-off]** Bỏ validation backend = data có thể incomplete
  → **Accepted:** UX inline edit quan trọng hơn data completeness enforcement
