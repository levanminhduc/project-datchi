/**
 * Thread Calculation Composable
 *
 * Provides reactive state and operations for thread calculation.
 */

import { ref, computed } from 'vue'
import { threadCalculationService } from '@/services'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  CalculationInput,
  CalculationResult,
  CalculateByPOInput,
  POCalculationResult,
} from '@/types/thread'

export function useThreadCalculation() {
  // State
  const calculationResult = ref<CalculationResult | null>(null)
  const poCalculationResults = ref<POCalculationResult[]>([])
  const error = ref<string | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasResults = computed(() =>
    calculationResult.value !== null || poCalculationResults.value.length > 0
  )

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Clear all results
   */
  const clearResults = () => {
    calculationResult.value = null
    poCalculationResults.value = []
  }

  /**
   * Calculate thread requirements by style and quantity
   */
  const calculate = async (input: CalculationInput): Promise<CalculationResult | null> => {
    clearError()
    try {
      const result = await loading.withLoading(async () => {
        return await threadCalculationService.calculate(input)
      })

      calculationResult.value = result
      snackbar.success('Tính toán định mức chỉ thành công')
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useThreadCalculation] calculate error:', err)
      return null
    }
  }

  /**
   * Calculate thread requirements by PO
   */
  const calculateByPO = async (input: CalculateByPOInput): Promise<POCalculationResult[]> => {
    clearError()
    try {
      const results = await loading.withLoading(async () => {
        return await threadCalculationService.calculateByPO(input)
      })

      poCalculationResults.value = results
      snackbar.success('Tính toán định mức chỉ theo đơn hàng thành công')
      return results
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useThreadCalculation] calculateByPO error:', err)
      return []
    }
  }

  return {
    // State
    calculationResult,
    poCalculationResults,
    error,
    // Computed
    isLoading,
    hasResults,
    // Actions
    clearError,
    clearResults,
    calculate,
    calculateByPO,
  }
}
