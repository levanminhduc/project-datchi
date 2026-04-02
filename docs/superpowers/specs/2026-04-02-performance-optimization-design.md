# Performance Optimization — Build + Cache + KeepAlive

**Date:** 2026-04-02
**Approach:** B — Build Optimization + API Caching Layer
**Scope:** Toàn diện nhưng KHÔNG thay đổi logic hoạt động của trang
**Effort:** 3-4 ngày

## Mục tiêu

1. Initial page load nhanh hơn (better cache hit rate on redeploy)
2. Navigate giữa các trang near-instant (KeepAlive + API cache)
3. Quay lại trang trước giữ nguyên state (filter, scroll, data)
4. Giảm bandwidth tiêu thụ (font trim, chunk splitting)

## Hiện trạng

| Metric | Giá trị |
|--------|---------|
| Total JS (uncompressed) | 3.8MB (191 files) |
| Total CSS (uncompressed) | 357KB (51 files) |
| Top chunks | ExcelJS 908KB, Quasar 456KB, Editor 406KB |
| Font files | 12 files (~1.8MB) — 6 weights × 2 styles |
| Service Worker | Không có |
| API caching | Không có |
| KeepAlive | Chỉ 2 trang (inventory, weekly-order) |
| Cache hit on redeploy | ~30% (vendor + app code mixed) |

## Constraints

- KHÔNG thay đổi logic hoạt động của trang
- KHÔNG thay đổi `fetchApi()` signature/behavior
- KHÔNG thêm Service Worker / PWA (phase sau nếu cần)
- KHÔNG split CSS (tránh flash-of-unstyled-content)
- Page component code giữ nguyên — chỉ thêm infra layer

---

## Section 1: Vite Build — Chunk Splitting

### File thay đổi
- `vite.config.mts` — thêm `build.rollupOptions.output.manualChunks`

### Manual Chunks

```
manualChunks:
├── vendor-vue      → vue, vue-router, pinia, @vue/*
├── vendor-quasar   → quasar, @quasar/*
├── vendor-utils    → date-fns, zod, @vueuse/*
├── vendor-heavy    → exceljs, vuedraggable, qrcode (lazy load only)
└── [auto]          → page chunks (giữ nguyên file-based splitting)
```

### Kết quả mong đợi
- Deploy mới: chỉ app chunks đổi hash, vendor chunks giữ nguyên
- Cache hit rate: 30% → ~80%
- User download on redeploy: ~2MB → ~200-400KB

---

## Section 2: KeepAlive

### File thay đổi
- `src/App.vue` — wrap `<router-view>` với `<keep-alive>`
- `src/composables/useKeepAliveRoutes.ts` — composable quản lý cached route list
- Route meta files (nếu cần) — thêm `meta.keepAlive: true`

### Cách hoạt động

```vue
<!-- App.vue -->
<router-view v-slot="{ Component, route }">
  <keep-alive :include="cachedRoutes" :max="10">
    <component :is="Component" :key="route.path" />
  </keep-alive>
</router-view>
```

### Trang được cache

| Route | Component | Lý do |
|-------|-----------|-------|
| `/thread` | thread/index | Listing, hay quay lại |
| `/thread/inventory` | thread/inventory | Trang nặng, nhiều filter |
| `/thread/allocations` | thread/allocations | Hay switch qua lại |
| `/thread/colors` | thread/colors | Lookup, ít thay đổi |
| `/thread/suppliers` | thread/suppliers | Lookup, ít thay đổi |
| `/thread/dashboard` | thread/dashboard | Nhiều widget |
| `/thread/styles` | thread/styles | Listing |
| `/employees` | employees | HR listing |

### Trang KHÔNG cache
- `/login` — security
- `/settings`, `/phan-quyen` — admin, tránh stale
- Form/detail pages (`/thread/styles/[id]`) — dynamic data, memory concern

### Cơ chế
- `:max="10"` → LRU evict trang cũ nhất khi vượt 10
- Realtime subscriptions: `onActivated` resume, `onDeactivated` pause
- `useKeepAliveRoutes` composable: maintain include list từ route meta

---

## Section 3: API Caching Layer (SWR)

### File mới
- `src/lib/api-cache.ts` — In-memory cache store (Map + TTL + LRU)
- `src/composables/useCachedQuery.ts` — SWR composable

### Không thay đổi
- `src/services/api.ts` (`fetchApi`) — giữ nguyên 100%
- Service files — giữ nguyên
- Page/component logic — giữ nguyên

### Cache Store (`api-cache.ts`)

```typescript
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// In-memory Map, max 50 entries, LRU eviction
// Functions: get, set, invalidate(prefix), clear
```

### SWR Composable (`useCachedQuery.ts`)

```typescript
interface UseCachedQueryOptions {
  ttl?: number        // default 60_000 (1 phút)
  enabled?: boolean   // default true
}

function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: UseCachedQueryOptions
): {
  data: Ref<T | null>
  isLoading: Ref<boolean>
  isRefreshing: Ref<boolean>
  error: Ref<string | null>
  refresh: () => Promise<void>
}
```

### Flow

```
useCachedQuery(key, fetcher, { ttl })
  │
  ├─ Cache HIT + fresh (age < ttl) → return cached, done
  │
  ├─ Cache HIT + stale (age >= ttl) → return cached immediately
  │     └─ background: fetcher() → update cache → update reactive ref
  │
  └─ Cache MISS → isLoading=true → fetcher() → store + return
```

### Cache Policy

| Data type | TTL | Cache key pattern |
|-----------|-----|-------------------|
| Suppliers | 5 min | `/api/suppliers` |
| Colors | 5 min | `/api/thread/colors` |
| Warehouses | 5 min | `/api/warehouses` |
| Thread Types | 3 min | `/api/thread/types` |
| Employees, Positions | 5 min | `/api/employees`, `/api/positions` |
| Inventory listing | 30 sec | `/api/thread/inventory?page=...` |
| Dashboard widgets | 1 min | `/api/dashboard/*` |
| Allocations | 30 sec | `/api/allocations?...` |

### Cache Invalidation

| Trigger | Action |
|---------|--------|
| Mutation success (POST/PUT/DELETE) | `invalidateCache(prefix)` trong composable |
| Realtime event | `invalidateCache(prefix)` trong `useRealtime` callback |
| User logout | `clearAllCache()` |
| Tab focus after >5min away | Revalidate all stale entries |

### Adoption Priority

1. **Lookup composables (đầu tiên):** useSuppliers, useColors, useWarehouses, usePositions — ít thay đổi, TTL dài, dùng ở nhiều trang
2. **Thread master data:** useThreadTypes — dùng phổ biến
3. **Listing composables:** useInventory, useAllocations, useEmployees — TTL ngắn hơn
4. **Dashboard:** useDashboard — nhiều widget calls

### Adoption Pattern

Composables opt-in dần:
```typescript
// BEFORE (useSuppliers.ts)
const fetchSuppliers = async () => {
  suppliers.value = await supplierService.getAll()
}

// AFTER — chỉ thay đổi trong composable, page giữ nguyên
const { data: suppliers, isLoading } = useCachedQuery(
  '/api/suppliers',
  () => supplierService.getAll(),
  { ttl: 5 * 60_000 }
)
```

### Memory Management
- Max 50 entries, LRU eviction khi đầy
- `clearAllCache()` on logout
- `window 'focus'` event → revalidate stale entries nếu tab bị bỏ >5 phút

---

## Section 4: Font & Initial Load

### 4a. Font Optimization

**File:** `vite.config.mts` — `Fonts` plugin config

```typescript
// BEFORE: 6 weights × 2 styles = 12 files (~1.8MB)
weights: [100, 300, 400, 500, 700, 900],
styles: ['normal', 'italic'],

// AFTER: 3 weights × 1 style = 3 files (~450KB)
weights: [400, 500, 700],
styles: ['normal'],
```

Tiết kiệm: ~1.3MB download

### 4b. index.html — Loading Indicator + Preload

**File:** `index.html`

Thay đổi:
- `<title>` → "Hòa Thọ Điện Bàn"
- `<link rel="preload">` cho Roboto 400 woff2
- Inline loading spinner trong `<div id="app">` — hiện ngay, Vue auto-replace khi mount

### 4c. Nginx Font Cache

**Files:** `nginx.conf`, `nginx.docker.conf`

Thêm location block cho font files:
```nginx
location ~* \.(woff2?|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

---

## Testing Strategy

| Test | Cách verify |
|------|-------------|
| Chunk splitting | `npm run build` → kiểm tra dist/assets/ có vendor-* chunks riêng |
| KeepAlive | Navigate đi rồi quay lại → filter/scroll vẫn còn |
| API Cache | Open DevTools Network → navigate qua lại → ít request hơn |
| SWR behavior | Modify data → quay lại trang → thấy data cũ rồi tự update |
| Font trim | Build → kiểm tra chỉ 3 font files |
| Loading indicator | Hard refresh → thấy spinner trước khi app load |
| Cache invalidation | Create/Update/Delete → navigate → thấy data mới |
| Memory | Navigate nhiều trang → check memory tab không tăng liên tục |

## Files Changed Summary

| File | Thay đổi |
|------|----------|
| `vite.config.mts` | manualChunks + font trim |
| `index.html` | title + preload + loading indicator |
| `src/App.vue` | Wrap router-view với KeepAlive |
| `src/lib/api-cache.ts` | **MỚI** — cache store |
| `src/composables/useCachedQuery.ts` | **MỚI** — SWR composable |
| `src/composables/useKeepAliveRoutes.ts` | **MỚI** — KeepAlive route management |
| `nginx.conf` | Font cache headers |
| `nginx.docker.conf` | Font cache headers |
| Composables (opt-in) | Wrap service calls với useCachedQuery |
