import { ref, reactive, computed, watch, onMounted } from 'vue'
import { overQuotaService } from '@/services/overQuotaService'
import { useSnackbar } from '../useSnackbar'
import { getErrorMessage } from '@/utils/errorMessages'
import { useOverQuotaExport } from './useOverQuotaExport'
import {
  createDefaultFilters,
  type OverQuotaFilters,
  type OverQuotaSummary,
  type StyleOverQuotaItem,
  type TrendDataPoint,
  type DeptBreakdownItem,
} from '@/types/thread/overQuota'

export function useOverQuotaAnalysis() {
  const snackbar = useSnackbar()

  const filters = reactive<OverQuotaFilters>(createDefaultFilters())
  const summary = ref<OverQuotaSummary | null>(null)
  const byStyleData = ref<StyleOverQuotaItem[]>([])
  const trendData = ref<TrendDataPoint[]>([])
  const isLoadingSummary = ref(false)
  const isLoadingCharts = ref(false)
  const error = ref<string | null>(null)
  const granularity = ref<'week' | 'month'>('week')

  const byDeptData = computed<DeptBreakdownItem[]>(() => {
    const deptMap = new Map<string, number>()
    byStyleData.value.forEach((item) => {
      item.dept_breakdown.forEach(({ dept, count }) => {
        deptMap.set(dept, (deptMap.get(dept) || 0) + count)
      })
    })
    return Array.from(deptMap, ([dept, count]) => ({ dept, count }))
      .sort((a, b) => b.count - a.count)
  })

  function filtersSnapshot(): OverQuotaFilters {
    return { ...filters }
  }

  async function fetchSummary() {
    isLoadingSummary.value = true
    try {
      summary.value = await overQuotaService.getSummary(filtersSnapshot())
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể tải dữ liệu tổng hợp')
      error.value = msg
      snackbar.error(msg)
    } finally {
      isLoadingSummary.value = false
    }
  }

  async function fetchChartData() {
    isLoadingCharts.value = true
    try {
      const [styleResult, trendResult] = await Promise.all([
        overQuotaService.getByStyle(filtersSnapshot()),
        overQuotaService.getTrend(filtersSnapshot(), granularity.value),
      ])
      byStyleData.value = styleResult
      trendData.value = trendResult
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể tải dữ liệu biểu đồ')
      error.value = msg
      snackbar.error(msg)
    } finally {
      isLoadingCharts.value = false
    }
  }

  async function fetchAll() {
    error.value = null
    await Promise.all([fetchSummary(), fetchChartData()])
  }

  function handleApplyFilters() {
    fetchAll()
  }

  function handleStyleClick(styleId: number) {
    filters.style_ids = [styleId]
    handleApplyFilters()
  }

  function handleClearFilters() {
    Object.assign(filters, createDefaultFilters())
    fetchAll()
  }

  watch(granularity, () => {
    overQuotaService
      .getTrend(filtersSnapshot(), granularity.value)
      .then((result) => {
        trendData.value = result
      })
      .catch((err) => {
        snackbar.error(getErrorMessage(err, 'Không thể tải dữ liệu xu hướng'))
      })
  })

  const { exportToXlsx } = useOverQuotaExport(summary, byStyleData, filtersSnapshot)

  onMounted(() => {
    fetchAll()
  })

  return {
    filters,
    summary,
    byStyleData,
    trendData,
    byDeptData,
    isLoadingSummary,
    isLoadingCharts,
    error,
    granularity,
    fetchAll,
    handleApplyFilters,
    handleStyleClick,
    handleClearFilters,
    exportToXlsx,
  }
}
