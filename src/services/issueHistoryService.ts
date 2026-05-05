import { fetchApi } from './api'
import type { ApiResponse } from '@/types'
import type {
  IssueExportHistoryFilters,
  IssueExportHistoryRow,
} from '@/types/thread/issueExportHistory'

const BASE = '/api/issue-history'

export const issueHistoryService = {
  async getAggregated(
    filters: IssueExportHistoryFilters,
  ): Promise<IssueExportHistoryRow[]> {
    const params = new URLSearchParams({
      from_date: filters.from_date,
      to_date: filters.to_date,
    })

    if (filters.warehouse_id) {
      params.set('warehouse_id', String(filters.warehouse_id))
    }

    const response = await fetchApi<ApiResponse<IssueExportHistoryRow[]>>(
      `${BASE}/aggregated?${params.toString()}`,
    )
    return response.data || []
  },
}
