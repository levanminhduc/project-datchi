/**
 * useBatchOperations Composable
 *
 * State management for batch operations (receive, transfer, issue).
 */

import { ref, computed } from 'vue'
import { batchService } from '@/services/batchService'
import { useSnackbar } from './useSnackbar'
import type {
  BatchReceiveRequest,
  BatchTransferRequest,
  BatchIssueRequest,
  BatchReturnRequest,
  BatchOperationResponse,
  BatchTransaction,
  BatchTransactionFilters
} from '@/types/thread/batch'

export function useBatchOperations() {
  const snackbar = useSnackbar()

  // Buffer for scanned/entered cone IDs
  const coneBuffer = ref<string[]>([])
  const transactions = ref<BatchTransaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastResult = ref<BatchOperationResponse | null>(null)

  // Computed
  const bufferCount = computed(() => coneBuffer.value.length)
  const hasBuffer = computed(() => coneBuffer.value.length > 0)

  /**
   * Thêm cone vào buffer
   */
  function addToBuffer(coneId: string): boolean {
    const trimmed = coneId.trim()
    if (!trimmed) return false

    if (coneBuffer.value.includes(trimmed)) {
      snackbar.warning('Đã quét rồi')
      return false
    }

    coneBuffer.value.push(trimmed)
    return true
  }

  /**
   * Thêm nhiều cone vào buffer
   */
  function addMultipleToBuffer(coneIds: string[]): number {
    let added = 0
    for (const id of coneIds) {
      if (addToBuffer(id)) added++
    }
    return added
  }

  /**
   * Parse text input thành danh sách cone IDs
   */
  function parseInput(input: string): string[] {
    return input
      .split(/[,\n\r]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
  }

  /**
   * Xóa cone khỏi buffer
   */
  function removeFromBuffer(coneId: string) {
    const index = coneBuffer.value.indexOf(coneId)
    if (index !== -1) {
      coneBuffer.value.splice(index, 1)
    }
  }

  /**
   * Xóa toàn bộ buffer
   */
  function clearBuffer() {
    coneBuffer.value = []
  }

  /**
   * Nhập kho hàng loạt
   */
  async function batchReceive(data: Omit<BatchReceiveRequest, 'cone_ids'>): Promise<BatchOperationResponse | null> {
    if (coneBuffer.value.length === 0) {
      snackbar.error('Chưa có cuộn nào để nhập')
      return null
    }

    loading.value = true
    error.value = null
    try {
      const result = await batchService.receive({
        ...data,
        cone_ids: coneBuffer.value
      })
      lastResult.value = result
      clearBuffer()
      snackbar.success(`Đã nhập ${result.cone_count} cuộn vào kho`)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi nhập kho'
      snackbar.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Chuyển kho hàng loạt
   */
  async function batchTransfer(data: BatchTransferRequest): Promise<BatchOperationResponse | null> {
    loading.value = true
    error.value = null
    try {
      const result = await batchService.transfer(data)
      lastResult.value = result
      snackbar.success(`Đã chuyển ${result.cone_count} cuộn`)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi chuyển kho'
      snackbar.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Xuất kho hàng loạt
   */
  async function batchIssue(data: BatchIssueRequest): Promise<BatchOperationResponse | null> {
    loading.value = true
    error.value = null
    try {
      const result = await batchService.issue(data)
      lastResult.value = result
      snackbar.success(`Đã xuất ${result.cone_count} cuộn cho ${data.recipient}`)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi xuất kho'
      snackbar.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Trả lại cuộn
   */
  async function batchReturn(data: BatchReturnRequest): Promise<BatchOperationResponse | null> {
    loading.value = true
    error.value = null
    try {
      const result = await batchService.return(data)
      lastResult.value = result
      snackbar.success(`Đã trả ${result.cone_count} cuộn`)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi trả cuộn'
      snackbar.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Tải lịch sử thao tác
   */
  async function fetchTransactions(filters?: BatchTransactionFilters) {
    loading.value = true
    error.value = null
    try {
      transactions.value = await batchService.getTransactions(filters)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi tải lịch sử'
      snackbar.error(error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset state
   */
  function reset() {
    coneBuffer.value = []
    transactions.value = []
    lastResult.value = null
    error.value = null
  }

  return {
    // State
    coneBuffer,
    transactions,
    loading,
    error,
    lastResult,

    // Computed
    bufferCount,
    hasBuffer,

    // Buffer actions
    addToBuffer,
    addMultipleToBuffer,
    parseInput,
    removeFromBuffer,
    clearBuffer,

    // Batch operations
    batchReceive,
    batchTransfer,
    batchIssue,
    batchReturn,

    // History
    fetchTransactions,

    // Utils
    reset
  }
}
