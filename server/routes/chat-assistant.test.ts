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

function ask(app: Hono<AppEnv>, message = 'C9700 còn bao nhiêu cuộn?', history?: unknown, path = '/query') {
  return app.request(path, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer abc', 'Content-Type': 'application/json' },
    body: JSON.stringify(history === undefined ? { message } : { message, history }),
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
    assert.deepEqual(JSON.parse(String(call.init?.body)), { app: 'datchi', question: 'C9700 còn bao nhiêu cuộn?', history: [] })
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

const OK_PAYLOAD = { data: { answer: 'Có C9701.', tools_used: [] }, error: null }

async function testForwardsTrimmedHistory() {
  const seen: SeenCall[] = []
  const history = [
    { role: 'user', content: '  C9700\n\n còn   bao nhiêu cuộn?  ' },
    { role: 'assistant', content: 'x'.repeat(2500) },
  ]
  await withService(SERVICE_ENV, jsonFetch(200, OK_PAYLOAD, seen), async () => {
    const res = await ask(buildApp(['chat.assistant.use']), 'Còn màu khác không?', history)
    assert.equal(res.status, 200)
    const [call] = seen
    assert.ok(call)
    assert.deepEqual(JSON.parse(String(call.init?.body)), {
      app: 'datchi',
      question: 'Còn màu khác không?',
      history: [
        { role: 'user', content: 'C9700 còn bao nhiêu cuộn?' },
        { role: 'assistant', content: 'x'.repeat(2000) },
      ],
    })
  })
}

async function testCutsHistoryByCodePoint() {
  const seen: SeenCall[] = []
  const history = [
    { role: 'user', content: 'q' },
    { role: 'assistant', content: 'a'.repeat(1999) + '📦' + 'b'.repeat(10) },
  ]
  await withService(SERVICE_ENV, jsonFetch(200, OK_PAYLOAD, seen), async () => {
    const res = await ask(buildApp(['chat.assistant.use']), 'Còn màu khác không?', history)
    assert.equal(res.status, 200)
    const [call] = seen
    assert.ok(call)
    const body = JSON.parse(String(call.init?.body)) as { history: { role: string; content: string }[] }
    assert.deepEqual(body.history[1]?.content, 'a'.repeat(1999) + '📦')
  })
}

async function testRejectsInvalidHistory() {
  const user = { role: 'user', content: 'a' }
  const assistant = { role: 'assistant', content: 'b' }
  const cases: unknown[] = [
    'abc',
    {},
    null,
    Array.from({ length: 11 }, () => [user, assistant]).flat(),
    [user, assistant, user],
    [assistant, user],
    [user],
    [user, user],
    [{ role: 'system', content: 'a' }, assistant],
    [null, assistant],
    [{ role: 'user', content: 5 }, assistant],
  ]
  for (const history of cases) {
    const seen: SeenCall[] = []
    await withService(SERVICE_ENV, jsonFetch(200, OK_PAYLOAD, seen), async () => {
      const res = await ask(buildApp(['chat.assistant.use']), 'Còn màu khác không?', history)
      assert.equal(res.status, 400, JSON.stringify(history))
      assert.deepEqual(await res.json(), { data: null, error: 'Lịch sử hội thoại không hợp lệ' })
      assert.equal(seen.length, 0)
    })
  }
}

async function testFallbackIgnoresHistory() {
  await withService({}, jsonFetch(200, {}), async () => {
    const res = await ask(buildApp(['chat.assistant.use']), 'C9700 còn bao nhiêu cuộn?', 'abc')
    assert.equal(res.status, 403)
    assert.deepEqual(await res.json(), { data: null, error: 'Trợ lý AI chưa được bật' })
  })
}

async function forwardedBody(message: string, history: unknown, payload: unknown = OK_PAYLOAD) {
  const seen: SeenCall[] = []
  let status = 0
  let data: unknown = null
  await withService(SERVICE_ENV, jsonFetch(200, payload, seen), async () => {
    const res = await ask(buildApp(['chat.assistant.use']), message, history)
    status = res.status
    data = await res.json()
  })
  const body = seen[0] ? JSON.parse(String(seen[0].init?.body)) as { question: string; history: unknown[] } : null
  return { status, data, body }
}

async function testSanitizesControlCharacters() {
  const history = [
    { role: 'user', content: '\u001f' },
    { role: 'assistant', content: 'bị bỏ' },
    { role: 'user', content: '\ud800C9700\u0085' },
    { role: 'assistant', content: '\ufeffCòn 120 cuộn.\u001c' },
  ]
  const { status, body } = await forwardedBody('\u001cC9700\ufeff còn màu khác?', history)
  assert.equal(status, 200)
  assert.ok(body)
  assert.equal(body.question, 'C9700 còn màu khác?')
  assert.deepEqual(body.history, [
    { role: 'user', content: 'C9700' },
    { role: 'assistant', content: 'Còn 120 cuộn.' },
  ])
}

async function testQuestionOfControlCharactersIsRejected() {
  await withService(SERVICE_ENV, jsonFetch(200, OK_PAYLOAD), async () => {
    const res = await ask(buildApp(['chat.assistant.use']), '\u001c\u001d\ufeff')
    assert.equal(res.status, 400)
    assert.deepEqual(await res.json(), { data: null, error: 'Vui lòng nhập câu hỏi' })
  })
}

async function testBlankPairsAreDropped() {
  const history = [
    { role: 'user', content: '   ' },
    { role: 'assistant', content: 'a' },
    { role: 'user', content: 'q' },
    { role: 'assistant', content: '\u001e' },
  ]
  const { status, body } = await forwardedBody('Còn màu khác không?', history)
  assert.equal(status, 200)
  assert.deepEqual(body?.history, [])
}

async function testAcceptsTwentyItems() {
  const history = Array.from({ length: 10 }, () => [
    { role: 'user', content: 'q' },
    { role: 'assistant', content: 'a' },
  ]).flat()
  const { status, body } = await forwardedBody('Còn màu khác không?', history)
  assert.equal(status, 200)
  assert.equal(body?.history.length, 20)
}

async function testForwardsEmptyHistory() {
  const { status, body } = await forwardedBody('Còn màu khác không?', [])
  assert.equal(status, 200)
  assert.deepEqual(body?.history, [])
}

async function testForwardsSuggestions() {
  const readSuggestions = (result: { data: unknown }) => (result.data as { data: { suggestions: unknown } }).data.suggestions

  const mixed = { data: { answer: 'Có.', tools_used: [], suggestions: [' Tồn theo kho? ', '', 7, 'B?', 'C?', 'D?'] }, error: null }
  assert.deepEqual(readSuggestions(await forwardedBody('Hỏi gì đó?', undefined, mixed)), ['Tồn theo kho?', 'B?', 'C?'])

  const absent = { data: { answer: 'Có.', tools_used: [] }, error: null }
  assert.deepEqual(readSuggestions(await forwardedBody('Hỏi gì đó?', undefined, absent)), [])

  const notArray = { data: { answer: 'Có.', tools_used: [], suggestions: 'abc' }, error: null }
  assert.deepEqual(readSuggestions(await forwardedBody('Hỏi gì đó?', undefined, notArray)), [])
}

async function testForwardsAnswerKind() {
  const refusal = { data: { answer: 'Trợ lý không trả lời được câu hỏi này.', tools_used: [], answer_kind: 'refusal' }, error: null }
  const first = await forwardedBody('Hỏi gì đó?', undefined, refusal)
  assert.equal((first.data as { data: { answer_kind?: string } }).data.answer_kind, 'refusal')

  const unknown = { data: { answer: 'Có.', tools_used: [], answer_kind: 'xyz' }, error: null }
  const second = await forwardedBody('Hỏi gì đó?', undefined, unknown)
  assert.equal((second.data as { data: { answer_kind?: string } }).data.answer_kind, 'xyz')

  const absent = { data: { answer: 'Có.', tools_used: [] }, error: null }
  const fourth = await forwardedBody('Hỏi gì đó?', undefined, absent)
  assert.equal((fourth.data as { data: { answer_kind?: string } }).data.answer_kind, undefined)

  const notString = { data: { answer: 'Có.', tools_used: [], answer_kind: 5 }, error: null }
  const fifth = await forwardedBody('Hỏi gì đó?', undefined, notString)
  assert.equal((fifth.data as { data: { answer_kind?: string } }).data.answer_kind, undefined)

  const empty = { data: { answer: '   ', tools_used: [], answer_kind: 'answer' }, error: null }
  const third = await forwardedBody('Hỏi gì đó?', undefined, empty)
  assert.equal((third.data as { data: { answer_kind?: string } }).data.answer_kind, 'empty')
}

async function testRejectsRawOversizedQuestion() {
  const seen: SeenCall[] = []
  await withService(SERVICE_ENV, jsonFetch(200, OK_PAYLOAD, seen), async () => {
    const res = await ask(buildApp(['chat.assistant.use']), 'a'.repeat(8001))
    assert.equal(res.status, 400)
    assert.deepEqual(await res.json(), { data: null, error: 'Câu hỏi tối đa 2000 ký tự' })
    assert.equal(seen.length, 0)
  })
}

async function testCutsRawHistoryBeforeSanitizing() {
  const history = [
    { role: 'user', content: 'q' },
    { role: 'assistant', content: 'a'.repeat(7999) + '📦' + 'b'.repeat(10) },
    { role: 'user', content: '\u001f'.repeat(9000) + 'c' },
    { role: 'assistant', content: 'd' },
  ]
  const { status, body } = await forwardedBody('Còn màu khác không?', history)
  assert.equal(status, 200)
  assert.deepEqual(body?.history, [
    { role: 'user', content: 'q' },
    { role: 'assistant', content: 'a'.repeat(2000) },
  ])
}

async function testMissingAuthorizationComesBeforeHistory() {
  await withService(SERVICE_ENV, jsonFetch(200, OK_PAYLOAD), async () => {
    const res = await buildApp(['chat.assistant.use']).request('/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Còn màu khác không?', history: 'abc' }),
    })
    assert.equal(res.status, 401)
  })
}

async function testAuthorisedFallbackIgnoresInvalidHistory() {
  const permissions = ['chat.assistant.use', 'thread.inventory.view', 'thread.styles.view']
  await withService({}, jsonFetch(200, {}), async () => {
    const res = await ask(buildApp(permissions), 'xin chào', 'abc')
    assert.equal(res.status, 200)
    const payload = await res.json() as { data: { term: string | null } }
    assert.equal(payload.data.term, null)
  })
}

const SSE_EVENTS = [
  'event: status\ndata: {"phase":"thinking"}\n\n',
  'event: delta\ndata: {"text":"Còn 120"}\n\n',
  'event: done\ndata: {"answer":"Còn 120 cuộn.","answer_kind":"answer","tools_used":[],"suggestions":[]}\n\n',
]

function sseFetch(chunks: string[], seen: SeenCall[] = [], stall = false): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    seen.push({ url: String(input), init })
    const encoder = new TextEncoder()
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
        if (!stall) {
          controller.close()
          return
        }
        init?.signal?.addEventListener('abort', () => {
          controller.error(Object.assign(new Error('aborted'), { name: 'AbortError' }))
        })
      },
    })
    return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
  }) as unknown as typeof fetch
}

function askStream(app: Hono<AppEnv>, message = 'C9700 còn bao nhiêu cuộn?', history?: unknown) {
  return ask(app, message, history, '/stream')
}

async function testStreamPassesEventsThrough() {
  const seen: SeenCall[] = []
  await withService(SERVICE_ENV, sseFetch(SSE_EVENTS, seen), async () => {
    const res = await askStream(buildApp(['chat.assistant.use']), 'C9700 còn bao nhiêu cuộn?', [])
    assert.equal(res.status, 200)
    assert.ok(res.headers.get('content-type')?.startsWith('text/event-stream'))
    assert.equal(await res.text(), SSE_EVENTS.join(''))

    const [call] = seen
    assert.ok(call)
    assert.equal(call.url, 'http://ai.test/v1/chat/stream')
    assert.deepEqual(JSON.parse(String(call.init?.body)), { app: 'datchi', question: 'C9700 còn bao nhiêu cuộn?', history: [] })
    const headers = call.init?.headers as Record<string, string>
    assert.equal(headers['Authorization'], 'Bearer abc')
    assert.equal(headers['X-Internal-Token'], 'noi-bo')
    assert.ok(headers['X-Request-Id'] && headers['X-Request-Id'].length >= 8)
  })
}

async function testStreamKeepsEventsSplitAcrossChunks() {
  const joined = SSE_EVENTS.join('')
  const chunks = [joined.slice(0, 20), joined.slice(20, 75), joined.slice(75)]
  await withService(SERVICE_ENV, sseFetch(chunks), async () => {
    const res = await askStream(buildApp(['chat.assistant.use']))
    assert.equal(await res.text(), joined)
  })
}

async function testStreamUnavailableWhenNotConfigured() {
  await withService({}, jsonFetch(200, {}), async () => {
    const res = await askStream(buildApp(['chat.assistant.use']))
    assert.equal(res.status, 404)
    assert.deepEqual(await res.json(), { data: null, error: 'stream_unavailable' })
  })
}

async function testStreamUnavailableWhenServiceIs404() {
  await withService(SERVICE_ENV, jsonFetch(404, { detail: 'Not Found' }), async () => {
    const res = await askStream(buildApp(['chat.assistant.use']))
    assert.equal(res.status, 404)
    assert.deepEqual(await res.json(), { data: null, error: 'stream_unavailable' })
  })
}

async function testStreamServiceJsonErrorKeepsStatus() {
  const payload = { data: null, error: { code: 'unauthorized', message: 'Phiên đăng nhập đã hết hạn' } }
  await withService(SERVICE_ENV, jsonFetch(401, payload), async () => {
    const res = await askStream(buildApp(['chat.assistant.use']))
    assert.equal(res.status, 401)
    assert.deepEqual(await res.json(), { data: null, error: 'Phiên đăng nhập đã hết hạn' })
  })
}

async function testStreamServiceDownReturns502() {
  const failing = (async () => {
    throw new TypeError('fetch failed')
  }) as unknown as typeof fetch
  await withService(SERVICE_ENV, failing, async () => {
    const res = await askStream(buildApp(['chat.assistant.use']))
    assert.equal(res.status, 502)
    assert.deepEqual(await res.json(), { data: null, error: 'Không thể kết nối trợ lý AI' })
  })
}

async function testStreamRequiresPermission() {
  const seen: SeenCall[] = []
  await withService(SERVICE_ENV, sseFetch(SSE_EVENTS, seen), async () => {
    const res = await askStream(buildApp(['thread.inventory.view', 'thread.styles.view']))
    assert.equal(res.status, 403)
    assert.equal(seen.length, 0)
  })
}

async function testStreamValidatesMessage() {
  const seen: SeenCall[] = []
  await withService(SERVICE_ENV, sseFetch(SSE_EVENTS, seen), async () => {
    const app = buildApp(['chat.assistant.use'])
    const empty = await askStream(app, '   ')
    assert.equal(empty.status, 400)
    assert.deepEqual(await empty.json(), { data: null, error: 'Vui lòng nhập câu hỏi' })

    const long = await askStream(app, 'a'.repeat(2001))
    assert.equal(long.status, 400)
    assert.deepEqual(await long.json(), { data: null, error: 'Câu hỏi tối đa 2000 ký tự' })

    const badHistory = await askStream(app, 'Còn màu khác không?', 'abc')
    assert.equal(badHistory.status, 400)
    assert.deepEqual(await badHistory.json(), { data: null, error: 'Lịch sử hội thoại không hợp lệ' })

    const noAuth = await app.request('/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Còn màu khác không?' }),
    })
    assert.equal(noAuth.status, 401)
    assert.equal(seen.length, 0)
  })
}

async function testStreamIdleTimeoutEmitsError() {
  const seen: SeenCall[] = []
  await withService({ ...SERVICE_ENV, CHATBOT_REQUEST_TIMEOUT_MS: '100' }, sseFetch(SSE_EVENTS.slice(0, 1), seen, true), async () => {
    const started = Date.now()
    const res = await askStream(buildApp(['chat.assistant.use']))
    assert.equal(res.status, 200)
    const text = await res.text()
    assert.equal(
      text,
      SSE_EVENTS[0] + 'event: error\ndata: {"code":"timeout","message":"Trợ lý AI phản hồi quá thời gian"}\n\n',
    )
    assert.ok(Date.now() - started < 2000)
    assert.equal(seen[0]?.init?.signal?.aborted, true)
  })
}

async function testStreamIdleTimeoutResetsOnEachChunk() {
  const encoder = new TextEncoder()
  let aborted = false
  const slowFetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    init?.signal?.addEventListener('abort', () => {
      aborted = true
    })
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const chunk of SSE_EVENTS) {
          await new Promise((resolve) => setTimeout(resolve, 80))
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()
      },
    })
    return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
  }) as unknown as typeof fetch
  await withService({ ...SERVICE_ENV, CHATBOT_REQUEST_TIMEOUT_MS: '150' }, slowFetch, async () => {
    const res = await askStream(buildApp(['chat.assistant.use']))
    assert.equal(await res.text(), SSE_EVENTS.join(''))
    assert.equal(aborted, false)
  })
}

function abortError() {
  return Object.assign(new Error('aborted'), { name: 'AbortError' })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testStreamClientAbortAbortsUpstream() {
  const seen: SeenCall[] = []
  const hanging = ((input: string | URL | Request, init?: RequestInit) => {
    seen.push({ url: String(input), init })
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(abortError()))
    })
  }) as unknown as typeof fetch
  await withService(SERVICE_ENV, hanging, async () => {
    const client = new AbortController()
    const pending = buildApp(['chat.assistant.use']).request('/stream', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer abc', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'C9700 còn bao nhiêu cuộn?' }),
      signal: client.signal,
    })
    await sleep(50)
    assert.equal(seen[0]?.init?.signal?.aborted, false)
    client.abort()
    await sleep(50)
    assert.equal(seen[0]?.init?.signal?.aborted, true)
    await pending.catch(() => null)
  })
}

async function testStreamClientGoneBeforeHeadersDoesNotStartStream() {
  let cancelled = false
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const lateFetch = (async () => {
    await gate
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(SSE_EVENTS[0]))
      },
      cancel() {
        cancelled = true
      },
    })
    return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
  }) as unknown as typeof fetch
  await withService(SERVICE_ENV, lateFetch, async () => {
    const client = new AbortController()
    const pending = buildApp(['chat.assistant.use']).request('/stream', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer abc', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'C9700 còn bao nhiêu cuộn?' }),
      signal: client.signal,
    })
    await sleep(50)
    client.abort()
    release()
    await sleep(100)
    assert.equal(cancelled, true)
    await pending.catch(() => null)
  })
}

async function testStreamStalledJsonErrorBodyTimesOut() {
  const stalledJson = (async (_input: string | URL | Request, init?: RequestInit) => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        init?.signal?.addEventListener('abort', () => controller.error(abortError()))
      },
    })
    return new Response(body, { status: 500, headers: { 'Content-Type': 'application/json' } })
  }) as unknown as typeof fetch
  await withService({ ...SERVICE_ENV, CHATBOT_REQUEST_TIMEOUT_MS: '100' }, stalledJson, async () => {
    const started = Date.now()
    const res = await askStream(buildApp(['chat.assistant.use']))
    assert.equal(res.status, 408)
    assert.deepEqual(await res.json(), { data: null, error: 'Trợ lý AI phản hồi quá thời gian' })
    assert.ok(Date.now() - started < 2000)
  })
}

async function testStreamIdleTimerIgnoresClientBackpressure() {
  const encoder = new TextEncoder()
  const pullFetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    let next = 0
    const body = new ReadableStream<Uint8Array>(
      {
        start(controller) {
          init?.signal?.addEventListener('abort', () => controller.error(abortError()))
        },
        pull(controller) {
          const chunk = SSE_EVENTS[next]
          next += 1
          if (chunk === undefined) controller.close()
          else controller.enqueue(encoder.encode(chunk))
        },
      },
      { highWaterMark: 0 },
    )
    return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
  }) as unknown as typeof fetch
  await withService({ ...SERVICE_ENV, CHATBOT_REQUEST_TIMEOUT_MS: '100' }, pullFetch, async () => {
    const res = await askStream(buildApp(['chat.assistant.use']))
    await sleep(350)
    assert.equal(await res.text(), SSE_EVENTS.join(''))
  })
}

function sendFeedback(app: Hono<AppEnv>, body: unknown, authorization: string | null = 'Bearer abc') {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authorization) headers['Authorization'] = authorization
  return app.request('/feedback', { method: 'POST', headers, body: JSON.stringify(body) })
}

const FEEDBACK_OK = { data: { ok: true }, error: null }
const CHAT_USER = ['chat.assistant.use']

async function testForwardsRequestId() {
  const readRequestId = async (data: Record<string, unknown>) => {
    const result = await forwardedBody('Hỏi gì đó?', undefined, { data: { answer: 'Có.', tools_used: [], ...data }, error: null })
    return (result.data as { data: { request_id?: string } }).data.request_id
  }
  assert.equal(await readRequestId({ request_id: 'req-123' }), 'req-123')
  assert.equal(await readRequestId({}), undefined)
  assert.equal(await readRequestId({ request_id: 7 }), undefined)
  assert.equal(await readRequestId({ request_id: '   ' }), undefined)
}

async function testFeedbackForwardsToService() {
  const seen: SeenCall[] = []
  await withService(SERVICE_ENV, jsonFetch(200, FEEDBACK_OK, seen), async () => {
    const res = await sendFeedback(buildApp(CHAT_USER), { request_id: 'req-123', rating: 'down', comment: 'Sai số cuộn' })
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { data: { ok: true }, error: null })

    const [call] = seen
    assert.ok(call)
    assert.equal(seen.length, 1)
    assert.equal(call.url, 'http://ai.test/v1/feedback')
    assert.equal(call.init?.method, 'POST')
    assert.deepEqual(JSON.parse(String(call.init?.body)), {
      app: 'datchi', request_id: 'req-123', rating: 'down', comment: 'Sai số cuộn',
    })
    const headers = call.init?.headers as Record<string, string>
    assert.equal(headers['Authorization'], 'Bearer abc')
    assert.equal(headers['X-Internal-Token'], 'noi-bo')
  })
}

async function testFeedbackOmitsEmptyComment() {
  for (const comment of [undefined, '', '   ', '\u0000\u0007']) {
    const seen: SeenCall[] = []
    await withService(SERVICE_ENV, jsonFetch(200, FEEDBACK_OK, seen), async () => {
      const res = await sendFeedback(buildApp(CHAT_USER), { request_id: 'req-1', rating: 'up', comment })
      assert.equal(res.status, 200)
      assert.deepEqual(JSON.parse(String(seen[0]?.init?.body)), { app: 'datchi', request_id: 'req-1', rating: 'up' })
    })
  }
}

async function testFeedbackSanitizesComment() {
  const seen: SeenCall[] = []
  await withService(SERVICE_ENV, jsonFetch(200, FEEDBACK_OK, seen), async () => {
    const comment = `  Sai\u0000 số\u0007 cuộn${'x'.repeat(489)}  `
    const res = await sendFeedback(buildApp(CHAT_USER), { request_id: ' req-1 ', rating: 'down', comment })
    assert.equal(res.status, 200)
    const forwarded = JSON.parse(String(seen[0]?.init?.body)) as { request_id: string; comment: string }
    assert.equal(forwarded.request_id, 'req-1')
    assert.equal(forwarded.comment, `Sai số cuộn${'x'.repeat(489)}`)
    assert.equal(Array.from(forwarded.comment).length, 500)
  })
}

async function testFeedbackValidatesBody() {
  const invalid: unknown[] = [
    null,
    {},
    { rating: 'up' },
    { request_id: '', rating: 'up' },
    { request_id: '   ', rating: 'up' },
    { request_id: 12, rating: 'up' },
    { request_id: 'x'.repeat(101), rating: 'up' },
    { request_id: 'req-1' },
    { request_id: 'req-1', rating: 'UP' },
    { request_id: 'req-1', rating: 'meh' },
    { request_id: 'req-1', rating: 1 },
    { request_id: 'req-1', rating: 'down', comment: 5 },
    { request_id: 'req-1', rating: 'down', comment: 'x'.repeat(501) },
    { request_id: 'req-1', rating: 'down', comment: 'x'.repeat(9000) },
  ]
  const seen: SeenCall[] = []
  await withService(SERVICE_ENV, jsonFetch(200, FEEDBACK_OK, seen), async () => {
    for (const body of invalid) {
      const res = await sendFeedback(buildApp(CHAT_USER), body)
      assert.equal(res.status, 400, JSON.stringify(body)?.slice(0, 80))
      const payload = await res.json() as { data: unknown; error: string }
      assert.equal(payload.data, null)
      assert.ok(payload.error)
    }
    assert.equal(seen.length, 0)
  })
}

async function testFeedbackAcceptsCommentOfExactlyLimit() {
  const seen: SeenCall[] = []
  await withService(SERVICE_ENV, jsonFetch(200, FEEDBACK_OK, seen), async () => {
    const res = await sendFeedback(buildApp(CHAT_USER), { request_id: 'req-1', rating: 'down', comment: 'ế'.repeat(500) })
    assert.equal(res.status, 200)
    assert.equal(seen.length, 1)
  })
}

async function testFeedbackRequiresPermission() {
  const seen: SeenCall[] = []
  await withService(SERVICE_ENV, jsonFetch(200, FEEDBACK_OK, seen), async () => {
    const res = await sendFeedback(buildApp(['thread.inventory.view', 'thread.styles.view']), { request_id: 'req-1', rating: 'up' })
    assert.equal(res.status, 403)
    assert.equal(seen.length, 0)
  })
}

async function testFeedbackUnavailableWhenNotConfigured() {
  const seen: SeenCall[] = []
  for (const env of [{}, { CHATBOT_SERVICE_URL: 'http://ai.test/' }, { CHATBOT_INTERNAL_TOKEN: 'noi-bo' }]) {
    await withService(env, jsonFetch(200, FEEDBACK_OK, seen), async () => {
      const res = await sendFeedback(buildApp(CHAT_USER), { request_id: 'req-1', rating: 'up' })
      assert.equal(res.status, 404)
      assert.deepEqual(await res.json(), { data: null, error: 'feedback_unavailable' })
    })
  }
  assert.equal(seen.length, 0)
}

async function testFeedbackNeedsAuthorization() {
  const seen: SeenCall[] = []
  await withService(SERVICE_ENV, jsonFetch(200, FEEDBACK_OK, seen), async () => {
    const res = await sendFeedback(buildApp(CHAT_USER), { request_id: 'req-1', rating: 'up' }, null)
    assert.equal(res.status, 401)
    assert.equal(seen.length, 0)
  })
}

async function testFeedbackServiceErrorsKeepStatus() {
  const cases: Array<[number, unknown, number, string]> = [
    [401, { data: null, error: { code: 'unauthorized', message: 'Phiên đăng nhập đã hết hạn' } }, 401, 'Phiên đăng nhập đã hết hạn'],
    [429, { data: null, error: { code: 'rate_limited', message: 'Bạn gửi quá nhanh' } }, 429, 'Bạn gửi quá nhanh'],
    [422, { data: null, error: 'Dữ liệu không hợp lệ' }, 400, 'Dữ liệu không hợp lệ'],
    [500, { data: null, error: 'boom' }, 502, 'boom'],
    [500, null, 502, 'Trợ lý AI trả về lỗi'],
  ]
  for (const [status, payload, expectedStatus, expectedMessage] of cases) {
    await withService(SERVICE_ENV, jsonFetch(status, payload), async () => {
      const res = await sendFeedback(buildApp(CHAT_USER), { request_id: 'req-1', rating: 'up' })
      assert.equal(res.status, expectedStatus, String(status))
      assert.deepEqual(await res.json(), { data: null, error: expectedMessage })
    })
  }
}

async function testFeedbackServiceDownReturns502() {
  const failing = (async () => {
    throw new TypeError('fetch failed')
  }) as unknown as typeof fetch
  await withService(SERVICE_ENV, failing, async () => {
    const res = await sendFeedback(buildApp(CHAT_USER), { request_id: 'req-1', rating: 'up' })
    assert.equal(res.status, 502)
    assert.deepEqual(await res.json(), { data: null, error: 'Không thể kết nối trợ lý AI' })
  })
}

async function testFeedbackTimeoutReturns408() {
  const hanging = ((_input: string | URL | Request, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))
    })) as unknown as typeof fetch
  await withService({ ...SERVICE_ENV, CHATBOT_REQUEST_TIMEOUT_MS: '50' }, hanging, async () => {
    const started = Date.now()
    const res = await sendFeedback(buildApp(CHAT_USER), { request_id: 'req-1', rating: 'up' })
    assert.equal(res.status, 408)
    assert.ok(Date.now() - started < 1000)
  })
}

async function testFeedbackStalledBodyTimesOut() {
  const stalled = ((_input: string | URL | Request, init?: RequestInit) => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        init?.signal?.addEventListener('abort', () => controller.error(Object.assign(new Error('aborted'), { name: 'AbortError' })))
      },
    })
    return Promise.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }))
  }) as unknown as typeof fetch
  await withService({ ...SERVICE_ENV, CHATBOT_REQUEST_TIMEOUT_MS: '100' }, stalled, async () => {
    const started = Date.now()
    const res = await sendFeedback(buildApp(CHAT_USER), { request_id: 'req-1', rating: 'up' })
    assert.equal(res.status, 408)
    assert.ok(Date.now() - started < 1500)
  })
}

async function testFeedbackRejectsMalformedServiceReply() {
  for (const payload of [null, {}, { data: null, error: null }, { data: { ok: false }, error: null }]) {
    await withService(SERVICE_ENV, jsonFetch(200, payload), async () => {
      const res = await sendFeedback(buildApp(CHAT_USER), { request_id: 'req-1', rating: 'up' })
      assert.equal(res.status, 502, JSON.stringify(payload))
    })
  }
}

async function main() {
  await testForwardsRequestId()
  await testFeedbackForwardsToService()
  await testFeedbackOmitsEmptyComment()
  await testFeedbackSanitizesComment()
  await testFeedbackValidatesBody()
  await testFeedbackAcceptsCommentOfExactlyLimit()
  await testFeedbackRequiresPermission()
  await testFeedbackUnavailableWhenNotConfigured()
  await testFeedbackNeedsAuthorization()
  await testFeedbackServiceErrorsKeepStatus()
  await testFeedbackServiceDownReturns502()
  await testFeedbackTimeoutReturns408()
  await testFeedbackStalledBodyTimesOut()
  await testFeedbackRejectsMalformedServiceReply()
  await testRequiresChatPermission()
  await testForwardsQuestionToService()
  await testServiceUnauthorizedPassesThrough()
  await testServiceDownReturns502()
  await testServiceTimeoutReturns408()
  await testRejectsOverlongQuestion()
  await testServiceDetailIsNotForwarded()
  await testFallbackNeedsLookupPermissions()
  await testForwardsTrimmedHistory()
  await testCutsHistoryByCodePoint()
  await testRejectsInvalidHistory()
  await testFallbackIgnoresHistory()
  await testSanitizesControlCharacters()
  await testQuestionOfControlCharactersIsRejected()
  await testBlankPairsAreDropped()
  await testAcceptsTwentyItems()
  await testForwardsEmptyHistory()
  await testForwardsAnswerKind()
  await testForwardsSuggestions()
  await testRejectsRawOversizedQuestion()
  await testCutsRawHistoryBeforeSanitizing()
  await testMissingAuthorizationComesBeforeHistory()
  await testAuthorisedFallbackIgnoresInvalidHistory()
  await testStreamPassesEventsThrough()
  await testStreamKeepsEventsSplitAcrossChunks()
  await testStreamUnavailableWhenNotConfigured()
  await testStreamUnavailableWhenServiceIs404()
  await testStreamServiceJsonErrorKeepsStatus()
  await testStreamServiceDownReturns502()
  await testStreamRequiresPermission()
  await testStreamValidatesMessage()
  await testStreamIdleTimeoutEmitsError()
  await testStreamIdleTimeoutResetsOnEachChunk()
  await testStreamClientAbortAbortsUpstream()
  await testStreamClientGoneBeforeHeadersDoesNotStartStream()
  await testStreamStalledJsonErrorBodyTimesOut()
  await testStreamIdleTimerIgnoresClientBackpressure()
  console.log('chat-assistant route tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
