<template>
  <q-page padding>
    <PageHeader
      title="Import giá CMPT"
      subtitle="Cập nhật giá CM, P, T (USD/cái) cho mã hàng từ file Excel. Ô trống giữ giá cũ."
      show-back
      back-to="/thread/styles"
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
          <div class="text-subtitle1 q-mb-sm">
            Chọn file Excel (.xlsx) chứa giá CMPT
          </div>
          <div class="text-caption text-grey-7 q-mb-md">
            Cột A: Mã hàng · B: CM · C: P · D: T. Dòng 1 là tiêu đề, dữ liệu từ dòng 2.
          </div>
          <FilePicker
            v-model="selectedFile"
            accept=".xlsx"
            label="Chọn file Excel"
            hint="Định dạng: .xlsx"
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
                {{ preview?.summary.update || 0 }} cập nhật
              </q-badge>
            </div>
            <div class="col-auto">
              <q-badge
                color="grey"
                class="q-pa-sm text-body2"
              >
                {{ preview?.summary.unchanged || 0 }} không đổi
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

          <div
            v-if="preview?.summary.errors"
            class="text-negative q-mb-md"
          >
            File còn dòng lỗi. Sửa file rồi chọn lại để import.
          </div>

          <q-tabs
            v-model="previewTab"
            class="text-grey q-mb-md"
            active-color="primary"
            indicator-color="primary"
            align="left"
          >
            <q-tab
              name="update"
              :label="`Cập nhật (${updateRows.length})`"
            />
            <q-tab
              name="unchanged"
              :label="`Không đổi (${unchangedRows.length})`"
            />
            <q-tab
              name="errors"
              :label="`Lỗi (${errorRows.length})`"
            />
          </q-tabs>

          <q-table
            flat
            bordered
            dense
            :rows="tabRows"
            :columns="columns"
            row-key="row_number"
            :rows-per-page-options="[10, 25, 50, 0]"
            :pagination="{ page: 1, rowsPerPage: 25 }"
          >
            <template
              v-for="field in priceFields"
              :key="field"
              #[`body-cell-${field}`]="props"
            >
              <q-td :props="props">
                <template v-if="isChanged(props.row, field)">
                  <span class="text-grey-6">{{ formatPrice(props.row.old_prices?.[field] ?? null) }}</span>
                  <q-icon
                    name="arrow_forward"
                    size="xs"
                    class="q-mx-xs"
                  />
                  <span class="text-weight-bold">{{ formatPrice(props.row.new_prices[field]) }}</span>
                </template>
                <template v-else>
                  {{ formatPrice(props.row.old_prices?.[field] ?? props.row.new_prices[field]) }}
                </template>
              </q-td>
            </template>
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="STATUS_COLORS[props.row.status as StyleCmptRowStatus]"
                  :label="STATUS_LABELS[props.row.status as StyleCmptRowStatus]"
                />
              </q-td>
            </template>
            <template #body-cell-error_message="props">
              <q-td :props="props">
                <span class="text-negative">{{ props.row.error_message }}</span>
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
            label="Cập nhật giá"
            icon="upload"
            :disable="!canImport"
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
            <div>Đã cập nhật: {{ importResult.updated }} mã hàng</div>
            <div v-if="importResult.unchanged > 0">
              Không đổi: {{ importResult.unchanged }}
            </div>
          </div>
          <AppButton
            label="Về danh sách mã hàng"
            icon="arrow_back"
            @click="router.push('/thread/styles')"
          />
        </div>
      </template>
    </AppStepper>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { CellValue } from 'exceljs'
import { useSnackbar } from '@/composables/useSnackbar'
import { importService } from '@/services/importService'
import type {
  StyleCmptImportResult,
  StyleCmptImportRow,
  StyleCmptPreview,
  StyleCmptPreviewRow,
  StyleCmptPrices,
  StyleCmptRowStatus,
} from '@/types/thread'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppStepper from '@/components/ui/navigation/AppStepper.vue'
import FilePicker from '@/components/ui/pickers/FilePicker.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.styles.edit'],
  },
})

type PriceField = keyof StyleCmptPrices

const DATA_START_ROW = 2
const COLUMNS = { style_code: 'A', cm_price: 'B', p_price: 'C', t_price: 'D' } as const

const STATUS_LABELS: Record<StyleCmptRowStatus, string> = {
  UPDATE: 'Cập nhật',
  UNCHANGED: 'Không đổi',
  STYLE_NOT_FOUND: 'Chưa có mã',
  ERROR: 'Lỗi',
}

const STATUS_COLORS: Record<StyleCmptRowStatus, string> = {
  UPDATE: 'positive',
  UNCHANGED: 'grey',
  STYLE_NOT_FOUND: 'orange',
  ERROR: 'negative',
}

const router = useRouter()
const snackbar = useSnackbar()

const currentStep = ref<string | number>('upload')
const selectedFile = ref<File | null>(null)
const parsing = ref(false)
const parseError = ref('')
const importing = ref(false)
const fileRows = ref<StyleCmptImportRow[]>([])
const preview = ref<StyleCmptPreview | null>(null)
const importResult = ref<StyleCmptImportResult | null>(null)
const previewTab = ref<'update' | 'unchanged' | 'errors'>('update')

const steps = [
  { name: 'upload', title: 'Chọn file', icon: 'upload_file' },
  { name: 'preview', title: 'Xem trước', icon: 'preview' },
  { name: 'result', title: 'Kết quả', icon: 'check_circle' },
]

const priceFields: PriceField[] = ['cm_price', 'p_price', 't_price']

const columns = [
  { name: 'row_number', label: 'Dòng', field: 'row_number', align: 'center' as const },
  { name: 'style_code', label: 'Mã hàng', field: 'style_code', align: 'left' as const },
  { name: 'style_name', label: 'Tên mã hàng', field: 'style_name', align: 'left' as const },
  { name: 'cm_price', label: 'CM (USD/cái)', field: 'cm_price', align: 'right' as const },
  { name: 'p_price', label: 'P (USD/cái)', field: 'p_price', align: 'right' as const },
  { name: 't_price', label: 'T (USD/cái)', field: 't_price', align: 'right' as const },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' as const },
  { name: 'error_message', label: 'Lỗi', field: 'error_message', align: 'left' as const },
]

const updateRows = computed(() => preview.value?.rows.filter(r => r.status === 'UPDATE') ?? [])
const unchangedRows = computed(() => preview.value?.rows.filter(r => r.status === 'UNCHANGED') ?? [])
const errorRows = computed(
  () => preview.value?.rows.filter(r => r.status === 'ERROR' || r.status === 'STYLE_NOT_FOUND') ?? []
)
const tabRows = computed(() => {
  if (previewTab.value === 'errors') return errorRows.value
  if (previewTab.value === 'unchanged') return unchangedRows.value
  return updateRows.value
})
const canImport = computed(
  () => !!preview.value && preview.value.summary.errors === 0 && preview.value.summary.update > 0
)

function formatPrice(value: string | null): string {
  return value === null ? '–' : value
}

function isChanged(row: StyleCmptPreviewRow, field: PriceField): boolean {
  const next = row.new_prices[field]
  if (next === null || !row.old_prices) return false
  const old = row.old_prices[field]
  return old === null || Number(old) !== Number(next)
}

function cellToRaw(value: CellValue): string | number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'object') {
    if ('result' in value) return cellToRaw(value.result as CellValue)
    if ('richText' in value) return value.richText.map(part => part.text).join('')
    if ('text' in value) return String(value.text)
  }
  return String(value)
}

function cellToText(value: CellValue): string {
  const raw = cellToRaw(value)
  return raw === null ? '' : String(raw).trim()
}

function onFileSelected() {
  parseError.value = ''
  preview.value = null
  fileRows.value = []
}

async function downloadTemplate() {
  try {
    await importService.downloadStyleCmptTemplate()
  } catch (err) {
    snackbar.error((err as Error).message || 'Không thể tải file mẫu')
  }
}

async function parseFile() {
  if (!selectedFile.value) return

  parsing.value = true
  parseError.value = ''

  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await selectedFile.value.arrayBuffer())

    const sheet = workbook.worksheets[0]
    if (!sheet) {
      parseError.value = 'File không có sheet nào'
      return
    }

    const rows: StyleCmptImportRow[] = []
    for (let rowIdx = DATA_START_ROW; rowIdx <= sheet.rowCount; rowIdx++) {
      const row = sheet.getRow(rowIdx)
      const styleCode = cellToText(row.getCell(COLUMNS.style_code).value)
      const prices = {
        cm_price: cellToRaw(row.getCell(COLUMNS.cm_price).value),
        p_price: cellToRaw(row.getCell(COLUMNS.p_price).value),
        t_price: cellToRaw(row.getCell(COLUMNS.t_price).value),
      }
      const hasPrice = Object.values(prices).some(v => v !== null && String(v).trim() !== '')
      if (!styleCode && !hasPrice) continue
      rows.push({ row_number: rowIdx, style_code: styleCode, ...prices })
    }

    if (rows.length === 0) {
      parseError.value = 'Không tìm thấy dữ liệu trong file'
      return
    }

    fileRows.value = rows
    preview.value = await importService.parseStyleCmpt(rows)
    previewTab.value = preview.value.summary.errors > 0 ? 'errors' : 'update'
    currentStep.value = 'preview'
  } catch (err) {
    parseError.value = (err as Error).message || 'Lỗi khi đọc file Excel'
  } finally {
    parsing.value = false
  }
}

async function doImport() {
  if (!canImport.value) return

  importing.value = true
  try {
    const result = await importService.executeStyleCmpt(fileRows.value)
    importResult.value = result
    snackbar.success(`Đã cập nhật giá CMPT cho ${result.updated} mã hàng`)
    currentStep.value = 'result'
  } catch (err) {
    snackbar.error((err as Error).message || 'Lỗi khi cập nhật giá CMPT')
  } finally {
    importing.value = false
  }
}
</script>
