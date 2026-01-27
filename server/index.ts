/**
 * Hono Backend Server
 *
 * Main entry point for the Employee Management API
 * Provides REST endpoints with CORS support
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Import routes
import employeesRouter from './routes/employees'

// Create Hono app instance
const app = new Hono()

// Get configuration from environment
const PORT = parseInt(process.env.PORT || '3000', 10)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

/**
 * CORS Configuration
 * Allows requests from the Vue.js frontend
 */
app.use(
  '/api/*',
  cors({
    origin: [FRONTEND_URL, 'http://127.0.0.1:5173', 'http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

/**
 * Health Check Endpoint
 * GET /health
 */
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'employee-management-api',
  })
})

/**
 * Mount Employee Routes
 * All employee endpoints are prefixed with /api/employees
 */
app.route('/api/employees', employeesRouter)

/**
 * Global Error Handler
 */
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

/**
 * 404 Handler for unmatched routes
 */
app.notFound((c) => {
  return c.json(
    {
      data: null,
      error: 'Không tìm thấy endpoint',
    },
    404
  )
})

// Start the server
console.log(`Starting server on port ${PORT}...`)
console.log(`CORS enabled for: ${FRONTEND_URL}`)

serve({
  fetch: app.fetch,
  port: PORT,
})

console.log(`Server is running at http://localhost:${PORT}`)
console.log(`Health check: http://localhost:${PORT}/health`)
console.log(`Employees API: http://localhost:${PORT}/api/employees`)
