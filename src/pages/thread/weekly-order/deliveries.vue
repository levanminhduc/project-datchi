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

    <!-- Tabs -->
    <q-tabs
      v-model="activeTab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab
        name="tracking"
        label="Theo dõi giao hàng"
      />
      <q-tab
        name="receive"
        label="Nhập kho"
      />
    </q-tabs>

    <q-separator />

    <q-tab-panels
      v-model="activeTab"
      animated
    >
      <!-- Tab 1: Delivery Tracking -->
      <q-tab-panel name="tracking">
        <!-- Filters -->
        <div class="row q-mb-md q-gutter-sm items-center">
          <AppSelect
            v-model="statusFilter"
            :options="statusOptions"
            label="Trạng thái"
            dense
            style="min-width: 150px"
            @update:model-value="loadTrackingData"
          />
          <q-space />
          <q-btn
            color="primary"
            icon="refresh"
            label="Tải lại"
            :loading="loading"
            @click="loadTrackingData"
          />
        </div>

        <!-- Tracking Table -->
        <q-table
          :rows="deliveries"
          :columns="trackingColumns"
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
                :label="props.row.status === DeliveryStatus.DELIVERED ? '✓' : `${props.row.days_remaining} ngày`"
              />
            </q-td>
          </template>

          <!-- status badge -->
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.status === DeliveryStatus.DELIVERED ? 'green' : 'orange'"
                :label="props.row.status === DeliveryStatus.DELIVERED ? 'Đã giao' : 'Chờ giao'"
              />
            </q-td>
          </template>

          <!-- inventory_status badge (tracking tab) -->
          <template #body-cell-inventory_status="props">
            <q-td :props="props">
              <template v-if="props.row.status === DeliveryStatus.DELIVERED">
                <q-badge
                  v-if="props.row.inventory_status === InventoryReceiptStatus.RECEIVED"
                  color="green"
                  label="Đã nhập đủ"
                />
                <q-badge
                  v-else-if="props.row.inventory_status === InventoryReceiptStatus.PARTIAL"
                  color="orange"
                  :label="`Chờ nhập (${getPendingQuantity(props.row)}/${props.row.total_cones || 0})`"
                />
                <q-badge
                  v-else
                  color="grey"
                  :label="`Chờ nhập (${props.row.total_cones || 0})`"
                />
              </template>
              <span
                v-else
                class="text-grey-5"
              >—</span>
            </q-td>
          </template>

          <!-- actions -->
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                v-if="props.row.status === DeliveryStatus.PENDING"
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
      </q-tab-panel>

      <!-- Tab 2: Receive into Inventory -->
      <q-tab-panel name="receive">
        <!-- Filters -->
        <div class="row q-mb-md q-gutter-sm items-center">
          <q-space />
          <q-btn
            color="primary"
            icon="refresh"
            label="Tải lại"
            :loading="loadingReceive"
            @click="loadReceiveData"
          />
        </div>

        <!-- Receive Table -->
        <q-table
          :rows="pendingReceiveItems"
          :columns="receiveColumns"
          row-key="id"
          :loading="loadingReceive"
          flat
          bordered
          dense
          :rows-per-page-options="[20, 50, 0]"
          :pagination="{ rowsPerPage: 20 }"
        >
          <!-- inventory_status badge -->
          <template #body-cell-inventory_status="props">
            <q-td :props="props">
              <q-badge
                :color="getInventoryStatusColor(props.row.inventory_status)"
                :label="getInventoryStatusLabel(props.row.inventory_status)"
              />
            </q-td>
          </template>

          <!-- pending_quantity -->
          <template #body-cell-pending_quantity="props">
            <q-td :props="props">
              <span :class="{ 'text-negative text-weight-bold': getPendingQuantity(props.row) > 0 }">
                {{ getPendingQuantity(props.row) }}
              </span>
            </q-td>
          </template>

          <!-- actions -->
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                v-if="getPendingQuantity(props.row) > 0"
                size="sm"
                color="primary"
                label="Nhập kho"
                dense
                @click="openReceiveDialog(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Mark as Delivered Dialog -->
    <q-dialog v-model="showDeliveredDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">
            Xác nhận đã giao hàng
          </div>
        </q-card-section>
        <q-card-section>
          <p v-if="selectedDelivery">
            <strong>{{ selectedDelivery.thread_type_name }}</strong><br>
            NCC: {{ selectedDelivery.supplier_name }}
          </p>
          <DatePicker
            v-model="actualDeliveryDate"
            label="Ngày giao thực tế"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            v-close-popup
            flat
            label="Hủy"
          />
          <q-btn
            color="primary"
            label="Xác nhận"
            :loading="updating"
            @click="confirmDelivered"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Receive into Inventory Dialog -->
    <q-dialog v-model="showReceiveDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            Nhập kho
          </div>
        </q-card-section>
        <q-card-section>
          <div
            v-if="selectedReceiveDelivery"
            class="q-mb-md"
          >
            <div class="text-subtitle2 text-grey-7">
              Thông tin đơn hàng
            </div>
            <p class="q-mb-xs">
              <strong>{{ selectedReceiveDelivery.thread_type_name }}</strong>
            </p>
            <p class="q-mb-xs">
              NCC: {{ selectedReceiveDelivery.supplier_name }}
            </p>
            <p class="q-mb-xs">
              Tuần: {{ selectedReceiveDelivery.week_name }}
            </p>
            <p class="q-mb-none">
              Số đặt: {{ selectedReceiveDelivery.total_cones || 0 }} cuộn |
              Đã nhập: {{ selectedReceiveDelivery.received_quantity || 0 }} cuộn |
              <strong class="text-negative">Còn thiếu: {{ getPendingQuantity(selectedReceiveDelivery) }} cuộn</strong>
            </p>
          </div>

          <q-separator class="q-mb-md" />

          <AppSelect
            v-model="receiveForm.warehouse_id"
            :options="warehouseOptions"
            label="Kho nhập *"
            option-value="id"
            option-label="name"
            use-input
            fill-input
            hide-selected
            emit-value
            map-options
            :rules="[(v: number | null) => !!v || 'Vui lòng chọn kho nhập']"
          />

          <AppInput
            v-model.number="receiveForm.quantity"
            type="number"
            label="Số lượng nhập *"
            :min="1"
            :max="selectedReceiveDelivery ? getPendingQuantity(selectedReceiveDelivery) : 9999"
            :rules="[(v: number) => v > 0 || 'Số lượng phải lớn hơn 0']"
            class="q-mt-md"
          />

          <div class="q-mt-md text-grey-7">
            <q-icon
              name="person"
              size="sm"
              class="q-mr-xs"
            />
            Người nhập: <strong>{{ currentUser }}</strong>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            v-close-popup
            flat
            label="Hủy"
          />
          <q-btn
            color="primary"
            label="Nhập kho"
            :loading="receiving"
            :disable="!receiveForm.warehouse_id || receiveForm.quantity < 1"
            @click="confirmReceive"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import type { QTableColumn } from 'quasar'
import { deliveryService } from '@/services/deliveryService'
import { warehouseService, type Warehouse } from '@/services/warehouseService'
import { useSnackbar } from '@/composables/useSnackbar'
import { useAuth } from '@/composables/useAuth'
import type { DeliveryRecord } from '@/types/thread'
import { DeliveryStatus, InventoryReceiptStatus } from '@/types/thread/enums'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'

const snackbar = useSnackbar()
const { employee } = useAuth()

// Tab state
const activeTab = ref('tracking')

// Tracking tab state
const loading = ref(false)
const deliveries = ref<DeliveryRecord[]>([])
const statusFilter = ref<string | null>(null)
const statusOptions = [
  { label: 'Tất cả', value: null },
  { label: 'Chờ giao', value: DeliveryStatus.PENDING },
  { label: 'Đã giao', value: DeliveryStatus.DELIVERED },
]

// Delivered dialog state
const showDeliveredDialog = ref(false)
const selectedDelivery = ref<DeliveryRecord | null>(null)
const actualDeliveryDate = ref('')
const updating = ref(false)

// Receive tab state
const loadingReceive = ref(false)
const pendingReceiveItems = ref<DeliveryRecord[]>([])

// Receive dialog state
const showReceiveDialog = ref(false)
const selectedReceiveDelivery = ref<DeliveryRecord | null>(null)
const receiving = ref(false)
const warehouses = ref<Warehouse[]>([])
const receiveForm = ref({
  warehouse_id: null as number | null,
  quantity: 0,
})

const currentUser = computed(() => {
  return employee.value?.fullName || 'Chưa đăng nhập'
})

const warehouseOptions = computed(() => {
  return warehouses.value.map(w => ({ id: w.id, name: `${w.name} (${w.code})` }))
})

const trackingColumns: QTableColumn[] = [
  { name: 'week_name', label: 'Tuần', field: 'week_name', align: 'left', sortable: true },
  { name: 'thread_type_name', label: 'Loại chỉ', field: 'thread_type_name', align: 'left', sortable: true },
  { name: 'tex_number', label: 'TEX', field: 'tex_number', align: 'center' },
  { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
  { name: 'total_cones', label: 'Số cuộn', field: 'total_cones', align: 'center' },
  { name: 'delivery_date', label: 'Ngày giao dự kiến', field: 'delivery_date', align: 'center', sortable: true },
  { name: 'days_remaining', label: 'Còn lại', field: 'days_remaining', align: 'center', sortable: true },
  { name: 'status', label: 'Giao hàng', field: 'status', align: 'center' },
  { name: 'inventory_status', label: 'Nhập kho', field: 'inventory_status', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'center' },
]

const receiveColumns: QTableColumn[] = [
  { name: 'week_name', label: 'Tuần', field: 'week_name', align: 'left', sortable: true },
  { name: 'thread_type_name', label: 'Loại chỉ', field: 'thread_type_name', align: 'left', sortable: true },
  { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
  { name: 'total_cones', label: 'Số đặt', field: 'total_cones', align: 'center' },
  { name: 'received_quantity', label: 'Đã nhập', field: 'received_quantity', align: 'center' },
  { name: 'pending_quantity', label: 'Còn thiếu', field: 'pending_quantity', align: 'center' },
  { name: 'inventory_status', label: 'Trạng thái', field: 'inventory_status', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'center' },
]

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getDaysColor(days: number | undefined, status: string): string {
  if (status === DeliveryStatus.DELIVERED) return 'green'
  if (days === undefined) return 'grey'
  if (days <= 0) return 'red'
  if (days <= 3) return 'orange'
  return 'green'
}

function toDatePickerFormat(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function fromDatePickerFormat(dateStr: string): string {
  if (!dateStr) return ''
  const [day, month, year] = dateStr.split('/')
  return `${year}-${month}-${day}`
}

function getPendingQuantity(delivery: DeliveryRecord): number {
  const total = delivery.total_cones || 0
  const received = delivery.received_quantity || 0
  return Math.max(0, total - received)
}

function getInventoryStatusColor(status: string): string {
  switch (status) {
    case InventoryReceiptStatus.RECEIVED: return 'green'
    case InventoryReceiptStatus.PARTIAL: return 'orange'
    default: return 'grey'
  }
}

function getInventoryStatusLabel(status: string): string {
  switch (status) {
    case InventoryReceiptStatus.RECEIVED: return 'Đã nhập đủ'
    case InventoryReceiptStatus.PARTIAL: return 'Nhập một phần'
    default: return 'Chưa nhập'
  }
}

async function handleDeliveryDateChange(deliveryId: number, val: string | null) {
  if (!val) return
  const isoDate = fromDatePickerFormat(val)
  await updateDeliveryDate(deliveryId, isoDate)
}

async function loadTrackingData() {
  loading.value = true
  try {
    const filters: { status?: DeliveryStatus } = {}
    if (statusFilter.value) filters.status = statusFilter.value as DeliveryStatus
    deliveries.value = await deliveryService.getOverview(filters)
  } catch (err) {
    snackbar.error('Lỗi tải dữ liệu: ' + (err instanceof Error ? err.message : 'Unknown'))
  } finally {
    loading.value = false
  }
}

async function loadReceiveData() {
  loadingReceive.value = true
  try {
    // Get delivered items that are not fully received
    const allDeliveries = await deliveryService.getOverview({ status: DeliveryStatus.DELIVERED })
    pendingReceiveItems.value = allDeliveries.filter(d => d.inventory_status !== InventoryReceiptStatus.RECEIVED)
  } catch (err) {
    snackbar.error('Lỗi tải dữ liệu: ' + (err instanceof Error ? err.message : 'Unknown'))
  } finally {
    loadingReceive.value = false
  }
}

async function loadWarehouses() {
  try {
    warehouses.value = await warehouseService.getStorageOnly()
  } catch (err) {
    console.error('Error loading warehouses:', err)
  }
}

async function updateDeliveryDate(deliveryId: number, newDate: string) {
  try {
    await deliveryService.update(deliveryId, { delivery_date: newDate })
    snackbar.success('Đã cập nhật ngày giao')
    await loadTrackingData()
  } catch (err) {
    snackbar.error('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown'))
  }
}

function openDeliveredDialog(delivery: DeliveryRecord) {
  selectedDelivery.value = delivery
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
    const isoDate = fromDatePickerFormat(actualDeliveryDate.value)
    await deliveryService.update(selectedDelivery.value.id, {
      status: DeliveryStatus.DELIVERED,
      actual_delivery_date: isoDate,
    })
    snackbar.success('Đã xác nhận giao hàng')
    showDeliveredDialog.value = false
    await loadTrackingData()
  } catch (err) {
    snackbar.error('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown'))
  } finally {
    updating.value = false
  }
}

function openReceiveDialog(delivery: DeliveryRecord) {
  selectedReceiveDelivery.value = delivery
  receiveForm.value = {
    warehouse_id: null,
    quantity: getPendingQuantity(delivery),
  }
  showReceiveDialog.value = true
}

async function confirmReceive() {
  if (!selectedReceiveDelivery.value || !receiveForm.value.warehouse_id) return
  receiving.value = true
  try {
    const result = await deliveryService.receiveDelivery(selectedReceiveDelivery.value.id, {
      warehouse_id: receiveForm.value.warehouse_id,
      quantity: receiveForm.value.quantity,
      received_by: currentUser.value,
    })
    snackbar.success(`Đã nhập ${result.cones_created} cuộn vào kho (Lot: ${result.lot_number})`)
    showReceiveDialog.value = false
    await loadReceiveData()
  } catch (err) {
    snackbar.error('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown'))
  } finally {
    receiving.value = false
  }
}

// Load data when switching tabs
watch(activeTab, (newTab) => {
  if (newTab === 'tracking') {
    loadTrackingData()
  } else if (newTab === 'receive') {
    loadReceiveData()
  }
})

onMounted(async () => {
  await loadWarehouses()
  await loadTrackingData()
})
</script>
