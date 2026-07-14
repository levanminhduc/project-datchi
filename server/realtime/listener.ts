import { Client } from 'pg'

export interface RealtimeEvent {
  table: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  id: number | string
  warehouse_id?: number | null
  thread_type_id?: number | null
  status?: string | null
}

type Subscriber = (event: RealtimeEvent) => void

const CHANNEL = 'datchi_realtime'
const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 30000

const subscribers = new Set<Subscriber>()
let client: Client | null = null
let reconnectAttempts = 0
let started = false
let stopping = false

export function subscribe(fn: Subscriber): () => void {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

export function subscriberCount(): number {
  return subscribers.size
}

function fanout(payload: string): void {
  let event: RealtimeEvent
  try {
    event = JSON.parse(payload) as RealtimeEvent
  } catch (err) {
    console.error('[realtime] failed to parse NOTIFY payload:', payload, err)
    return
  }
  for (const fn of subscribers) {
    try {
      fn(event)
    } catch (err) {
      console.error('[realtime] subscriber threw:', err)
    }
  }
}

async function connect(): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set; realtime listener cannot start.')
  }

  client = new Client({
    connectionString,
    keepAlive: true,
    keepAliveInitialDelayMillis: Number(
      process.env.DATABASE_KEEPALIVE_DELAY_MS ?? 30000
    ),
  })

  client.on('notification', (msg) => {
    if (msg.channel === CHANNEL && msg.payload) {
      fanout(msg.payload)
    }
  })

  client.on('error', (err) => {
    console.error('[realtime] listener client error:', err)
    scheduleReconnect()
  })

  client.on('end', () => {
    scheduleReconnect()
  })

  await client.connect()
  await client.query(`LISTEN ${CHANNEL}`)
  reconnectAttempts = 0
  console.log(`[realtime] LISTEN ${CHANNEL} established`)
}

function scheduleReconnect(): void {
  if (stopping) return

  if (client) {
    const dead = client
    client = null
    dead.removeAllListeners()
    dead.end().catch(() => {})
  }

  reconnectAttempts++
  const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempts, RECONNECT_MAX_MS)
  console.warn(`[realtime] reconnecting in ${delay}ms (attempt ${reconnectAttempts})`)
  setTimeout(() => {
    connect().catch((err) => {
      console.error('[realtime] reconnect failed:', err)
      scheduleReconnect()
    })
  }, delay)
}

export async function startRealtimeListener(): Promise<void> {
  if (started) return
  started = true
  try {
    await connect()
  } catch (err) {
    console.error('[realtime] initial connect failed:', err)
    scheduleReconnect()
  }
}

export async function stopRealtimeListener(): Promise<void> {
  stopping = true
  if (client) {
    const dead = client
    client = null
    dead.removeAllListeners()
    await dead.end().catch(() => {})
  }
}
