---
name: enhance
description: "/enhance [prompt user request]"
user_invocable: true
arguments: prompt to enhance
---

# Skill: /enhance

Transform vague or incomplete user prompts into detailed, structured prompts with real codebase context.
Similar to Augment Code's Prompt Enhancer, but works independently within Claude Code.

When the user invokes `/enhance [prompt]`, follow ALL steps below.

---

## PROCESS (4 steps)

### STEP 1: ANALYZE THE ORIGINAL PROMPT

Read the user's original prompt and determine:
1. **Intent** — What does the user want? (fix bug, add feature, refactor, debug, ask about code...)
2. **Scope** — Which layers are affected? (DB / Backend / Frontend / multiple layers)
3. **Vagueness level** — How vague is it:
   - **Low**: Specifies exact file/function → just add context
   - **Medium**: Describes feature/bug but no exact location → need to find related files
   - **High**: Very generic ("fix bug", "add feature X") → need deep codebase exploration

### STEP 2: GATHER CONTEXT FROM CODEBASE

Based on vagueness level, perform the following:

#### Always do (all levels):
- Read `CLAUDE.md` for conventions, architecture, anti-patterns
- Identify project stack: Vue 3 + Quasar 2 + TypeScript + Vite | Hono backend | Supabase

#### Level Medium + High — Find related files:
- Use `Grep` and `Glob` to find files/functions related to the prompt
- If MCP `mcp__augment-context-engine__codebase-retrieval` is available → use it (priority)
- If MCP `mcp__auggie-prompt-enhancer-mcp__enhance-prompt` is available → use as supplement
- Find up to 5-10 most relevant files

#### Level High — Deep exploration:
- Read content of key related files (service, route, composable, page)
- Identify exact DB column names, function names, type names
- Find similar patterns already in the codebase

### STEP 3: REWRITE THE PROMPT

Rewrite the prompt using this structure:

```
## Goal
[Clear description of the goal, 1-2 sentences]

## Context
- Stack: [relevant stack]
- Architecture: [describe relevant flow]
- Conventions to follow: [list from CLAUDE.md]

## Related files
- `path/to/file1.ts` — [role of this file]
- `path/to/file2.vue` — [role of this file]
- ...

## Implementation steps
1. [Specific step with file path and action]
2. [Specific step...]
3. ...

## Constraints
- [Constraint from CLAUDE.md: e.g., use AppInput not q-input]
- [Language constraint: all messages in Vietnamese]
- [Pattern constraint: use fetchApi, useSnackbar...]
```

### STEP 4: OUTPUT TO USER

Display the enhanced prompt inside a markdown code block (```) so the user can easily copy it.

Add a short note:
> Enhanced prompt with codebase context. You can edit before using.

---

## ENHANCE RULES

### Output format
- Always use **Vietnamese** for the enhanced prompt (unless original prompt is in English)
- Keep the enhanced prompt **concise and actionable** — no more than 40 lines
- Only list files that **actually exist** in the codebase — NEVER guess file names
- Every implementation step must be **specific with file paths** — not generic

### Context injection rules
- **DO**: Add real file paths, exact function/type names, conventions from CLAUDE.md
- **DO**: Add pattern references (e.g., "refer to `threadService.ts` for fetchApi pattern")
- **DO**: Add anti-pattern constraints (e.g., "DO NOT use q-input, use AppInput")
- **DON'T**: Add too much unrelated context
- **DON'T**: Repeat the entire CLAUDE.md — only relevant parts
- **DON'T**: Add comments/docstrings into the prompt

### Project-specific conventions
- Backend: Hono routes, response format `{data, error, message}`, Zod validation
- Frontend: AppInput/AppSelect/AppButton, useSnackbar, fetchApi, useRealtime
- Database: snake_case, soft delete, enum UPPERCASE, migrations in `supabase/migrations/`
- Auth: fetchApi auto-attach token, requirePermission middleware
- Language: All messages/validation/toasts in **Vietnamese**

---

## EXAMPLES

### Example 1: Feature request

**Input:**
```
/enhance thêm trang quản lý nhà cung cấp
```

**Output:**
````
## Mục tiêu
Tạo trang quản lý danh sách nhà cung cấp (Supplier) với CRUD đầy đủ: xem danh sách, thêm mới, sửa, xóa mềm.

## Context
- Stack: Vue 3 + Quasar 2 + TypeScript (frontend) | Hono (backend) | Supabase PostgreSQL (DB)
- Architecture: Supabase → Hono API (`server/routes/`) → Service (`src/services/`) → Composable (`src/composables/`) → Page (`src/pages/`)
- Tính năng tương tự đã có: Quản lý Màu chỉ (`src/pages/thread/colors/`)

## Files liên quan
- `supabase/migrations/` — migration tạo bảng `suppliers`
- `server/routes/suppliers.ts` — API routes (chưa tồn tại, cần tạo)
- `src/services/supplierService.ts` — service layer (chưa tồn tại, cần tạo)
- `src/composables/useSuppliers.ts` — composable (chưa tồn tại, cần tạo)
- `src/pages/suppliers/` — trang list + form (chưa tồn tại, cần tạo)
- `src/services/threadService.ts` — tham khảo pattern fetchApi
- `src/composables/thread/useThreadColors.ts` — tham khảo pattern CRUD composable

## Các bước thực hiện
1. Tạo migration: bảng `suppliers` với cột `id`, `code`, `name`, `phone`, `address`, `is_active`, `created_at`, `updated_at`, `deleted_at`
2. Tạo Hono route `server/routes/suppliers.ts`: GET list, GET by id, POST create, PUT update, DELETE soft-delete. Dùng Zod validation.
3. Đăng ký route trong `server/index.ts`
4. Tạo `src/services/supplierService.ts` dùng fetchApi pattern
5. Tạo `src/composables/useSuppliers.ts` với useSnackbar, useLoading
6. Tạo trang `src/pages/suppliers/SuppliersPage.vue` với AppInput, AppButton, q-table

## Ràng buộc
- Dùng AppInput/AppSelect/AppButton, KHÔNG dùng q-input/q-select/q-btn
- Thông báo toast bằng Tiếng Việt: "Thêm nhà cung cấp thành công", "Xóa nhà cung cấp thành công"
- Dùng fetchApi wrapper, KHÔNG dùng fetch() trực tiếp
- Soft delete (đặt deleted_at), KHÔNG xóa cứng
- Response format: `{ data, error, message }`
````

---

### Example 2: Bug fix

**Input:**
```
/enhance fix lỗi không hiển thị danh sách màu
```

**Output:**
````
## Mục tiêu
Debug và fix lỗi trang danh sách màu chỉ (Thread Colors) không hiển thị data.

## Context
- Flow: `ColorListPage.vue` → `useThreadColors.ts` → `threadColorService.ts` → Hono API `/api/thread-colors` → Supabase `thread_colors`
- Auth: fetchApi auto-attach token từ localStorage('auth_access_token')

## Files cần kiểm tra
- `src/pages/thread/colors/ColorListPage.vue` — trang hiển thị danh sách
- `src/composables/thread/useThreadColors.ts` — composable gọi service
- `src/services/threadColorService.ts` — service gọi API
- `server/routes/threadColors.ts` — API route handler
- Browser Console (Network tab) — kiểm tra response API

## Các bước debug
1. Mở Browser DevTools → Network tab → kiểm tra request GET `/api/thread-colors`
2. Nếu 401: Kiểm tra token trong localStorage, kiểm tra fetchApi có gửi Authorization header
3. Nếu 403: Kiểm tra requirePermission middleware và role của user
4. Nếu 500: Đọc server logs, kiểm tra Supabase query trong route handler
5. Nếu 200 nhưng data rỗng: Kiểm tra query có filter `deleted_at IS NULL`, kiểm tra data trong DB
6. Nếu data có nhưng UI không hiện: Kiểm tra reactive state trong composable, kiểm tra template binding

## Ràng buộc
- KHÔNG sửa auth middleware mà không kiểm tra frontend token flow
- Kiểm tra cả happy path và edge cases sau khi fix
````
