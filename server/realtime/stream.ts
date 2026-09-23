import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { verifyAccessToken } from '../auth/jwt'
import { subscribe, type RealtimeEvent } from './listener'

const realtime = new Hono()

realtime.get('/stream', async (c) => {
  const token = c.req.query('token') || ''

  if (!token) {
    return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
  }

  try {
    const payload = await verifyAccessToken(token)
    if (!payload.employee_id) {
      return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
    }
  } catch {
    return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
  }

  return streamSSE(c, async (stream) => {
    let closed = false

    const unsubscribe = subscribe((event: RealtimeEvent) => {
      if (closed) return
      stream
        .writeSSE({ event: 'change', data: JSON.stringify(event) })
        .catch(() => {})
    })

    const heartbeat = setInterval(() => {
      if (closed) return
      stream.writeSSE({ event: 'ping', data: '1' }).catch(() => {})
    }, 25000)

    stream.onAbort(() => {
      closed = true
      clearInterval(heartbeat)
      unsubscribe()
    })

    await stream.writeSSE({ event: 'connected', data: '1' })

    while (!closed) {
      await stream.sleep(60000)
    }
  })
})

export default realtime
