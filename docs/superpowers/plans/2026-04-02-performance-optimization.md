# Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve page load speed, navigation speed, and cache efficiency through Vite chunk splitting, KeepAlive, SWR API caching, and font/asset optimization.

**Architecture:** 4 independent layers — (1) Vite build config for chunk splitting, (2) KeepAlive wrapper in App.vue with route-path-based caching, (3) in-memory SWR cache layer between composables and services, (4) font trimming + loading indicator. Each layer is independently testable and deployable.

**Tech Stack:** Vue 3 + Vite 8 + Quasar 2, no new dependencies

---

## File Structure

| File | Responsibility | Status |
|------|---------------|--------|
| `vite.config.mts` | Chunk splitting + font trim | Modify |
| `index.html` | Title + preload + loading indicator | Modify |
| `src/App.vue` | KeepAlive wrapper around router-view | Modify |
| `src/lib/api-cache.ts` | In-memory cache store (Map + TTL + LRU) | Create |
| `src/composables/useCachedQuery.ts` | SWR composable for API data | Create |
| `nginx.conf` | Font cache headers (already has static asset cache) | Modify |
| `nginx.docker.conf` | Already has font cache — no change needed | No change |

---

### Task 1: Vite Chunk Splitting

**Files:**
- Modify: `vite.config.mts:40-43` (build section)

- [ ] **Step 1: Add manualChunks to vite.config.mts**

In `vite.config.mts`, replace the `build` block:

```typescript
// BEFORE (line 41-43)
build: {
  chunkSizeWarningLimit: 1000,
},

// AFTER
build: {
  chunkSizeWarningLimit: 1000,
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
            return 'vendor-vue'
          }
          if (id.includes('quasar') || id.includes('@quasar')) {
            return 'vendor-quasar'
          }
          if (id.includes('date-fns') || id.includes('@vueuse') || id.includes('zod')) {
            return 'vendor-utils'
          }
          if (id.includes('exceljs') || id.includes('vuedraggable') || id.includes('qrcode') || id.includes('tiptap')) {
            return 'vendor-heavy'
          }
        }
      },
    },
  },
},
```

- [ ] **Step 2: Build and verify chunk splitting**

Run: `npm run build-only`

Expected: `dist/assets/` contains files named `vendor-vue-*.js`, `vendor-quasar-*.js`, `vendor-utils-*.js`, `vendor-heavy-*.js` alongside page chunks.

Verify with: `ls dist/assets/vendor-*.js`

- [ ] **Step 3: Commit**

```bash
git add vite.config.mts
git commit -m "perf: add manual chunk splitting for better cache hit rate"
```

---

### Task 2: Font Optimization

**Files:**
- Modify: `vite.config.mts:28-38` (Fonts plugin)

- [ ] **Step 1: Trim font weights and remove italic**

In `vite.config.mts`, replace the Fonts plugin config:

```typescript
// BEFORE (line 28-38)
Fonts({
  fontsource: {
    families: [
      {
        name: 'Roboto',
        weights: [100, 300, 400, 500, 700, 900],
        styles: ['normal', 'italic'],
      },
    ],
  },
}),

// AFTER
Fonts({
  fontsource: {
    families: [
      {
        name: 'Roboto',
        weights: [400, 500, 700],
        styles: ['normal'],
      },
    ],
  },
}),
```

- [ ] **Step 2: Build and verify only 3 font files**

Run: `npm run build-only`

Verify: `ls dist/assets/*.woff2 | wc -l` should output 3 (instead of 12).

- [ ] **Step 3: Commit**

```bash
git add vite.config.mts
git commit -m "perf: trim fonts to 3 weights, remove italic (~1.3MB savings)"
```

---

### Task 3: index.html — Title, Preload, Loading Indicator

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update index.html**

Replace the entire `index.html` content:

```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Hòa Thọ Điện Bàn</title>
    <style>
      .app-loader{display:flex;align-items:center;justify-content:center;height:100vh;background:#1976d2}
      .app-loader-spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
      @media(prefers-color-scheme:dark){.app-loader{background:#121212}}
      @keyframes spin{to{transform:rotate(360deg)}}
    </style>
  </head>
  <body>
    <div id="app">
      <div class="app-loader">
        <div class="app-loader-spinner"></div>
      </div>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Key changes:
- `lang="vi"` (was `"en"`)
- `<title>` → "Hòa Thọ Điện Bàn" (was "Quasar App")
- Inline CSS spinner — shows immediately on white screen, Vue auto-replaces `<div id="app">` content on mount
- Dark mode aware via `prefers-color-scheme`

- [ ] **Step 2: Verify loading indicator**

Run: `npm run dev` → open browser → hard refresh (Ctrl+Shift+R).

Expected: Brief blue spinner visible before app mounts. Spinner disappears when Vue hydrates.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "perf: add loading indicator and update title in index.html"
```

---

### Task 4: Nginx Font Cache Headers

**Files:**
- Modify: `nginx.conf:62-66`

Note: `nginx.docker.conf` already has font cache at lines 133-137, no change needed.

- [ ] **Step 1: Verify nginx.docker.conf already has font cache**

Read `nginx.docker.conf:132-137`. Confirm it has:

```nginx
location ~* \.(woff2?|ttf|otf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header Access-Control-Allow-Origin "*";
}
```

If present — no change needed for docker config.

- [ ] **Step 2: Add dedicated font cache block to nginx.conf**

In `nginx.conf`, the existing static asset block at line 62 already catches fonts:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
}
```

Fonts are already covered. No change needed.

- [ ] **Step 3: Commit (skip if no changes)**

If changes were made:
```bash
git add nginx.conf nginx.docker.conf
git commit -m "perf: add font-specific cache headers to nginx"
```

---

### Task 5: API Cache Store

**Files:**
- Create: `src/lib/api-cache.ts`

- [ ] **Step 1: Create api-cache.ts**

Create file `src/lib/api-cache.ts`:

```typescript
interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry>()
const accessOrder: string[] = []
const MAX_ENTRIES = 50

function touchAccessOrder(key: string) {
  const idx = accessOrder.indexOf(key)
  if (idx > -1) accessOrder.splice(idx, 1)
  accessOrder.push(key)
}

function evictIfNeeded() {
  while (cache.size >= MAX_ENTRIES && accessOrder.length > 0) {
    const oldest = accessOrder.shift()!
    cache.delete(oldest)
  }
}

export function getCacheEntry<T>(key: string): { data: T; isStale: boolean } | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null

  touchAccessOrder(key)
  const age = Date.now() - entry.timestamp
  return { data: entry.data, isStale: age >= entry.ttl }
}

export function setCacheEntry<T>(key: string, data: T, ttl: number): void {
  evictIfNeeded()
  cache.set(key, { data, timestamp: Date.now(), ttl })
  touchAccessOrder(key)
}

export function invalidateCache(prefix: string): void {
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
      const idx = accessOrder.indexOf(key)
      if (idx > -1) accessOrder.splice(idx, 1)
    }
  }
}

export function clearAllCache(): void {
  cache.clear()
  accessOrder.length = 0
}

export function getCacheSize(): number {
  return cache.size
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx vue-tsc --noEmit --skipLibCheck 2>&1 | grep api-cache || echo "No errors in api-cache.ts"`

Expected: No TypeScript errors related to `api-cache.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api-cache.ts
git commit -m "feat: add in-memory API cache store with TTL and LRU eviction"
```

---

### Task 6: SWR Composable — useCachedQuery

**Files:**
- Create: `src/composables/useCachedQuery.ts`

- [ ] **Step 1: Create useCachedQuery.ts**

Create file `src/composables/useCachedQuery.ts`:

```typescript
import { ref, onUnmounted, type Ref } from 'vue'
import { getCacheEntry, setCacheEntry } from '@/lib/api-cache'

interface UseCachedQueryOptions {
  ttl?: number
  enabled?: boolean
}

interface UseCachedQueryReturn<T> {
  data: Ref<T | null>
  isLoading: Ref<boolean>
  isRefreshing: Ref<boolean>
  error: Ref<string | null>
  refresh: () => Promise<void>
}

const DEFAULT_TTL = 60_000
const TAB_STALE_THRESHOLD = 5 * 60_000

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: UseCachedQueryOptions,
): UseCachedQueryReturn<T> {
  const ttl = options?.ttl ?? DEFAULT_TTL
  const enabled = options?.enabled ?? true

  const data = ref<T | null>(null) as Ref<T | null>
  const isLoading = ref(false)
  const isRefreshing = ref(false)
  const error = ref<string | null>(null)

  let lastFocusCheck = Date.now()

  async function fetchData(background = false): Promise<void> {
    if (!enabled) return

    if (!background) isLoading.value = true
    else isRefreshing.value = true

    error.value = null

    try {
      const result = await fetcher()
      data.value = result
      setCacheEntry(key, result, ttl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải dữ liệu'
      error.value = msg
    } finally {
      isLoading.value = false
      isRefreshing.value = false
    }
  }

  async function refresh(): Promise<void> {
    await fetchData(false)
  }

  function handleFocus() {
    const now = Date.now()
    if (now - lastFocusCheck < TAB_STALE_THRESHOLD) return
    lastFocusCheck = now

    const cached = getCacheEntry<T>(key)
    if (cached && cached.isStale) {
      fetchData(true)
    }
  }

  function init() {
    if (!enabled) return

    const cached = getCacheEntry<T>(key)

    if (cached) {
      data.value = cached.data

      if (cached.isStale) {
        fetchData(true)
      }
    } else {
      fetchData(false)
    }
  }

  window.addEventListener('focus', handleFocus)
  onUnmounted(() => {
    window.removeEventListener('focus', handleFocus)
  })

  init()

  return { data, isLoading, isRefreshing, error, refresh }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx vue-tsc --noEmit --skipLibCheck 2>&1 | grep useCachedQuery || echo "No errors in useCachedQuery.ts"`

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/composables/useCachedQuery.ts
git commit -m "feat: add useCachedQuery SWR composable for API data caching"
```

---

### Task 7: KeepAlive in App.vue

**Files:**
- Modify: `src/App.vue:90-92` (router-view section)

**Key discovery:** Pages use `<script setup>` without `defineOptions({ name })` — they have no explicit component name. KeepAlive `:include` by name won't work. Instead, use a route-path-based approach: conditionally wrap with KeepAlive based on `route.meta.keepAlive` or a static set of paths.

- [ ] **Step 1: Add keepAlive logic to App.vue script**

In `src/App.vue`, add to the `<script>` block (after line 18):

```typescript
const KEEP_ALIVE_PATHS = new Set([
  '/thread',
  '/thread/inventory',
  '/thread/allocations',
  '/thread/colors',
  '/thread/suppliers',
  '/thread/dashboard',
  '/thread/styles',
  '/employees',
])

const shouldKeepAlive = computed(() => KEEP_ALIVE_PATHS.has(route.path))
```

- [ ] **Step 2: Wrap router-view with conditional KeepAlive**

In `src/App.vue`, replace line 91:

```vue
<!-- BEFORE -->
<router-view />

<!-- AFTER -->
<router-view v-slot="{ Component }">
  <keep-alive :max="10" v-if="shouldKeepAlive">
    <component :is="Component" :key="route.path" />
  </keep-alive>
  <component :is="Component" :key="route.path" v-else />
</router-view>
```

This approach:
- Does NOT require component names (works with anonymous `<script setup>` components)
- Uses `route.path` as cache key — each path gets its own cached instance
- `:max="10"` limits memory usage
- Non-keepalive pages render normally without caching overhead

- [ ] **Step 3: Verify build compiles**

Run: `npm run type-check`

Expected: No TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.vue
git commit -m "perf: add KeepAlive for frequently visited pages"
```

---

### Task 8: Hook clearAllCache into Logout

**Files:**
- Modify: `src/composables/useAuth.ts` (signOut function, around line 521)

- [ ] **Step 1: Import clearAllCache in useAuth.ts**

Add import at top of `src/composables/useAuth.ts`:

```typescript
import { clearAllCache } from '@/lib/api-cache'
```

- [ ] **Step 2: Call clearAllCache in signOut function**

In the `signOut()` function (around line 533, after `clearAll()`), add:

```typescript
// BEFORE
clearAll()
snackbar.success('Đã đăng xuất')

// AFTER
clearAll()
clearAllCache()
snackbar.success('Đã đăng xuất')
```

- [ ] **Step 3: Verify build compiles**

Run: `npm run type-check`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/composables/useAuth.ts
git commit -m "feat: clear API cache on user logout"
```

---

### Task 9: Adopt useCachedQuery in Lookup Composables

**Files:**
- Modify: `src/composables/usePositions.ts` (first adoption — simplest composable)

This task demonstrates the adoption pattern. Other composables (useSuppliers, useColors, useWarehouses) follow the same pattern and can be done incrementally.

- [ ] **Step 1: Add useCachedQuery to usePositions.ts**

In `src/composables/usePositions.ts`, add import:

```typescript
import { useCachedQuery } from './useCachedQuery'
import { invalidateCache } from '@/lib/api-cache'
```

- [ ] **Step 2: Replace fetchPositions with cached version**

Replace the `fetchPositions` function and related state:

```typescript
// BEFORE (around line 26-84)
const positions = ref<PositionOption[]>([])
const error = ref<string | null>(null)
const snackbar = useSnackbar()
const loading = useLoading()
const isLoading = computed(() => loading.isLoading.value)
// ... fetchPositions function ...

// AFTER — replace the state + fetch with useCachedQuery
const snackbar = useSnackbar()

const {
  data: positionsData,
  isLoading,
  error,
  refresh: fetchPositions,
} = useCachedQuery<PositionOption[]>(
  '/api/positions',
  () => positionService.getUniquePositions(),
  { ttl: 5 * 60_000 },
)

const positions = computed(() => positionsData.value ?? [])
```

Remove the `useLoading` import and usage since `useCachedQuery` handles loading state.

Keep all computed properties (`hasPositions`, `positionOptions`, `positionLabels`) and utility functions (`getPositionLabel`, `clearError`) unchanged — they read from `positions` which is still a reactive ref.

The return object stays the same. Pages calling `usePositions()` see no change.

- [ ] **Step 3: Verify build compiles**

Run: `npm run type-check`

Expected: No errors. The composable's public API is unchanged — `positions`, `isLoading`, `error`, `fetchPositions` all still exist with compatible types.

- [ ] **Step 4: Commit**

```bash
git add src/composables/usePositions.ts
git commit -m "perf: adopt useCachedQuery in usePositions (5min TTL)"
```

---

### Task 10: Full Build Verification

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: No errors (or only pre-existing warnings).

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`

Expected: No TypeScript errors.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: Build succeeds. Check output for:
- `dist/assets/vendor-vue-*.js` — exists
- `dist/assets/vendor-quasar-*.js` — exists
- `dist/assets/vendor-utils-*.js` — exists
- `dist/assets/vendor-heavy-*.js` — exists
- Font files: exactly 3 `.woff2` files

Verify: `ls dist/assets/vendor-*.js && ls dist/assets/*.woff2 | wc -l`

- [ ] **Step 4: Commit if any lint fixes were needed**

```bash
git add -A
git commit -m "chore: lint fixes for performance optimization"
```

---

## Post-Implementation: Incremental Adoption

After the core infrastructure is in place, these composables can be migrated to `useCachedQuery` incrementally (same pattern as Task 9):

| Priority | Composable | Cache Key | TTL |
|----------|-----------|-----------|-----|
| 1 | `useSuppliers` | `/api/suppliers` | 5 min |
| 2 | `useColors` | `/api/thread/colors` | 5 min |
| 3 | `useWarehouses` | `/api/warehouses` | 5 min |
| 4 | `useThreadTypes` | `/api/thread/types` | 3 min |
| 5 | `useEmployees` | `/api/employees` | 5 min |

Each migration: import `useCachedQuery` + `invalidateCache`, replace `ref` + `fetchFn` with `useCachedQuery(...)`, add `invalidateCache(prefix)` after mutations. Public API stays identical.
