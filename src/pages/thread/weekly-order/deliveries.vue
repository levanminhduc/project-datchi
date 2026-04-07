<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="col">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Quản lý ngày giao hàng
        </h1>
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
      <q-tab
        name="history"
        label="Lịch sử nhập kho"
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
          <q-checkbox
            v-model="hideFullyReceived"
            label="Ẩn đã nhập đủ"
            dense
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
          :rows="groupedRows"
          :columns="trackingColumns"
          row-key="row.id"
          :loading="loading"
          flat
          bordered
          dense
          class="delivery-tracking-table"
          :rows-per-page-options="[20, 50, 0]"
          :pagination="{ rowsPerPage: 50 }"
        >
          <template #body="props">
            <tr :class="[props.row.row.is_overdue ? 'bg-red-1' : '', props.row.isFirstInGroup ? 'group-first-row' : '']">
              <td class="text-left text-weight-medium">
                {{ props.row.isFirstInGroup ? (props.row.row.week_name || '—') : '' }}
              </td>
              <td class="text-left">
                {{ props.row.row.supplier_name || '—' }}
              </td>
              <td class="text-center">
                {{ props.row.row.tex_number || '—' }}
              </td>
              <td class="text-left">
                <div class="row items-center q-gutter-x-xs no-wrap">
                  <div
                    v-if="props.row.row.color_hex"
                    style="width: 12px; height: 12px; border-radius: 50%; border: 1px solid #ccc"
                    :style="{ backgroundColor: props.row.row.color_hex }"
                  />
                  <span>{{ props.row.row.color_name || '—' }}</span>
                </div>
              </td>
              <td class="text-center">
                {{ props.row.row.quantity_cones }}
              </td>
              <td class="text-center">
                {{ props.row.row.received_quantity }}
              </td>
              <td class="text-center">
                {{ (props.row.row.quantity_cones || 0) - (props.row.row.received_quantity || 0) }}
              </td>
              <template v-if="hasAnyLoans">
                <td class="text-center">
                  <span
                    v-if="props.row.row.borrowed_in > 0"
                    class="text-info text-weight-medium"
                  >{{ props.row.row.borrowed_in }} cuộn</span>
                  <span
                    v-else
                    class="text-grey-5"
                  >—</span>
                </td>
                <td class="text-center">
                  <span
                    v-if="props.row.row.lent_out > 0"
                    class="text-warning text-weight-medium"
                  >{{ props.row.row.lent_out }} cuộn</span>
                  <span
                    v-else
                    class="text-grey-5"
                  >—</span>
                </td>
              </template>
              <td class="text-center">
                <span class="cursor-pointer text-primary">
                  {{ formatDate(props.row.row.delivery_date) }}
                  <q-popup-proxy>
                    <DatePicker
                      :model-value="toDatePickerFormat(props.row.row.delivery_date)"
                      @update:model-value="(val: string | null) => handleDeliveryDateChange(props.row.row.id, val)"
                    />
                  </q-popup-proxy>
                </span>
              </td>
              <td class="text-center">
                <q-badge
                  :color="getDaysColor(props.row.row.days_remaining, props.row.row.status)"
                  :label="props.row.row.status === DeliveryStatus.DELIVERED ? '✓' : `${props.row.row.days_remaining} ngày`"
                />
              </td>
              <td class="text-center">
                <q-badge
                  :color="props.row.row.status === DeliveryStatus.DELIVERED ? 'green' : 'orange'"
                  :label="props.row.row.status === DeliveryStatus.DELIVERED ? 'Đã giao' : 'Chờ giao'"
                />
              </td>
              <td class="text-center">
                <template v-if="props.row.row.status === DeliveryStatus.DELIVERED">
                  <q-badge
                    v-if="props.row.row.inventory_status === InventoryReceiptStatus.RECEIVED"
                    color="green"
                    label="Đã nhập đủ"
                  />
                  <q-badge
                    v-else-if="props.row.row.inventory_status === InventoryReceiptStatus.PARTIAL"
                    color="orange"
                    :label="`Chờ nhập (${getPendingQuantity(props.row.row)}/${props.row.row.quantity_cones || 0})`"
                  />
                  <q-badge
                    v-else
                    color="grey"
                    :label="`Chờ nhập (${props.row.row.quantity_cones || 0})`"
                  />
                </template>
                <span
                  v-else
                  class="text-grey-5"
                >—</span>
              </td>
              <td class="text-center">
                <q-btn
                  v-if="props.row.row.status === DeliveryStatus.PENDING"
                  size="sm"
                  color="green"
                  label="Đã giao"
                  dense
                  flat
                  @click="openDeliveredDialog(props.row.row)"
                />
              </td>
            </tr>
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
          <!-- color_name with color dot -->
          <template #body-cell-color_name="props">
            <q-td :props="props">
              <div class="row items-center q-gutter-x-xs no-wrap">
                <div
                  v-if="props.row.color_hex"
                  style="width: 12px; height: 12px; border-radius: 50%; border: 1px solid #ccc"
                  :style="{ backgroundColor: props.row.color_hex }"
                />
                <span>{{ props.row.color_name || '—' }}</span>
              </div>
            </q-td>
          </template>

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

      <!-- Tab 3: Receive History -->
      <q-tab-panel name="history">
        <div class="row q-mb-md q-gutter-sm items-center">
          <AppSelect
            v-model="historyWeekFilter"
            :options="weekFilterOptions"
            label="Lọc theo tuần"
            dense
            style="min-width: 200px"
            @update:model-value="loadHistoryData"
          />
          <q-space />
          <q-btn
            color="primary"
            icon="refresh"
            label="Tải lại"
            :loading="loadingHistory"
            @click="loadHistoryData"
          />
        </div>

        <q-table
          :rows="historyLogs"
          :columns="historyColumns"
          row-key="id"
          :loading="loadingHistory"
          flat
          bordered
          dense
          :rows-per-page-options="[20, 50, 0]"
          :pagination="{ rowsPerPage: 50 }"
        >
          <template #body-cell-color_name="props">
            <q-td :props="props">
              <div class="row items-center q-gutter-x-xs no-wrap">
                <div
                  v-if="props.row.color_hex"
                  style="width: 12px; height: 12px; border-radius: 50%; border: 1px solid #ccc"
                  :style="{ backgroundColor: props.row.color_hex }"
                />
                <span>{{ props.row.color_name || '—' }}</span>
              </div>
            </q-td>
          </template>
          <template #body-cell-quantity="props">
            <q-td :props="props">
              <span class="text-weight-medium">{{ props.row.quantity }}</span>
              <span class="text-grey-6"> / {{ props.row.quantity_cones || '—' }}</span>
            </q-td>
          </template>
          <template #no-data>
            <div class="full-width text-center q-pa-lg text-grey-6">
              Chưa có lịch sử nhập kho
            </div>
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
              Số đặt: {{ selectedReceiveDelivery.quantity_cones || 0 }} cuộn |
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

          <DatePicker
            v-model="receiveForm.expiry_date"
            label="Ngày hết hạn (tùy chọn)"
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

    <ReceiveResultDialog
      v-if="receiveResult"
      v-model="showResultDialog"
      :result="receiveResult"
      @update:model-value="onResultDialogClose"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import type { QTableColumn } from 'quasar'
import { deliveryService } from '@/services/deliveryService'
import { warehouseService, type Warehouse } from '@/services/warehouseService'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import { useSnackbar } from '@/composables/useSnackbar'
import { useAuth } from '@/composables/useAuth'
import type { DeliveryRecord, DeliveryReceiveLog } from '@/types/thread'
import { DeliveryStatus, InventoryReceiptStatus } from '@/types/thread/enums'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import ReceiveResultDialog from '@/components/thread/weekly-order/ReceiveResultDialog.vue'
import type { ReceiveResult } from '@/components/thread/weekly-order/ReceiveResultDialog.vue'

const snackbar = useSnackbar()
const { employee } = useAuth()

// Tab state
const activeTab = ref('tracking')

// Tracking tab state
const loading = ref(false)
const deliveries = ref<DeliveryRecord[]>([])
const statusFilter = ref<string | null>(null)
const hideFullyReceived = ref(true)
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
  expiry_date: '' as string,
})

const showResultDialog = ref(false)
const receiveResult = ref<ReceiveResult | null>(null)

const loadingHistory = ref(false)
const historyLogs = ref<DeliveryReceiveLog[]>([])
const historyWeekFilter = ref<number | null>(null)
const weekOptions = ref<Array<{ id: number; week_name: string }>>([])

const weekFilterOptions = computed(() => {
  return [
    { label: 'Tất cả', value: null },
    ...weekOptions.value.map(w => ({ label: w.week_name, value: w.id })),
  ]
})

const currentUser = computed(() => {
  return employee.value?.fullName || 'Chưa đăng nhập'
})

const warehouseOptions = computed(() => {
  return warehouses.value.map(w => ({ id: w.id, name: `${w.name} (${w.code})` }))
})

const filteredDeliveries = computed(() => {
  if (!hideFullyReceived.value) return deliveries.value
  return deliveries.value.filter(d => d.inventory_status !== InventoryReceiptStatus.RECEIVED)
})

const hasAnyLoans = computed(() => {
  return filteredDeliveries.value.some((d: DeliveryRecord) => (d.borrowed_in || 0) > 0 || (d.lent_out || 0) > 0)
})

interface GroupedRow {
  row: DeliveryRecord
  isFirstInGroup: boolean
  groupSize: number
}

const groupedRows = computed<GroupedRow[]>(() => {
  const sorted = [...filteredDeliveries.value].sort((a, b) => {
    const weekCmp = (a.week_name || '').localeCompare(b.week_name || '')
    if (weekCmp !== 0) return weekCmp
    return String(a.delivery_date).localeCompare(String(b.delivery_date))
  })
  const groups = new Map<string, DeliveryRecord[]>()
  for (const row of sorted) {
    const key = row.week_name || `__${row.week_id}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(row)
  }
  const result: GroupedRow[] = []
  for (const rows of groups.values()) {
    rows.forEach((row, idx) => {
      result.push({ row, isFirstInGroup: idx === 0, groupSize: rows.length })
    })
  }
  return result
})

const trackingColumns = computed<QTableColumn[]>(() => {
  const cols: QTableColumn[] = [
    { name: 'week_name', label: 'Đơn Hàng', field: 'week_name', align: 'left', sortable: true },
    { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
    { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'center' },
    { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left', sortable: true },
    { name: 'quantity_cones', label: 'Đặt NCC', field: 'quantity_cones', align: 'center' },
    { name: 'received_quantity', label: 'Đã nhận', field: 'received_quantity', align: 'center' },
    { name: 'pending_cones', label: 'Chờ nhận', field: (row: DeliveryRecord) => (row.quantity_cones || 0) - (row.received_quantity || 0), align: 'center' },
  ]
  if (hasAnyLoans.value) {
    cols.push(
      { name: 'borrowed_in', label: 'Đã mượn', field: 'borrowed_in', align: 'center' },
      { name: 'lent_out', label: 'Cho mượn', field: 'lent_out', align: 'center' },
    )
  }
  cols.push(
    { name: 'delivery_date', label: 'Ngày giao', field: 'delivery_date', align: 'center', sortable: true },
    { name: 'days_remaining', label: 'Còn lại', field: 'days_remaining', align: 'center', sortable: true },
    { name: 'status', label: 'Giao hàng', field: 'status', align: 'center' },
    { name: 'inventory_status', label: 'Nhập kho', field: 'inventory_status', align: 'center' },
    { name: 'actions', label: '', field: 'actions', align: 'center' },
  )
  return cols
})

const receiveColumns: QTableColumn[] = [
  { name: 'week_name', label: 'Đơn Hàng', field: 'week_name', align: 'left', sortable: true },
  { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
  { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'center' },
  { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left', sortable: true },
  { name: 'quantity_cones', label: 'Số đặt', field: 'quantity_cones', align: 'center' },
  { name: 'received_quantity', label: 'Đã nhập', field: 'received_quantity', align: 'center' },
  { name: 'pending_quantity', label: 'Còn thiếu', field: 'pending_quantity', align: 'center' },
  { name: 'inventory_status', label: 'Trạng thái', field: 'inventory_status', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'center' },
]

const historyColumns: QTableColumn[] = [
  { name: 'created_at', label: 'Thời gian', field: 'created_at', align: 'left', sortable: true, format: (val: string) => formatDateTime(val) },
  { name: 'week_name', label: 'Tuần', field: 'week_name', align: 'left', sortable: true },
  { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
  { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'center' },
  { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left' },
  { name: 'warehouse_name', label: 'Kho nhập', field: 'warehouse_name', align: 'left' },
  { name: 'quantity', label: 'Số lượng (cuộn)', field: 'quantity', align: 'center' },
  { name: 'received_by', label: 'Người nhập', field: 'received_by', align: 'left' },
]

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
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

// Task 7.2: Use quantity_cones for pending calculation
// ISSUE-8: Allow negative values to indicate over-receipt per spec
function getPendingQuantity(delivery: DeliveryRecord): number {
  const total = delivery.quantity_cones || 0
  const received = delivery.received_quantity || 0
  return total - received
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
    snackbar.error('Lỗi tải dữ liệu: ' + (err instanceof Error ? err.message : 'Không xác định'))
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
    snackbar.error('Lỗi tải dữ liệu: ' + (err instanceof Error ? err.message : 'Không xác định'))
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

async function loadWeekOptions() {
  try {
    const weeks = await weeklyOrderService.getAll()
    weekOptions.value = weeks.map(w => ({ id: w.id, week_name: w.week_name }))
  } catch (err) {
    console.error('Error loading weeks:', err)
  }
}

async function loadHistoryData() {
  loadingHistory.value = true
  try {
    const params: { week_id?: number; limit?: number } = { limit: 100 }
    if (historyWeekFilter.value) params.week_id = historyWeekFilter.value
    historyLogs.value = await deliveryService.getReceiveLogs(params)
  } catch (err) {
    snackbar.error('Lỗi tải lịch sử: ' + (err instanceof Error ? err.message : 'Không xác định'))
  } finally {
    loadingHistory.value = false
  }
}

async function updateDeliveryDate(deliveryId: number, newDate: string) {
  try {
    await deliveryService.update(deliveryId, { delivery_date: newDate })
    snackbar.success('Đã cập nhật ngày giao')
    await loadTrackingData()
  } catch (err) {
    snackbar.error('Lỗi: ' + (err instanceof Error ? err.message : 'Không xác định'))
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
    snackbar.error('Lỗi: ' + (err instanceof Error ? err.message : 'Không xác định'))
  } finally {
    updating.value = false
  }
}

function openReceiveDialog(delivery: DeliveryRecord) {
  selectedReceiveDelivery.value = delivery
  receiveForm.value = {
    warehouse_id: null,
    quantity: getPendingQuantity(delivery),
    expiry_date: '',
  }
  showReceiveDialog.value = true
}

async function confirmReceive() {
  if (!selectedReceiveDelivery.value || !receiveForm.value.warehouse_id) return
  receiving.value = true
  try {
    const dto: { warehouse_id: number; quantity: number; received_by: string; expiry_date?: string } = {
      warehouse_id: receiveForm.value.warehouse_id,
      quantity: receiveForm.value.quantity,
      received_by: currentUser.value,
    }
    if (receiveForm.value.expiry_date) {
      dto.expiry_date = fromDatePickerFormat(receiveForm.value.expiry_date)
    }
    const result = await deliveryService.receiveDelivery(selectedReceiveDelivery.value.id, dto)
    showReceiveDialog.value = false
    receiveResult.value = result
    showResultDialog.value = true
  } catch (err) {
    snackbar.error('Lỗi: ' + (err instanceof Error ? err.message : 'Không xác định'))
  } finally {
    receiving.value = false
  }
}

async function onResultDialogClose(val: boolean) {
  if (!val) {
    showResultDialog.value = false
    receiveResult.value = null
    await loadReceiveData()
  }
}

// Load data when switching tabs
watch(activeTab, (newTab) => {
  if (newTab === 'tracking') {
    loadTrackingData()
  } else if (newTab === 'receive') {
    loadReceiveData()
  } else if (newTab === 'history') {
    loadHistoryData()
  }
})

onMounted(async () => {
  await Promise.all([loadWarehouses(), loadWeekOptions()])
  await loadTrackingData()
})
</script>

<style scoped>
.delivery-tracking-table :deep(.group-first-row td) {
  border-top: 2px solid #90a4ae;
}
</style>
