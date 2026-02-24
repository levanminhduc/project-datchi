<template>
  <q-page padding>
    <PageHeader
      title="Import NCC-Tex"
      subtitle="Nhập danh sách nhà cung cấp và thông tin Tex từ file Excel"
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
            Chọn file Excel (.xlsx, .xls) chứa danh sách NCC-Tex
          </div>
          <FilePicker
            v-model="selectedFile"
            accept=".xlsx,.xls"
            label="Chọn file Excel"
            hint="Định dạng: .xlsx hoặc .xls"
            outlined
            @update:model-value="onFileSelected"
          />
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
            :disable="!selectedFile || parsing"
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
              v-if="summary.newSuppliers > 0"
              class="col-auto"
            >
              <q-badge
                color="info"
                class="q-pa-sm text-body2"
              >
                {{ summary.newSuppliers }} NCC mới
              </q-badge>
            </div>
            <div
              v-if="summary.newTex > 0"
              class="col-auto"
            >
              <q-badge
                color="accent"
                class="q-pa-sm text-body2"
              >
                {{ summary.newTex }} Tex mới
              </q-badge>
            </div>
            <div
              v-if="summary.errors > 0"
              class="col-auto"
            >
              <q-badge
                color="negative"
                class="q-pa-sm text-body2"
              >
                {{ summary.errors }} lỗi
              </q-badge>
            </div>
          </div>

          <q-table
            flat
            bordered
            :rows="parsedRows"
            :columns="previewColumns"
            row-key="row_number"
            :rows-per-page-options="[10, 25, 50, 0]"
            :pagination="{ page: 1, rowsPerPage: 25 }"
            dense
          >
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  v-if="props.row.status === 'valid' || props.row.status === 'exists'"
                  color="positive"
                >
                  Hợp lệ
                </q-badge>
                <q-badge
                  v-else-if="props.row.status === 'new_supplier'"
                  color="info"
                >
                  NCC mới
                </q-badge>
                <q-badge
                  v-else-if="props.row.status === 'new_tex'"
                  color="accent"
                >
                  Tex mới
                </q-badge>
                <q-badge
                  v-else-if="props.row.status === 'error'"
                  color="negative"
                >
                  Lỗi
                </q-badge>
                <div
                  v-if="props.row.errors.length > 0"
                  class="text-caption text-negative q-mt-xs"
                >
                  {{ props.row.errors.join(', ') }}
                </div>
              </q-td>
            </template>

            <template #body-cell-unit_price="props">
              <q-td :props="props">
                {{ formatCurrency(props.row.unit_price) }}
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
            :disable="summary.valid === 0"
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
            <div>Đã import: {{ importResult.imported }} dòng</div>
            <div v-if="importResult.skipped > 0">
              Bỏ qua: {{ importResult.skipped }} dòng
            </div>
            <div v-if="importResult.suppliers_created > 0">
              NCC mới tạo: {{ importResult.suppliers_created }}
            </div>
            <div v-if="importResult.thread_types_created > 0">
              Loại chỉ mới tạo: {{ importResult.thread_types_created }}
            </div>
          </div>
          <AppButton
            label="Về trang NCC"
            icon="arrow_back"
            @click="router.push('/thread/suppliers')"
          />
        </div>
      </template>
    </AppStepper>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbar } from '@/composables/useSnackbar'
import { importService } from '@/services/importService'
import { supplierService } from '@/services/supplierService'
import { threadService } from '@/services/threadService'
import type { ImportMappingConfig, ImportTexRow, ImportTexResponse, ImportRowStatus } from '@/types/thread'
import type { Supplier } from '@/types/thread/supplier'
import type { ThreadType } from '@/types/thread/thread-type'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppStepper from '@/components/ui/navigation/AppStepper.vue'
import FilePicker from '@/components/ui/pickers/FilePicker.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.suppliers.manage'],
  },
})

const router = useRouter()
const snackbar = useSnackbar()

const currentStep = ref<string | number>('upload')
const selectedFile = ref<File | null>(null)
const parsing = ref(false)
const parseError = ref('')
const importing = ref(false)
const parsedRows = ref<ImportTexRow[]>([])
const importResult = ref<ImportTexResponse | null>(null)
const mappingConfig = ref<ImportMappingConfig | null>(null)

const steps = [
  { name: 'upload', title: 'Chọn file', icon: 'upload_file' },
  { name: 'preview', title: 'Xem trước', icon: 'preview' },
  { name: 'result', title: 'Kết quả', icon: 'check_circle' },
]

const previewColumns = [
  { name: 'row_number', label: '#', field: 'row_number', align: 'center' as const, sortable: true },
  { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' as const, sortable: true },
  { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'center' as const, sortable: true },
  { name: 'meters_per_cone', label: 'Mét/Cuộn', field: 'meters_per_cone', align: 'center' as const, sortable: true },
  { name: 'unit_price', label: 'Giá (VND)', field: 'unit_price', align: 'right' as const, sortable: true },
  { name: 'supplier_item_code', label: 'Mã hàng NCC', field: 'supplier_item_code', align: 'left' as const },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' as const },
]

const summary = computed(() => {
  const rows = parsedRows.value
  return {
    valid: rows.filter(r => r.status !== 'error').length,
    errors: rows.filter(r => r.status === 'error').length,
    newSuppliers: rows.filter(r => r.status === 'new_supplier').length,
    newTex: rows.filter(r => r.status === 'new_tex').length,
  }
})

function formatCurrency(value: number): string {
  if (!value && value !== 0) return '-'
  return new Intl.NumberFormat('vi-VN').format(value)
}

function onFileSelected() {
  parseError.value = ''
  parsedRows.value = []
}

async function downloadTemplate() {
  try {
    await importService.downloadTexTemplate()
  } catch (err) {
    snackbar.error((err as Error).message || 'Không thể tải file mẫu')
  }
}

async function loadMappingConfig(): Promise<ImportMappingConfig> {
  if (mappingConfig.value) return mappingConfig.value
  const config = await importService.getImportMapping('import_supplier_tex_mapping')
  mappingConfig.value = config
  return config
}

async function parseFile() {
  if (!selectedFile.value) return

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

    const cols = config.columns
    const rows: ImportTexRow[] = []

    const [suppliers, threadTypes] = await Promise.all([
      supplierService.getAll(),
      threadService.getAll(),
    ])

    const supplierNames = new Set(suppliers.map((s: Supplier) => s.name.toLowerCase().trim()))
    const texNumbers = new Set(threadTypes.map((t: ThreadType) => t.tex_number).filter(Boolean))

    for (let rowIdx = config.data_start_row; rowIdx <= sheet.rowCount; rowIdx++) {
      const row = sheet.getRow(rowIdx)
      const supplierName = String(row.getCell(cols.supplier_name || 'A').value || '').trim()
      const texRaw = row.getCell(cols.tex_number || 'B').value
      const metersRaw = row.getCell(cols.meters_per_cone || 'C').value
      const priceRaw = row.getCell(cols.unit_price || 'D').value
      const itemCode = String(row.getCell(cols.supplier_item_code || 'E').value || '').trim()

      if (!supplierName && !texRaw) continue

      const texNumber = Number(texRaw) || 0
      const metersPerCone = Number(metersRaw) || 0
      const unitPrice = Number(priceRaw) || 0

      const errors: string[] = []
      if (!supplierName) errors.push('Thiếu tên NCC')
      if (texNumber <= 0) errors.push('Tex phải > 0')
      if (metersPerCone <= 0) errors.push('Mét/cuộn phải > 0')
      if (unitPrice < 0) errors.push('Giá không được âm')

      let status: ImportRowStatus = 'valid'
      if (errors.length > 0) {
        status = 'error'
      } else if (!supplierNames.has(supplierName.toLowerCase())) {
        status = 'new_supplier'
      } else if (!texNumbers.has(texNumber)) {
        status = 'new_tex'
      }

      rows.push({
        row_number: rowIdx,
        supplier_name: supplierName,
        tex_number: texNumber,
        meters_per_cone: metersPerCone,
        unit_price: unitPrice,
        supplier_item_code: itemCode || undefined,
        status,
        errors,
      })
    }

    if (rows.length === 0) {
      parseError.value = 'Không tìm thấy dữ liệu trong file. Kiểm tra lại cấu hình sheet và dòng bắt đầu.'
      return
    }

    parsedRows.value = rows
    currentStep.value = 'preview'
  } catch (err) {
    parseError.value = err instanceof Error ? err.message : 'Lỗi khi đọc file Excel'
  } finally {
    parsing.value = false
  }
}

async function doImport() {
  const validRows = parsedRows.value.filter(r => r.status !== 'error')
  if (validRows.length === 0) return

  importing.value = true
  try {
    const result = await importService.importSupplierTex(validRows)
    importResult.value = result
    snackbar.success(`Import thành công ${result.imported} dòng`)
    currentStep.value = 'result'
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Lỗi khi import dữ liệu')
  } finally {
    importing.value = false
  }
}
</script>
