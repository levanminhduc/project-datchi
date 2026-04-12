import { ref } from 'vue'
import { batchService } from '@/services/batchService'
import { useSnackbar } from './useSnackbar'
import type {
  TransferHistoryItem,
  TransferHistorySummary,
  TransferHistoryFilters,
} from '@/types/thread/batch'

const defaultSummary: TransferHistorySummary = {
  total_transfers: 0,
  total_cones: 0,
  top_source: null,
  top_destination: null,
}

export function useTransferHistory() {
  const snackbar = useSnackbar()

  const items = ref<TransferHistoryItem[]>([])
  const total = ref(0)
  const summary = ref<TransferHistorySummary>({ ...defaultSummary })
  const loading = ref(false)
  const summaryLoading = ref(false)

  const filters = ref<TransferHistoryFilters>({})

  const pagination = ref({
    page: 1,
    rowsPerPage: 25,
    sortBy: 'performed_at' as string | null,
    descending: true,
    rowsNumber: 0,
  })

  async function fetchHistory() {
    loading.value = true
    try {
      const response = await batchService.getTransferHistory({
        filters: filters.value,
        page: pagination.value.page,
        pageSize: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy || 'performed_at',
        descending: pagination.value.descending,
      })
      items.value = response.data.items
      total.value = response.data.total
      pagination.value.rowsNumber = response.data.total
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : 'Lỗi khi tải lịch sử chuyển kho')
    } finally {
      loading.value = false
    }
  }

  async function fetchSummary() {
    summaryLoading.value = true
    try {
      const response = await batchService.getTransferHistorySummary(filters.value)
      if (response.data) {
        summary.value = response.data
      }
    } catch (err) {
      console.error('[useTransferHistory] summary error:', err)
    } finally {
      summaryLoading.value = false
    }
  }

  async function handleTableRequest(props: {
    pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean }
  }) {
    const { page, rowsPerPage, sortBy, descending } = props.pagination
    pagination.value.page = page
    pagination.value.rowsPerPage = rowsPerPage
    pagination.value.sortBy = sortBy || 'performed_at'
    pagination.value.descending = descending
    await fetchHistory()
  }

  function resetFilters() {
    filters.value = {}
    pagination.value.page = 1
    fetchHistory()
    fetchSummary()
  }

  function applyFilters() {
    pagination.value.page = 1
    fetchHistory()
    fetchSummary()
  }

  async function exportExcel() {
    if (items.value.length === 0) return

    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Lịch Sử Chuyển Kho')

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Kho xuất', key: 'from_warehouse', width: 20 },
        { header: 'Kho nhận', key: 'to_warehouse', width: 20 },
        { header: 'Số cuộn', key: 'cone_count', width: 12 },
        { header: 'Người thực hiện', key: 'performed_by', width: 20 },
        { header: 'Thời gian', key: 'performed_at', width: 22 },
        { header: 'Ghi chú', key: 'notes', width: 30 },
        { header: 'Số tham chiếu', key: 'reference_number', width: 18 },
      ]

      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' },
      }
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

      items.value.forEach(item => {
        worksheet.addRow({
          id: item.id,
          from_warehouse: item.from_warehouse?.name || '',
          to_warehouse: item.to_warehouse?.name || '',
          cone_count: item.cone_count,
          performed_by: item.performed_by || '',
          performed_at: item.performed_at
            ? new Date(item.performed_at).toLocaleString('vi-VN')
            : '',
          notes: item.notes || '',
          reference_number: item.reference_number || '',
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `lich-su-chuyen-kho-${new Date().toISOString().slice(0, 10)}.xlsx`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('[transfer-history] export error:', err)
      snackbar.error('Lỗi khi xuất Excel')
    }
  }

  return {
    items,
    total,
    summary,
    loading,
    summaryLoading,
    filters,
    pagination,
    fetchHistory,
    fetchSummary,
    handleTableRequest,
    applyFilters,
    resetFilters,
    exportExcel,
  }
}
