import assert from 'node:assert/strict'
import { Hono } from 'hono'
import chatAssistantRoutes from './chat-assistant'
import { pool } from '../db/pool'
import type { AppEnv } from '../types/hono-env'

interface SeenCall {
  url: string
  init: RequestInit | undefined
}

const SERVICE_KEYS = ['CHATBOT_SERVICE_URL', 'CHATBOT_INTERNAL_TOKEN', 'CHATBOT_REQUEST_TIMEOUT_MS'] as const
type ServiceEnv = Partial<Record<(typeof SERVICE_KEYS)[number], string>>
const SERVICE_ENV: ServiceEnv = { CHATBOT_SERVICE_URL: 'http://ai.test/', CHATBOT_INTERNAL_TOKEN: 'noi-bo' }

function buildApp(permissions: string[]) {
  const app = new Hono<AppEnv>()
  app.use('*', async (c, next) => {
    c.set('auth', { employeeId: 5, employeeCode: 'NV005', roles: ['warehouse_staff'], isRoot: false, isAdmin: false, permissions })
    await next()
  })
  app.route('/', chatAssistantRoutes)
  return app
}

function ask(app: Hono<AppEnv>, message = 'C9700 còn bao nhiêu cuộn?') {
  return app.request('/query', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer abc', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
}

function jsonFetch(status: number, payload: unknown, seen: SeenCall[] = []): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    seen.push({ url: String(input), init })
    return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })
  }) as unknown as typeof fetch
}

async function withService(env: ServiceEnv, fetchImpl: typeof fetch, handler: () => Promise<void>) {
  const savedEnv = SERVICE_KEYS.map((key) => [key, process.env[key]] as const)
  const originalFetch = globalThis.fetch
  const originalQuery = pool.query
  const originalConnect = pool.connect
  for (const key of SERVICE_KEYS) {
    const value = env[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  globalThis.fetch = fetchImpl
  pool.query = (async () => {
    throw new Error('test route chat-assistant không được chạm DB')
  }) as unknown as typeof pool.query
  pool.connect = (async () => {
    throw new Error('test route chat-assistant không được mở transaction')
  }) as unknown as typeof pool.connect
  try {
    await handler()
  } finally {
    globalThis.fetch = originalFetch
    pool.query = originalQuery
    pool.connect = originalConnect
    for (const [key, value] of savedEnv) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

async function testRequiresChatPermission() {
  await withService(SERVICE_ENV, jsonFetch(200, {}), async () => {
    const res = await ask(buildApp(['thread.inventory.view', 'thread.styles.view']))
    assert.equal(res.status, 403)
  })
}

async function testForwardsQuestionToService() {
  const seen: SeenCall[] = []
  const payload = { data: { answer: 'Còn 120 cuộn nguyên.', tools_used: ['search_inventory'] }, error: null }
  await withService(SERVICE_ENV, jsonFetch(200, payload, seen), async () => {
    const res = await ask(buildApp(['chat.assistant.use']))
    assert.equal(res.status, 200)
    const body = await res.json() as { data: { answer: string; stock: unknown[]; context: { tools_used: string[] } } }
    assert.equal(body.data.answer, 'Còn 120 cuộn nguyên.')
    assert.deepEqual(body.data.stock, [])
    assert.deepEqual(body.data.context.tools_used, ['search_inventory'])

    const [call] = seen
    assert.ok(call)
    assert.equal(call.url, 'http://ai.test/v1/chat')
    assert.deepEqual(JSON.parse(String(call.init?.body)), { app: 'datchi', question: 'C9700 còn bao nhiêu cuộn?' })
    const headers = call.init?.headers as Record<string, string>
    assert.equal(headers['Authorization'], 'Bearer abc')
    assert.equal(headers['X-Internal-Token'], 'noi-bo')
    assert.ok(headers['X-Request-Id'] && headers['X-Request-Id'].length >= 8)
  })
}

async function testServiceUnauthorizedPassesThrough() {
  const payload = { data: null, error: { code: 'unauthorized', message: 'Phiên đăng nhập đã hết hạn' } }
  await withService(SERVICE_ENV, jsonFetch(401, payload), async () => {
    const res = await ask(buildApp(['chat.assistant.use']))
    assert.equal(res.status, 401)
    assert.deepEqual(await res.json(), { data: null, error: 'Phiên đăng nhập đã hết hạn' })
  })
}

async function testServiceDownReturns502() {
  const failing = (async () => {
    throw new TypeError('fetch failed')
  }) as unknown as typeof fetch
  await withService(SERVICE_ENV, failing, async () => {
    const res = await ask(buildApp(['chat.assistant.use']))
    assert.equal(res.status, 502)
    assert.deepEqual(await res.json(), { data: null, error: 'Không thể kết nối trợ lý AI' })
  })
}

async function testServiceTimeoutReturns408() {
  const hanging = ((_input: string | URL | Request, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))
    })) as unknown as typeof fetch
  await withService({ ...SERVICE_ENV, CHATBOT_REQUEST_TIMEOUT_MS: '50' }, hanging, async () => {
    const started = Date.now()
    const res = await ask(buildApp(['chat.assistant.use']))
    assert.equal(res.status, 408)
    assert.ok(Date.now() - started < 1000)
  })
}

async function testRejectsOverlongQuestion() {
  const seen: SeenCall[] = []
  await withService(SERVICE_ENV, jsonFetch(200, {}, seen), async () => {
    const res = await ask(buildApp(['chat.assistant.use']), 'a'.repeat(2001))
    assert.equal(res.status, 400)
    assert.deepEqual(await res.json(), { data: null, error: 'Câu hỏi tối đa 2000 ký tự' })
    assert.equal(seen.length, 0)
  })
}

async function testServiceDetailIsNotForwarded() {
  await withService(SERVICE_ENV, jsonFetch(404, { detail: 'Not Found' }), async () => {
    const res = await ask(buildApp(['chat.assistant.use']))
    assert.equal(res.status, 502)
    assert.deepEqual(await res.json(), { data: null, error: 'Trợ lý AI trả về lỗi' })
  })
}

async function testFallbackNeedsLookupPermissions() {
  await withService({}, jsonFetch(200, {}), async () => {
    const res = await ask(buildApp(['chat.assistant.use']))
    assert.equal(res.status, 403)
    assert.deepEqual(await res.json(), { data: null, error: 'Trợ lý AI chưa được bật' })
  })
}

async function main() {
  await testRequiresChatPermission()
  await testForwardsQuestionToService()
  await testServiceUnauthorizedPassesThrough()
  await testServiceDownReturns502()
  await testServiceTimeoutReturns408()
  await testRejectsOverlongQuestion()
  await testServiceDetailIsNotForwarded()
  await testFallbackNeedsLookupPermissions()
  console.log('chat-assistant route tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
