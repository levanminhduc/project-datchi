<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="col">
        <h5 class="q-ma-none">
          Quản lý ngày giao hàng
        </h5>
        <p class="text-grey-7 q-mb-none">
          Theo dõi tình trạng giao hàng của NCC theo tuần đặt chỉ
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="row q-mb-md q-gutter-sm items-center">
      <AppSelect
        v-model="statusFilter"
        :options="statusOptions"
        label="Trạng thái"
        dense
        style="min-width: 150px"
        @update:model-value="loadData"
      />
      <q-space />
      <q-btn
        color="primary"
        icon="refresh"
        label="Tải lại"
        :loading="loading"
        @click="loadData"
      />
    </div>

    <!-- Table -->
    <q-table
      :rows="deliveries"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      dense
      :rows-per-page-options="[20, 50, 0]"
      :pagination="{ rowsPerPage: 20 }"
      :row-class="(row: DeliveryRecord) => row.is_overdue ? 'bg-red-1' : ''"
    >
      <!-- delivery_date cell with popup edit -->
      <template #body-cell-delivery_date="props">
        <q-td :props="props">
          <span class="cursor-pointer text-primary">
            {{ formatDate(props.row.delivery_date) }}
            <q-popup-proxy>
              <DatePicker
                :model-value="toDatePickerFormat(props.row.delivery_date)"
                @update:model-value="(val: string | null) => handleDeliveryDateChange(props.row.id, val)"
              />
            </q-popup-proxy>
          </span>
        </q-td>
      </template>

      <!-- days_remaining with color -->
      <template #body-cell-days_remaining="props">
        <q-td :props="props">
          <q-badge
            :color="getDaysColor(props.row.days_remaining, props.row.status)"
            :label="props.row.status === 'delivered' ? '✓' : `${props.row.days_remaining} ngày`"
          />
        </q-td>
      </template>

      <!-- status badge -->
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="props.row.status === 'delivered' ? 'green' : 'orange'"
            :label="props.row.status === 'delivered' ? 'Đã giao' : 'Chờ giao'"
          />
        </q-td>
      </template>

      <!-- actions -->
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            v-if="props.row.status === 'pending'"
            size="sm"
            color="green"
            label="Đã giao"
            dense
            flat
            @click="openDeliveredDialog(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Mark as Delivered Dialog -->
    <q-dialog v-model="showDeliveredDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">
            Xác nhận đã giao hàng
          </div>
        </q-card-section>
        <q-card-section>
          <q-input
            :model-value="formatDate(fromDatePickerFormat(actualDeliveryDate) || actualDeliveryDate)"
            label="Ngày giao thực tế"
            dense
            outlined
            readonly
          >
            <template #append>
              <q-icon
                name="event"
                class="cursor-pointer"
              >
                <q-popup-proxy>
                  <DatePicker
                    :model-value="actualDeliveryDate"
                    @update:model-value="(val: string | null) => { if (val) actualDeliveryDate = val }"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            v-close-popup
            flat
            label="Hủy"
          />
          <q-btn
            color="green"
            label="Xác nhận"
            :loading="updating"
            @click="confirmDelivered"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { QTableColumn } from 'quasar'
import { useSnackbar } from '@/composables/useSnackbar'
import { deliveryService } from '@/services/deliveryService'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import type { DeliveryRecord } from '@/types/thread'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.view'],
  },
})

const snackbar = useSnackbar()

const deliveries = ref<DeliveryRecord[]>([])
const loading = ref(false)
const updating = ref(false)
const statusFilter = ref<string | null>(null)

const statusOptions = [
  { label: 'Tất cả', value: null },
  { label: 'Chờ giao', value: 'pending' },
  { label: 'Đã giao', value: 'delivered' },
]

// Delivered dialog
const showDeliveredDialog = ref(false)
const selectedDelivery = ref<DeliveryRecord | null>(null)
const actualDeliveryDate = ref('')

const columns: QTableColumn[] = [
  { name: 'week_name', label: 'Tuần', field: 'week_name', align: 'left', sortable: true },
  { name: 'thread_type_name', label: 'Loại chỉ', field: 'thread_type_name', align: 'left', sortable: true },
  { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left', sortable: true },
  { name: 'delivery_date', label: 'Ngày giao dự kiến', field: 'delivery_date', align: 'center', sortable: true },
  { name: 'days_remaining', label: 'Còn lại (ngày)', field: 'days_remaining', align: 'center', sortable: true },
  {
    name: 'actual_delivery_date',
    label: 'Ngày giao thực tế',
    field: 'actual_delivery_date',
    align: 'center',
    format: (val: string | null) => {
      if (!val) return '—'
      return new Date(val).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    },
  },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
  { name: 'actions', label: '', field: 'id', align: 'center' },
]

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getDaysColor(days: number | undefined, status: string): string {
  if (status === 'delivered') return 'green'
  if (days === undefined) return 'grey'
  if (days <= 0) return 'red'
  if (days <= 3) return 'orange'
  return 'green'
}

// Convert YYYY-MM-DD to DD/MM/YYYY for DatePicker
function toDatePickerFormat(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

// Convert DD/MM/YYYY to YYYY-MM-DD for API
function fromDatePickerFormat(dateStr: string): string {
  if (!dateStr) return ''
  const [day, month, year] = dateStr.split('/')
  return `${year}-${month}-${day}`
}

async function handleDeliveryDateChange(deliveryId: number, val: string | null) {
  if (!val) return
  const isoDate = fromDatePickerFormat(val)
  await updateDeliveryDate(deliveryId, isoDate)
}

async function loadData() {
  loading.value = true
  try {
    const filters: { status?: 'pending' | 'delivered' } = {}
    if (statusFilter.value) filters.status = statusFilter.value as 'pending' | 'delivered'
    deliveries.value = await deliveryService.getOverview(filters)
  } catch (err) {
    snackbar.error('Lỗi tải dữ liệu: ' + (err instanceof Error ? err.message : 'Unknown'))
  } finally {
    loading.value = false
  }
}

async function updateDeliveryDate(deliveryId: number, newDate: string) {
  try {
    await deliveryService.update(deliveryId, { delivery_date: newDate })
    snackbar.success('Đã cập nhật ngày giao')
    await loadData()
  } catch (err) {
    snackbar.error('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown'))
  }
}

function openDeliveredDialog(delivery: DeliveryRecord) {
  selectedDelivery.value = delivery
  // Use DD/MM/YYYY format for DatePicker
  const today = new Date()
  const day = String(today.getDate()).padStart(2, '0')
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const year = today.getFullYear()
  actualDeliveryDate.value = `${day}/${month}/${year}`
  showDeliveredDialog.value = true
}

async function confirmDelivered() {
  if (!selectedDelivery.value) return
  updating.value = true
  try {
    // Convert DD/MM/YYYY to YYYY-MM-DD for API
    const isoDate = fromDatePickerFormat(actualDeliveryDate.value)
    await deliveryService.update(selectedDelivery.value.id, {
      status: 'delivered',
      actual_delivery_date: isoDate,
    })
    snackbar.success('Đã xác nhận giao hàng')
    showDeliveredDialog.value = false
    await loadData()
  } catch (err) {
    snackbar.error('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown'))
  } finally {
    updating.value = false
  }
}

onMounted(loadData)
</script>
