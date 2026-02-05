# src/types/ - TypeScript Type Definitions

Type definitions for frontend application.

## STRUCTURE

```
types/
├── index.ts          # Barrel exports
├── auth/             # Authentication types
├── thread/           # Thread domain types (10 files)
├── ui/               # UI component interfaces (12 files)
├── employee.ts       # Employee models
├── position.ts       # Position models
├── navigation.ts     # Navigation types
├── qr.ts             # QR code types
├── qr-label.ts       # QR label printing
└── components.ts     # Auto-generated component types
```

## CONVENTIONS

### Organization
- **Domain types**: `thread/*.ts` - inventory, allocation, recovery, lot, color, supplier
- **UI types**: `ui/*.ts` - component prop interfaces
- **Auth types**: `auth/*.ts` - user, session, permission
- **Shared**: Root level for cross-cutting types

### Naming
```typescript
// Entity: PascalCase
interface ThreadType { ... }

// Props: [Component]Props
interface ButtonProps { ... }

// DTOs: Create/Update prefix
interface CreateThreadDTO { ... }
interface UpdateThreadDTO { ... }

// Enums: PascalCase with singular name
enum AllocationStatus { PENDING, CONFIRMED, COMPLETED }
```

### Export Pattern
```typescript
// Each file exports its types
export interface ThreadColor { ... }
export type ColorId = string

// index.ts re-exports all
export * from './thread'
export * from './ui'
export * from './auth'
```

## WHERE TO LOOK

| Task | File |
|------|------|
| Thread domain types | `thread/*.ts` |
| UI component props | `ui/*.ts` |
| Auth/permission types | `auth/*.ts` |
| Employee types | `employee.ts` |
| Add new domain type | Create in appropriate subdir, export from index.ts |

## ANTI-PATTERNS

- Don't inline types in components → define in `types/`
- Don't use `any` → define proper interfaces
- Don't duplicate types between frontend/backend → share via common file
