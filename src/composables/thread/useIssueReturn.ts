import { ref, computed } from 'vue'
import { issueV2Service } from '@/services/issueV2Service'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type { IssueLineV2WithComputed, ReturnLineDTO } from '@/types/thread/issueV2'

export interface ReturnInput {
  returned_full: number
  returned_partial: number
}

export function useIssueReturn() {
  const inputs = ref<Map<number, ReturnInput>>(new Map())
  const errors = ref<string[]>([])
  const snackbar = useSnackbar()
  const loading = useLoading()

  const isSubmitting = computed(() => loading.isLoading.value)

  const hasInput = computed(() => {
    for (const [, v] of inputs.value) {
      if (v.returned_full > 0 || v.returned_partial > 0) return true
    }
    return false
  })

  function getInput(lineId: number): ReturnInput {
    if (!inputs.value.has(lineId)) {
      inputs.value.set(lineId, { returned_full: 0, returned_partial: 0 })
    }
    return inputs.value.get(lineId)!
  }

  function reset() {
    inputs.value = new Map()
    errors.value = []
  }

  function validate(lines: IssueLineV2WithComputed[]): boolean {
    const errs: string[] = []

    for (const line of lines) {
      const input = inputs.value.get(line.id)
      if (!input) continue

      const availFull = Math.max(0, line.issued_full - line.returned_full)
      const totalRemaining = Math.max(0, (line.issued_full + line.issued_partial) - (line.returned_full + line.returned_partial))

      if (input.returned_full > availFull) {
        errs.push(`${line.thread_name}: trả nguyên (${input.returned_full}) vượt còn lại (${availFull})`)
      }
      if (input.returned_full + input.returned_partial > totalRemaining) {
        errs.push(`${line.thread_name}: tổng trả (${input.returned_full + input.returned_partial}) vượt tổng còn lại (${totalRemaining})`)
      }
    }

    errors.value = errs
    return errs.length === 0
  }

  async function submit(issueId: number, lines: IssueLineV2WithComputed[]): Promise<boolean> {
    if (!validate(lines)) return false

    const returnLines: ReturnLineDTO[] = []
    for (const [lineId, input] of inputs.value) {
      if (input.returned_full > 0 || input.returned_partial > 0) {
        returnLines.push({
          line_id: lineId,
          returned_full: input.returned_full,
          returned_partial: input.returned_partial,
        })
      }
    }

    if (returnLines.length === 0) {
      snackbar.warning('Vui lòng nhập số lượng trả')
      return false
    }

    try {
      await loading.withLoading(() =>
        issueV2Service.returnItems(issueId, { lines: returnLines })
      )
      snackbar.success('Trả kho thành công')
      reset()
      return true
    } catch (err) {
      snackbar.error(getErrorMessage(err, 'Không thể trả kho'))
      return false
    }
  }

  return {
    inputs,
    errors,
    isSubmitting,
    hasInput,
    getInput,
    reset,
    validate,
    submit,
  }
}
