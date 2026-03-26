# Pages Layer

File-based routing với `unplugin-vue-router`. Mỗi `.vue` file = 1 route.

## STRUCTURE

```
pages/
├── index.vue              # / (Dashboard)
├── login.vue              # /login (Public)
├── forbidden.vue          # /forbidden (403 page)
├── employees.vue          # /employees (HR management)
├── phan-quyen.vue         # /phan-quyen (Permissions)
├── kho.vue                # /kho (Warehouses)
├── components.vue         # /components (UI Demo)
├── qr-demo.vue            # /qr-demo (QR features demo)
├── ke-hoach.vue           # /ke-hoach (placeholder)
├── ky-thuat.vue           # /ky-thuat (placeholder)
├── nhan-su/               # HR module
│   └── danh-sach.vue      # /nhan-su/danh-sach
├── reports/               # Reporting module
│   └── allocations.vue    # /reports/allocations
└── thread/                # Thread management (main module)
    ├── index.vue          # /thread (Thread types)
    ├── dashboard.vue      # /thread/dashboard
    ├── inventory.vue      # /thread/inventory
    ├── allocations.vue    # /thread/allocations
    ├── recovery.vue       # /thread/recovery
    ├── requests.vue       # /thread/requests
    ├── stocktake.vue      # /thread/stocktake
    ├── colors.vue         # /thread/colors
    ├── suppliers.vue      # /thread/suppliers
    ├── batch/             # Batch operations
    │   ├── receive.vue    # /thread/batch/receive
    │   ├── issue.vue      # /thread/batch/issue
    │   ├── transfer.vue   # /thread/batch/transfer
    │   └── history.vue    # /thread/batch/history
    ├── lots/              # Lot management
    │   ├── index.vue      # /thread/lots
    │   └── [id].vue       # /thread/lots/:id (dynamic)
    └── mobile/            # Mobile-optimized
        ├── issue.vue      # /thread/mobile/issue
        ├── receive.vue    # /thread/mobile/receive
        └── recovery.vue   # /thread/mobile/recovery
```

## CONVENTIONS

### Route Meta
```typescript
definePage({
  meta: {
    requiresAuth: true,        // Protected route
    permissions: ['domain.action'],  // Required permissions
  }
})
```

### Dynamic Routes
- `[id].vue` → `:id` param
- Access via `useRoute().params.id`

### Page Structure Pattern
```vue
<template>
  <q-page padding>
    <!-- Page Header: Title + Filters + Actions -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12 col-md-3">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Page Title
        </h1>
      </div>
      <div class="col-12 col-md-9">
        <!-- Filters & Actions (responsive) -->
      </div>
    </div>
    
    <!-- Main Content -->
    <AppCard>
      <!-- DataTable or Form -->
    </AppCard>
    
    <!-- Dialogs -->
    <FormDialog v-model="showDialog" ... />
  </q-page>
</template>

<script setup lang="ts">
definePage({
  meta: { requiresAuth: true }
})

// Composables for data & actions
const { items, loading, fetchItems, createItem, ... } = useDomainData()
</script>
```

### Responsive Layout (MANDATORY)
```vue
<!-- Mobile-first: col-12 base, then responsive up -->
<div class="row q-col-gutter-md">
  <!-- Stats cards: 1 col mobile → 2 tablet → 4 desktop -->
  <div class="col-12 col-sm-6 col-md-3">Stat 1</div>
  
  <!-- Form fields: full mobile → 2 cols tablet+ -->
  <div class="col-12 col-sm-6">Field 1</div>
  
  <!-- Sidebar + content -->
  <div class="col-12 col-md-3">Sidebar</div>
  <div class="col-12 col-md-9">Main content</div>
</div>
```

## MODULE BREAKDOWN

### Thread Module (`/thread/...`)
| Page | Purpose | Composable |
|------|---------|------------|
| `index.vue` | Thread types management | `useThreadTypes()` |
| `inventory.vue` | Inventory list & search | `useInventory()` |
| `allocations.vue` | View/manage allocations | `useAllocations()` |
| `recovery.vue` | Partial cone recovery | `useRecovery()` |
| `stocktake.vue` | Physical inventory count | `useStocktake()` |
| `colors.vue` | Color master data | `useColors()` |
| `suppliers.vue` | Supplier master data | `useSuppliers()` |
| `batch/*.vue` | Batch receive/issue/transfer | `useBatchOperations()` |
| `lots/*.vue` | Lot tracking | `useLots()` |
| `mobile/*.vue` | Mobile-optimized for warehouse | Same as desktop |

### Auth Pages
| Page | Auth Required | Notes |
|------|--------------|-------|
| `login.vue` | No | Redirect if already logged in |
| `forbidden.vue` | No | 403 unauthorized page |
| All others | Yes | Redirect to login if not authenticated |

## ANTI-PATTERNS

| Forbidden | Correct |
|-----------|---------|
| `$q.notify()` direct | `useSnackbar().success()` |
| `$q.dialog()` direct | `useConfirm().show()` |
| Hardcode API calls | Use services from `@/services/` |
| Direct Supabase access | Backend API via services |
| `<q-btn>` direct | `<AppButton>` wrapper |

## WHERE TO LOOK

| Need | Location |
|------|----------|
| Add new page | Create `.vue` file here (auto-routing) |
| Add page to thread module | `thread/` subdirectory |
| Mobile-optimized page | `thread/mobile/` |
| Shared page logic | Create composable in `src/composables/` |
| Page types | `src/types/` |
