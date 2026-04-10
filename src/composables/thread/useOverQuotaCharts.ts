import { computed, ref, type Ref } from 'vue'
import type { StyleOverQuotaItem, TrendDataPoint, DeptBreakdownItem } from '@/types/thread/overQuota'
import {
  buildRankingOption,
  buildComparisonOption,
  buildReasonOption,
  buildTrendOption,
  buildDeptOption,
} from './over-quota-chart-builders'

export function useOverQuotaCharts(
  byStyleData: Ref<StyleOverQuotaItem[]>,
  trendData: Ref<TrendDataPoint[]>,
  byDeptData: Ref<DeptBreakdownItem[]>,
) {
  const topN = ref(10)

  const rankingOption = computed(() => buildRankingOption(byStyleData.value, topN.value))
  const comparisonOption = computed(() => buildComparisonOption(byStyleData.value))
  const reasonOption = computed(() => buildReasonOption(byStyleData.value))
  const trendOption = computed(() => buildTrendOption(trendData.value))
  const deptOption = computed(() => buildDeptOption(byDeptData.value))

  return {
    topN,
    rankingOption,
    comparisonOption,
    reasonOption,
    trendOption,
    deptOption,
  }
}
