## Context

CLAUDE.md hiện tại có ~438 lines với nhiều section. Phân tích cho thấy:
- Claude Code tự động đọc `package.json`, `tsconfig.json`, folder structure
- Nhiều section (Dev Commands, Testing, Git) là thông tin standard mà AI đã biết
- Các code blocks dài (Excel, DatePicker) chiếm nhiều dòng nhưng có thể reference

## Goals / Non-Goals

**Goals:**
- Giảm CLAUDE.md xuống ~130-150 lines (giảm ~70%)
- Giữ thông tin AI không thể tự suy luận (Safety Rules, Business Context, Project Conventions)
- Dùng reference links thay vì code blocks cho patterns

**Non-Goals:**
- Không tạo file documentation mới (chỉ edit CLAUDE.md)
- Không thay đổi cấu trúc folder docs/
- Không ảnh hưởng source code

## Decisions

### 1. Structure mới

```
CLAUDE.md (~130 lines)
├── CRITICAL SAFETY RULES     [~20 lines] - Giữ nguyên
├── Project Context           [~10 lines] - Rút gọn từ Overview
├── Architecture              [~15 lines] - Diagram + data flow
├── Conventions               [~40 lines]
│   ├── Database              [~10 lines]
│   ├── API                   [~10 lines]
│   └── Frontend              [~20 lines]
├── Anti-patterns             [~15 lines] - Những gì KHÔNG làm
├── Pattern References        [~10 lines] - Table với links
├── Multi-Agent (optional)    [~10 lines] - Summary only
└── Key Files                 [~10 lines] - Quick reference
```

### 2. Pattern References thay vì Code Blocks

| Pattern | Reference File |
|---------|----------------|
| Excel Export | `src/composables/useReports.ts` |
| DatePicker | `src/components/ui/pickers/DatePicker.vue` |
| AppInput/Select | `src/components/app/` |
| Notifications | `src/composables/useNotify.ts` |

**Rationale**: AI sẽ đọc file khi cần, không cần duplicate code trong CLAUDE.md

### 3. Sections bị loại bỏ

| Section | Lý do bỏ |
|---------|----------|
| Development Commands | Có trong `package.json` |
| Type Safety Guidelines | TypeScript standard |
| Testing | Vitest standard |
| Git Conventions | Standard git workflow |
| Key Directories (chi tiết) | AI tự explore folder structure |

### 4. Multi-Agent: Summary thay vì Full Workflow

Chỉ giữ bảng agents và khi nào dùng, bỏ ví dụ chi tiết.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| AI thiếu context cho patterns phức tạp | Reference links trỏ đến example files tốt nhất |
| Mất thông tin Multi-Agent workflow | Giữ summary, AI có thể hỏi khi cần |
| Reference files thay đổi | Chọn files stable (core components, main composables) |
