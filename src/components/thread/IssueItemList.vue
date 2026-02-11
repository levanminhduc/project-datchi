<script setup lang="ts">
/**
 * IssueItemList - Display list of issued cones
 * Xuất kho sản xuất - Issue to Production
 *
 * Shows table of issued items with totals and remove functionality
 */
import { computed } from 'vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import type { IssueItem } from '@/types/thread/issue'

interface Props {
  items: IssueItem[]
  readonly?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  loading: false,
})

const emit = defineEmits<{
  'remove': [item: IssueItem]
}>()

// Table columns definition
const columns = [
  {
    name: 'cone_code',
    label: 'Mã Cuộn',
    field: 'cone_code',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'quantity_meters',
    label: 'Số Mét',
    field: 'quantity_meters',
    align: 'right' as const,
    format: (val: number) => val.toLocaleString('vi-VN'),
    sortable: true,
  },
  {
    name: 'batch_number',
    label: 'Số Batch',
    field: 'batch_number',
    align: 'center' as const,
  },
  {
    name: 'issued_by',
    label: 'Người Xuất',
    field: 'issued_by',
    align: 'left' as const,
  },
  {
    name: 'issued_at',
    label: 'Thời Gian',
    field: 'issued_at',
    align: 'left' as const,
    format: (val: string) => new Date(val).toLocaleString('vi-VN'),
    sortable: true,
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'center' as const,
  },
]

// Calculate totals
const totalMeters = computed(() =>
  props.items.reduce((sum, item) => sum + item.quantity_meters, 0)
)

const totalItems = computed(() => props.items.length)

// Handle remove
function handleRemove(item: IssueItem) {
  emit('remove', item)
}
</script>

<template>
  <div class="issue-item-list">
    <q-table
      :rows="items"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      dense
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
    >
      <!-- Cone code with over-limit badge -->
      <template #body-cell-cone_code="slotProps">
        <q-td :props="slotProps">
          <span class="text-weight-medium">{{ slotProps.value }}</span>
          <q-badge
            v-if="slotProps.row.over_limit_notes"
            color="warning"
            class="q-ml-sm"
          >
            Vượt ĐM
            <q-tooltip>{{ slotProps.row.over_limit_notes }}</q-tooltip>
          </q-badge>
        </q-td>
      </template>

      <!-- Actions column -->
      <template #body-cell-actions="slotProps">
        <q-td :props="slotProps">
          <AppButton
            v-if="!readonly"
            icon="delete"
            size="sm"
            variant="flat"
            round
            color="negative"
            @click="handleRemove(slotProps.row)"
          >
            <q-tooltip>Gỡ cuộn</q-tooltip>
          </AppButton>
        </q-td>
      </template>

      <!-- Bottom row with totals -->
      <template
        v-if="items.length > 0"
        #bottom-row
      >
        <q-tr class="bg-grey-2 text-weight-bold">
          <q-td>
            Tổng cộng: {{ totalItems }} cuộn
          </q-td>
          <q-td class="text-right">
            {{ totalMeters.toLocaleString('vi-VN') }} m
          </q-td>
          <q-td colspan="4" />
        </q-tr>
      </template>

      <!-- Empty state -->
      <template #no-data>
        <div class="text-center q-pa-md text-grey">
          <q-icon
            name="inventory_2"
            size="48px"
            class="q-mb-sm"
          />
          <div>Chưa có cuộn nào</div>
        </div>
      </template>

      <!-- Loading state -->
      <template #loading>
        <q-inner-loading
          showing
          color="primary"
        >
          <q-spinner-dots
            size="50px"
            color="primary"
          />
        </q-inner-loading>
      </template>
    </q-table>

    <!-- Summary card below table -->
    <q-card
      v-if="items.length > 0"
      flat
      bordered
      class="q-mt-md bg-blue-1"
    >
      <q-card-section class="row items-center q-gutter-md">
        <div class="col">
          <div class="text-caption text-grey-7">
            Tổng Số Cuộn
          </div>
          <div class="text-h6">
            {{ totalItems }}
          </div>
        </div>
        <q-separator vertical />
        <div class="col">
          <div class="text-caption text-grey-7">
            Tổng Số Mét
          </div>
          <div class="text-h6 text-primary">
            {{ totalMeters.toLocaleString('vi-VN') }} m
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped>
.issue-item-list {
  width: 100%;
}
</style>
