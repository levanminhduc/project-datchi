<template>
  <q-page
    padding
    class="recovery-page"
  >
    <!-- Page Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <h1 class="text-h4 q-my-none">
          Hoàn Trả Chỉ Dư
        </h1>
      </div>
      <div class="col-auto">
        <AppButton
          label="Quét Mã"
          icon="qr_code_scanner"
          color="primary"
          @click="openScanDialog"
        />
      </div>
    </div>

    <!-- Filters -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4">
        <AppInput
          v-model="filters.cone_id"
          label="Tìm theo mã cuộn"
          placeholder="Nhập hoặc quét mã..."
          clearable
          dense
          @update:model-value="handleFilterChange"
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </AppInput>
      </div>
      <div class="col-12 col-sm-4">
        <AppSelect
          v-model="filters.status"
          label="Trạng thái"
          :options="statusOptions"
          clearable
          dense
          emit-value
          map-options
          @update:model-value="handleFilterChange"
        />
      </div>
    </div>

    <!-- Workflow Summary Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div
        v-for="(step, index) in workflowSteps"
        :key="index"
        class="col-12 col-sm-4"
      >
        <q-card
          flat
          bordered
          class="workflow-card"
        >
          <q-card-section class="row items-center no-wrap">
            <div class="col">
              <div class="text-overline text-secondary">
                {{ step.overline }}
              </div>
              <div class="text-h6">
                {{ step.title }}
              </div>
              <div class="text-caption text-secondary">
                {{ step.description }}
              </div>
            </div>
            <div class="col-auto">
              <q-avatar
                :color="step.color"
                text-color="white"
                :icon="step.icon"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Data Table -->
    <q-table
      flat
      bordered
      :rows="recoveries"
      :columns="columns"
      :loading="isLoading"
      row-key="id"
      :rows-per-page-options="[10, 25, 50, 100]"
      class="recovery-table shadow-1"
    >
      <!-- Thread Type Column -->
      <template #body-cell-thread_type="props">
        <q-td :props="props">
          <div class="row items-center no-wrap">
            <q-badge
              rounded
              :style="{ backgroundColor: props.row.cone?.thread_type?.color_data?.hex_code || '#ccc' }"
              class="q-mr-xs"
              style="width: 12px; height: 12px; border: 1px solid rgba(0,0,0,0.1)"
            />
            <span>{{ props.row.cone?.thread_type?.name || 'N/A' }}</span>
          </div>
        </q-td>
      </template>

      <!-- Original Meters Column -->
      <template #body-cell-original_meters="props">
        <q-td :props="props">
          {{ formatNumber(props.row.original_meters) }}m
        </q-td>
      </template>

      <!-- Returned Weight Column -->
      <template #body-cell-returned_weight="props">
        <q-td :props="props">
          <span v-if="props.row.returned_weight_grams">
            {{ formatNumber(props.row.returned_weight_grams) }}g
          </span>
          <span
            v-else
            class="text-hint"
          >—</span>
        </q-td>
      </template>

      <!-- Remaining Meters Column -->
      <template #body-cell-remaining_meters="props">
        <q-td :props="props">
          <span
            v-if="props.row.calculated_meters"
            class="text-weight-bold"
          >
            {{ formatNumber(props.row.calculated_meters) }}m
          </span>
          <span
            v-else
            class="text-hint"
          >—</span>
        </q-td>
      </template>

      <!-- Consumed Meters Column -->
      <template #body-cell-consumed_meters="props">
        <q-td :props="props">
          <span
            v-if="props.row.consumption_meters"
            class="text-negative"
          >
            -{{ formatNumber(props.row.consumption_meters) }}m
          </span>
          <span
            v-else
            class="text-hint"
          >—</span>
        </q-td>
      </template>

      <!-- Status Column -->
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="getStatusConfig(props.row.status).color"
            class="q-pa-xs"
          >
            <q-icon
              :name="getStatusConfig(props.row.status).icon"
              size="14px"
              class="q-mr-xs"
            />
            {{ getStatusConfig(props.row.status).label }}
          </q-badge>
        </q-td>
      </template>

      <!-- Actions Column -->
      <template #body-cell-actions="props">
        <q-td
          :props="props"
          class="text-right"
        >
          <div class="row justify-end q-gutter-xs">
            <!-- Details -->
            <IconButton
              icon="visibility"
              color="grey-7"
              tooltip="Chi tiết"
              @click="openDetailDialog(props.row)"
            />

            <!-- Weigh Button -->
            <IconButton
              v-if="canWeigh(props.row.status)"
              icon="scale"
              color="warning"
              tooltip="Cân cuộn chỉ"
              @click="openWeighDialog(props.row)"
            />

            <!-- Confirm Button -->
            <IconButton
              v-if="canConfirm(props.row.status)"
              icon="check_circle"
              color="positive"
              tooltip="Xác nhận nhập kho"
              @click="handleConfirm(props.row)"
            />

            <!-- Write Off Button -->
            <IconButton
              v-if="canWriteOff(props.row)"
              icon="delete_outline"
              color="negative"
              tooltip="Loại bỏ"
              @click="openWriteOffDialog(props.row)"
            />
          </div>
        </q-td>
      </template>

      <!-- Empty State -->
      <template #no-data>
        <div class="full-width q-pa-xl text-center text-secondary">
          <q-icon
            name="inventory_2"
            size="64px"
            class="q-mb-md"
          />
          <div class="text-h6">
            Không tìm thấy bản ghi hoàn trả nào
          </div>
          <div class="text-caption">
            Hãy thử thay đổi bộ lọc hoặc quét mã mới
          </div>
        </div>
      </template>
    </q-table>

    <!-- Initiate/Scan Dialog -->
    <FormDialog
      v-model="scanDialog.isOpen"
      title="Khởi Tạo Hoàn Trả"
      :loading="isLoading"
      @submit="handleScanSubmit"
    >
      <div class="q-gutter-y-md">
        <AppInput
          v-model="scanDialog.barcode"
          label="Mã Barcode Cuộn Chỉ"
          placeholder="Quét hoặc nhập mã cuộn..."
          required
          autofocus
          @keyup.enter="handleScanSubmit"
        >
          <template #prepend>
            <q-icon name="qr_code_scanner" />
          </template>
        </AppInput>

        <AppInput
          v-model="scanDialog.notes"
          label="Ghi chú (Tùy chọn)"
          type="textarea"
          rows="2"
        />
      </div>
    </FormDialog>

    <!-- Weigh Dialog -->
    <FormDialog
      v-model="weighDialog.isOpen"
      title="Cân Cuộn Chỉ"
      :loading="isLoading"
      @submit="handleWeighSubmit"
    >
      <div
        v-if="weighDialog.recovery"
        class="q-gutter-y-md"
      >
        <!-- Cone Info Summary -->
        <q-banner
          dense
          class="bg-blue-1 text-blue-9 rounded-borders"
        >
          <template #avatar>
            <q-icon
              name="info"
              color="blue"
            />
          </template>
          <div class="text-weight-bold">
            {{ weighDialog.recovery.cone?.thread_type?.name }}
          </div>
          <div class="text-caption">
            Mã: {{ weighDialog.recovery.cone?.cone_id }} | Gốc: {{ formatNumber(weighDialog.recovery.original_meters) }}m
          </div>
        </q-banner>

        <AppInput
          v-model.number="weighDialog.weight"
          label="Trọng lượng thực tế (grams)"
          type="number"
          placeholder="Nhập cân nặng..."
          required
          suffix="g"
          :rules="[val => val > 0 || 'Vui lòng nhập trọng lượng hợp lệ']"
        >
          <template #prepend>
            <q-icon name="scale" />
          </template>
        </AppInput>

        <!-- Calculation Display -->
        <div
          v-if="weighDialog.weight"
          class="bg-surface q-pa-md rounded-borders"
        >
          <div class="row justify-between q-mb-xs">
            <span>Mét còn lại dự kiến:</span>
            <span class="text-weight-bold text-primary">{{ formatNumber(calculatedMeters) }}m</span>
          </div>
          <div class="row justify-between">
            <span>Lượng đã tiêu thụ:</span>
            <span class="text-weight-bold text-negative">{{ formatNumber(calculatedConsumption) }}m</span>
          </div>
          <div
            v-if="weighDialog.weight < 50"
            class="text-caption text-negative q-mt-sm"
          >
            <q-icon
              name="warning"
              size="14px"
            /> Trọng lượng thấp (&lt;50g), hệ thống sẽ gợi ý loại bỏ.
          </div>
        </div>

        <AppInput
          v-model="weighDialog.weighed_by"
          label="Người thực hiện"
          placeholder="Nhập tên người cân..."
        />
      </div>
    </FormDialog>

    <!-- Write-Off Dialog -->
    <FormDialog
      v-model="writeOffDialog.isOpen"
      title="Loại Bỏ Cuộn Chỉ"
      color="negative"
      :loading="isLoading"
      @submit="handleWriteOffSubmit"
    >
      <div
        v-if="writeOffDialog.recovery"
        class="q-gutter-y-md"
      >
        <q-banner
          dense
          class="bg-red-1 text-red-9 rounded-borders"
        >
          <template #avatar>
            <q-icon
              name="warning"
              color="negative"
            />
          </template>
          <b>Cảnh báo:</b> Thao tác này sẽ loại bỏ vĩnh viễn cuộn chỉ khỏi danh sách sử dụng.
        </q-banner>

        <div class="text-subtitle2 q-mb-xs">
          Thông tin cuộn:
        </div>
        <div class="bg-surface q-pa-sm rounded-borders">
          <div>Loại: {{ writeOffDialog.recovery.cone?.thread_type?.name }}</div>
          <div>Mã: {{ writeOffDialog.recovery.cone?.cone_id }}</div>
          <div v-if="writeOffDialog.recovery.returned_weight_grams">
            TL: {{ formatNumber(writeOffDialog.recovery.returned_weight_grams) }}g 
            (~{{ formatNumber(writeOffDialog.recovery.remaining_meters) }}m)
          </div>
        </div>

        <AppInput
          v-model="writeOffDialog.reason"
          label="Lý do loại bỏ"
          required
          :rules="[val => !!val || 'Vui lòng nhập lý do']"
        />

        <AppInput
          v-model="writeOffDialog.approved_by"
          label="Người phê duyệt (Giám sát)"
          placeholder="Nhập tên người duyệt..."
          required
          :rules="[val => !!val || 'Vui lòng nhập tên người duyệt']"
        />
      </div>
    </FormDialog>

    <!-- Detail Dialog -->
    <AppDialog
      v-model="detailDialog.isOpen"
      title="Chi Tiết Hoàn Trả"
      width="600px"
    >
      <div
        v-if="detailDialog.recovery"
        class="q-pa-md"
      >
        <div class="row q-col-gutter-md">
          <!-- Cone Info Section -->
          <div class="col-12">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              Thông tin cuộn chỉ
            </div>
            <q-list
              bordered
              separator
              padding
              class="rounded-borders"
            >
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Mã Barcode
                  </q-item-label>
                  <q-item-label class="text-weight-medium">
                    {{ detailDialog.recovery.cone?.cone_id }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Loại chỉ
                  </q-item-label>
                  <q-item-label class="row items-center">
                    <q-badge
                      rounded
                      :style="{ backgroundColor: detailDialog.recovery.cone?.thread_type?.color_data?.hex_code || '#ccc' }"
                      class="q-mr-xs"
                      style="width: 10px; height: 10px"
                    />
                    {{ detailDialog.recovery.cone?.thread_type?.name }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Statistics Section -->
          <div class="col-12">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              Thông số đo đạc
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-card
                  flat
                  bordered
                  class="bg-surface"
                >
                  <q-card-section class="q-pa-sm">
                    <div class="text-caption text-secondary">
                      Mét gốc
                    </div>
                    <div class="text-h6">
                      {{ formatNumber(detailDialog.recovery.original_meters) }}m
                    </div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-6">
                <q-card
                  flat
                  bordered
                  class="bg-surface"
                >
                  <q-card-section class="q-pa-sm">
                    <div class="text-caption text-secondary">
                      Trọng lượng (net)
                    </div>
                    <div class="text-h6">
                      {{ detailDialog.recovery.returned_weight_grams ? formatNumber(detailDialog.recovery.returned_weight_grams) + 'g' : '—' }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-6">
                <q-card
                  flat
                  bordered
                  class="bg-primary text-white"
                >
                  <q-card-section class="q-pa-sm">
                    <div class="text-caption text-blue-1">
                      Mét còn lại
                    </div>
                    <div class="text-h6">
                      {{ detailDialog.recovery.remaining_meters ? formatNumber(detailDialog.recovery.remaining_meters) + 'm' : '—' }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-6">
                <q-card
                  flat
                  bordered
                  class="bg-negative text-white"
                >
                  <q-card-section class="q-pa-sm">
                    <div class="text-caption text-red-1">
                      Đã tiêu thụ
                    </div>
                    <div class="text-h6">
                      {{ detailDialog.recovery.consumed_meters ? formatNumber(detailDialog.recovery.consumed_meters) + 'm' : '—' }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <!-- History Section -->
          <div class="col-12">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              Trạng thái & Lịch sử
            </div>
            <q-list
              bordered
              separator
              padding
              class="rounded-borders"
            >
              <q-item>
                <q-item-section>
                  <q-item-label caption>
                    Trạng thái hiện tại
                  </q-item-label>
                  <q-item-label>
                    <q-badge :color="getStatusConfig(detailDialog.recovery.status).color">
                      {{ getStatusConfig(detailDialog.recovery.status).label }}
                    </q-badge>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="detailDialog.recovery.returned_by">
                <q-item-section>
                  <q-item-label caption>
                    Người khởi tạo
                  </q-item-label>
                  <q-item-label>{{ detailDialog.recovery.returned_by }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption>
                    {{ formatDate(detailDialog.recovery.created_at) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="detailDialog.recovery.weighed_by">
                <q-item-section>
                  <q-item-label caption>
                    Người cân
                  </q-item-label>
                  <q-item-label>{{ detailDialog.recovery.weighed_by }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="detailDialog.recovery.notes">
                <q-item-section>
                  <q-item-label caption>
                    Ghi chú
                  </q-item-label>
                  <q-item-label>{{ detailDialog.recovery.notes }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </div>
      <template #actions>
        <AppButton
          v-close-popup
          label="Đóng"
          flat
          color="grey-7"
        />
        <AppButton 
          v-if="canWeigh(detailDialog.recovery?.status)"
          label="Cân Ngay" 
          color="warning" 
          icon="scale"
          @click="() => { detailDialog.isOpen = false; openWeighDialog(detailDialog.recovery!) }"
        />
        <AppButton 
          v-if="canConfirm(detailDialog.recovery?.status)"
          label="Xác Nhận" 
          color="positive" 
          icon="check_circle"
          @click="() => { detailDialog.isOpen = false; handleConfirm(detailDialog.recovery!) }"
        />
      </template>
    </AppDialog>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { type QTableColumn } from 'quasar'
import { useRecovery, useSnackbar, useConfirm } from '@/composables'
import { RecoveryStatus } from '@/types/thread/enums'
import type { Recovery, RecoveryFilters } from '@/types/thread'

// Composables
const snackbar = useSnackbar()
const { confirm } = useConfirm()
const {
  recoveries,
  isLoading,
  fetchRecoveries,
  initiateReturn,
  weighCone,
  confirmRecovery,
  writeOffCone,
} = useRecovery()

// State
const filters = reactive<RecoveryFilters>({
  status: undefined,
  cone_id: '',
})

const scanDialog = reactive({
  isOpen: false,
  barcode: '',
  notes: '',
})

const weighDialog = reactive({
  isOpen: false,
  recovery: null as Recovery | null,
  weight: null as number | null,
  weighed_by: '',
})

const writeOffDialog = reactive({
  isOpen: false,
  recovery: null as Recovery | null,
  reason: '',
  approved_by: '',
})

const detailDialog = reactive({
  isOpen: false,
  recovery: null as Recovery | null,
})

// Options & Config
const statusOptions = [
  { label: 'Đã khởi tạo', value: RecoveryStatus.INITIATED },
  { label: 'Chờ cân', value: RecoveryStatus.PENDING_WEIGH },
  { label: 'Đã cân', value: RecoveryStatus.WEIGHED },
  { label: 'Đã xác nhận', value: RecoveryStatus.CONFIRMED },
  { label: 'Đã loại bỏ', value: RecoveryStatus.WRITTEN_OFF },
  { label: 'Từ chối', value: RecoveryStatus.REJECTED },
]

const statusConfig = {
  [RecoveryStatus.INITIATED]: { color: 'info', label: 'Đã khởi tạo', icon: 'qr_code_scanner' },
  [RecoveryStatus.PENDING_WEIGH]: { color: 'warning', label: 'Chờ cân', icon: 'scale' },
  [RecoveryStatus.WEIGHED]: { color: 'blue', label: 'Đã cân', icon: 'check' },
  [RecoveryStatus.CONFIRMED]: { color: 'positive', label: 'Đã xác nhận', icon: 'check_circle' },
  [RecoveryStatus.WRITTEN_OFF]: { color: 'negative', label: 'Đã loại bỏ', icon: 'delete' },
  [RecoveryStatus.REJECTED]: { color: 'grey-7', label: 'Từ chối', icon: 'block' },
}

const workflowSteps = [
  { 
    overline: 'Bước 1', 
    title: 'Quét Mã', 
    description: 'Công nhân quét mã cuộn chỉ dư', 
    icon: 'qr_code_scanner', 
    color: 'info' 
  },
  { 
    overline: 'Bước 2', 
    title: 'Cân Trọng Lượng', 
    description: 'Kho cân và tính toán số mét còn', 
    icon: 'scale', 
    color: 'warning' 
  },
  { 
    overline: 'Bước 3', 
    title: 'Xác Nhận Nhập', 
    description: 'Xác nhận đưa về kho khả dụng', 
    icon: 'check_circle', 
    color: 'positive' 
  },
]

// Table Columns
const columns: QTableColumn[] = [
  { name: 'cone_id', label: 'Mã cuộn', field: row => row.cone?.cone_id || 'N/A', align: 'left', sortable: true },
  { name: 'thread_type', label: 'Loại chỉ', field: 'thread_type', align: 'left', sortable: true },
  { name: 'original_meters', label: 'Mét gốc', field: 'original_meters', align: 'right', sortable: true },
  { name: 'returned_weight', label: 'TL hoàn (g)', field: 'returned_weight_grams', align: 'right', sortable: true },
  { name: 'remaining_meters', label: 'Mét còn', field: 'calculated_meters', align: 'right', sortable: true },
  { name: 'consumed_meters', label: 'Đã dùng', field: 'consumption_meters', align: 'right', sortable: true },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center', sortable: true },
  { name: 'actions', label: 'Thao Tác', field: 'actions', align: 'right' },
]

// Computed Calculations
const calculatedMeters = computed(() => {
  if (weighDialog.weight && weighDialog.recovery?.cone?.thread_type?.density_grams_per_meter) {
    const density = weighDialog.recovery.cone.thread_type.density_grams_per_meter
    const tare = weighDialog.recovery.tare_weight_grams || 10 // default tare
    const netWeight = Math.max(0, weighDialog.weight - tare)
    return Math.round(netWeight / density)
  }
  return 0
})

const calculatedConsumption = computed(() => {
  if (calculatedMeters.value && weighDialog.recovery?.original_meters) {
    return Math.max(0, weighDialog.recovery.original_meters - calculatedMeters.value)
  }
  return 0
})

// Methods
const getStatusConfig = (status: RecoveryStatus) => {
  return statusConfig[status] || { color: 'grey', label: status, icon: 'help' }
}

const formatNumber = (val: number | null | undefined) => {
  if (val === null || val === undefined) return '0'
  return new Intl.NumberFormat('vi-VN').format(val)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('vi-VN')
}

const handleFilterChange = () => {
  fetchRecoveries({ ...filters })
}

const openScanDialog = () => {
  scanDialog.barcode = ''
  scanDialog.notes = ''
  scanDialog.isOpen = true
}

const handleScanSubmit = async () => {
  if (!scanDialog.barcode) {
    snackbar.warning('Vui lòng nhập hoặc quét mã barcode')
    return
  }

  const result = await initiateReturn({
    cone_id: scanDialog.barcode,
    notes: scanDialog.notes || undefined
  })

  if (result) {
    scanDialog.isOpen = false
  }
}

const openWeighDialog = (recovery: Recovery) => {
  weighDialog.recovery = recovery
  weighDialog.weight = recovery.returned_weight_grams || null
  weighDialog.weighed_by = recovery.weighed_by || ''
  weighDialog.isOpen = true
}

const handleWeighSubmit = async () => {
  if (!weighDialog.recovery || !weighDialog.weight) return

  const result = await weighCone(weighDialog.recovery.id, {
    weight_grams: weighDialog.weight
  })

  if (result) {
    weighDialog.isOpen = false
    // If weight is very low, maybe suggest write off?
  }
}

const handleConfirm = async (recovery: Recovery) => {
  const confirmed = await confirm({
    title: 'Xác nhận nhập kho',
    message: `Bạn có chắc chắn muốn xác nhận hoàn trả cuộn chỉ ${recovery.cone?.cone_id} với ${formatNumber(recovery.remaining_meters)}m về kho?`,
    color: 'positive',
    ok: 'Xác nhận'
  })

  if (confirmed) {
    await confirmRecovery(recovery.id)
  }
}

const openWriteOffDialog = (recovery: Recovery) => {
  writeOffDialog.recovery = recovery
  writeOffDialog.reason = ''
  writeOffDialog.approved_by = ''
  writeOffDialog.isOpen = true
}

const handleWriteOffSubmit = async () => {
  if (!writeOffDialog.recovery || !writeOffDialog.reason || !writeOffDialog.approved_by) {
    snackbar.warning('Vui lòng điền đầy đủ thông tin phê duyệt')
    return
  }

  const result = await writeOffCone(writeOffDialog.recovery.id, {
    reason: writeOffDialog.reason,
    approved_by: writeOffDialog.approved_by
  })

  if (result) {
    writeOffDialog.isOpen = false
  }
}

const openDetailDialog = (recovery: Recovery) => {
  detailDialog.recovery = recovery
  detailDialog.isOpen = true
}

// Permissions/Visibility helpers
const canWeigh = (status?: RecoveryStatus) => {
  return status === RecoveryStatus.INITIATED || status === RecoveryStatus.PENDING_WEIGH
}

const canConfirm = (status?: RecoveryStatus) => {
  return status === RecoveryStatus.WEIGHED
}

const canWriteOff = (recovery: Recovery) => {
  return recovery.status === RecoveryStatus.WEIGHED
}

// Lifecycle
onMounted(() => {
  fetchRecoveries()
})
</script>

<style scoped lang="scss">
.recovery-page {
  width: 100%;
  max-width: 100%;
}

.workflow-card {
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-4px);
  }
}

.recovery-table {
  border-radius: 8px;
  width: 100%;
  max-width: 100%;
}

:deep(.q-table th) {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

/* Ensure table scrolls horizontally on smaller widths */
:deep(.q-table__middle) {
  overflow-x: auto;
}

// Dark mode compatible surface background
.bg-surface {
  background: rgba(128, 128, 128, 0.08);
}

// Hint/placeholder text color - adapts to dark mode
.text-hint {
  color: rgba(0, 0, 0, 0.38);
}

// Dark mode overrides using Quasar's body class
.body--dark {
  .workflow-card {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .text-hint {
    color: rgba(255, 255, 255, 0.5);
  }
  
  .bg-surface {
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
