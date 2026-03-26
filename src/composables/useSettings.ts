/**
 * System Settings Management Composable
 * Cai dat he thong - System Settings
 *
 * Provides reactive state and operations for managing system settings.
 * Handles fetching, getting individual settings, and updating values.
 */

import { ref, computed } from 'vue'
import { settingsService, type SystemSetting } from '@/services/settingsService'
import { useSnackbar } from './useSnackbar'
import { useLoading } from './useLoading'
import { getErrorMessage } from '@/utils/errorMessages'

export function useSettings() {
  // State
  const settings = ref<SystemSetting[]>([])
  const error = ref<string | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasSettings = computed(() => settings.value.length > 0)

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all system settings
   */
  const fetchSettings = async (): Promise<void> => {
    clearError()

    try {
      settings.value = await loading.withLoading(async () => {
        return await settingsService.getAll()
      })
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Khong the tai danh sach cai dat')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useSettings] fetchSettings error:', err)
    }
  }

  /**
   * Get a single setting by key
   * @param key - Setting key (e.g., 'partial_cone_ratio')
   * @returns System setting or null on error
   */
  const getSetting = async (key: string): Promise<SystemSetting | null> => {
    clearError()

    try {
      const setting = await loading.withLoading(async () => {
        return await settingsService.get(key)
      })
      return setting
    } catch (err) {
      const errorMessage = getErrorMessage(err, `Khong the tai cai dat: ${key}`)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useSettings] getSetting error:', err)
      return null
    }
  }

  /**
   * Update a setting value
   * @param key - Setting key
   * @param value - New value
   * @returns Updated setting or null on error
   */
  const updateSetting = async (key: string, value: unknown): Promise<SystemSetting | null> => {
    clearError()

    try {
      const updated = await loading.withLoading(async () => {
        return await settingsService.update(key, value)
      })

      // Update local state
      const index = settings.value.findIndex((s) => s.key === key)
      if (index !== -1) {
        settings.value[index] = updated
      }

      snackbar.success('Da cap nhat cai dat thanh cong')
      return updated
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Khong the cap nhat cai dat')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useSettings] updateSetting error:', err)
      return null
    }
  }

  /**
   * Get setting value from local state
   * @param key - Setting key
   * @returns Setting value or undefined if not found
   */
  const getSettingValue = <T = unknown>(key: string): T | undefined => {
    const setting = settings.value.find((s) => s.key === key)
    return setting?.value as T | undefined
  }

  /**
   * Clear all settings
   */
  const clearSettings = () => {
    settings.value = []
  }

  return {
    // State
    settings,
    error,
    // Computed
    isLoading,
    hasSettings,
    // Actions
    fetchSettings,
    getSetting,
    updateSetting,
    getSettingValue,
    clearSettings,
    clearError,
  }
}
