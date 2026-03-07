<template>
  <q-page padding>
    <PageHeader
      title="Import Đơn Hàng (PO)"
      subtitle="Nhập danh sách PO và mã hàng từ file Excel"
      show-back
      back-to="/thread/purchase-orders"
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
            Chọn file Excel (.xlsx, .xls) chứa danh sách PO
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
                {{ preview?.summary.valid || 0 }} hợp lệ
              </q-badge>
            </div>
            <div
              v-if="preview?.summary.new_pos"
              class="col-auto"
            >
              <q-badge
                color="info"
                class="q-pa-sm text-body2"
              >
                {{ preview.summary.new_pos }} PO mới
              </q-badge>
            </div>
            <div
              v-if="preview?.summary.update_items"
              class="col-auto"
            >
              <q-badge
                color="accent"
                class="q-pa-sm text-body2"
              >
                {{ preview.summary.update_items }} cập nhật
              </q-badge>
            </div>
            <div
              v-if="preview?.summary.skip_items"
              class="col-auto"
            >
              <q-badge
                color="grey"
                class="q-pa-sm text-body2"
              >
                {{ preview.summary.skip_items }} bỏ qua
              </q-badge>
            </div>
            <div
              v-if="preview?.summary.errors"
              class="col-auto"
            >
              <q-badge
                color="negative"
                class="q-pa-sm text-body2"
              >
                {{ preview.summary.errors }} lỗi
              </q-badge>
            </div>
          </div>

          <q-tabs
            v-model="previewTab"
            class="text-grey q-mb-md"
            active-color="primary"
            indicator-color="primary"
            align="left"
          >
            <q-tab
              name="valid"
              :label="`Hợp lệ (${preview?.valid_rows.length || 0})`"
            />
            <q-tab
              name="errors"
              :label="`Lỗi (${preview?.error_rows.length || 0})`"
            />
          </q-tabs>

          <q-tab-panels
            v-model="previewTab"
            animated
          >
            <q-tab-panel
              name="valid"
              class="q-pa-none"
            >
              <q-table
                flat
                bordered
                :rows="preview?.valid_rows || []"
                :columns="validColumns"
                row-key="po_number"
                :rows-per-page-options="[10, 25, 50, 0]"
                :pagination="{ page: 1, rowsPerPage: 25 }"
                dense
              >
                <template #body-cell-style_code="props">
                  <q-td :props="props">
                    {{ props.value }}
                    <q-badge
                      v-if="props.row.status === 'new_style'"
                      color="warning"
                      label="Mới"
                      class="q-ml-sm"
                    />
                  </q-td>
                </template>
                <template #body-cell-status="props">
                  <q-td :props="props">
                    <q-badge
                      :color="getRowStatusColor(props.row.status)"
                      :label="getRowStatusLabel(props.row.status)"
                    />
                  </q-td>
                </template>
              </q-table>
            </q-tab-panel>

            <q-tab-panel
              name="errors"
              class="q-pa-none"
            >
              <q-table
                flat
                bordered
                :rows="preview?.error_rows || []"
                :columns="errorColumns"
                row-key="row_number"
                :rows-per-page-options="[10, 25, 50, 0]"
                :pagination="{ page: 1, rowsPerPage: 25 }"
                dense
              >
                <template #body-cell-error_message="props">
                  <q-td :props="props">
                    <span class="text-negative">{{ props.row.error_message }}</span>
                  </q-td>
                </template>
              </q-table>
            </q-tab-panel>
          </q-tab-panels>
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
            :disable="!preview?.valid_rows.length"
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
            <div v-if="importResult.created_pos > 0">
              PO mới: {{ importResult.created_pos }}
            </div>
            <div>Mặt hàng mới: {{ importResult.created_items }}</div>
            <div>Cập nhật: {{ importResult.updated_items }}</div>
            <div v-if="importResult.skipped_items > 0">
              Bỏ qua: {{ importResult.skipped_items }}
            </div>
            <div
              v-if="importResult.failed_items > 0"
              class="text-negative"
            >
              Thất bại: {{ importResult.failed_items }}
            </div>
          </div>
          <AppButton
            label="Về danh sách PO"
            icon="arrow_back"
            @click="router.push('/thread/purchase-orders')"
          />
        </div>
      </template>
    </AppStepper>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbar } from '@/composables/useSnackbar'
import { importService } from '@/services/importService'
import type { POImportPreview, POImportResult, POImportRowStatus, ImportMappingConfig } from '@/types/thread'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppStepper from '@/components/ui/navigation/AppStepper.vue'
import FilePicker from '@/components/ui/pickers/FilePicker.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.purchase-orders.import'],
  },
})

const router = useRouter()
const snackbar = useSnackbar()

const currentStep = ref<string | number>('upload')
const selectedFile = ref<File | null>(null)
const parsing = ref(false)
const parseError = ref('')
const importing = ref(false)
const preview = ref<POImportPreview | null>(null)
const importResult = ref<POImportResult | null>(null)
const previewTab = ref('valid')
const mappingConfig = ref<ImportMappingConfig | null>(null)

const steps = [
  { name: 'upload', title: 'Chọn file', icon: 'upload_file' },
  { name: 'preview', title: 'Xem trước', icon: 'preview' },
  { name: 'result', title: 'Kết quả', icon: 'check_circle' }
]

const validColumns = [
  { name: 'po_number', label: 'Số PO', field: 'po_number', align: 'left' as const },
  { name: 'style_code', label: 'Mã hàng', field: 'style_code', align: 'left' as const },
  { name: 'style_name', label: 'Tên mã hàng', field: 'style_name', align: 'left' as const },
  { name: 'quantity', label: 'Số lượng', field: 'quantity', align: 'center' as const },
  { name: 'customer_name', label: 'Khách hàng', field: 'customer_name', align: 'left' as const },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' as const }
]

const errorColumns = [
  { name: 'row_number', label: 'Dòng', field: 'row_number', align: 'center' as const },
  { name: 'error_message', label: 'Lỗi', field: 'error_message', align: 'left' as const }
]

function getRowStatusColor(status: POImportRowStatus): string {
  const colors: Record<POImportRowStatus, string> = {
    new: 'positive',
    update: 'info',
    skip: 'grey',
    new_style: 'warning'
  }
  return colors[status] || 'grey'
}

function getRowStatusLabel(status: POImportRowStatus): string {
  const labels: Record<POImportRowStatus, string> = {
    new: 'Mới',
    update: 'Cập nhật',
    skip: 'Bỏ qua',
    new_style: 'Mã hàng mới'
  }
  return labels[status] || status
}

function onFileSelected() {
  parseError.value = ''
  preview.value = null
}

async function downloadTemplate() {
  try {
    await importService.downloadPOTemplate()
  } catch (err) {
    snackbar.error((err as Error).message || 'Không thể tải file mẫu')
  }
}

async function loadMappingConfig(): Promise<ImportMappingConfig> {
  if (mappingConfig.value) return mappingConfig.value
  const config = await importService.getPOImportMapping()
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
    const rows: Array<{
      row_number: number
      po_number: string
      style_code: string
      quantity: number
      customer_name?: string
      order_date?: string
      notes?: string
    }> = []

    for (let rowIdx = config.data_start_row; rowIdx <= sheet.rowCount; rowIdx++) {
      const row = sheet.getRow(rowIdx)
      const poNumber = String(row.getCell(cols.po_number || 'A').value || '').trim()
      const styleCode = String(row.getCell(cols.style_code || 'B').value || '').trim()
      const quantityRaw = row.getCell(cols.quantity || 'C').value
      const customerName = cols.customer_name ? String(row.getCell(cols.customer_name).value || '').trim() : undefined
      const orderDate = cols.order_date ? String(row.getCell(cols.order_date).value || '').trim() : undefined
      const notes = cols.notes ? String(row.getCell(cols.notes).value || '').trim() : undefined

      if (!poNumber && !styleCode) continue

      const quantity = Number(quantityRaw) || 0

      rows.push({
        row_number: rowIdx,
        po_number: poNumber,
        style_code: styleCode,
        quantity,
        customer_name: customerName || undefined,
        order_date: orderDate || undefined,
        notes: notes || undefined
      })
    }

    if (rows.length === 0) {
      parseError.value = 'Không tìm thấy dữ liệu trong file'
      return
    }

    preview.value = await importService.parsePOItems(rows)
    previewTab.value = preview.value.error_rows.length > 0 ? 'errors' : 'valid'
    currentStep.value = 'preview'
  } catch (err) {
    parseError.value = (err as Error).message || 'Lỗi khi đọc file Excel'
  } finally {
    parsing.value = false
  }
}

async function doImport() {
  if (!preview.value?.valid_rows.length) return

  importing.value = true
  try {
    const result = await importService.executePOImport(preview.value.valid_rows)
    importResult.value = result
    snackbar.success(`Import thành công: ${result.created_pos} PO mới, ${result.created_items} mặt hàng mới, ${result.updated_items} cập nhật`)
    currentStep.value = 'result'
  } catch (err) {
    snackbar.error((err as Error).message || 'Lỗi khi import dữ liệu')
  } finally {
    importing.value = false
  }
}
</script>
