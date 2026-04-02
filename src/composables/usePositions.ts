import { computed } from 'vue'
import { positionService, type PositionOption } from '@/services/positionService'
import { useCachedQuery } from './useCachedQuery'

export type { PositionOption }

export function usePositions() {
  const {
    data: positionsData,
    isLoading,
    error,
    refresh: fetchPositions,
  } = useCachedQuery<PositionOption[]>(
    '/api/positions',
    () => positionService.getUniquePositions(),
    { ttl: 5 * 60_000 },
  )

  const positions = computed(() => positionsData.value ?? [])
  const hasPositions = computed(() => positions.value.length > 0)

  const positionOptions = computed<PositionOption[]>(() => {
    return positions.value
  })

  const positionLabels = computed<Record<string, string>>(() => {
    const labels: Record<string, string> = {}
    for (const pos of positions.value) {
      labels[pos.value] = pos.label
    }
    return labels
  })

  const clearError = () => {
    error.value = null
  }

  const getPositionLabel = (value: string): string => {
    return positionLabels.value[value] || value
  }

  return {
    positions,
    error,
    loading: isLoading,

    hasPositions,
    positionOptions,
    positionLabels,

    fetchPositions,
    clearError,
    getPositionLabel,
  }
}
