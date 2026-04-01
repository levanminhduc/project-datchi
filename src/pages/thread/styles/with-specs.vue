<template>
  <q-page padding>
    <PageHeader
      title="Danh Sách Định Mức"
      subtitle="Các mã hàng đã có định mức chỉ"
    >
      <template #actions>
        <SearchInput
          v-model="searchQuery"
          placeholder="Tìm mã hàng, tên..."
          @update:model-value="onSearch"
        />
      </template>
    </PageHeader>

    <DataTable
      v-model:pagination="pagination"
      :rows="styles"
      :columns="columns"
      row-key="id"
      :loading="isLoading"
      :rows-per-page-options="[10, 25, 50, 100]"
      @request="onTableRequest"
    >
      <template #body-cell-style_code="props">
        <q-td :props="props">
          <div class="row items-center no-wrap">
            <q-avatar
              size="32px"
              color="primary"
              text-color="white"
              class="q-mr-sm text-weight-bold"
            >
              {{ getInitials(props.row.style_code) }}
            </q-avatar>
            <div>
              <div class="text-weight-medium">
                {{ props.row.style_code }}
              </div>
              <div class="text-caption text-grey-6">
                {{ props.row.style_name }}
              </div>
            </div>
          </div>
        </q-td>
      </template>

      <template #body-cell-spec_count="props">
        <q-td
          :props="props"
          class="text-center"
        >
          <q-badge
            color="primary"
            :label="props.row.spec_count"
          />
        </q-td>
      </template>

      <template #body-cell-first_created_by="props">
        <q-td :props="props">
          <span v-if="props.row.first_created_by">{{ props.row.first_created_by }}</span>
          <span
            v-else
            class="text-grey-5"
          >-</span>
        </q-td>
      </template>

      <template #body-cell-last_updated_by="props">
        <q-td :props="props">
          <span v-if="props.row.last_updated_by">{{ props.row.last_updated_by }}</span>
          <span
            v-else
            class="text-grey-5"
          >-</span>
        </q-td>
      </template>

      <template #body-cell-last_spec_updated_at="props">
        <q-td :props="props">
          <span v-if="props.row.last_spec_updated_at">{{ formatDate(props.row.last_spec_updated_at) }}</span>
          <span
            v-else
            class="text-grey-5"
          >-</span>
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td
          :props="props"
          class="text-center"
        >
          <q-btn
            flat
            round
            color="primary"
            icon="visibility"
            size="sm"
            @click="viewStyle(props.row.id)"
          >
            <q-tooltip>Xem chi tiết & Định mức</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </DataTable>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStylesWithSpecs } from '@/composables/thread/useStylesWithSpecs'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import SearchInput from '@/components/ui/inputs/SearchInput.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.styles.view'],
  },
})

const router = useRouter()

const {
  styles,
  totalCount,
  searchQuery,
  isLoading,
  fetchStyles,
  handleTableRequest,
} = useStylesWithSpecs()

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'style_code',
  descending: false,
  rowsNumber: 0,
})

const columns = [
  { name: 'style_code', label: 'Mã hàng', field: 'style_code', align: 'left' as const, sortable: true },
  { name: 'spec_count', label: 'Số công đoạn', field: 'spec_count', align: 'center' as const, sortable: true },
  { name: 'first_created_by', label: 'Người nhập', field: 'first_created_by', align: 'left' as const },
  { name: 'last_updated_by', label: 'Người sửa cuối', field: 'last_updated_by', align: 'left' as const },
  { name: 'last_spec_updated_at', label: 'Ngày sửa cuối', field: 'last_spec_updated_at', align: 'left' as const, sortable: true },
  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' as const },
]

function getInitials(code: string): string {
  if (!code) return '?'
  return code.substring(0, 2).toUpperCase()
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function viewStyle(id: number) {
  router.push(`/thread/styles/${id}`)
}

function onSearch() {
  pagination.value.page = 1
  fetchStyles()
}

async function onTableRequest(props: {
  pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean }
}) {
  await handleTableRequest(props)
  pagination.value = {
    ...pagination.value,
    page: props.pagination.page,
    rowsPerPage: props.pagination.rowsPerPage,
    sortBy: props.pagination.sortBy,
    descending: props.pagination.descending,
    rowsNumber: totalCount.value,
  }
}

watch(totalCount, (n) => {
  pagination.value.rowsNumber = n
})

onMounted(async () => {
  await fetchStyles()
  pagination.value.rowsNumber = totalCount.value
})
</script>
