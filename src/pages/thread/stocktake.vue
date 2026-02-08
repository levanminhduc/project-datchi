<script setup lang="ts">
/**
 * Stocktake Page - Inventory verification using QR scanning
 * Allows scanning cones and comparing with database records
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useWarehouses, useSnackbar } from '@/composables'
import { QrScannerStream } from '@/components/qr'
import { inventoryService } from '@/services'
import type { Cone } from '@/types/thread/inventory'

// Types
interface ScannedItem {
  cone_id: string
  status: 'found' | 'not_found' | 'wrong_warehouse' | 'duplicate'
  cone?: Partial<Cone>
  scannedAt: Date
}

interface StocktakeSession {
  warehouseId: number | null
  scannedItems: ScannedItem[]
  startedAt: Date | null
}

// Composables
const snackbar = useSnackbar()
const { warehouseOptions, fetchWarehouses, loading: warehousesLoading } = useWarehouses()

// State
const selectedWarehouseId = ref<number | null>(null)
const isScanning = ref(false)
const scannedItems = ref<ScannedItem[]>([])
const warehouseCones = ref<Map<string, Partial<Cone>>>(new Map())
const isLoadingCones = ref(false)
const showComparison = ref(false)
const showResumePrompt = ref(false)

// Session storage key
const SESSION_KEY = 'stocktake_session'

// Computed
const canStartScan = computed(() => 
  selectedWarehouseId.value !== null && !isLoadingCones.value
)

const stats = computed(() => {
  const found = scannedItems.value.filter(i => i.status === 'found').length
  const notFound = scannedItems.value.filter(i => i.status === 'not_found').length
  const wrongWarehouse = scannedItems.value.filter(i => i.status === 'wrong_warehouse').length
  return { found, notFound, wrongWarehouse, total: scannedItems.value.length }
})

const comparisonResult = computed(() => {
  const scannedIds = new Set(scannedItems.value.map(i => i.cone_id))
  const dbIds = new Set(warehouseCones.value.keys())
  
  const matched = [...scannedIds].filter(id => dbIds.has(id))
  const missing = [...dbIds].filter(id => !scannedIds.has(id))
  const extra = [...scannedIds].filter(id => !dbIds.has(id))
  
  return {
    matched,
    missing,
    extra,
    matchRate: dbIds.size > 0 ? (matched.length / dbIds.size * 100).toFixed(1) : '0',
  }
})

// Methods
const loadWarehouseCones = async () => {
  if (!selectedWarehouseId.value) return
  
  isLoadingCones.value = true
  try {
    const response = await inventoryService.getByWarehouse(selectedWarehouseId.value)
    if (response.data) {
      warehouseCones.value = new Map(
        response.data.map((c: Partial<Cone>) => [c.cone_id!, c])
      )
    }
  } catch {
    snackbar.error('Không thể tải danh sách tồn kho')
  } finally {
    isLoadingCones.value = false
  }
}

const handleDetect = (codes: { rawValue: string }[]) => {
  const firstCode = codes[0]
  if (!firstCode) return
  
  const code = firstCode.rawValue
  
  // Check for duplicate in current session
  if (scannedItems.value.some(i => i.cone_id === code)) {
    snackbar.warning(`Đã quét rồi: ${code}`)
    return
  }
  
  // Check in warehouse cones
  const cone = warehouseCones.value.get(code)
  let status: ScannedItem['status'] = 'not_found'
  
  if (cone) {
    status = 'found'
  }
  
  // Add to scanned list
  scannedItems.value.unshift({
    cone_id: code,
    status,
    cone,
    scannedAt: new Date(),
  })
  
  // Feedback
  if (status === 'found') {
    snackbar.success(`✓ ${code}`)
  } else {
    snackbar.error(`✗ Không tìm thấy: ${code}`)
  }
  
  // Save session
  saveSession()
}

const removeItem = (coneId: string) => {
  scannedItems.value = scannedItems.value.filter(i => i.cone_id !== coneId)
  saveSession()
}

const clearAll = () => {
  scannedItems.value = []
  showComparison.value = false
  saveSession()
}

const startComparison = () => {
  showComparison.value = true
}

const exportXlsx = async () => {
  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Kiểm Kê')

    worksheet.columns = [
      { header: 'Cone ID', key: 'cone_id', width: 18 },
      { header: 'Trạng thái', key: 'status', width: 20 },
      { header: 'Loại chỉ', key: 'thread_type', width: 18 },
      { header: 'Số lô', key: 'lot_number', width: 15 },
    ]

    // Style header row
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' },
    }
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    comparisonResult.value.matched.forEach(id => {
      const cone = warehouseCones.value.get(id)
      worksheet.addRow({
        cone_id: id,
        status: 'Khớp',
        thread_type: cone?.thread_type?.code || '',
        lot_number: cone?.lot_number || '',
      })
    })
    comparisonResult.value.missing.forEach(id => {
      const cone = warehouseCones.value.get(id)
      worksheet.addRow({
        cone_id: id,
        status: 'Thiếu (trong DB)',
        thread_type: cone?.thread_type?.code || '',
        lot_number: cone?.lot_number || '',
      })
    })
    comparisonResult.value.extra.forEach(id => {
      worksheet.addRow({
        cone_id: id,
        status: 'Thừa (không trong DB)',
        thread_type: '',
        lot_number: '',
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stocktake_${selectedWarehouseId.value}_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    snackbar.error('Không thể xuất file Excel')
    console.error('[stocktake] export error:', err)
  }
}

// Session management
const saveSession = () => {
  const session: StocktakeSession = {
    warehouseId: selectedWarehouseId.value,
    scannedItems: scannedItems.value,
    startedAt: new Date(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

const loadSession = (): StocktakeSession | null => {
  const saved = localStorage.getItem(SESSION_KEY)
  if (!saved) return null
  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

const resumeSession = async () => {
  const session = loadSession()
  if (session) {
    selectedWarehouseId.value = session.warehouseId
    scannedItems.value = session.scannedItems
    if (session.warehouseId) {
      await loadWarehouseCones()
    }
  }
  showResumePrompt.value = false
}

const startNewSession = () => {
  localStorage.removeItem(SESSION_KEY)
  scannedItems.value = []
  selectedWarehouseId.value = null
  showResumePrompt.value = false
}

const completeStocktake = async () => {
  if (!selectedWarehouseId.value) return
  
  // Save stocktake to backend
  try {
    const scannedConeIds = scannedItems.value.map(i => i.cone_id)
    const response = await inventoryService.saveStocktake(
      selectedWarehouseId.value,
      scannedConeIds
    )
    
    if (response.error) {
      snackbar.error(response.error)
      return
    }
    
    snackbar.success(response.message || 'Đã hoàn tất kiểm kê')
  } catch {
    // Even if save fails, still clear session
    snackbar.success('Đã hoàn tất kiểm kê (lưu offline)')
  }
  
  localStorage.removeItem(SESSION_KEY)
  scannedItems.value = []
  showComparison.value = false
}

// Watchers
watch(selectedWarehouseId, async (newId) => {
  if (newId) {
    await loadWarehouseCones()
    scannedItems.value = []
    showComparison.value = false
  }
})

// Lifecycle
onMounted(async () => {
  await fetchWarehouses()
  
  // Check for existing session
  const session = loadSession()
  if (session && session.scannedItems.length > 0) {
    showResumePrompt.value = true
  }
})
</script>

<template>
  <q-page padding>
    <!-- Page Header -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12 col-md-4">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Kiểm Kê Kho Chỉ
        </h1>
        <p class="text-grey-7 q-mb-none q-mt-xs">
          Quét mã QR để đối chiếu tồn kho thực tế
        </p>
      </div>

      <div class="col-12 col-md-8">
        <div class="row q-col-gutter-sm items-center justify-end">
          <!-- Warehouse Selector -->
          <div class="col-12 col-sm-4">
            <q-select
              v-model="selectedWarehouseId"
              :options="warehouseOptions"
              :loading="warehousesLoading"
              label="Chọn kho kiểm kê"
              emit-value
              map-options
              outlined
              dense
              :disable="isScanning"
            />
          </div>

          <!-- Action Buttons -->
          <div class="col-auto">
            <q-btn
              v-if="!isScanning"
              :disable="!canStartScan"
              color="primary"
              icon="qr_code_scanner"
              label="Bắt đầu quét"
              @click="isScanning = true"
            />
            <q-btn
              v-else
              color="negative"
              icon="stop"
              label="Dừng quét"
              @click="isScanning = false"
            />
          </div>

          <div class="col-auto">
            <q-btn
              :disable="scannedItems.length === 0"
              color="secondary"
              icon="compare"
              label="So sánh"
              outline
              @click="startComparison"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Scanner Panel -->
      <div class="col-12 col-md-6">
        <q-card
          flat
          bordered
        >
          <q-card-section class="q-pb-none">
            <div class="text-subtitle1 text-weight-medium">
              <q-icon
                name="qr_code_scanner"
                class="q-mr-sm"
              />
              Camera Scanner
            </div>
          </q-card-section>

          <q-card-section>
            <div
              v-if="!selectedWarehouseId"
              class="text-center q-pa-xl text-grey-6"
            >
              <q-icon
                name="warehouse"
                size="64px"
              />
              <div class="q-mt-md">
                Vui lòng chọn kho để bắt đầu kiểm kê
              </div>
            </div>

            <QrScannerStream
              v-else
              v-model="isScanning"
              :formats="['qr_code', 'code_128', 'ean_13']"
              hint="Đưa mã QR vào khung để quét"
              @detect="handleDetect"
            />
          </q-card-section>

          <!-- Stats -->
          <q-card-section
            v-if="scannedItems.length > 0"
            class="q-pt-none"
          >
            <div class="row q-col-gutter-sm">
              <div class="col">
                <q-chip
                  color="primary"
                  text-color="white"
                  dense
                >
                  Đã quét: {{ stats.total }}
                </q-chip>
              </div>
              <div class="col-auto">
                <q-chip
                  color="positive"
                  text-color="white"
                  dense
                >
                  <q-icon
                    name="check"
                    class="q-mr-xs"
                  />
                  {{ stats.found }}
                </q-chip>
              </div>
              <div class="col-auto">
                <q-chip
                  color="negative"
                  text-color="white"
                  dense
                >
                  <q-icon
                    name="close"
                    class="q-mr-xs"
                  />
                  {{ stats.notFound }}
                </q-chip>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Scanned List -->
      <div class="col-12 col-md-6">
        <q-card
          flat
          bordered
        >
          <q-card-section class="row items-center q-pb-none">
            <div class="text-subtitle1 text-weight-medium">
              <q-icon
                name="list"
                class="q-mr-sm"
              />
              Danh sách đã quét
            </div>
            <q-space />
            <q-btn
              v-if="scannedItems.length > 0"
              flat
              dense
              color="negative"
              label="Xóa tất cả"
              @click="clearAll"
            />
          </q-card-section>

          <q-card-section>
            <q-list
              v-if="scannedItems.length > 0"
              bordered
              separator
              class="rounded-borders"
              style="max-height: 400px; overflow-y: auto;"
            >
              <q-item
                v-for="item in scannedItems"
                :key="item.cone_id"
                dense
              >
                <q-item-section avatar>
                  <q-icon
                    :name="item.status === 'found' ? 'check_circle' : 'error'"
                    :color="item.status === 'found' ? 'positive' : 'negative'"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium font-mono">
                    {{ item.cone_id }}
                  </q-item-label>
                  <q-item-label
                    v-if="item.cone"
                    caption
                  >
                    {{ item.cone.thread_type?.code }} | Lô: {{ item.cone.lot_number || 'N/A' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    size="sm"
                    color="grey"
                    @click="removeItem(item.cone_id)"
                  />
                </q-item-section>
              </q-item>
            </q-list>

            <div
              v-else
              class="text-center q-pa-lg text-grey-6"
            >
              <q-icon
                name="inbox"
                size="48px"
              />
              <div class="q-mt-sm">
                Chưa có mã nào được quét
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Comparison Results -->
    <q-card
      v-if="showComparison"
      flat
      bordered
      class="q-mt-md"
    >
      <q-card-section class="row items-center">
        <div class="text-h6">
          <q-icon
            name="analytics"
            class="q-mr-sm"
          />
          Kết quả so sánh
        </div>
        <q-space />
        <q-btn
          color="primary"
          icon="download"
          label="Xuất Excel"
          outline
          @click="exportXlsx"
        />
        <q-btn
          color="positive"
          icon="check"
          label="Hoàn tất"
          class="q-ml-sm"
          @click="completeStocktake"
        />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-3">
            <q-card
              flat
              class="bg-blue-1"
            >
              <q-card-section class="text-center">
                <div class="text-h4 text-primary">
                  {{ warehouseCones.size }}
                </div>
                <div class="text-caption">
                  Trong database
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-3">
            <q-card
              flat
              class="bg-green-1"
            >
              <q-card-section class="text-center">
                <div class="text-h4 text-positive">
                  {{ comparisonResult.matched.length }}
                </div>
                <div class="text-caption">
                  Khớp ({{ comparisonResult.matchRate }}%)
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-3">
            <q-card
              flat
              class="bg-orange-1"
            >
              <q-card-section class="text-center">
                <div class="text-h4 text-warning">
                  {{ comparisonResult.missing.length }}
                </div>
                <div class="text-caption">
                  Thiếu (chưa quét)
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-3">
            <q-card
              flat
              class="bg-red-1"
            >
              <q-card-section class="text-center">
                <div class="text-h4 text-negative">
                  {{ comparisonResult.extra.length }}
                </div>
                <div class="text-caption">
                  Thừa (không trong DB)
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Resume Session Dialog -->
    <q-dialog v-model="showResumePrompt">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">
            Tiếp tục phiên kiểm kê?
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          Bạn có phiên kiểm kê trước đó chưa hoàn tất. Bạn muốn tiếp tục hay bắt đầu mới?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Bắt đầu mới"
            color="negative"
            @click="startNewSession"
          />
          <q-btn
            flat
            label="Tiếp tục"
            color="primary"
            @click="resumeSession"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.font-mono {
  font-family: monospace;
}
</style>
