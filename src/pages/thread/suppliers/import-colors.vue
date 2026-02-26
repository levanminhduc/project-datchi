<template>
  <q-page padding>
    <PageHeader
      title="Import Màu cho NCC"
      subtitle="Nhập danh sách màu từ file Excel và liên kết với nhà cung cấp"
      show-back
      back-to="/thread/suppliers"
    >
      <template #actions>
        <AppButton
          label="Tải mẫu Excel"
          icon="download"
          variant="outlined"
          color="primary"
          @click="downloadTemplate"
        />
      </template>
    </PageHeader>

    <AppStepper
      v-model="currentStep"
      :steps="steps"
      flat
      bordered
      :header-nav="false"
      class="q-mt-md"
    >
      <template #step-upload>
        <div class="q-pa-md">
          <div class="text-subtitle1 q-mb-md">
            Chọn nhà cung cấp và file Excel (.xlsx, .xls) chứa danh sách màu
          </div>

          <div class="row q-col-gutter-md items-start">
            <div class="col-12 col-sm-6 col-md-6">
              <AppSelect
                v-model="selectedSupplierId"
                :options="supplierOptions"
                label="Nhà cung cấp"
                option-value="value"
                option-label="label"
                use-input
                clearable
                dense
                hide-bottom-space
                :loading="loadingSuppliers"
                :disable="parsing || importing"
                required
                @update:model-value="onSupplierSelected"
              />
            </div>

            <div class="col-12 col-sm-6 col-md-6">
              <FilePicker
                v-model="selectedFile"
                accept=".xlsx,.xls"
                label="Chọn file Excel"
                hint="Định dạng: .xlsx hoặc .xls"
                dense
                hide-bottom-space
                :disable="!selectedSupplierId || parsing || importing"
                @update:model-value="onFileSelected"
              />
            </div>
          </div>

          <div
            v-if="parseError"
            class="text-negative q-mt-sm"
          >
            {{ parseError }}
          </div>
        </div>

        <q-stepper-navigation>
          <AppButton
            label="Tiếp tục"
            icon-right="arrow_forward"
            :disable="!selectedSupplierId || !selectedFile || parsing"
            :loading="parsing"
            @click="parseFile"
          />
        </q-stepper-navigation>
      </template>

      <template #step-preview>
        <div class="q-pa-md">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-auto">
              <q-badge
                color="positive"
                class="q-pa-sm text-body2"
              >
                {{ summary.valid }} hợp lệ
              </q-badge>
            </div>
            <div
              v-if="summary.newCount > 0"
              class="col-auto"
            >
              <q-badge
                color="info"
                class="q-pa-sm text-body2"
              >
                {{ summary.newCount }} màu mới
              </q-badge>
            </div>
            <div
              v-if="summary.existsCount > 0"
              class="col-auto"
            >
              <q-badge
                color="blue-grey"
                class="q-pa-sm text-body2"
              >
                {{ summary.existsCount }} đã có
              </q-badge>
            </div>
            <div
              v-if="summary.errorCount > 0"
              class="col-auto"
            >
              <q-badge
                color="negative"
                class="q-pa-sm text-body2"
              >
                {{ summary.errorCount }} lỗi
              </q-badge>
            </div>
          </div>

          <q-table
            flat
            bordered
            dense
            :rows="parsedRows"
            :columns="previewColumns"
            row-key="row_number"
            :rows-per-page-options="[10, 25, 50, 0]"
            :pagination="{ page: 1, rowsPerPage: 25 }"
          >
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-badge :color="getStatusColor(props.row.status)">
                  {{ getStatusLabel(props.row.status) }}
                </q-badge>
                <div
                  v-if="props.row.errors.length > 0"
                  class="text-caption text-negative q-mt-xs"
                >
                  {{ props.row.errors.join(', ') }}
                </div>
              </q-td>
            </template>
          </q-table>
        </div>

        <q-stepper-navigation>
          <AppButton
            label="Quay lại"
            variant="flat"
            color="grey"
            icon="arrow_back"
            class="q-mr-sm"
            @click="currentStep = 'upload'"
          />
          <AppButton
            label="Import"
            icon="upload"
            :disable="summary.valid === 0 || !selectedSupplierId"
            :loading="importing"
            @click="doImport"
          />
        </q-stepper-navigation>
      </template>

      <template #step-result>
        <div class="q-pa-md text-center">
          <q-icon
            name="check_circle"
            color="positive"
            size="64px"
            class="q-mb-md"
          />
          <div class="text-h6 q-mb-sm">
            Import thành công!
          </div>
          <div
            v-if="importResult"
            class="text-body1 q-mb-md"
          >
            <div>Đã import: {{ importResult.imported }} liên kết</div>
            <div v-if="importResult.skipped > 0">
              Bỏ qua: {{ importResult.skipped }} dòng
            </div>
            <div v-if="importResult.colors_created > 0">
              Màu mới tạo: {{ importResult.colors_created }}
            </div>
          </div>
          <div class="row justify-center q-gutter-sm">
            <AppButton
              label="Import file khác"
              icon="replay"
              variant="outlined"
              @click="resetFlow"
            />
            <AppButton
              label="Về trang NCC"
              icon="arrow_back"
              @click="router.push('/thread/suppliers')"
            />
          </div>
        </div>
      </template>
    </AppStepper>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSnackbar } from '@/composables/useSnackbar'
import { colorService } from '@/services/colorService'
import { importService } from '@/services/importService'
import { supplierService } from '@/services/supplierService'
import type { Color } from '@/types/thread/color'
import type { Supplier } from '@/types/thread/supplier'
import type {
  ImportColorResponse,
  ImportColorRow,
  ImportMappingConfig,
  ImportRowStatus,
} from '@/types/thread'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppStepper from '@/components/ui/navigation/AppStepper.vue'
import FilePicker from '@/components/ui/pickers/FilePicker.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.suppliers.manage'],
  },
})

const route = useRoute()
const router = useRouter()
const snackbar = useSnackbar()

const steps = [
  { name: 'upload', title: 'Chọn file', icon: 'upload_file' },
  { name: 'preview', title: 'Xem trước', icon: 'preview' },
  { name: 'result', title: 'Kết quả', icon: 'check_circle' },
]

const currentStep = ref<string | number>('upload')
const selectedSupplierId = ref<number | null>(null)
const selectedFile = ref<File | null>(null)
const parsing = ref(false)
const parseError = ref('')
const importing = ref(false)
const parsedRows = ref<ImportColorRow[]>([])
const importResult = ref<ImportColorResponse | null>(null)
const loadingSuppliers = ref(false)
const suppliers = ref<Supplier[]>([])
const existingColors = ref<Color[]>([])
const mappingConfig = ref<ImportMappingConfig | null>(null)

const supplierOptions = computed(() =>
  suppliers.value.map((supplier) => ({
    label: `${supplier.code} - ${supplier.name}`,
    value: supplier.id,
  }))
)

const summary = computed(() => {
  const rows = parsedRows.value
  return {
    valid: rows.filter((row) => row.status !== 'error').length,
    newCount: rows.filter((row) => row.status === 'new_color').length,
    existsCount: rows.filter((row) => row.status === 'exists').length,
    errorCount: rows.filter((row) => row.status === 'error').length,
  }
})

const previewColumns = [
  { name: 'row_number', label: '#', field: 'row_number', align: 'center' as const, sortable: true },
  { name: 'color_name', label: 'Tên màu', field: 'color_name', align: 'left' as const, sortable: true },
  {
    name: 'supplier_color_code',
    label: 'Mã màu NCC',
    field: 'supplier_color_code',
    align: 'left' as const,
    format: (value: string | undefined) => value || '-',
  },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' as const },
]

function getStatusColor(status: ImportRowStatus): string {
  switch (status) {
    case 'new_color':
      return 'info'
    case 'exists':
      return 'blue-grey'
    case 'error':
      return 'negative'
    default:
      return 'grey'
  }
}

function getStatusLabel(status: ImportRowStatus): string {
  switch (status) {
    case 'new_color':
      return 'Màu mới'
    case 'exists':
      return 'Đã có'
    case 'error':
      return 'Lỗi'
    default:
      return status
  }
}

function resetPreviewState(): void {
  parseError.value = ''
  parsedRows.value = []
  importResult.value = null
  if (currentStep.value !== 'upload') {
    currentStep.value = 'upload'
  }
}

function onSupplierSelected(): void {
  resetPreviewState()
}

function onFileSelected(file: File | File[] | null): void {
  if (Array.isArray(file)) {
    selectedFile.value = file[0] ?? null
  }
  resetPreviewState()
}

function resetFlow(): void {
  selectedFile.value = null
  resetPreviewState()
}

async function loadMappingConfig(): Promise<ImportMappingConfig> {
  if (mappingConfig.value) return mappingConfig.value
  const config = await importService.getSupplierColorMapping()
  mappingConfig.value = config
  return config
}

async function loadInitialData() {
  loadingSuppliers.value = true
  try {
    const [supplierData, colorData] = await Promise.all([
      supplierService.getAll({ is_active: true }),
      colorService.getAll(),
    ])

    suppliers.value = supplierData
    existingColors.value = colorData

    const preSelectedId = Number(route.query.supplier_id)
    if (!Number.isNaN(preSelectedId) && suppliers.value.some((supplier) => supplier.id === preSelectedId)) {
      selectedSupplierId.value = preSelectedId
    }
  } catch (error) {
    snackbar.error('Lỗi khi tải dữ liệu')
    console.error(error)
  } finally {
    loadingSuppliers.value = false
  }
}

async function parseFile() {
  if (!selectedSupplierId.value) {
    parseError.value = 'Vui lòng chọn nhà cung cấp'
    return
  }

  if (!selectedFile.value) {
    parseError.value = 'Vui lòng chọn file Excel'
    return
  }

  parsing.value = true
  parseError.value = ''

  try {
    const config = await loadMappingConfig()
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const buffer = await selectedFile.value.arrayBuffer()
    await workbook.xlsx.load(buffer)

    const sheet = workbook.worksheets[config.sheet_index]
    if (!sheet) {
      parseError.value = `Không tìm thấy sheet tại vị trí ${config.sheet_index}`
      return
    }

    const columns = config.columns
    const rows: ImportColorRow[] = []
    const existingColorNames = new Set(existingColors.value.map((color) => color.name.toLowerCase().trim()))
    const fileColorNames = new Set<string>()

    for (let rowIdx = config.data_start_row; rowIdx <= sheet.rowCount; rowIdx++) {
      const row = sheet.getRow(rowIdx)
      const colorName = String(row.getCell(columns.color_name || 'A').value ?? '').trim()
      const supplierColorCode = String(row.getCell(columns.supplier_color_code || 'B').value ?? '').trim()

      if (!colorName) continue

      const normalizedColor = colorName.toLowerCase()
      const errors: string[] = []
      let status: ImportRowStatus = existingColorNames.has(normalizedColor) ? 'exists' : 'new_color'

      if (fileColorNames.has(normalizedColor)) {
        status = 'error'
        errors.push('Tên màu bị trùng trong file')
      } else {
        fileColorNames.add(normalizedColor)
      }

      rows.push({
        row_number: rowIdx,
        color_name: colorName,
        supplier_color_code: supplierColorCode || undefined,
        status,
        errors,
      })
    }

    if (rows.length === 0) {
      parseError.value = 'Không tìm thấy dữ liệu trong file. Kiểm tra lại cấu hình sheet và dòng bắt đầu.'
      return
    }

    parsedRows.value = rows
    snackbar.success(`Đã đọc ${rows.length} dòng từ file Excel`)
    currentStep.value = 'preview'
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Lỗi khi đọc file Excel'
  } finally {
    parsing.value = false
  }
}

async function doImport() {
  if (!selectedSupplierId.value) return

  const validRows = parsedRows.value.filter((row) => row.status !== 'error')
  if (validRows.length === 0) {
    snackbar.error('Không có dòng hợp lệ để import')
    return
  }

  importing.value = true
  try {
    const result = await importService.importSupplierColors(selectedSupplierId.value, validRows)
    importResult.value = result
    snackbar.success(`Import thành công ${result.imported} liên kết`)
    currentStep.value = 'result'
  } catch (error) {
    snackbar.error(error instanceof Error ? error.message : 'Lỗi khi import dữ liệu')
  } finally {
    importing.value = false
  }
}

async function downloadTemplate() {
  try {
    await importService.downloadColorTemplate()
  } catch (error) {
    snackbar.error(error instanceof Error ? error.message : 'Không thể tải file mẫu')
  }
}

onMounted(() => {
  loadInitialData()
})
</script>
