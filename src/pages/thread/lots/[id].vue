<template>
  <q-page padding>
    <!-- Back Button & Header -->
    <div class="row items-center q-mb-lg">
      <q-btn
        flat
        round
        icon="arrow_back"
        color="primary"
        @click="$router.back()"
      />
      <div class="q-ml-md">
        <h1 class="text-h5 q-my-none text-weight-bold">
          {{ lot?.lot_number || 'Chi tiết lô' }}
        </h1>
        <div
          v-if="lot"
          class="text-grey-6"
        >
          {{ lot.thread_type?.name }} - {{ lot.warehouse?.name }}
        </div>
      </div>
      <q-space />
      <LotStatusBadge
        v-if="lot"
        :status="lot.status"
        size="lg"
      />
    </div>

    <div
      v-if="loading"
      class="row justify-center q-py-xl"
    >
      <q-spinner
        size="lg"
        color="primary"
      />
    </div>

    <template v-else-if="lot">
      <!-- Lot Info Cards -->
      <div class="row q-col-gutter-md q-mb-lg">
        <!-- Basic Info -->
        <div class="col-12 col-md-6">
          <q-card
            flat
            bordered
          >
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                Thông tin lô
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Mã lô
                  </div>
                  <div class="text-body1">
                    {{ lot.lot_number }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Loại chỉ
                  </div>
                  <div class="text-body1 row items-center no-wrap q-gutter-xs">
                    <div
                      v-if="lot.thread_type?.color_data?.hex_code"
                      class="color-swatch"
                      :style="{ backgroundColor: lot.thread_type.color_data.hex_code }"
                    />
                    <span>{{ lot.thread_type?.name || '-' }}</span>
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Kho
                  </div>
                  <div class="text-body1">
                    {{ lot.warehouse?.name || '-' }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Nhà cung cấp
                  </div>
                  <div class="text-body1">
                    {{ lot.supplier || '-' }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Ngày sản xuất
                  </div>
                  <div class="text-body1">
                    {{ formatDate(lot.production_date) }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Hết hạn
                  </div>
                  <div
                    class="text-body1"
                    :class="isExpired ? 'text-negative' : ''"
                  >
                    {{ formatDate(lot.expiry_date) }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Quantity Summary -->
        <div class="col-12 col-md-6">
          <q-card
            flat
            bordered
          >
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                Số lượng
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="text-h4 text-primary">
                    {{ lot.available_cones }}
                  </div>
                  <div class="text-caption text-grey-6">
                    Cuộn còn sẵn
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-h4">
                    {{ lot.total_cones }}
                  </div>
                  <div class="text-caption text-grey-6">
                    Tổng cuộn
                  </div>
                </div>
              </div>
              <q-linear-progress
                :value="lot.total_cones > 0 ? lot.available_cones / lot.total_cones : 0"
                color="primary"
                class="q-mt-md"
                size="8px"
                rounded
              />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Tabs -->
      <q-card
        flat
        bordered
      >
        <q-tabs
          v-model="activeTab"
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="left"
        >
          <q-tab
            name="cones"
            label="Danh sách cuộn"
            icon="inventory_2"
          />
          <q-tab
            name="history"
            label="Lịch sử thao tác"
            icon="history"
          />
        </q-tabs>

        <q-separator />

        <q-tab-panels
          v-model="activeTab"
          animated
        >
          <!-- Cones Tab -->
          <q-tab-panel name="cones">
            <q-table
              flat
              :rows="cones"
              :columns="coneColumns"
              :loading="loadingCones"
              row-key="id"
              :pagination="{ rowsPerPage: 20 }"
            >
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-badge
                    :color="getConeStatusColor(props.row.status)"
                    :label="getConeStatusLabel(props.row.status)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>

          <!-- History Tab -->
          <q-tab-panel name="history">
            <q-table
              flat
              :rows="transactions"
              :columns="transactionColumns"
              :loading="loadingTransactions"
              row-key="id"
              :pagination="{ rowsPerPage: 20 }"
            >
              <template #body-cell-operation_type="props">
                <q-td :props="props">
                  <q-badge
                    :color="getOperationColor(props.row.operation_type)"
                    :label="getOperationLabel(props.row.operation_type)"
                  />
                </q-td>
              </template>
              <template #body-cell-performed_at="props">
                <q-td :props="props">
                  {{ formatDateTime(props.row.performed_at) }}
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </template>

    <template v-else>
      <q-banner class="bg-negative text-white">
        Không tìm thấy lô hàng
      </q-banner>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { lotService } from '@/services/lotService'
import LotStatusBadge from '@/components/thread/LotStatusBadge.vue'
import type { Lot } from '@/types/thread/lot'
import type { Cone } from '@/types/thread/inventory'
import type { BatchTransaction, BatchOperationType } from '@/types/thread/batch'

const route = useRoute() as RouteLocationNormalizedLoaded & { params: { id: string } }

// State
const lot = ref<Lot | null>(null)
const cones = ref<Cone[]>([])
const transactions = ref<BatchTransaction[]>([])
const loading = ref(false)
const loadingCones = ref(false)
const loadingTransactions = ref(false)
const activeTab = ref('cones')

// Computed
const lotId = computed(() => Number(route.params.id as string))
const isExpired = computed(() => {
  if (!lot.value?.expiry_date) return false
  return new Date(lot.value.expiry_date) < new Date()
})

// Table columns
const coneColumns = [
  { name: 'cone_id', label: 'Mã Cuộn', field: 'cone_id', align: 'left' as const },
  { name: 'status', label: 'Trạng Thái', field: 'status', align: 'center' as const },
  { name: 'quantity_meters', label: 'Số Mét', field: 'quantity_meters', align: 'right' as const },
  { name: 'weight_grams', label: 'Khối Lượng (g)', field: 'weight_grams', align: 'right' as const },
  { name: 'location', label: 'Vị Trí', field: 'location', align: 'left' as const }
]

const transactionColumns = [
  { name: 'operation_type', label: 'Loại', field: 'operation_type', align: 'center' as const },
  { name: 'cone_count', label: 'Số Cuộn', field: 'cone_count', align: 'center' as const },
  { name: 'recipient', label: 'Người Nhận', field: 'recipient', align: 'left' as const },
  { name: 'reference_number', label: 'Số Tham Chiếu', field: 'reference_number', align: 'left' as const },
  { name: 'performed_at', label: 'Thời Gian', field: 'performed_at', align: 'left' as const }
]

// Helpers
function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('vi-VN')
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('vi-VN')
}

function getConeStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: 'positive',
    RECEIVED: 'info',
    INSPECTED: 'secondary',
    SOFT_ALLOCATED: 'warning',
    HARD_ALLOCATED: 'orange',
    IN_PRODUCTION: 'purple',
    CONSUMED: 'grey',
    QUARANTINE: 'negative'
  }
  return colors[status] || 'grey'
}

function getConeStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AVAILABLE: 'Sẵn sàng',
    RECEIVED: 'Đã nhận',
    INSPECTED: 'Đã kiểm',
    SOFT_ALLOCATED: 'Đã phân bổ',
    HARD_ALLOCATED: 'Đã xuất',
    IN_PRODUCTION: 'Đang dùng',
    CONSUMED: 'Đã dùng hết',
    QUARANTINE: 'Cách ly'
  }
  return labels[status] || status
}

function getOperationColor(type: BatchOperationType): string {
  const colors: Record<BatchOperationType, string> = {
    RECEIVE: 'positive',
    TRANSFER: 'info',
    ISSUE: 'warning',
    RETURN: 'secondary'
  }
  return colors[type]
}

function getOperationLabel(type: BatchOperationType): string {
  const labels: Record<BatchOperationType, string> = {
    RECEIVE: 'Nhập kho',
    TRANSFER: 'Chuyển kho',
    ISSUE: 'Xuất kho',
    RETURN: 'Trả lại'
  }
  return labels[type]
}

// Load data
async function loadLot() {
  loading.value = true
  try {
    lot.value = await lotService.getById(lotId.value)
  } catch {
    lot.value = null
  } finally {
    loading.value = false
  }
}

async function loadCones() {
  loadingCones.value = true
  try {
    cones.value = await lotService.getCones(lotId.value)
  } finally {
    loadingCones.value = false
  }
}

async function loadTransactions() {
  loadingTransactions.value = true
  try {
    transactions.value = await lotService.getTransactions(lotId.value)
  } finally {
    loadingTransactions.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'cones' && cones.value.length === 0) {
    loadCones()
  } else if (tab === 'history' && transactions.value.length === 0) {
    loadTransactions()
  }
})

onMounted(() => {
  loadLot()
  loadCones()
})
</script>

<style scoped>
.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
