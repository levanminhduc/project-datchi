# Project Specifications

This folder contains all specifications for the project-datchi application - a warehouse/thread management system.

## Consolidated Specs Structure (Updated: 2026-02-02)

```
.claude/
├── CONSTITUTION.md              # Project rules and constraints
├── learned-patterns.md          # Development patterns and lessons learned
├── skills/                      # Claude skills
│   └── ui-ux-pro-max/
├── specs/                       # ← All specifications consolidated here
│   ├── README.md                # This file
│   ├── thread-management-system/ # Core allocation/FEFO logic
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   ├── kho-chi/                 # Warehouse operations (extends thread-management)
│   │   ├── requirements.md      # Batch ops, lots, stocktake
│   │   ├── design.md
│   │   └── tasks.md
│   ├── ui-components/           # Component library specs
│   │   ├── requirements.md
│   │   └── design.md
│   ├── features/                # Feature specifications
│   │   ├── employee-management.md
│   │   └── dashboard.md
│   └── sidebar-redesign/        # CSS sidebar redesign
│       └── requirements.md
└── archive/                     # Archived spec systems
    └── openspec-archived/       # Historical OpenSpec changes
```

## Spec Relationships

### Thread Management System ↔ Kho-Chi

These are **COMPLEMENTARY** specs that work together:

| thread-management-system | kho-chi (extends) |
|-------------------------|-------------------|
| Soft/hard allocation | Warehouse hierarchy (LOCATION → STORAGE) |
| FEFO logic | Batch operations (receive/transfer/issue/return) |
| Conflict resolution | Lot management (lot_number, status, expiry) |
| Partial cone recovery | QR stocktake (continuous scanning, sessions) |
| Recovery workflow | Mobile offline support |

**Read order:** `thread-management-system` first, then `kho-chi` for extensions.

## Preferred Skills

When working on this project, prioritize loading these skills:

| Skill | Use Case |
|-------|----------|
| `frontend-design` | Creating UI components, pages, styling with high design quality |
| `supabase-postgres-best-practices` | Database queries, schema design, RLS policies, performance optimization |
| `hono-routing` | API endpoints, middleware, validation, streaming |
| `vue-best-practices` | Vue 3 components, TypeScript, Composition API, Volar |

### Skill Loading Examples

| Task Type | Skills to Load |
|-----------|----------------|
| New page/component | `frontend-design` + `vue-best-practices` |
| API endpoint | `hono-routing` + `supabase-postgres-best-practices` |
| Full-stack feature | All 4 skills |
| UI styling/design | `frontend-design` |
| Database migration | `supabase-postgres-best-practices` |

## Spec Conventions

### Feature Specs (`features/`)
- One file per feature (merged requirements + design)
- Include: User stories, Acceptance criteria, Technical design, API endpoints
- Status indicator: COMPLETED ✅, IN_PROGRESS 🔄, PLANNED 📋

### System Specs (`thread-management-system/`, `kho-chi/`)
- Separate requirements.md, design.md, tasks.md
- Include validation status and implementation progress

### Component Specs (`ui-components/`)
- Separate requirements.md and design.md
- Document wrapper patterns, TypeScript interfaces, composables

### Learned Patterns (`../learned-patterns.md`)
- Record solutions to problems encountered during development
- Format: Context → Pattern → Reason
- Reference when starting new tasks to avoid repeating mistakes

## Tech Stack Reference

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 + Quasar 2 + TypeScript + Vite |
| Backend | Hono (Node.js) with @hono/node-server |
| Database | Supabase (PostgreSQL) |
| Routing | unplugin-vue-router (file-based) |
| UI Components | Custom wrappers in `src/components/ui/` |

## Quick Links

- [CLAUDE.md](../../CLAUDE.md) - Development commands and architecture
- [Thread Management System](thread-management-system/requirements.md) - Core allocation logic
- [Kho-Chi (Warehouse)](kho-chi/requirements.md) - Batch operations and stocktake
- [Employee Management](features/employee-management.md) - Employee CRUD feature
- [UI Components](ui-components/requirements.md) - Component library
- [Learned Patterns](../learned-patterns.md) - Development patterns
