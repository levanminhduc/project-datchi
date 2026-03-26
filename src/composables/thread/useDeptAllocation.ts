import { ref, computed } from 'vue'
import { deptAllocationService } from '@/services/deptAllocationService'
import { useSnackbar } from '../useSnackbar'
import type {
  DeptAllocationSummary,
  DeptAllocationLog,
} from '@/types/thread/deptAllocation'

export function useDeptAllocation() {
  const snackbar = useSnackbar()
  const summary = ref<DeptAllocationSummary | null>(null)
  const logs = ref<DeptAllocationLog[]>([])
  const isLoading = ref(false)
  const isAllocating = ref(false)

  const hasAllocations = computed(() =>
    (summary.value?.total_allocated ?? 0) > 0
  )

  function getDeptInfo(department: string) {
    if (!summary.value) return null
    return summary.value.allocated.find(a => a.department === department) ?? null
  }

  async function loadSummary(poId: number, styleId: number, styleColorId: number) {
    isLoading.value = true
    try {
      summary.value = await deptAllocationService.getSummary(poId, styleId, styleColorId)
    } catch (err) {
      console.error('[useDeptAllocation] loadSummary error:', err)
      summary.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function allocate(data: {
    po_id: number
    style_id: number
    style_color_id: number
    department: string
    add_quantity: number
    created_by: string
  }) {
    isAllocating.value = true
    try {
      const result = await deptAllocationService.allocate(data)
      snackbar.success(`Đã phân bổ ${result.added_quantity} SP cho ${data.department}`)
      await loadSummary(data.po_id, data.style_id, data.style_color_id)
      return result
    } catch (err: any) {
      snackbar.error(err.message || 'Không thể phân bổ sản phẩm')
      throw err
    } finally {
      isAllocating.value = false
    }
  }

  async function loadLogs(
    poId: number,
    styleId: number,
    styleColorId: number,
    department?: string
  ) {
    try {
      logs.value = await deptAllocationService.getLogs(poId, styleId, styleColorId, department)
    } catch (err) {
      console.error('[useDeptAllocation] loadLogs error:', err)
      logs.value = []
    }
  }

  function reset() {
    summary.value = null
    logs.value = []
  }

  return {
    summary,
    logs,
    isLoading,
    isAllocating,
    hasAllocations,
    getDeptInfo,
    loadSummary,
    allocate,
    loadLogs,
    reset,
  }
}
