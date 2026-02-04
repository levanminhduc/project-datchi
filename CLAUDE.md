# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Search Rules

**CRITICAL: Always use MCP Context Engine (`augment-context-engine_codebase-retrieval`) as the PRIMARY tool for codebase search.**

| Scenario | Tool to Use |
|----------|-------------|
| Finding code by meaning/purpose | `augment-context-engine_codebase-retrieval` (FIRST CHOICE) |
| "Where is X?", "How does Y work?" | `augment-context-engine_codebase-retrieval` |
| Understanding codebase structure | `augment-context-engine_codebase-retrieval` |
| Finding exact string/identifier | `grep` or `ast_grep_search` |
| Finding all references to a symbol | `lsp_find_references` |

**Why Context Engine First:**
- Semantic search understands intent, not just keywords
- Real-time index reflects current codebase state
- Cross-language retrieval support
- Higher quality recall for complex queries

## Project Overview

Vue 3 + Quasar Framework application with Hono backend and Supabase database. Features employee management with CRUD operations and a custom UI component library wrapping Quasar components.

## Development Commands

```bash
# Start frontend dev server (port 5173)
npm run dev

# Start backend API server (port 3000)
npm run server

# Run both frontend and backend concurrently
npm run dev:all

# Build for production (includes type-check)
npm run build

# Type checking only
npm run type-check

# Lint and auto-fix
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Frontend-Backend Data Flow

```
Supabase → Hono API → Vue Service → Composable → Component
```

**Stack:**
- Frontend: Vue 3 + Quasar 2 + TypeScript + Vite
- Backend: Hono (Node.js) with @hono/node-server
- Database: Supabase (PostgreSQL)
- Routing: unplugin-vue-router (file-based, auto-generated)

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/pages/` | Page components with auto-routing (file name = route) |
| `src/components/ui/` | Quasar wrapper components with standardized props |
| `src/composables/` | Vue composables for state and logic |
| `src/services/` | API client and service layers |
| `src/types/ui/` | TypeScript interfaces for UI components |
| `server/` | Hono backend API |
| `server/routes/` | API route handlers |
| `server/db/` | Supabase client configuration |

### UI Component Library Pattern

Components in `src/components/ui/` wrap Quasar components with:
- Standardized props and Vietnamese defaults
- TypeScript interfaces from `src/types/ui/`
- v-model:modelValue for two-way binding
- Slot forwarding via `v-for="(_, name) in $slots"`

Example naming conventions:
- Wrapper: `App[Name]` (AppButton, AppInput)
- Composite: `[Context][Name]` (DataTable, FormDialog)
- Item: `[Parent]Item` (ListItem, StepperStep)

### Composable Pattern

Composables provide unified APIs wrapping Quasar plugins:

```typescript
// useSnackbar() - wraps $q.notify()
snackbar.success('Message')  // NOT $q.notify()

// useConfirm() - wraps $q.dialog()
const confirmed = await confirm('Are you sure?')

// useLoading() - manages loading state
const data = await loading.withLoading(async () => fetchData())
```

**Important:** Composables already show notifications on CRUD success/error. Pages should NOT add duplicate notifications.

## Critical Patterns and Gotchas

### Environment Variables

Backend requires `dotenv.config()` before accessing `process.env`:
```typescript
import dotenv from 'dotenv'
dotenv.config()  // Must be before any process.env access
```

Frontend uses `VITE_` prefix (`import.meta.env.VITE_API_URL`).

### Supabase Dual Client Pattern

```typescript
// server/db/supabase.ts
supabase      // anon key - respects RLS
supabaseAdmin // service_role key - bypasses RLS (backend only)
```

Use `supabaseAdmin` for backend CRUD operations. Never expose to frontend.

### API Response Structure

All API responses use: `{ data, error, message }` with Vietnamese error messages.

### Quasar-Specific Patterns

1. **Icons**: Use Material Icons format only (`check_circle`, not `mdi-check-circle`)

2. **$q.notify() undefined handling**: Use conditional spread to avoid overriding defaults:
   ```typescript
   $q.notify({
     message,
     type,
     ...(color && { color }),  // Only include if defined
   })
   ```

3. **q-popup-edit rollback**: Store original value for API failure revert:
   ```typescript
   @save="(val, initialVal) => handler(val, initialVal)"
   ```

4. **Responsive columns**: Use `$q.screen.lt.sm` to switch column arrays for mobile/desktop

5. **Pagination reset**: Watch search/filter changes to reset `page = 1`

### Vue Reactive Objects to API

Always spread reactive objects before passing to API functions:
```typescript
createEmployee({ ...formData })  // NOT createEmployee(formData)
```

### Supabase Large Dataset Fetching

Supabase limits responses to 1000 rows. Use batch fetching:
```typescript
// Use limit=0 query param to trigger batch fetch on backend
// Backend loops with .range(offset, offset + BATCH_SIZE - 1)
```

### Duplicate Check Before Insert

Check for existing records with unique fields before insert, return 409 with Vietnamese message instead of relying on database constraint errors.

### Dynamic Import Error Workaround

Router includes workaround for Vite dynamic import failures (see `src/router/index.ts`):
```typescript
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    location.assign(to.fullPath)  // Reload page once
  }
})
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
```
PORT=3000
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Type Definitions

- Employee types: `src/types/employee.ts` and `server/types/employee.ts`
- UI component types: `src/types/ui/` (base.ts, buttons.ts, inputs.ts, etc.)
- Auto-generated: `src/typed-router.d.ts`, `src/components.d.ts`
