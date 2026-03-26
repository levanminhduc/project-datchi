<template>
  <q-page padding>
    <!-- Page Header -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Cài đặt hệ thống
        </h1>
        <p class="text-caption text-grey-7 q-mb-none">
          Quản lý các cài đặt chung cho hệ thống
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading && !hasLoaded"
      class="row justify-center q-py-xl"
    >
      <q-spinner-dots
        size="50px"
        color="primary"
      />
    </div>

    <!-- Settings Form -->
    <q-card
      v-else
      flat
      bordered
      class="settings-card"
    >
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">
          Cài đặt xuất kho
        </div>

        <!-- Partial Cone Ratio Setting -->
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-6 col-lg-4">
            <AppInput
              v-model.number="partialConeRatio"
              label="Tỷ lệ quy đổi cuộn lẻ"
              type="number"
              step="0.1"
              min="0"
              max="1"
              hint="Giá trị từ 0 đến 1 (ví dụ: 0.3 = 30%)"
              :disable="isLoading"
              outlined
              dense
            >
              <template #prepend>
                <q-icon name="percent" />
              </template>
            </AppInput>
          </div>

          <div class="col-12 col-md-auto">
            <AppButton
              label="Lưu thay đổi"
              color="primary"
              icon="save"
              :loading="isLoading"
              :disable="!hasChanges"
              @click="handleSave"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="q-mt-md text-caption text-grey-7">
          <q-icon
            name="info"
            size="xs"
            class="q-mr-xs"
          />
          Tỷ lệ quy đổi cuộn lẻ được sử dụng để tính toán số lượng cuộn lẻ khi xuất kho sản xuất.
          Giá trị mặc định là 0.3 (tương đương 30% cuộn nguyên).
        </div>

        <!-- Reserve Priority Setting -->
        <q-separator class="q-my-lg" />

        <div class="text-subtitle1 text-weight-medium q-mb-md">
          Ưu tiên reserve cuộn
        </div>

        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-6 col-lg-4">
            <AppSelect
              v-model="reservePriority"
              label="Ưu tiên khi reserve cuộn cho tuần"
              :options="reservePriorityOptions"
              emit-value
              map-options
              :disable="isLoading"
              outlined
              dense
            >
              <template #prepend>
                <q-icon name="sort" />
              </template>
            </AppSelect>
          </div>

          <div class="col-12 col-md-auto">
            <AppButton
              label="Lưu ưu tiên"
              color="primary"
              icon="save"
              :loading="isSavingReservePriority"
              :disable="!hasReservePriorityChanges"
              @click="handleSaveReservePriority"
            />
          </div>
        </div>

        <div class="q-mt-md text-caption text-grey-7">
          <q-icon
            name="info"
            size="xs"
            class="q-mr-xs"
          />
          Khi xác nhận tuần đặt hàng, hệ thống sẽ ưu tiên reserve cuộn lẻ hoặc cuộn nguyên trước tùy theo cài đặt này.
        </div>
      </q-card-section>
    </q-card>

    <!-- Department Settings for Issue (ROOT only) -->
    <q-card
      v-if="isRoot && hasLoaded"
      flat
      bordered
      class="settings-card q-mt-lg"
    >
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">
          Cài đặt Bộ Phận — Phiếu Xuất
        </div>

        <div
          v-if="isLoadingDepts"
          class="q-py-md"
        >
          <q-spinner-dots
            size="30px"
            color="primary"
          />
        </div>

        <template v-else>
          <div class="text-body2 q-mb-sm text-grey-8">
            Bộ phận từ nhân viên (tick = hiển thị):
          </div>
          <div class="q-gutter-sm q-mb-md">
            <q-checkbox
              v-for="item in deptCheckboxItems"
              :key="item.name"
              :model-value="item.checked"
              :label="item.name"
              dense
              @update:model-value="toggleDept(item.name, $event as boolean)"
            />
          </div>

          <q-separator class="q-my-md" />

          <div class="text-body2 q-mb-sm text-grey-8">
            Bộ phận bổ sung:
          </div>
          <div class="q-gutter-sm q-mb-md">
            <q-chip
              v-for="dept in deptConfig.custom"
              :key="dept"
              removable
              color="primary"
              text-color="white"
              @remove="removeCustomDept(dept)"
            >
              {{ dept }}
            </q-chip>
            <span
              v-if="!deptConfig.custom.length"
              class="text-grey-5 text-caption"
            >Chưa có</span>
          </div>

          <div class="row q-col-gutter-sm items-end">
            <div class="col-12 col-md-4">
              <AppInput
                v-model="newCustomDept"
                label="Thêm bộ phận"
                dense
                outlined
                @keyup.enter="addCustomDept"
              />
            </div>
            <div class="col-auto">
              <AppButton
                label="Thêm"
                color="secondary"
                icon="add"
                :disable="!newCustomDept.trim()"
                dense
                @click="addCustomDept"
              />
            </div>
          </div>
        </template>

        <div class="row q-mt-lg">
          <AppButton
            label="Lưu cấu hình bộ phận"
            color="primary"
            icon="save"
            :loading="isSavingDeptConfig"
            :disable="!hasDeptChanges"
            @click="handleSaveDeptConfig"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Import NCC-Tex Mapping (ROOT only) -->
    <q-card
      v-if="isRoot && hasLoaded"
      flat
      bordered
      class="settings-card q-mt-lg"
    >
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">
          Cài đặt Import NCC-Tex
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <AppInput
              v-model.number="texMapping.sheet_index"
              label="Sheet"
              type="number"
              min="0"
              hint="Vị trí sheet (bắt đầu từ 0)"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-4">
            <AppInput
              v-model.number="texMapping.header_row"
              label="Dòng header"
              type="number"
              min="1"
              hint="Dòng chứa tiêu đề cột"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-4">
            <AppInput
              v-model.number="texMapping.data_start_row"
              label="Dòng data bắt đầu"
              type="number"
              min="1"
              hint="Dòng bắt đầu dữ liệu"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-6 col-md-3">
            <AppSelect
              v-model="texMapping.columns.supplier_name"
              label="Cột Nhà cung cấp"
              :options="columnOptions"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-6 col-md-3">
            <AppSelect
              v-model="texMapping.columns.tex_number"
              label="Cột Tex"
              :options="columnOptions"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-6 col-md-3">
            <AppSelect
              v-model="texMapping.columns.meters_per_cone"
              label="Cột Mét/Cuộn"
              :options="columnOptions"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-6 col-md-3">
            <AppSelect
              v-model="texMapping.columns.unit_price"
              label="Cột Giá/Cuộn VND"
              :options="columnOptions"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-6 col-md-3">
            <AppSelect
              v-model="texMapping.columns.supplier_item_code"
              label="Cột Mã hàng NCC (tuỳ chọn)"
              :options="columnOptions"
              :disable="isLoading"
              clearable
              outlined
              dense
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md items-center">
          <div class="col-auto">
            <AppButton
              label="Lưu"
              color="primary"
              icon="save"
              :loading="isSavingTexMapping"
              :disable="isLoading"
              @click="handleSaveTexMapping"
            />
          </div>
          <div class="col-auto">
            <AppButton
              label="Tải file mẫu"
              color="secondary"
              icon="download"
              variant="outlined"
              :disable="isLoading"
              @click="handleDownloadTexTemplate"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Import Colors Mapping (ROOT only) -->
    <q-card
      v-if="isRoot && hasLoaded"
      flat
      bordered
      class="settings-card q-mt-lg"
    >
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">
          Cài đặt Import Màu NCC
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <AppInput
              v-model.number="colorMapping.sheet_index"
              label="Sheet"
              type="number"
              min="0"
              hint="Vị trí sheet (bắt đầu từ 0)"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-4">
            <AppInput
              v-model.number="colorMapping.header_row"
              label="Dòng header"
              type="number"
              min="1"
              hint="Dòng chứa tiêu đề cột"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-4">
            <AppInput
              v-model.number="colorMapping.data_start_row"
              label="Dòng data bắt đầu"
              type="number"
              min="1"
              hint="Dòng bắt đầu dữ liệu"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-6 col-md-3">
            <AppSelect
              v-model="colorMapping.columns.color_name"
              label="Cột Tên Màu"
              :options="columnOptions"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-6 col-md-3">
            <AppSelect
              v-model="colorMapping.columns.supplier_color_code"
              label="Cột Mã màu NCC (tuỳ chọn)"
              :options="columnOptions"
              :disable="isLoading"
              clearable
              outlined
              dense
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md items-center">
          <div class="col-auto">
            <AppButton
              label="Lưu"
              color="primary"
              icon="save"
              :loading="isSavingColorMapping"
              :disable="isLoading"
              @click="handleSaveColorMapping"
            />
          </div>
          <div class="col-auto">
            <AppButton
              label="Tải file mẫu"
              color="secondary"
              icon="download"
              variant="outlined"
              :disable="isLoading"
              @click="handleDownloadColorTemplate"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Import PO Mapping (ROOT only) -->
    <q-card
      v-if="isRoot && hasLoaded"
      flat
      bordered
      class="settings-card q-mt-lg"
    >
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">
          Cài đặt Import Đơn Hàng (PO)
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <AppInput
              v-model.number="poMapping.sheet_index"
              label="Sheet"
              type="number"
              min="0"
              hint="Vị trí sheet (bắt đầu từ 0)"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-4">
            <AppInput
              v-model.number="poMapping.header_row"
              label="Dòng header"
              type="number"
              min="1"
              hint="Dòng chứa tiêu đề cột"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-4">
            <AppInput
              v-model.number="poMapping.data_start_row"
              label="Dòng data bắt đầu"
              type="number"
              min="1"
              hint="Dòng bắt đầu dữ liệu"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-6 col-md-2">
            <AppSelect
              v-model="poMapping.columns.customer_name"
              label="Cột Khách hàng"
              :options="columnOptions"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-6 col-md-2">
            <AppSelect
              v-model="poMapping.columns.po_number"
              label="Cột Số PO"
              :options="columnOptions"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-6 col-md-2">
            <AppSelect
              v-model="poMapping.columns.style_code"
              label="Cột Mã hàng"
              :options="columnOptions"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
          <div class="col-6 col-md-2">
            <AppSelect
              v-model="poMapping.columns.week"
              label="Cột Week"
              :options="columnOptions"
              :disable="isLoading"
              clearable
              outlined
              dense
            />
          </div>
          <div class="col-6 col-md-2">
            <AppSelect
              v-model="poMapping.columns.description"
              label="Cột Mô tả"
              :options="columnOptions"
              :disable="isLoading"
              clearable
              outlined
              dense
            />
          </div>
          <div class="col-6 col-md-2">
            <AppSelect
              v-model="poMapping.columns.finished_product_code"
              label="Cột Mã TP KT"
              :options="columnOptions"
              :disable="isLoading"
              clearable
              outlined
              dense
            />
          </div>
          <div class="col-6 col-md-2">
            <AppSelect
              v-model="poMapping.columns.quantity"
              label="Cột SL SP"
              :options="columnOptions"
              :disable="isLoading"
              outlined
              dense
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md items-center">
          <div class="col-auto">
            <AppButton
              label="Lưu"
              color="primary"
              icon="save"
              :loading="isSavingPOMapping"
              :disable="isLoading"
              @click="handleSavePOMapping"
            />
          </div>
          <div class="col-auto">
            <AppButton
              label="Tải file mẫu"
              color="secondary"
              icon="download"
              variant="outlined"
              :disable="isLoading"
              @click="handleDownloadPOTemplate"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { usePermission } from '@/composables/usePermission'
import { useSnackbar } from '@/composables/useSnackbar'
import { importService } from '@/services/importService'
import { settingsService } from '@/services/settingsService'
import { employeeService } from '@/services/employeeService'

const PARTIAL_CONE_RATIO_KEY = 'partial_cone_ratio'
const RESERVE_PRIORITY_KEY = 'reserve_priority'
const TEX_MAPPING_KEY = 'import_supplier_tex_mapping'
const COLOR_MAPPING_KEY = 'import_supplier_color_mapping'
const PO_MAPPING_KEY = 'import_po_items_mapping'
const ISSUE_DEPT_KEY = 'issue_department_options'

const { isLoading, getSetting, updateSetting } = useSettings()
const { isRoot } = usePermission()
const snackbar = useSnackbar()

const partialConeRatio = ref<number>(0.5)
const originalValue = ref<number>(0.5)
const hasLoaded = ref(false)
const isSavingTexMapping = ref(false)
const isSavingColorMapping = ref(false)
const isSavingPOMapping = ref(false)
const isSavingReservePriority = ref(false)

const reservePriority = ref<string>('partial_first')
const originalReservePriority = ref<string>('partial_first')
const reservePriorityOptions = [
  { label: 'Ưu tiên cuộn lẻ', value: 'partial_first' },
  { label: 'Ưu tiên cuộn nguyên', value: 'full_first' },
]

interface DeptConfig { hidden: string[]; custom: string[] }
const employeeDepts = ref<string[]>([])
const deptConfig = reactive<DeptConfig>({ hidden: [], custom: [] })
const originalDeptConfig = ref<DeptConfig>({ hidden: [], custom: [] })
const newCustomDept = ref('')
const isSavingDeptConfig = ref(false)
const isLoadingDepts = ref(false)

const deptCheckboxItems = computed(() =>
  employeeDepts.value.map(d => ({
    name: d,
    checked: !deptConfig.hidden.includes(d),
  }))
)

const hasDeptChanges = computed(() =>
  JSON.stringify({ hidden: deptConfig.hidden, custom: deptConfig.custom })
  !== JSON.stringify(originalDeptConfig.value)
)

const hasReservePriorityChanges = computed(() => {
  return reservePriority.value !== originalReservePriority.value
})

const columnOptions = Array.from({ length: 26 }, (_, i) => ({
  label: String.fromCharCode(65 + i),
  value: String.fromCharCode(65 + i),
}))

const texMapping = reactive({
  sheet_index: 0,
  header_row: 1,
  data_start_row: 2,
  columns: {
    supplier_name: 'A',
    tex_number: 'B',
    meters_per_cone: 'C',
    unit_price: 'D',
    supplier_item_code: 'E',
  } as Record<string, string>,
})

const colorMapping = reactive({
  sheet_index: 0,
  header_row: 1,
  data_start_row: 2,
  columns: {
    color_name: 'A',
    supplier_color_code: 'B',
  } as Record<string, string>,
})

const poMapping = reactive({
  sheet_index: 0,
  header_row: 1,
  data_start_row: 2,
  columns: {
    customer_name: 'A',
    po_number: 'B',
    style_code: 'C',
    week: 'D',
    description: 'E',
    finished_product_code: 'F',
    quantity: 'G',
  } as Record<string, string>,
})

function normalizePOMappingSettingValue(setting: { value: unknown } | null) {
  if (!setting?.value || typeof setting.value !== 'object') return null

  const val = setting.value as Record<string, unknown>
  const columns = val.columns && typeof val.columns === 'object'
    ? val.columns as Record<string, unknown>
    : {}

  const hasLegacyShape = 'order_date' in columns || 'notes' in columns
  if (hasLegacyShape) {
    return null
  }

  return {
    sheet_index: typeof val.sheet_index === 'number' ? val.sheet_index : poMapping.sheet_index,
    header_row: typeof val.header_row === 'number' ? val.header_row : poMapping.header_row,
    data_start_row: typeof val.data_start_row === 'number' ? val.data_start_row : poMapping.data_start_row,
    columns: {
      customer_name: typeof columns.customer_name === 'string' ? columns.customer_name : poMapping.columns.customer_name,
      po_number: typeof columns.po_number === 'string' ? columns.po_number : poMapping.columns.po_number,
      style_code: typeof columns.style_code === 'string' ? columns.style_code : poMapping.columns.style_code,
      week: typeof columns.week === 'string' ? columns.week : poMapping.columns.week,
      description: typeof columns.description === 'string' ? columns.description : poMapping.columns.description,
      finished_product_code:
        typeof columns.finished_product_code === 'string'
          ? columns.finished_product_code
          : poMapping.columns.finished_product_code,
      quantity: typeof columns.quantity === 'string' ? columns.quantity : poMapping.columns.quantity,
    }
  }
}

const hasChanges = computed(() => {
  return partialConeRatio.value !== originalValue.value
})

async function loadSettings() {
  const setting = await getSetting(PARTIAL_CONE_RATIO_KEY)
  if (setting) {
    const value = typeof setting.value === 'number' ? setting.value : parseFloat(String(setting.value))
    partialConeRatio.value = isNaN(value) ? 0.5 : value
    originalValue.value = partialConeRatio.value
  }

  const prioritySetting = await getSettingSilent(RESERVE_PRIORITY_KEY)
  if (prioritySetting?.value) {
    const val = typeof prioritySetting.value === 'string' ? prioritySetting.value : String(prioritySetting.value)
    reservePriority.value = val === 'full_first' ? 'full_first' : 'partial_first'
    originalReservePriority.value = reservePriority.value
  }

  if (isRoot.value) {
    await loadImportMappings()
    await loadDeptConfig()
  }

  hasLoaded.value = true
}

async function getSettingSilent(key: string) {
  try {
    return await settingsService.get(key)
  } catch {
    return null
  }
}

function applyMappingValues(target: Record<string, unknown>, setting: { value: unknown } | null) {
  if (!setting?.value || typeof setting.value !== 'object') return
  const val = setting.value as Record<string, unknown>
  if (typeof val.sheet_index === 'number') target.sheet_index = val.sheet_index
  if (typeof val.header_row === 'number') target.header_row = val.header_row
  if (typeof val.data_start_row === 'number') target.data_start_row = val.data_start_row
  if (val.columns && typeof val.columns === 'object') {
    Object.assign(target.columns as Record<string, string>, val.columns)
  }
}

async function loadImportMappings() {
  const [texSetting, colorSetting, poSetting] = await Promise.all([
    getSettingSilent(TEX_MAPPING_KEY),
    getSettingSilent(COLOR_MAPPING_KEY),
    getSettingSilent(PO_MAPPING_KEY),
  ])

  applyMappingValues(texMapping, texSetting)
  applyMappingValues(colorMapping, colorSetting)
  const normalizedPOMapping = normalizePOMappingSettingValue(poSetting)
  if (normalizedPOMapping) {
    applyMappingValues(poMapping, { value: normalizedPOMapping })
  }
}

async function handleSave() {
  const result = await updateSetting(PARTIAL_CONE_RATIO_KEY, partialConeRatio.value)
  if (result) {
    originalValue.value = partialConeRatio.value
  }
}

async function handleSaveReservePriority() {
  isSavingReservePriority.value = true
  try {
    const result = await updateSetting(RESERVE_PRIORITY_KEY, reservePriority.value)
    if (result) {
      originalReservePriority.value = reservePriority.value
    }
  } finally {
    isSavingReservePriority.value = false
  }
}

async function handleSaveTexMapping() {
  isSavingTexMapping.value = true
  try {
    const result = await updateSetting(TEX_MAPPING_KEY, {
      sheet_index: texMapping.sheet_index,
      header_row: texMapping.header_row,
      data_start_row: texMapping.data_start_row,
      columns: { ...texMapping.columns },
    })
    if (result) {
      snackbar.success('Đã lưu cấu hình Import NCC-Tex')
    }
  } finally {
    isSavingTexMapping.value = false
  }
}

async function handleSaveColorMapping() {
  isSavingColorMapping.value = true
  try {
    const result = await updateSetting(COLOR_MAPPING_KEY, {
      sheet_index: colorMapping.sheet_index,
      header_row: colorMapping.header_row,
      data_start_row: colorMapping.data_start_row,
      columns: { ...colorMapping.columns },
    })
    if (result) {
      snackbar.success('Đã lưu cấu hình Import Màu NCC')
    }
  } finally {
    isSavingColorMapping.value = false
  }
}

async function handleDownloadTexTemplate() {
  try {
    await importService.downloadTexTemplate()
  } catch (e) {
    snackbar.error('Không thể tải file mẫu NCC-Tex')
  }
}

async function handleDownloadColorTemplate() {
  try {
    await importService.downloadColorTemplate()
  } catch (e) {
    snackbar.error('Không thể tải file mẫu Màu NCC')
  }
}

async function handleSavePOMapping() {
  isSavingPOMapping.value = true
  try {
    const result = await updateSetting(PO_MAPPING_KEY, {
      sheet_index: poMapping.sheet_index,
      header_row: poMapping.header_row,
      data_start_row: poMapping.data_start_row,
      columns: { ...poMapping.columns },
    })
    if (result) {
      snackbar.success('Đã lưu cấu hình Import PO')
    }
  } finally {
    isSavingPOMapping.value = false
  }
}

async function handleDownloadPOTemplate() {
  try {
    await importService.downloadPOTemplate()
  } catch (e) {
    snackbar.error('Không thể tải file mẫu PO')
  }
}

async function loadDeptConfig() {
  isLoadingDepts.value = true
  try {
    const [depts, setting] = await Promise.all([
      employeeService.getDepartments(),
      getSettingSilent(ISSUE_DEPT_KEY),
    ])
    employeeDepts.value = depts
    const val = setting?.value as DeptConfig | null
    if (val) {
      deptConfig.hidden = [...(val.hidden || [])]
      deptConfig.custom = [...(val.custom || [])]
    }
    originalDeptConfig.value = { hidden: [...deptConfig.hidden], custom: [...deptConfig.custom] }
  } finally {
    isLoadingDepts.value = false
  }
}

function toggleDept(name: string, checked: boolean) {
  if (checked) {
    deptConfig.hidden = deptConfig.hidden.filter(d => d !== name)
  } else {
    if (!deptConfig.hidden.includes(name)) deptConfig.hidden.push(name)
  }
}

function addCustomDept() {
  const name = newCustomDept.value.trim()
  if (!name) return
  if (deptConfig.custom.includes(name) || employeeDepts.value.includes(name)) {
    snackbar.error('Bộ phận đã tồn tại')
    return
  }
  deptConfig.custom.push(name)
  newCustomDept.value = ''
}

function removeCustomDept(name: string) {
  deptConfig.custom = deptConfig.custom.filter(d => d !== name)
}

async function handleSaveDeptConfig() {
  isSavingDeptConfig.value = true
  try {
    const result = await updateSetting(ISSUE_DEPT_KEY, {
      hidden: [...deptConfig.hidden],
      custom: [...deptConfig.custom],
    })
    if (result) {
      originalDeptConfig.value = { hidden: [...deptConfig.hidden], custom: [...deptConfig.custom] }
      snackbar.success('Đã lưu cấu hình bộ phận')
    }
  } finally {
    isSavingDeptConfig.value = false
  }
}

onMounted(async () => {
  await loadSettings()
})
</script>

<style scoped>
</style>
