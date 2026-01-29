import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import dotenv from 'dotenv'

dotenv.config()

import employeesRouter from './routes/employees'
import positionsRouter from './routes/positions'

const app = new Hono()

const PORT = parseInt(process.env.PORT || '3000', 10)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(
  '/api/*',
  cors({
    origin: [FRONTEND_URL, 'http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5174', 'http://localhost:5174'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'employee-management-api',
  })
})

app.route('/api/employees', employeesRouter)
app.route('/api/positions', positionsRouter)

// TODO: thread-management-35 Register thread management routes (threads, inventory, allocations, recovery, dashboard)

app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json(
    {
      data: null,
      error: 'Lỗi hệ thống',
    },
    500
  )
})

app.notFound((c) => {
  return c.json(
    {
      data: null,
      error: 'Không tìm thấy endpoint',
    },
    404
  )
})

console.log(`Starting server on port ${PORT}...`)
console.log(`CORS enabled for: ${FRONTEND_URL}`)

serve({
  fetch: app.fetch,
  port: PORT,
})

console.log(`Server is running at http://localhost:${PORT}`)
console.log(`Health check: http://localhost:${PORT}/health`)
console.log(`Employees API: http://localhost:${PORT}/api/employees`)
console.log(`Positions API: http://localhost:${PORT}/api/positions`)
