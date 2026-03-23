# hono.md

Backend Hono với Supabase

## Skills Cần Gọi

- `hono-routing` - Routing, validation, middleware, error handling
- `supabase-postgres-best-practices` - Query optimization, schema design, RLS (khi làm việc với database)

## Quy Tắc Bắt Buộc

### Environment

- Luôn gọi `dotenv.config()` TRƯỚC khi access `process.env`
- File: `server/index.ts` (đầu file)

### Supabase Pattern

- `supabase` (anon key): Cho frontend-like operations, respects RLS
- `supabaseAdmin` (service_role key): Cho CRUD backend, bypasses RLS
- KHÔNG expose `supabaseAdmin` ra frontend

### API Response Structure

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```
