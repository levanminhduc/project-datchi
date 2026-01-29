/**
 * Supabase Real-time Subscription Composable
 *
 * Provides reactive real-time subscriptions to Supabase table changes.
 * Auto-cleanup on component unmount, handles reconnection gracefully.
 */

import { ref, onUnmounted, readonly } from 'vue'
import { supabase } from '@/lib/supabase'

/**
 * Connection status for real-time channel
 */
export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * Supported real-time events
 */
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

/**
 * Options for subscribing to real-time changes
 */
export interface UseRealtimeOptions {
  /** Table name to subscribe to */
  table: string
  /** Database schema (default: 'public') */
  schema?: string
  /** Event type to listen for (default: '*' for all) */
  event?: RealtimeEvent
  /** Filter expression (e.g., 'thread_type_id=eq.5') */
  filter?: string
}

/**
 * Payload received from real-time subscription
 */
export interface RealtimePayload<T = Record<string, unknown>> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  table: string
  schema: string
  commitTimestamp: string
}

/**
 * Callback function for real-time events
 */
export type RealtimeCallback<T = Record<string, unknown>> = (payload: RealtimePayload<T>) => void

/**
 * Vietnamese messages for user feedback
 */
const MESSAGES = {
  CONNECTED: 'Đã kết nối real-time',
  DISCONNECTED: 'Mất kết nối real-time',
  RECONNECTING: 'Đang kết nối lại...',
  ERROR: 'Lỗi kết nối real-time',
  SUBSCRIBE_ERROR: 'Không thể đăng ký nhận cập nhật',
}

/**
 * Generate unique channel name
 */
function generateChannelName(options: UseRealtimeOptions): string {
  const { table, schema = 'public', event = '*', filter } = options
  const filterPart = filter ? `-${filter.replace(/[=.]/g, '_')}` : ''
  return `${schema}:${table}:${event}${filterPart}-${Date.now()}`
}

// Store channel references with their names
// Using 'unknown' type to avoid Supabase internal type conflicts
type ChannelRef = ReturnType<typeof supabase.channel>

/**
 * Real-time Subscription Composable
 *
 * Provides methods to subscribe to Supabase real-time table changes.
 * Automatically cleans up subscriptions on component unmount.
 *
 * @example
 * ```ts
 * const { status, subscribe, unsubscribe, unsubscribeAll } = useRealtime()
 *
 * // Subscribe to all changes on inventory table
 * subscribe({ table: 'thread_inventory', event: '*' }, (payload) => {
 *   console.log('Change:', payload.eventType, payload.new)
 * })
 *
 * // Subscribe with filter
 * subscribe({ table: 'allocations', event: 'UPDATE', filter: 'status=eq.PENDING' }, (payload) => {
 *   console.log('Allocation updated:', payload.new)
 * })
 * ```
 */
export function useRealtime() {
  // State
  const status = ref<RealtimeStatus>('disconnected')
  const channelNames = ref<Set<string>>(new Set())
  const channelMap = new Map<string, ChannelRef>()
  const lastError = ref<string | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5

  /**
   * Subscribe to real-time changes on a table
   * @param options - Subscription options (table, schema, event, filter)
   * @param callback - Function called when changes occur
   * @returns Channel name for unsubscribing
   */
  const subscribe = <T extends Record<string, unknown> = Record<string, unknown>>(
    options: UseRealtimeOptions,
    callback: RealtimeCallback<T>
  ): string => {
    const channelName = generateChannelName(options)
    const { table, schema = 'public', event = '*', filter } = options

    status.value = 'connecting'
    lastError.value = null

    try {
      // Build the subscription configuration
      const subscriptionConfig: {
        event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
        schema: string
        table: string
        filter?: string
      } = {
        event,
        schema,
        table,
      }

      // Add filter if provided
      if (filter) {
        subscriptionConfig.filter = filter
      }

      // Create channel and subscribe
      const channel = supabase.channel(channelName)

      // Use type assertion for the on() call due to Supabase's complex generics
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(channel as any).on(
        'postgres_changes',
        subscriptionConfig,
        (payload: {
          eventType: string
          new: Record<string, unknown>
          old: Record<string, unknown>
          table: string
          schema: string
          commit_timestamp: string
        }) => {
          const realtimePayload: RealtimePayload<T> = {
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: (payload.new ?? null) as T | null,
            old: (payload.old ?? null) as T | null,
            table: payload.table,
            schema: payload.schema,
            commitTimestamp: payload.commit_timestamp,
          }
          callback(realtimePayload)
        }
      )

      channel.subscribe((subscriptionStatus: string) => {
        switch (subscriptionStatus) {
          case 'SUBSCRIBED':
            status.value = 'connected'
            reconnectAttempts.value = 0
            console.log(`[useRealtime] ${MESSAGES.CONNECTED}: ${channelName}`)
            break
          case 'CHANNEL_ERROR':
            status.value = 'error'
            lastError.value = MESSAGES.ERROR
            console.error(`[useRealtime] ${MESSAGES.ERROR}: ${channelName}`)
            handleReconnect(options, callback)
            break
          case 'TIMED_OUT':
            status.value = 'error'
            lastError.value = MESSAGES.SUBSCRIBE_ERROR
            console.error(`[useRealtime] ${MESSAGES.SUBSCRIBE_ERROR}: ${channelName}`)
            handleReconnect(options, callback)
            break
          case 'CLOSED':
            status.value = 'disconnected'
            console.log(`[useRealtime] ${MESSAGES.DISCONNECTED}: ${channelName}`)
            break
        }
      })

      channelMap.set(channelName, channel)
      channelNames.value.add(channelName)
      return channelName
    } catch (err) {
      status.value = 'error'
      lastError.value = err instanceof Error ? err.message : MESSAGES.SUBSCRIBE_ERROR
      console.error('[useRealtime] Subscribe error:', err)
      return channelName
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  const handleReconnect = <T extends Record<string, unknown> = Record<string, unknown>>(
    options: UseRealtimeOptions,
    callback: RealtimeCallback<T>
  ): void => {
    if (reconnectAttempts.value >= maxReconnectAttempts) {
      console.error('[useRealtime] Max reconnect attempts reached')
      return
    }

    reconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000)

    console.log(`[useRealtime] ${MESSAGES.RECONNECTING} (attempt ${reconnectAttempts.value}/${maxReconnectAttempts})`)

    setTimeout(() => {
      // Unsubscribe from failed channel first
      const channelName = generateChannelName(options)
      unsubscribe(channelName)

      // Re-subscribe
      subscribe(options, callback)
    }, delay)
  }

  /**
   * Unsubscribe from a specific channel
   * @param channelName - Name of the channel to unsubscribe from
   */
  const unsubscribe = (channelName: string): void => {
    const channel = channelMap.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      channelMap.delete(channelName)
      channelNames.value.delete(channelName)
      console.log(`[useRealtime] Unsubscribed: ${channelName}`)
    }

    // Update status if no channels remain
    if (channelMap.size === 0) {
      status.value = 'disconnected'
    }
  }

  /**
   * Unsubscribe from all active channels
   */
  const unsubscribeAll = (): void => {
    channelMap.forEach((channel, name) => {
      supabase.removeChannel(channel)
      console.log(`[useRealtime] Unsubscribed: ${name}`)
    })
    channelMap.clear()
    channelNames.value.clear()
    status.value = 'disconnected'
  }

  /**
   * Check if connected to any channel
   */
  const isConnected = (): boolean => {
    return status.value === 'connected' && channelMap.size > 0
  }

  /**
   * Get count of active subscriptions
   */
  const getSubscriptionCount = (): number => {
    return channelMap.size
  }

  // Auto cleanup on component unmount
  onUnmounted(() => {
    unsubscribeAll()
  })

  return {
    // State (readonly for external use)
    status: readonly(status),
    lastError: readonly(lastError),
    reconnectAttempts: readonly(reconnectAttempts),
    activeChannels: readonly(channelNames),

    // Methods
    subscribe,
    unsubscribe,
    unsubscribeAll,
    isConnected,
    getSubscriptionCount,
  }
}
