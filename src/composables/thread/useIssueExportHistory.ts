import { reactive } from 'vue'
import { useLoading } from '@/composables/useLoading'
import { issueHistoryService } from '@/services/issueHistoryService'
import type {
  IssueExportHistoryFilters,
  IssueExportHistoryRow,
} from '@/types/thread/issueExportHistory'

interface DisplayFilters {
  from_date_display: string
  to_date_display: string
  warehouse_id: number | null
}

export function ddmmyyyyToISO(value: string): string {
  if (!value || !/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return ''
  const [day, month, year] = value.split('/')
  return `${year}-${month}-${day}`
}

export function useIssueExportHistory() {
  const filters = reactive<DisplayFilters>({
    from_date_display: '',
    to_date_display: '',
    warehouse_id: null,
  })
  const { isLoading, withLoading } = useLoading()

  function toApiFilters(): IssueExportHistoryFilters {
    return {
      from_date: ddmmyyyyToISO(filters.from_date_display),
      to_date: ddmmyyyyToISO(filters.to_date_display),
      warehouse_id: filters.warehouse_id,
    }
  }

  async function fetchHistory(): Promise<IssueExportHistoryRow[]> {
    return withLoading(() => issueHistoryService.getAggregated(toApiFilters()))
  }

  return {
    filters,
    isLoading,
    fetchHistory,
    toApiFilters,
    ddmmyyyyToISO,
  }
}
