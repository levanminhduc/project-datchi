import { Hono } from 'hono'
import { pool } from '../db/pool'
import deptAllocationsRouter from '../routes/deptAllocations'
import employeesRouter from '../routes/employees'
import inventoryRouter from '../routes/inventory'
import issuesV2Router from '../routes/issuesV2'
import purchaseOrdersRouter from '../routes/purchaseOrders'
import stylesRouter from '../routes/styles'
import weeklyOrderRouter from '../routes/weekly-order'
import type { AppEnv } from '../types/hono-env'
import { createAiToolsRouter } from './router'
import type { AiAuth, AiTool } from './types'

export const TEST_INTERNAL_TOKEN = 'test-internal-token'
process.env.CHATBOT_INTERNAL_TOKEN = TEST_INTERNAL_TOKEN

function profile(employeeId: number, employeeCode: string, permissions: string[], isRoot = false): AiAuth {
  return { employeeId, employeeCode, roles: isRoot ? ['root'] : ['staff'], isRoot, isAdmin: isRoot, permissions }
}

export const TEST_USERS: Record<string, AiAuth> = {
  root: profile(1, 'ROOT001', ['*'], true),
  kho: profile(2, 'KHO001', ['chat.assistant.use', 'thread.inventory.view', 'thread.allocations.view']),
  xuatkho: profile(6, 'XK001', ['chat.assistant.use', 'thread.allocations.view', 'thread.issues.return']),
  phanbo: profile(7, 'PB001', ['chat.assistant.use', 'thread.issues.return', 'thread.dept-allocation.manage']),
  kehoach: profile(3, 'KH001', ['chat.assistant.use', 'thread.styles.view', 'thread.purchase-orders.view']),
  kythuat: profile(4, 'KT001', ['chat.assistant.use', 'thread.styles.view']),
  xem: profile(5, 'XEM001', ['chat.assistant.use']),
}

export function useTestAuth(app: Hono<AppEnv>) {
  app.use('/api/*', async (c, next) => {
    const key = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const auth = TEST_USERS[key]
    if (!auth) return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
    c.set('auth', auth)
    await next()
  })
}

export function buildAiTestApp(options: { tools?: AiTool[]; timeoutMs?: number } = {}) {
  const app = new Hono<AppEnv>()
  useTestAuth(app)
  app.route('/api/inventory', inventoryRouter)
  app.route('/api/styles', stylesRouter)
  app.route('/api/purchase-orders', purchaseOrdersRouter)
  app.route('/api/weekly-orders', weeklyOrderRouter)
  app.route('/api/issues/v2', issuesV2Router)
  app.route('/api/employees', employeesRouter)
  app.route('/api/dept-allocations', deptAllocationsRouter)
  app.route('/api/ai', createAiToolsRouter((request) => app.fetch(request), options))
  return app
}

export interface ToolResponseBody {
  data: { result: unknown; total: number; truncated: boolean } | null
  error: { code: string; message: string } | null
}

export interface ToolListBody {
  data: {
    contract_version: number
    instructions: string
    tools: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>
  } | null
  error: unknown
}

function headersFor(user: string, internalToken: string) {
  return {
    'Authorization': `Bearer ${user}`,
    'X-Internal-Token': internalToken,
    'Content-Type': 'application/json',
  }
}

export async function callTool(app: Hono<AppEnv>, name: string, input: unknown, user = 'root', internalToken = TEST_INTERNAL_TOKEN) {
  const res = await app.request(`/api/ai/tools/${name}`, {
    method: 'POST',
    headers: headersFor(user, internalToken),
    body: JSON.stringify({ input }),
  })
  return { status: res.status, body: (await res.json()) as ToolResponseBody }
}

export async function listTools(app: Hono<AppEnv>, user = 'root', internalToken = TEST_INTERNAL_TOKEN) {
  const res = await app.request('/api/ai/tools', { headers: headersFor(user, internalToken) })
  return { status: res.status, body: (await res.json()) as ToolListBody }
}

export interface RecordedQuery {
  text: string
  params: unknown[]
}

export type QueryResponder = (text: string, params: unknown[]) => Record<string, unknown>[]

export async function withStubbedPool(responder: QueryResponder, handler: (calls: RecordedQuery[]) => Promise<void>) {
  const calls: RecordedQuery[] = []
  const originalQuery = pool.query
  const originalConnect = pool.connect

  pool.query = (async (text: string, params?: unknown[]) => {
    calls.push({ text, params: params ?? [] })
    const rows = responder(text, params ?? [])
    return { rows, rowCount: rows.length }
  }) as unknown as typeof pool.query

  pool.connect = (async () => {
    throw new Error('ai-tools chỉ đọc, không được mở transaction')
  }) as unknown as typeof pool.connect

  try {
    await handler(calls)
  } finally {
    pool.query = originalQuery
    pool.connect = originalConnect
  }
}
