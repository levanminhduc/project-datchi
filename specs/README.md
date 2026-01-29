# Project Specifications

This folder contains specifications for the project-datchi application.

## Preferred Skills

When working on this project, prioritize loading these skills for optimal results:

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

### How to Load Skills

Use the skill tool at the start of a task:
- Request: "Load skill frontend-design" or include in task description
- Skills provide specialized knowledge and step-by-step guidance

## Spec Structure

```
specs/
├── README.md                    # This file - project guidelines
├── .learned-patterns.md         # Development patterns and lessons learned
├── features/                    # Feature specifications
│   ├── employee-management.md   # Employee CRUD, inline edit, pagination
│   └── dashboard.md             # Dashboard overview with stat cards
└── ui-components/               # UI component library specs
    ├── requirements.md          # Component requirements and user stories
    └── design.md                # Technical design and patterns
```

## Spec Conventions

### Feature Specs (`features/`)
- One file per feature (merged requirements + design)
- Include: User stories, Acceptance criteria, Technical design, API endpoints
- Status indicator: COMPLETED ✅, IN_PROGRESS 🔄, PLANNED 📋

### Component Specs (`ui-components/`)
- Separate requirements.md and design.md
- Document wrapper patterns, TypeScript interfaces, composables

### Learned Patterns (`.learned-patterns.md`)
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

- [CLAUDE.md](../CLAUDE.md) - Development commands and architecture
- [Employee Management](features/employee-management.md) - Main feature spec
- [UI Components](ui-components/requirements.md) - Component library
