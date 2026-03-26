# server/ - Hono Backend API

Backend API layer using Hono framework with Supabase.

## STRUCTURE

```
server/
├── index.ts          # Entry point, route mounting, CORS config
├── routes/           # 19 API route handlers
├── db/               # supabase.ts (anon + admin clients)
├── middleware/       # auth.ts (JWT verification)
├── types/            # Backend-specific type definitions
└── scripts/          # Utility scripts
```

## CONVENTIONS

### Route Pattern
```typescript
const router = new Hono()
router.get('/', async (c) => {
  try {
    const { data, error } = await supabaseAdmin.from('table').select()
    if (error) throw error
    return c.json({ data, error: null })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})
export default router
```

### Response Structure
```typescript
{ data: T | null, error: string | null, message?: string }
```
- Vietnamese error messages always
- HTTP status codes: 200 success, 400 validation, 401 auth, 404 not found, 500 server

### Supabase Client Usage
- `supabase` → anon key, RLS applies
- `supabaseAdmin` → service_role, bypasses RLS (use for CRUD)

### Environment
`dotenv.config()` MUST be called at top of index.ts BEFORE any `process.env` access.

## WHERE TO LOOK

| Task | File |
|------|------|
| Add new API | `routes/{domain}.ts`, mount in `index.ts` |
| Auth middleware | `middleware/auth.ts` |
| JWT config | `routes/auth.ts` |
| DB clients | `db/supabase.ts` |

## ANTI-PATTERNS

- Don't use `supabase` (anon) for backend CRUD → use `supabaseAdmin`
- Don't expose service_role key to frontend
- Don't forget `.range()` loop for datasets >1000 rows
