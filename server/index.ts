import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { existsSync, readFileSync } from 'fs'
import dotenv from 'dotenv'

if (existsSync('.env')) {
  dotenv.config({ override: true })
}

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
import threadTypeSuppliersRouter from './routes/thread-type-supplier'
import purchaseOrdersRouter from './routes/purchaseOrders'
import stylesRouter from './routes/styles'
import styleThreadSpecsRouter from './routes/styleThreadSpecs'
import threadCalculationRouter from './routes/threadCalculation'
import weeklyOrderRouter from './routes/weekly-order'
import reconciliationRouter from './routes/reconciliation'
import settingsRouter from './routes/settings'
import stockRouter from './routes/stock'
import issuesV2Router from './routes/issuesV2'
import issueHistoryRouter from './routes/issue-history'
import notificationsRouter from './routes/notifications'
import notificationChannelsRouter from './routes/notification-channels'
import telegramRouter from './routes/telegram'
import importRouter from './routes/import'
import subArtsRouter from './routes/subArts'
import styleColorsRouter from './routes/styleColors'
import deptAllocationsRouter from './routes/deptAllocations'
import guidesRouter, { guideImages, publicGuideImages } from './routes/guides'
import adminGuidesRouter from './routes/admin-guides'
import publicGuidesRouter from './routes/public-guides'
import announcementsRouter from './routes/announcements'
import overQuotaRouter from './routes/over-quota'
import threadConeSummaryRouter from './routes/thread/cone-summary'
import chatAssistantRouter from './routes/chat-assistant'
import realtimeRouter from './realtime/stream'
import { startRealtimeListener } from './realtime/listener'
import { authMiddleware } from './middleware/auth'
import { assertSigningKeyConfigured } from './auth/jwt'

const app = new Hono()

const PORT = parseInt(process.env.PORT || '3000', 10)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use('*', secureHeaders())

app.use(
  '/api/*',
  cors({
    origin: [FRONTEND_URL, 'http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5174', 'http://localhost:5174', 'https://datchi.ithoathodb.xyz'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

app.route('/api/guides/images', guideImages)
app.route('/storage/v1/object/public/guide-images', publicGuideImages)
app.route('/api/public/guides', publicGuidesRouter)
app.route('/api/telegram', telegramRouter)
app.route('/api/realtime', realtimeRouter)

const PUBLIC_AUTH_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
])

app.use(
  '/api/*',
  async (c, next) => {
    if (
      c.req.path.startsWith('/api/guides/images/') ||
      c.req.path.startsWith('/api/public/') ||
      c.req.path.startsWith('/api/realtime/') ||
      PUBLIC_AUTH_PATHS.has(c.req.path)
    ) {
      return next()
    }
    return authMiddleware(c, next)
  }
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
app.route('/api/thread-type-suppliers', threadTypeSuppliersRouter)
app.route('/api/purchase-orders', purchaseOrdersRouter)
app.route('/api/styles', stylesRouter)
app.route('/api/style-thread-specs', styleThreadSpecsRouter)
app.route('/api/thread-calculation', threadCalculationRouter)
app.route('/api/weekly-orders', weeklyOrderRouter)
app.route('/api/issues/reconciliation', reconciliationRouter)
app.route('/api/issues/v2', issuesV2Router)
app.route('/api/issue-history', issueHistoryRouter)
app.route('/api/settings', settingsRouter)
app.route('/api/stock', stockRouter)
app.route('/api/notifications', notificationsRouter)
app.route('/api/notification-channels', notificationChannelsRouter)
app.route('/api/import', importRouter)
app.route('/api/sub-arts', subArtsRouter)
app.route('/api/style-colors', styleColorsRouter)
app.route('/api/dept-allocations', deptAllocationsRouter)
app.route('/api/admin/guides', adminGuidesRouter)
app.route('/api/guides', guidesRouter)
app.route('/api/announcements', announcementsRouter)
app.route('/api/over-quota', overQuotaRouter)
app.route('/api/thread/cone-summary', threadConeSummaryRouter)
app.route('/api/chat-assistant', chatAssistantRouter)

const HAS_DIST = existsSync('dist/index.html')
if (HAS_DIST) {
  app.use('*', serveStatic({ root: './dist' }))
}

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

if (HAS_DIST) {
  app.all('*', (c) => {
    if (c.req.path.startsWith('/api')) {
      return c.json({ data: null, error: 'Không tìm thấy endpoint' }, 404)
    }
    const html = readFileSync('dist/index.html', 'utf-8')
    return c.html(html)
  })
}

app.notFound((c) => {
  return c.json({ data: null, error: 'Không tìm thấy endpoint' }, 404)
})

console.log(`Starting server on port ${PORT}...`)
console.log(`CORS enabled for: ${FRONTEND_URL}`)
if (HAS_DIST) console.log('Serving static files from dist/')

assertSigningKeyConfigured()

serve({
  fetch: app.fetch,
  port: PORT,
})

startRealtimeListener().catch((err) => {
  console.error('Failed to start realtime listener:', err)
})

console.log(`Server is running at http://localhost:${PORT}`)
