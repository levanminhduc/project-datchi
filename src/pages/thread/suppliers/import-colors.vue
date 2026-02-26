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
          icon="download"
          label="Tải mẫu"
          variant="outlined"
          @click="downloadTemplate"
        />
      </template>
    </PageHeader>

    <div class="row q-col-gutter-md items-end">
      <div class="col-12 col-md-4">
        <AppSelect
          v-model="selectedSupplierId"
          :options="supplierOptions"
          label="Nhà cung cấp"
          option-value="value"
          option-label="label"
          use-input
          clearable
          :loading="loadingSuppliers"
          :disable="importing"
          required
        />
      </div>

      <div class="col-12 col-md-4">
        <FilePicker
          v-model="selectedFile"
          accept=".xlsx,.xls"
          label="Chọn file Excel (.xlsx, .xls)"
          :disable="!selectedSupplierId || importing"
          @update:model-value="handleFileSelected"
        />
      </div>

      <div class="col-12 col-md-auto">
        <AppButton
          icon="upload_file"
          label="Import"
          :disable="!canImport"
          :loading="importing"
          @click="handleImport"
        />
      </div>
    </div>

    <q-separator class="q-my-md" />

    <div
      v-if="parsedRows.length > 0"
      class="q-mb-md"
    >
      <div class="row q-gutter-sm items-center">
        <q-badge
          color="blue"
          outline
        >
          Tạo mới: {{ summary.newCount }}
        </q-badge>
        <q-badge
          color="positive"
          outline
        >
          Đã có: {{ summary.existsCount }}
        </q-badge>
        <q-badge
          v-if="summary.errorCount > 0"
          color="negative"
          outline
        >
          Lỗi: {{ summary.errorCount }}
        </q-badge>
        <q-badge
          color="grey"
          outline
        >
          Tổng: {{ parsedRows.length }}
        </q-badge>
      </div>
    </div>

    <DataTable
      v-if="parsedRows.length > 0"
      :rows="parsedRows"
      :columns="previewColumns"
      row-key="row_number"
      :rows-per-page-options="[0]"
      hide-pagination
      empty-title="Chưa có dữ liệu"
      empty-subtitle="Tải file Excel lên để xem trước"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="getStatusColor(props.row.status)"
            :label="getStatusLabel(props.row.status)"
          />
          <div
            v-if="props.row.errors.length > 0"
            class="text-caption text-negative q-mt-xs"
          >
            {{ props.row.errors.join(', ') }}
          </div>
        </q-td>
      </template>
    </DataTable>

    <div
      v-if="parsedRows.length === 0 && !selectedFile"
      class="text-center q-pa-xl text-grey-5"
    >
      <q-icon
        name="cloud_upload"
        size="64px"
        class="q-mb-md"
      />
      <div class="text-h6">
        Chọn nhà cung cấp và tải file Excel lên
      </div>
      <div class="text-caption">
        File Excel cần có cột: Tên Màu, Mã màu NCC (tùy chọn)
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { importService } from '@/services/importService'
import { colorService } from '@/services/colorService'
import { supplierService } from '@/services/supplierService'
import { useSnackbar } from '@/composables/useSnackbar'
import type { ImportMappingConfig, ImportColorRow, ImportRowStatus } from '@/types/thread'
import type { Color } from '@/types/thread/color'
import type { Supplier } from '@/types/thread/supplier'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import FilePicker from '@/components/ui/pickers/FilePicker.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.suppliers.manage'],
  },
})

const route = useRoute()
const router = useRouter()
const snackbar = useSnackbar()

const selectedSupplierId = ref<number | null>(null)
const selectedFile = ref<File | null>(null)
const parsedRows = ref<ImportColorRow[]>([])
const importing = ref(false)
const loadingSuppliers = ref(false)
const suppliers = ref<Supplier[]>([])
const existingColors = ref<Color[]>([])
const mappingConfig = ref<ImportMappingConfig | null>(null)

const supplierOptions = computed(() =>
  suppliers.value.map((s) => ({
    label: `${s.code} - ${s.name}`,
    value: s.id,
  }))
)

const summary = computed(() => {
  const newCount = parsedRows.value.filter((r) => r.status === 'new_color').length
  const existsCount = parsedRows.value.filter((r) => r.status === 'exists').length
  const errorCount = parsedRows.value.filter((r) => r.status === 'error').length
  return { newCount, existsCount, errorCount }
})

const canImport = computed(() => {
  if (!selectedSupplierId.value || parsedRows.value.length === 0 || importing.value) return false
  const validRows = parsedRows.value.filter((r) => r.status !== 'error')
  return validRows.length > 0
})

const previewColumns = [
  { name: 'row_number', label: '#', field: 'row_number', align: 'center' as const, style: 'width: 60px' },
  { name: 'color_name', label: 'Tên Màu', field: 'color_name', align: 'left' as const },
  { name: 'supplier_color_code', label: 'Mã NCC', field: 'supplier_color_code', align: 'left' as const, format: (v: string | undefined) => v || '-' },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' as const },
]

function getStatusColor(status: ImportRowStatus): string {
  switch (status) {
    case 'new_color': return 'blue'
    case 'exists': return 'positive'
    case 'error': return 'negative'
    default: return 'grey'
  }
}

function getStatusLabel(status: ImportRowStatus): string {
  switch (status) {
    case 'new_color': return 'Tạo mới'
    case 'exists': return 'Đã có'
    case 'error': return 'Lỗi'
    default: return status
  }
}

async function loadInitialData() {
  loadingSuppliers.value = true
  try {
    const [suppliersData, colorsData, config] = await Promise.all([
      supplierService.getAll({ is_active: true }),
      colorService.getAll(),
      importService.getSupplierColorMapping().catch(() => null),
    ])
    suppliers.value = suppliersData
    existingColors.value = colorsData
    mappingConfig.value = config

    const preSelectedId = route.query.supplier_id
    if (preSelectedId) {
      const id = Number(preSelectedId)
      if (!isNaN(id) && suppliers.value.some((s) => s.id === id)) {
        selectedSupplierId.value = id
      }
    }
  } catch (err) {
    snackbar.error('Lỗi khi tải dữ liệu')
    console.error(err)
  } finally {
    loadingSuppliers.value = false
  }
}

async function handleFileSelected(file: File | File[] | null) {
  parsedRows.value = []
  if (!file || Array.isArray(file)) return

  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const buffer = await file.arrayBuffer()
    await workbook.xlsx.load(buffer)

    const sheetIndex = mappingConfig.value?.sheet_index ?? 0
    const dataStartRow = mappingConfig.value?.data_start_row ?? 2
    const columns = mappingConfig.value?.columns ?? { color_name: 'A', supplier_color_code: 'B' }

    const sheet = workbook.worksheets[sheetIndex]
    if (!sheet) {
      snackbar.error('Không tìm thấy sheet trong file Excel')
      return
    }

    const rows: ImportColorRow[] = []
    const existingColorNames = new Set(
      existingColors.value.map((c) => c.name.toLowerCase().trim())
    )

    for (let rowNum = dataStartRow; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum)
      const colorName = String(row.getCell(columns.color_name || 'A').value ?? '').trim()
      const supplierColorCode = String(row.getCell(columns.supplier_color_code || 'B').value ?? '').trim()

      if (!colorName) continue

      const errors: string[] = []
      let status: ImportRowStatus = 'new_color'

      if (existingColorNames.has(colorName.toLowerCase())) {
        status = 'exists'
      }

      rows.push({
        row_number: rowNum,
        color_name: colorName,
        supplier_color_code: supplierColorCode || undefined,
        status,
        errors,
      })
    }

    if (rows.length === 0) {
      snackbar.error('Không tìm thấy dữ liệu trong file Excel')
      return
    }

    parsedRows.value = rows
    snackbar.success(`Đã đọc ${rows.length} dòng từ file Excel`)
  } catch (err) {
    snackbar.error('Lỗi khi đọc file Excel')
    console.error(err)
  }
}

async function handleImport() {
  if (!selectedSupplierId.value || parsedRows.value.length === 0) return

  const validRows = parsedRows.value.filter((r) => r.status !== 'error')
  if (validRows.length === 0) {
    snackbar.error('Không có dòng hợp lệ để import')
    return
  }

  importing.value = true
  try {
    const result = await importService.importSupplierColors(selectedSupplierId.value, validRows)
    snackbar.success(
      `Import thành công: ${result.imported} liên kết, ${result.colors_created} màu mới`
    )
    router.push('/thread/suppliers')
  } catch (err) {
    snackbar.error((err as Error).message || 'Lỗi khi import')
    console.error(err)
  } finally {
    importing.value = false
  }
}

async function downloadTemplate() {
  try {
    await importService.downloadColorTemplate()
  } catch (err) {
    snackbar.error((err as Error).message || 'Không thể tải file mẫu')
  }
}

onMounted(() => {
  loadInitialData()
})
</script>
