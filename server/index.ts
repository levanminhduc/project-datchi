import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import dotenv from 'dotenv'

dotenv.config()

import authRouter from './routes/auth'
import employeesRouter from './routes/employees'
import positionsRouter from './routes/positions'
import inventoryRouter from './routes/inventory'
import threadsRouter from './routes/threads'
import allocationsRouter from './routes/allocations'
import recoveryRouter from './routes/recovery'
import dashboardRouter from './routes/dashboard'
import warehousesRouter from './routes/warehouses'
import reportsRouter from './routes/reports'
import lotsRouter from './routes/lots'
import batchRouter from './routes/batch'
import colorsRouter from './routes/colors'
import suppliersRouter from './routes/suppliers'

const app = new Hono()

const PORT = parseInt(process.env.PORT || '3000', 10)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(
  '/api/*',
  cors({
    origin: [FRONTEND_URL, 'http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5174', 'http://localhost:5174'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

app.route('/api/auth', authRouter)
app.route('/api/employees', employeesRouter)
app.route('/api/positions', positionsRouter)
app.route('/api/inventory', inventoryRouter)
app.route('/api/threads', threadsRouter)
app.route('/api/allocations', allocationsRouter)
app.route('/api/recovery', recoveryRouter)
app.route('/api/dashboard', dashboardRouter)
app.route('/api/warehouses', warehousesRouter)
app.route('/api/reports', reportsRouter)
app.route('/api/lots', lotsRouter)
app.route('/api/batch', batchRouter)
app.route('/api/colors', colorsRouter)
app.route('/api/suppliers', suppliersRouter)

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
console.log(`Auth API: http://localhost:${PORT}/api/auth`)
console.log(`Employees API: http://localhost:${PORT}/api/employees`)
console.log(`Positions API: http://localhost:${PORT}/api/positions`)
console.log(`Inventory API: http://localhost:${PORT}/api/inventory`)
console.log(`Threads API: http://localhost:${PORT}/api/threads`)
console.log(`Allocations API: http://localhost:${PORT}/api/allocations`)
console.log(`Recovery API: http://localhost:${PORT}/api/recovery`)
console.log(`Dashboard API: http://localhost:${PORT}/api/dashboard`)
console.log(`Warehouses API: http://localhost:${PORT}/api/warehouses`)
console.log(`Reports API: http://localhost:${PORT}/api/reports`)
console.log(`Lots API: http://localhost:${PORT}/api/lots`)
console.log(`Batch API: http://localhost:${PORT}/api/batch`)
console.log(`Colors API: http://localhost:${PORT}/api/colors`)
console.log(`Suppliers API: http://localhost:${PORT}/api/suppliers`)
