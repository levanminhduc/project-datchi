import { ref, onUnmounted, readonly } from 'vue'
import { getAccessToken } from '@/lib/auth-token-store'

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export interface UseRealtimeOptions {
  table: string
  schema?: string
  event?: RealtimeEvent
  filter?: string
}

export interface RealtimePayload<T = Record<string, unknown>> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  table: string
  schema: string
  commitTimestamp: string
}

export type RealtimeCallback<T = Record<string, unknown>> = (payload: RealtimePayload<T>) => void

interface ServerEvent {
  table: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  id: number | string
  warehouse_id?: number | null
  thread_type_id?: number | null
  status?: string | null
}

interface Registration {
  options: UseRealtimeOptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: RealtimeCallback<any>
}

const MESSAGES = {
  CONNECTED: 'Đã kết nối real-time',
  DISCONNECTED: 'Mất kết nối real-time',
  RECONNECTING: 'Đang kết nối lại...',
  ERROR: 'Lỗi kết nối real-time',
  SUBSCRIBE_ERROR: 'Không thể đăng ký nhận cập nhật',
}

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const registrations = new Map<string, Registration>()
let source: EventSource | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectCount = 0
const MAX_RECONNECT = 5

const sharedStatus = ref<RealtimeStatus>('disconnected')
const sharedError = ref<string | null>(null)

function generateChannelName(options: UseRealtimeOptions): string {
  const { table, schema = 'public', event = '*', filter } = options
  const filterPart = filter ? `-${filter.replace(/[=.]/g, '_')}` : ''
  return `${schema}:${table}:${event}${filterPart}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function matchesFilter(filter: string | undefined, rec: Record<string, unknown>): boolean {
  if (!filter) return true
  const m = filter.match(/^([\w]+)=eq\.(.+)$/)
  if (!m) return true
  const col = m[1]
  const val = m[2]
  if (!col) return true
  return String(rec[col] ?? '') === val
}

function dispatch(event: ServerEvent): void {
  const partial: Record<string, unknown> = {
    id: event.id,
    warehouse_id: event.warehouse_id,
    thread_type_id: event.thread_type_id,
    status: event.status,
  }

  for (const reg of registrations.values()) {
    const { table, event: evt = '*', filter } = reg.options
    if (reg.options.schema && reg.options.schema !== 'public') continue
    if (table !== event.table) continue
    if (evt !== '*' && evt !== event.eventType) continue
    if (!matchesFilter(filter, partial)) continue

    reg.callback({
      eventType: event.eventType,
      new: event.eventType === 'DELETE' ? null : partial,
      old: event.eventType === 'INSERT' ? null : partial,
      table: event.table,
      schema: 'public',
      commitTimestamp: new Date().toISOString(),
    })
  }
}

function openConnection(): void {
  if (source || registrations.size === 0) return

  const token = getAccessToken()
  if (!token) {
    sharedStatus.value = 'error'
    sharedError.value = MESSAGES.SUBSCRIBE_ERROR
    return
  }

  sharedStatus.value = 'connecting'
  sharedError.value = null

  const url = `${API_BASE_URL}/api/realtime/stream?token=${encodeURIComponent(token)}`
  source = new EventSource(url)

  source.addEventListener('connected', () => {
    sharedStatus.value = 'connected'
    reconnectCount = 0
    console.log(`[useRealtime] ${MESSAGES.CONNECTED}`)
  })

  source.addEventListener('change', (e) => {
    try {
      const data = JSON.parse((e as MessageEvent).data) as ServerEvent
      dispatch(data)
    } catch (err) {
      console.error('[useRealtime] failed to parse event:', err)
    }
  })

  source.onerror = () => {
    sharedStatus.value = 'error'
    sharedError.value = MESSAGES.ERROR
    closeConnection()
    scheduleReconnect()
  }
}

function closeConnection(): void {
  if (source) {
    source.close()
    source = null
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer || registrations.size === 0) return
  if (reconnectCount >= MAX_RECONNECT) {
    console.error('[useRealtime] Max reconnect attempts reached')
    return
  }
  reconnectCount++
  const delay = Math.min(1000 * 2 ** reconnectCount, 30000)
  console.log(`[useRealtime] ${MESSAGES.RECONNECTING} (attempt ${reconnectCount}/${MAX_RECONNECT})`)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    openConnection()
  }, delay)
}

export function useRealtime() {
  const status = sharedStatus
  const lastError = sharedError
  const reconnectAttempts = ref(0)
  const localChannels = ref<Set<string>>(new Set())

  const subscribe = <T extends Record<string, unknown> = Record<string, unknown>>(
    options: UseRealtimeOptions,
    callback: RealtimeCallback<T>
  ): string => {
    const channelName = generateChannelName(options)
    registrations.set(channelName, { options, callback: callback as RealtimeCallback })
    localChannels.value.add(channelName)
    openConnection()
    return channelName
  }

  const unsubscribe = (channelName: string): void => {
    if (registrations.delete(channelName)) {
      localChannels.value.delete(channelName)
      console.log(`[useRealtime] Unsubscribed: ${channelName}`)
    }
    if (registrations.size === 0) {
      closeConnection()
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      sharedStatus.value = 'disconnected'
    }
  }

  const unsubscribeAll = (): void => {
    for (const name of localChannels.value) {
      registrations.delete(name)
    }
    localChannels.value.clear()
    if (registrations.size === 0) {
      closeConnection()
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      sharedStatus.value = 'disconnected'
    }
  }

  const isConnected = (): boolean => {
    return sharedStatus.value === 'connected' && registrations.size > 0
  }

  const getSubscriptionCount = (): number => {
    return localChannels.value.size
  }

  onUnmounted(() => {
    unsubscribeAll()
  })

  return {
    status: readonly(status),
    lastError: readonly(lastError),
    reconnectAttempts: readonly(reconnectAttempts),
    activeChannels: readonly(localChannels),
    subscribe,
    unsubscribe,
    unsubscribeAll,
    isConnected,
    getSubscriptionCount,
  }
}
