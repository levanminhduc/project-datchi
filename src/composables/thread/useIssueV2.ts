/**
 * Thread Issue V2 Composable
 * Reactive state and operations for the simplified issue management system
 *
 * Key design:
 * - Frontend only displays data and collects input
 * - All calculations (issued_equivalent, quota check, stock check) are done by backend
 * - API calls only, no frontend business logic
 */

import { ref, computed } from 'vue'
import { issueV2Service } from '@/services/issueV2Service'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  IssueV2,
  IssueV2WithLines,
  IssueLineV2WithComputed,
  CreateIssueV2DTO,
  CreateIssueWithLineDTO,
  AddIssueLineV2DTO,
  ValidateIssueLineV2DTO,
  ValidateLineResponse,
  IssueFormData,
  IssueV2Filters,
} from '@/types/thread/issueV2'

export function useIssueV2() {
  // State
  const currentIssue = ref<IssueV2WithLines | null>(null)
  const issues = ref<IssueV2[]>([])
  const formData = ref<IssueFormData | null>(null)
  const validationResult = ref<ValidateLineResponse | null>(null)
  const error = ref<string | null>(null)
  const total = ref(0)
  const filters = ref<IssueV2Filters>({})

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasIssue = computed(() => currentIssue.value !== null)
  const lines = computed(() => currentIssue.value?.lines || [])
  const threadTypes = computed(() => formData.value?.thread_types || [])
  const isConfirmed = computed(() => currentIssue.value?.status === 'CONFIRMED')

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Clear validation result
   */
  const clearValidation = () => {
    validationResult.value = null
  }

  /**
   * Create a new issue
   * @param data - CreateIssueV2DTO with department and created_by
   * @returns Created issue info or null on error
   */
  const createIssue = async (data: CreateIssueV2DTO) => {
    clearError()

    try {
      const result = await loading.withLoading(async () => {
        return await issueV2Service.create(data)
      })

      snackbar.success(`Đã tạo phiếu ${result.issue_code}`)

      // Load the full issue with lines
      await fetchIssue(result.issue_id)

      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể tạo phiếu xuất')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueV2] createIssue error:', err)
      return null
    }
  }

  const createIssueWithFirstLine = async (data: CreateIssueWithLineDTO) => {
    clearError()

    try {
      const result = await loading.withLoading(async () => {
        return await issueV2Service.createWithFirstLine(data)
      })

      currentIssue.value = result
      snackbar.success(`Đã tạo phiếu ${result.issue_code} và thêm dòng đầu tiên`)
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể tạo phiếu xuất')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueV2] createIssueWithFirstLine error:', err)
      return null
    }
  }

  /**
   * Fetch issue by ID
   * @param id - Issue ID
   */
  const fetchIssue = async (id: number) => {
    clearError()

    try {
      currentIssue.value = await loading.withLoading(async () => {
        return await issueV2Service.getById(id)
      })
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể tải phiếu xuất')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueV2] fetchIssue error:', err)
    }
  }

  /**
   * List issues with filters
   * @param newFilters - Optional filters to apply
   */
  const fetchIssues = async (newFilters?: IssueV2Filters) => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const result = await loading.withLoading(async () => {
        return await issueV2Service.list(filters.value)
      })

      issues.value = result.data
      total.value = result.total
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể tải danh sách phiếu xuất')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueV2] fetchIssues error:', err)
    }
  }

  /**
   * Load form data (thread types with quota and stock) for a PO/Style/Color
   * @param poId - Purchase Order ID
   * @param styleId - Style ID
   * @param colorId - Color ID
   */
  const loadFormData = async (poId: number, styleId: number, colorId: number) => {
    clearError()
    formData.value = null

    try {
      formData.value = await loading.withLoading(async () => {
        return await issueV2Service.getFormData(poId, styleId, colorId)
      })

      return formData.value
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể tải dữ liệu form')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueV2] loadFormData error:', err)
      return null
    }
  }

  /**
   * Validate a line (backend calculates equivalent, checks quota/stock)
   * @param data - Validate line data
   */
  const validateLine = async (data: ValidateIssueLineV2DTO): Promise<ValidateLineResponse | null> => {
    try {
      validationResult.value = await issueV2Service.validateLine(currentIssue.value?.id, data)
      return validationResult.value
    } catch (err) {
      console.error('[useIssueV2] validateLine error:', err)
      return null
    }
  }

  /**
   * Add a line to the current issue
   * @param data - Add line data
   */
  const addLine = async (data: AddIssueLineV2DTO): Promise<IssueLineV2WithComputed | null> => {
    if (!currentIssue.value) {
      snackbar.error('Chưa tạo phiếu xuất')
      return null
    }

    clearError()

    try {
      const line = await loading.withLoading(async () => {
        return await issueV2Service.addLine(currentIssue.value!.id, data)
      })

      // Refresh issue to get updated lines
      await fetchIssue(currentIssue.value.id)

      snackbar.success('Đã thêm dòng vào phiếu')
      return line
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể thêm dòng')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueV2] addLine error:', err)
      return null
    }
  }

  /**
   * Remove a line from the current issue
   * @param lineId - Line ID to remove
   */
  const removeLine = async (lineId: number): Promise<boolean> => {
    if (!currentIssue.value) {
      snackbar.error('Chưa tạo phiếu xuất')
      return false
    }

    clearError()

    try {
      await loading.withLoading(async () => {
        await issueV2Service.removeLine(currentIssue.value!.id, lineId)
      })

      // Refresh issue to get updated lines
      await fetchIssue(currentIssue.value.id)

      snackbar.success('Đã xóa dòng')
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể xóa dòng')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueV2] removeLine error:', err)
      return false
    }
  }

  /**
   * Update line notes (for over quota explanation)
   * @param lineId - Line ID
   * @param notes - Notes to set
   */
  const updateLineNotes = async (lineId: number, notes: string): Promise<boolean> => {
    if (!currentIssue.value) {
      return false
    }

    try {
      await issueV2Service.updateLineNotes(currentIssue.value.id, lineId, notes)

      // Refresh issue
      await fetchIssue(currentIssue.value.id)
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể cập nhật ghi chú')
      snackbar.error(errorMessage)
      console.error('[useIssueV2] updateLineNotes error:', err)
      return false
    }
  }

  /**
   * Confirm the current issue (deduct stock)
   */
  const confirmIssue = async (): Promise<boolean> => {
    if (!currentIssue.value) {
      snackbar.error('Chưa tạo phiếu xuất')
      return false
    }

    clearError()

    try {
      currentIssue.value = await loading.withLoading(async () => {
        return await issueV2Service.confirm(currentIssue.value!.id)
      })

      snackbar.success(`Đã xác nhận phiếu ${currentIssue.value.issue_code}`)
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể xác nhận phiếu xuất')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueV2] confirmIssue error:', err)
      return false
    }
  }

  /**
   * Clear current issue state
   */
  const clearIssue = () => {
    currentIssue.value = null
    formData.value = null
    validationResult.value = null
    error.value = null
  }

  return {
    // State
    currentIssue,
    issues,
    formData,
    validationResult,
    error,
    total,
    filters,
    // Computed
    isLoading,
    hasIssue,
    lines,
    threadTypes,
    isConfirmed,
    // Actions
    createIssue,
    createIssueWithFirstLine,
    fetchIssue,
    fetchIssues,
    loadFormData,
    validateLine,
    addLine,
    removeLine,
    updateLineNotes,
    confirmIssue,
    clearIssue,
    clearError,
    clearValidation,
  }
}
