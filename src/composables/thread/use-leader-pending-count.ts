import { ref } from 'vue'
import { weeklyOrderService } from '@/services/weeklyOrderService'

const pendingCount = ref(0)
let pollingInterval: ReturnType<typeof setInterval> | null = null

export function useLeaderPendingCount() {
  async function refresh() {
    try {
      pendingCount.value = await weeklyOrderService.getLeaderPendingCount()
    } catch {
    }
  }

  function startPolling(intervalMs = 30000) {
    if (pollingInterval) return
    refresh()
    pollingInterval = setInterval(refresh, intervalMs)
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    pendingCount.value = 0
  }

  return {
    pendingCount,
    refresh,
    startPolling,
    stopPolling,
  }
}
