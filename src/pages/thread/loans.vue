<template>
  <q-page padding>
    <PageHeader
      title="Mượn Chỉ"
      subtitle="Quản lý các khoản mượn chỉ giữa các tuần"
    />

    <q-card
      flat
      bordered
    >
      <q-card-section class="row items-center q-pb-none">
        <div class="text-subtitle1 text-weight-medium col">
          Danh sách mượn chỉ
        </div>
        <AppButton
          flat
          icon="refresh"
          label="Tải lại"
          :loading="isLoading"
          @click="loadLoans"
        />
      </q-card-section>

      <q-card-section>
        <q-table
          :rows="loans"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="isLoading"
          :rows-per-page-options="[20, 50, 100]"
          :filter="filter"
        >
          <template #top-right>
            <q-input
              v-model="filter"
              dense
              outlined
              placeholder="Tìm kiếm..."
            >
              <template #append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>

          <template #body-cell-from_week="props">
            <q-td :props="props">
              <router-link
                :to="`/thread/weekly-order/${props.row.from_week?.id}`"
                class="text-primary"
              >
                {{ props.row.from_week?.week_name || '-' }}
              </router-link>
            </q-td>
          </template>

          <template #body-cell-to_week="props">
            <q-td :props="props">
              <router-link
                :to="`/thread/weekly-order/${props.row.to_week?.id}`"
                class="text-primary"
              >
                {{ props.row.to_week?.week_name || '-' }}
              </router-link>
            </q-td>
          </template>

          <template #body-cell-thread_type="props">
            <q-td :props="props">
              <span class="text-weight-medium">{{ props.row.thread_type?.code }}</span>
              <span class="text-grey-6 q-ml-xs">{{ props.row.thread_type?.name }}</span>
            </q-td>
          </template>

          <template #no-data>
            <div class="text-center text-grey q-pa-xl">
              <q-icon
                name="swap_horiz"
                size="48px"
                color="grey-5"
              />
              <div class="q-mt-md">
                Chưa có khoản mượn chỉ nào
              </div>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import type { ThreadOrderLoan } from '@/types/thread'
import type { QTableColumn } from 'quasar'
import { useQuasar } from 'quasar'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.allocations.view'],
  },
})

const $q = useQuasar()

const loans = ref<ThreadOrderLoan[]>([])
const isLoading = ref(false)
const filter = ref('')

const columns: QTableColumn[] = [
  {
    name: 'from_week',
    label: 'Tuần cho mượn',
    field: (row) => row.from_week?.week_name,
    align: 'left',
    sortable: true,
  },
  {
    name: 'to_week',
    label: 'Tuần mượn',
    field: (row) => row.to_week?.week_name,
    align: 'left',
    sortable: true,
  },
  {
    name: 'thread_type',
    label: 'Loại chỉ',
    field: (row) => row.thread_type?.code,
    align: 'left',
    sortable: true,
  },
  {
    name: 'quantity_cones',
    label: 'Số cuộn',
    field: 'quantity_cones',
    align: 'right',
    sortable: true,
  },
  {
    name: 'quantity_meters',
    label: 'Số mét',
    field: 'quantity_meters',
    align: 'right',
    sortable: true,
    format: (val) => (val ? Number(val).toLocaleString('vi-VN') : '-'),
  },
  {
    name: 'reason',
    label: 'Lý do',
    field: 'reason',
    align: 'left',
  },
  {
    name: 'created_at',
    label: 'Ngày tạo',
    field: 'created_at',
    align: 'left',
    sortable: true,
    format: (val) => new Date(val).toLocaleDateString('vi-VN'),
  },
]

async function loadLoans() {
  isLoading.value = true
  try {
    loans.value = await weeklyOrderService.getAllLoans()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Lỗi tải dữ liệu',
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadLoans()
})
</script>
