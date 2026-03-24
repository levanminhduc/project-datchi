import { ref, computed } from 'vue'
import { issueV2Service } from '@/services/issueV2Service'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  ReturnGroup,
  ReturnGroupThread,
  ReturnGroupedResponse,
  GroupedReturnLog,
  CompletionInfo,
} from '@/types/thread/issueV2'

export function useReturnV2() {
  const returnGroups = ref<ReturnGroup[]>([])
  const selectedGroup = ref<ReturnGroup | null>(null)
  const returnLogs = ref<GroupedReturnLog[]>([])
  const error = ref<string | null>(null)
  const completionInfo = ref<CompletionInfo | null>(null)

  const snackbar = useSnackbar()
  const loading = useLoading()

  const isLoading = computed(() => loading.isLoading.value)
  const hasGroups = computed(() => returnGroups.value.length > 0)

  const clearError = () => {
    error.value = null
  }

  const clearCompletionInfo = () => {
    completionInfo.value = null
  }

  const loadReturnGroups = async (): Promise<void> => {
    clearError()
    try {
      const result = await loading.withLoading(() => issueV2Service.getReturnGroups())
      returnGroups.value = result
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể tải danh sách nhóm trả')
      error.value = msg
      snackbar.error(msg)
    }
  }

  const selectGroup = (group: ReturnGroup | null) => {
    selectedGroup.value = group
    returnLogs.value = []
    clearCompletionInfo()
    if (group) {
      loadGroupedReturnLogs(group)
    }
  }

  const submitGroupedReturn = async (
    group: ReturnGroup,
    lines: { thread_type_id: number; returned_full: number; returned_partial: number }[]
  ): Promise<ReturnGroupedResponse | null> => {
    clearError()
    clearCompletionInfo()
    const linesToSubmit = lines.filter((l) => l.returned_full > 0 || l.returned_partial > 0)
    if (linesToSubmit.length === 0) {
      snackbar.warning('Vui lòng nhập số lượng trả')
      return null
    }

    try {
      const result = await loading.withLoading(() =>
        issueV2Service.returnGrouped({
          po_id: group.po_id,
          style_id: group.style_id,
          style_color_id: group.style_color_id,
          color_id: group.color_id,
          idempotency_key: crypto.randomUUID(),
          lines: linesToSubmit,
        })
      )

      if (result.completion_info) {
        completionInfo.value = result.completion_info
      }

      const autoCompleted = result.completion_info?.auto_completed ?? []
      const firstWeek = autoCompleted[0]
      if (firstWeek) {
        snackbar.success(`Đã nhập lại và đánh dấu hoàn tất xuất chỉ cho tuần ${firstWeek.week_name}`)
      } else {
        snackbar.success('Đã nhập lại thành công')
      }

      await loadReturnGroups()
      const updatedGroup = returnGroups.value.find((g) => g.group_key === group.group_key)
      selectedGroup.value = updatedGroup || null
      if (updatedGroup) {
        await loadGroupedReturnLogs(updatedGroup)
      }
      return result
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể nhập lại')
      error.value = msg
      snackbar.error(msg)
      return null
    }
  }

  const confirmBatchCompletion = async (itemIds: number[]): Promise<boolean> => {
    if (itemIds.length === 0) return false
    try {
      await weeklyOrderService.batchComplete(itemIds)
      snackbar.success('Đã đánh dấu hoàn tất xuất chỉ')
      clearCompletionInfo()
      return true
    } catch (err) {
      snackbar.error(getErrorMessage(err, 'Không thể đánh dấu hoàn tất'))
      return false
    }
  }

  const loadGroupedReturnLogs = async (group: ReturnGroup): Promise<void> => {
    try {
      const result = await loading.withLoading(() =>
        issueV2Service.getGroupedReturnLogs(
          group.po_id,
          group.style_id,
          group.style_color_id || undefined,
          group.color_id || undefined
        )
      )
      returnLogs.value = result
    } catch (err) {
      snackbar.error(getErrorMessage(err, 'Không thể tải lịch sử trả'))
    }
  }

  const validateReturnQuantities = (
    lines: { thread_type_id: number; returned_full: number; returned_partial: number }[],
    threads: ReturnGroupThread[]
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    for (const line of lines) {
      const thread = threads.find((t) => t.thread_type_id === line.thread_type_id)
      if (!thread) continue
      if (line.returned_full > thread.outstanding_full) {
        errors.push(
          `${thread.thread_name}: Nguyên trả (${line.returned_full}) vượt outstanding (${thread.outstanding_full})`
        )
      }
      if (line.returned_partial > thread.outstanding_partial) {
        errors.push(
          `${thread.thread_name}: Lẻ trả (${line.returned_partial}) vượt outstanding (${thread.outstanding_partial})`
        )
      }
    }
    return { valid: errors.length === 0, errors }
  }

  const lookupAndMarkCompletion = async (group: ReturnGroup): Promise<void> => {
    clearCompletionInfo()
    try {
      const result = await weeklyOrderService.completionLookup(
        group.po_id,
        group.style_id,
        group.style_color_id || null,
      )
      const weeks = result.weeks
      if (weeks.length === 0) {
        snackbar.warning('Không tìm thấy tuần CONFIRMED phù hợp')
        return
      }
      const firstWeek = weeks[0]
      if (weeks.length === 1 && firstWeek) {
        await weeklyOrderService.batchComplete(firstWeek.item_ids)
        snackbar.success(`Đã đánh dấu hoàn tất xuất chỉ cho tuần ${firstWeek.week_name}`)
        return
      }
      completionInfo.value = { auto_completed: [], pending_selection: weeks }
    } catch (err) {
      snackbar.error(getErrorMessage(err, 'Không thể tra cứu tuần hoàn tất'))
    }
  }

  return {
    returnGroups,
    selectedGroup,
    returnLogs,
    error,
    isLoading,
    hasGroups,
    completionInfo,
    loadReturnGroups,
    selectGroup,
    submitGroupedReturn,
    loadGroupedReturnLogs,
    validateReturnQuantities,
    confirmBatchCompletion,
    lookupAndMarkCompletion,
    clearCompletionInfo,
    clearError,
  }
}
