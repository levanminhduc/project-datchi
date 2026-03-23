## Why

CLAUDE.md hiện tại dài ~438 lines, chứa nhiều thông tin mà Claude Code đã tự động hiểu từ codebase (package.json, tsconfig, code patterns). Việc rút gọn giúp:
- Giảm noise trong context window
- Tập trung vào thông tin AI không thể tự suy luận
- Dễ maintain và cập nhật

## What Changes

- **Giữ nguyên**: CRITICAL SAFETY RULES section (bắt buộc)
- **Rút gọn**: Project Overview, Architecture, Conventions (từ chi tiết → core concepts)
- **Chuyển sang reference links**: Excel Export Pattern, DatePicker Pattern → link đến example files
- **Tối giản**: Multi-Agent Team section (từ full workflow → summary ngắn)
- **Loại bỏ hoàn toàn**:
  - Development Commands (có trong package.json)
  - Type Safety Guidelines (TypeScript standard)
  - Testing section (Vitest standard)
  - Git Conventions (standard git workflow)

## Capabilities

### New Capabilities

(Không có capability mới - đây là refactoring documentation)

### Modified Capabilities

(Không có spec nào bị ảnh hưởng - chỉ là documentation refactoring)

## Impact

- **Affected files**: `CLAUDE.md` only
- **No code changes**: Không ảnh hưởng source code
- **No API changes**: Không ảnh hưởng backend/frontend
- **Expected result**: CLAUDE.md giảm từ ~438 lines xuống ~130-150 lines
