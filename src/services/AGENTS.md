# src/services/ - API Client Layer

Frontend API clients using fetchApi pattern.

## STRUCTURE

```
services/
├── index.ts              # Barrel exports
├── api.ts                # fetchApi helper, ApiError class
├── [domain]Service.ts    # Domain-specific API clients
```

## CONVENTIONS

### Service Pattern
```typescript
const BASE = '/api/domain'

export const domainService = {
  async getAll(): Promise<Item[]> {
    const res = await fetchApi<{ data: Item[] }>(BASE)
    return res.data
  },
  
  async create(dto: CreateDTO): Promise<Item> {
    const res = await fetchApi<{ data: Item }>(BASE, {
      method: 'POST',
      body: JSON.stringify(dto),
    })
    return res.data
  },
}
```

### fetchApi
- Adds `Content-Type: application/json`
- Adds `Authorization: Bearer {token}` if logged in
- Throws `ApiError` on non-2xx responses
- Base URL from `VITE_API_URL`

### Error Handling
```typescript
try {
  await domainService.create(data)
} catch (err) {
  if (err instanceof ApiError) {
    snackbar.error(err.message)  // Vietnamese from backend
  }
}
```

## SERVICES

| Service | Domain |
|---------|--------|
| `employeeService` | HR management |
| `threadService` | Thread types |
| `inventoryService` | Stock tracking |
| `allocationService` | Allocations |
| `recoveryService` | Cone recovery |
| `dashboardService` | Analytics |
| `colorService` | Thread colors |
| `supplierService` | Suppliers |
| `lotService` | Lot management |
| `reportService` | Reports |

## WHERE TO LOOK

| Task | File |
|------|------|
| Add new API client | `{domain}Service.ts`, export in `index.ts` |
| Modify fetch logic | `api.ts` |

## ANTI-PATTERNS

- Don't call `fetch()` directly → use `fetchApi()`
- Don't call Supabase from frontend → use services
