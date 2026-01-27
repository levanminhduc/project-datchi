<template>
  <q-table
    v-bind="$attrs"
    v-model:pagination="paginationModel"
    v-model:selected="selectedModel"
    :rows="rows"
    :columns="columns"
    :row-key="rowKey"
    :loading="loading"
    :filter="filter"
    :rows-per-page-options="rowsPerPageOptions"
    :selection="selection"
    :flat="flat"
    :bordered="bordered"
    :square="square"
    :dense="dense"
    :dark="dark"
    :hide-header="hideHeader"
    :hide-bottom="hideBottom"
    :hide-pagination="hidePagination"
    :hide-selected-banner="hideSelectedBanner"
    :no-data-label="noDataLabel"
    :no-results-label="noResultsLabel"
    :loading-label="loadingLabel"
    :separator="separator"
    :wrap-cells="wrapCells"
    :virtual-scroll="virtualScroll"
    :virtual-scroll-slice-size="virtualScrollSliceSize"
    :virtual-scroll-item-size="virtualScrollItemSize"
    :binary-state-sort="binaryStateSort"
    :column-sort-order="columnSortOrder"
    :sort-method="sortMethod"
    :title="title"
    :grid="grid"
    :grid-header="gridHeader"
    :card-container-class="cardContainerClass"
    :card-container-style="cardContainerStyle"
    :card-class="cardClass"
    :card-style="cardStyle"
    :table-class="tableClass"
    :table-style="tableStyle"
    :table-header-class="tableHeaderClass"
    :table-header-style="tableHeaderStyle"
    :color="color"
    :icon-first-page="iconFirstPage"
    :icon-prev-page="iconPrevPage"
    :icon-next-page="iconNextPage"
    :icon-last-page="iconLastPage"
    class="app-data-table"
    @request="emit('request', $event)"
    @row-click="emit('rowClick', $event)"
  >
    <!-- Loading State -->
    <template #loading>
      <q-inner-loading showing>
        <q-spinner-dots size="50px" color="primary" />
      </q-inner-loading>
    </template>

    <!-- Empty State -->
    <template #no-data>
      <EmptyState
        :icon="emptyIcon"
        :title="emptyTitle"
        :subtitle="emptySubtitle"
      >
        <slot name="empty-action" />
      </EmptyState>
    </template>

    <!-- Pass through all slots -->
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps || {}" />
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DataTableProps } from '@/types/ui'
import EmptyState from '../feedback/EmptyState.vue'

const props = withDefaults(defineProps<DataTableProps>(), {
  rowKey: 'id',
  loading: false,
  filter: '',
  rowsPerPageOptions: () => [10, 25, 50, 100],
  selection: 'none',
  selected: () => [],
  emptyIcon: 'inbox',
  emptyTitle: 'Không có dữ liệu',
  emptySubtitle: 'Chưa có dữ liệu để hiển thị',
  flat: true,
  bordered: true,
  square: false,
  dense: false,
  hideHeader: false,
  hideBottom: false,
  hidePagination: false,
  hideSelectedBanner: false,
  noDataLabel: 'Không có dữ liệu',
  noResultsLabel: 'Không tìm thấy kết quả',
  loadingLabel: 'Đang tải...',
  separator: 'horizontal',
  wrapCells: false,
  virtualScroll: false,
  binaryStateSort: false,
  columnSortOrder: 'ad',
  grid: false,
  gridHeader: false,
})

const emit = defineEmits<{
  'update:pagination': [value: DataTableProps['pagination']]
  'update:selected': [value: any[]]
  request: [props: any]
  rowClick: [evt: any]
}>()

const paginationModel = computed({
  get: () => props.pagination ?? { page: 1, rowsPerPage: 25 },
  set: (value) => emit('update:pagination', value),
})

const selectedModel = computed({
  get: () => props.selected,
  set: (value) => emit('update:selected', value),
})
</script>

<style scoped>
.app-data-table {
  max-width: 100%;
}
</style>
