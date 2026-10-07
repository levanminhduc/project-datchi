import assert from 'node:assert/strict'
import { Hono } from 'hono'
import issuesV2Routes, { hashPayload } from './issuesV2'
import type { AppEnv } from '../types/hono-env'
import { pool } from '../db/pool'

interface Recorded {
  text: string
  params: unknown[]
}

interface StubOptions {
  secondLineFails: boolean
  existingOperation?: { request_hash: string; status: string }
  issueLines?: Array<Record<string, unknown>>
}

const COMPLETION_NOISE = 600

function completionRows() {
  const rows = Array.from({ length: COMPLETION_NOISE }, (_, i) => ({
    item_id: 1000 + i,
    po_id: LINE_A.po_id,
    style_id: LINE_A.style_id,
    style_color_id: 900 + i,
    thread_order_items: { po_id: LINE_A.po_id, style_id: LINE_A.style_id, style_color_id: 900 + i },
  }))
  rows.push({
    item_id: 99,
    po_id: LINE_A.po_id,
    style_id: LINE_A.style_id,
    style_color_id: LINE_A.style_color_id,
    thread_order_items: { po_id: LINE_A.po_id, style_id: LINE_A.style_id, style_color_id: LINE_A.style_color_id },
  })
  return rows
}

const LINE_A = {
  id: 501,
  issue_id: 90,
  po_id: 7,
  style_id: 8,
  style_color_id: 9,
  color_id: null,
  thread_type_id: 11,
  thread_color_id: 21,
  issued_full: 5,
  issued_partial: 0,
  returned_full: 0,
  returned_partial: 0,
  created_at: '2026-07-01T00:00:00.000Z',
  thread_issues: { id: 90, status: 'CONFIRMED', issue_code: 'XK-1', created_at: '2026-07-01T00:00:00.000Z' },
}

const LINE_B = {
  ...LINE_A,
  id: 502,
  thread_type_id: 12,
  thread_color_id: 22,
  issued_full: 3,
}

function buildApp() {
  const app = new Hono<AppEnv>()
  app.use('*', async (c, next) => {
    c.set('auth', {
      employeeId: 1,
      employeeCode: 'ROOT001',
      roles: ['root'],
      isRoot: true,
      isAdmin: true,
      permissions: ['thread.issues.return'],
    })
    await next()
  })
  app.route('/', issuesV2Routes)
  return app
}

function conesFor(lineId: number, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: lineId * 100 + i,
    quantity_meters: 5000,
    status: 'IN_PRODUCTION',
    issued_line_id: lineId,
  }))
}

async function withStubbedPool(
  options: StubOptions,
  handler: (poolCalls: Recorded[], clientCalls: Recorded[]) => Promise<void>,
) {
  const poolCalls: Recorded[] = []
  const clientCalls: Recorded[] = []
  const originalQuery = pool.query
  const originalConnect = pool.connect

  const answer = (text: string, params: unknown[]) => {
    if (text.includes('FROM system_settings')) {
      return { rows: [{ value: '0.3' }] }
    }
    if (text.includes('FROM issue_operations_log')) {
      return { rows: options.existingOperation ? [options.existingOperation] : [] }
    }
    if (text.includes('FROM thread_order_item_completions')) {
      const rows = completionRows()
      const limit = /LIMIT\s+(\d+)/i.exec(text)
      return { rows: limit ? rows.slice(0, Number(limit[1])) : rows }
    }
    if (text.includes('FROM thread_issue_lines til')) {
      return { rows: options.issueLines ?? [{ ...LINE_A }, { ...LINE_B }] }
    }
    if (options.issueLines && text.includes('FROM "purchase_orders"')) {
      return { rows: options.issueLines.map((l) => ({ id: l.po_id, po_number: `PO-${String(Number(l.po_id) - 100).padStart(3, '0')}` })) }
    }
    if (options.issueLines && text.includes('FROM "styles"')) {
      return { rows: [{ id: LINE_A.style_id, style_code: 'STY-X', style_name: 'Style X' }] }
    }
    if (text.includes('FROM "thread_inventory"')) {
      if (text.includes('quantity_meters')) {
        return { rows: [...conesFor(LINE_A.id, 5), ...conesFor(LINE_B.id, 3)] }
      }
      return { rows: [] }
    }
    if (text.includes('FROM "thread_types"')) {
      return { rows: [{ id: 11, meters_per_cone: 5000 }, { id: 12, meters_per_cone: 5000 }] }
    }
    if (text.includes('INSERT INTO thread_issue_return_logs')) {
      return { rows: [{ id: 777 }] }
    }
    if (text.includes('fn_revert_return_log')) {
      return { rows: [{ result: { success: true, log_id: 777, reverted_cones: 5 } }] }
    }
    if (text.includes('fn_return_cones_with_movements')) {
      const lineId = params[1] as number
      if (options.secondLineFails && lineId === LINE_B.id) {
        return { rows: [{ result: { success: true, full_returned: 0, partial_existing_returned: 0, partial_created_returned: 0 } }] }
      }
      const coneIds = (params[0] as number[] | null) ?? []
      return {
        rows: [{ result: { success: true, full_returned: coneIds.length, partial_existing_returned: 0, partial_created_returned: 0 } }],
      }
    }
    if (text.includes('FROM "thread_issue_lines"')) {
      return { rows: [{ issued_full: 5, issued_partial: 0, returned_full: 5, returned_partial: 0 }] }
    }
    return { rows: [] }
  }

  pool.query = (async (text: string, params?: unknown[]) => {
    poolCalls.push({ text, params: params ?? [] })
    return answer(text, params ?? [])
  }) as unknown as typeof pool.query

  pool.connect = (async () => ({
    query: async (text: string, params?: unknown[]) => {
      clientCalls.push({ text, params: params ?? [] })
      return answer(text, params ?? [])
    },
    release: () => {},
  })) as unknown as typeof pool.connect

  try {
    await handler(poolCalls, clientCalls)
  } finally {
    pool.query = originalQuery
    pool.connect = originalConnect
  }
}

function body(lines: Array<{ thread_type_id: number; thread_color_id: number | null; returned_full: number; returned_partial: number }>) {
  return {
    po_id: LINE_A.po_id,
    style_id: LINE_A.style_id,
    style_color_id: LINE_A.style_color_id,
    idempotency_key: '11111111-2222-4333-8444-555555555555',
    lines,
  }
}

function post(app: Hono<AppEnv>, payload: unknown) {
  return app.request('/return-grouped', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

const twoGoodLines = [
  { thread_type_id: 11, thread_color_id: 21, returned_full: 5, returned_partial: 0 },
  { thread_type_id: 12, thread_color_id: 22, returned_full: 3, returned_partial: 0 },
]

async function testCommitsWhenEveryLineSucceeds() {
  await withStubbedPool({ secondLineFails: false }, async (poolCalls, clientCalls) => {
    const res = await post(buildApp(), body(twoGoodLines))
    assert.equal(res.status, 200, await res.clone().text())

    const clientText = clientCalls.map((c) => c.text)
    assert.equal(clientText.filter((t) => t === 'BEGIN').length, 1)
    assert.equal(clientText.filter((t) => t === 'COMMIT').length, 1)
    assert.equal(clientText.filter((t) => t === 'ROLLBACK').length, 0)

    const ranOnClient = (needle: string) => clientText.some((t) => t.includes(needle))
    const ranOnPool = (needle: string) => poolCalls.some((c) => c.text.includes(needle))

    assert.ok(ranOnClient('fn_return_cones_with_movements'), 'RPC trả cuộn phải chạy trong transaction')
    assert.ok(ranOnClient('UPDATE thread_issue_lines'), 'cập nhật số đã trả phải chạy trong transaction')
    assert.ok(ranOnClient('INSERT INTO thread_issue_return_logs'), 'ghi lịch sử trả phải chạy trong transaction')
    assert.ok(ranOnClient('UPDATE thread_issues'), 'đổi trạng thái phiếu phải chạy trong transaction')

    assert.ok(!ranOnPool('fn_return_cones_with_movements'), 'RPC không được chạy ngoài transaction')
    assert.ok(!ranOnPool('UPDATE thread_issue_lines'), 'cập nhật số đã trả không được chạy ngoài transaction')
  })
}

async function testRollsBackWhenOneLineFails() {
  await withStubbedPool({ secondLineFails: true }, async (poolCalls, clientCalls) => {
    const res = await post(buildApp(), body(twoGoodLines))
    assert.equal(res.status, 400)

    const clientText = clientCalls.map((c) => c.text)
    assert.equal(clientText.filter((t) => t === 'BEGIN').length, 1)
    assert.equal(clientText.filter((t) => t === 'ROLLBACK').length, 1)
    assert.equal(clientText.filter((t) => t === 'COMMIT').length, 0)

    assert.ok(
      !poolCalls.some((c) => c.text.includes('INSERT INTO thread_issue_return_logs')),
      'lịch sử trả phải nằm trong transaction để rollback xoá được',
    )
  })
}

async function testFailureIsStillRecordedOutsideTransaction() {
  await withStubbedPool({ secondLineFails: true }, async (poolCalls) => {
    await post(buildApp(), body(twoGoodLines))

    const failedLog = poolCalls.find(
      (c) => c.text.includes('UPDATE issue_operations_log') && (c.params as unknown[])[0] === 'FAILED',
    )
    assert.ok(failedLog, 'nhật ký thao tác phải ghi FAILED ngoài transaction để không bị rollback xoá')
    assert.deepEqual((failedLog.params as unknown[])[1], [], 'rollback rồi thì không dòng nào được coi là đã trả')
  })
}

async function testCompletedGroupIsHiddenEvenBeyondFiveHundredCompletions() {
  await withStubbedPool({ secondLineFails: false }, async (poolCalls) => {
    const res = await buildApp().request('/return-groups')
    assert.equal(res.status, 200, await res.clone().text())

    const payload = (await res.json()) as { data: Array<{ group_key: string }> }
    assert.ok(
      poolCalls.some((c) => c.text.includes('FROM thread_order_item_completions')),
      'phải tra bảng đánh dấu hoàn tất',
    )
    assert.deepEqual(
      payload.data.map((g) => g.group_key),
      [],
      'nhóm đã đánh dấu hoàn tất phải bị ẩn dù dòng hoàn tất nằm sau mốc 500',
    )
  })
}

async function testMessagesAreProperVietnamese() {
  await withStubbedPool(
    { secondLineFails: false, existingOperation: { request_hash: 'khac', status: 'COMPLETED' } },
    async () => {
      const res = await post(buildApp(), body(twoGoodLines))
      assert.equal(res.status, 409)
      const payload = (await res.json()) as { error: string | null }
      assert.equal(payload.error, 'Mã chống trùng đã được dùng cho dữ liệu khác')
    },
  )

  await withStubbedPool(
    {
      secondLineFails: false,
      existingOperation: { request_hash: hashPayload(body(twoGoodLines)), status: 'IN_PROGRESS' },
    },
    async () => {
      const res = await post(buildApp(), body(twoGoodLines))
      const payload = (await res.json()) as { error: string | null }
      assert.equal(payload.error, 'Thao tác đang được xử lý, vui lòng đợi')
    },
  )
}

async function testChosenWarehouseAndLogIdReachTheRpc() {
  await withStubbedPool({ secondLineFails: false }, async (poolCalls, clientCalls) => {
    const res = await post(buildApp(), { ...body(twoGoodLines), warehouse_id: 3 })
    assert.equal(res.status, 200, await res.clone().text())

    const rpcCalls = clientCalls.filter((c) => c.text.includes('fn_return_cones_with_movements'))
    assert.equal(rpcCalls.length, 2)
    for (const call of rpcCalls) {
      assert.equal(call.params[4], 3, 'kho nhận phải được truyền xuống RPC')
      assert.equal(call.params[5], 777, 'mã lần trả phải được truyền xuống RPC để còn hoàn tác')
    }
  })
}

async function testRevertNeedsReasonAndCallsRpc() {
  await withStubbedPool({ secondLineFails: false }, async (poolCalls) => {
    const app = buildApp()

    const noReason = await app.request('/return-logs/777/revert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: '   ' }),
    })
    assert.equal(noReason.status, 400)
    assert.equal(((await noReason.json()) as { error: string }).error, 'Vui lòng nhập lý do hoàn tác')
    assert.ok(!poolCalls.some((c) => c.text.includes('fn_revert_return_log')), 'thiếu lý do thì không gọi RPC')

    const ok = await app.request('/return-logs/777/revert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Trả nhầm phiếu' }),
    })
    assert.equal(ok.status, 200, await ok.clone().text())
    const call = poolCalls.find((c) => c.text.includes('fn_revert_return_log'))
    assert.ok(call, 'phải gọi RPC hoàn tác')
    assert.equal(call.params[0], 777)
    assert.equal(call.params[2], 'Trả nhầm phiếu')
  })
}

const OUTSTANDING_GROUPS = 30
const FULLY_RETURNED_PO = 'PO-030'

function pagedIssueLines() {
  const lines = Array.from({ length: OUTSTANDING_GROUPS + 1 }, (_, i) => ({
    ...LINE_A,
    id: 600 + i,
    issue_id: 700 + i,
    po_id: 100 + i,
    style_color_id: null,
    color_id: 5,
    returned_full: i === OUTSTANDING_GROUPS ? LINE_A.issued_full : 0,
  }))
  return lines.reverse()
}

interface PagedPayload {
  data: { items: Array<{ group_key: string; po_number: string }>; total: number; page: number; limit: number }
  error: string | null
}

async function getPaged(search: string): Promise<{ status: number; payload: PagedPayload }> {
  const res = await buildApp().request(`/return-groups${search}`)
  return { status: res.status, payload: (await res.json()) as PagedPayload }
}

async function testReturnGroupsWithoutParamsStaysAnArray() {
  await withStubbedPool({ secondLineFails: false, issueLines: pagedIssueLines() }, async () => {
    const res = await buildApp().request('/return-groups')
    const payload = (await res.json()) as { data: unknown[] }
    assert.ok(Array.isArray(payload.data), 'không truyền tham số phân trang thì giữ nguyên dạng mảng')
    assert.equal(payload.data.length, OUTSTANDING_GROUPS)
  })
}

async function testReturnGroupsPaginatesInStableOrder() {
  await withStubbedPool({ secondLineFails: false, issueLines: pagedIssueLines() }, async () => {
    const second = await getPaged('?page=2&limit=10')
    assert.equal(second.status, 200)
    assert.equal(second.payload.data.total, OUTSTANDING_GROUPS)
    assert.equal(second.payload.data.page, 2)
    assert.equal(second.payload.data.limit, 10)
    assert.deepEqual(
      second.payload.data.items.map((g) => g.po_number),
      Array.from({ length: 10 }, (_, i) => `PO-${String(10 + i).padStart(3, '0')}`),
    )

    const last = await getPaged('?page=3&limit=12')
    assert.equal(last.payload.data.items.length, OUTSTANDING_GROUPS - 24)

    const beyond = await getPaged('?page=9&limit=10')
    assert.equal(beyond.payload.data.items.length, 0)
    assert.equal(beyond.payload.data.total, OUTSTANDING_GROUPS)

    const defaults = await getPaged('?page=1')
    assert.equal(defaults.payload.data.limit, 25)
    assert.equal(defaults.payload.data.items.length, 25)
  })
}

async function testReturnGroupsRejectsInvalidPaging() {
  await withStubbedPool({ secondLineFails: false, issueLines: pagedIssueLines() }, async () => {
    for (const search of ['?limit=101', '?page=0', '?page=abc', '?outstanding_only=maybe']) {
      const res = await getPaged(search)
      assert.equal(res.status, 400, search)
      assert.equal(typeof res.payload.error, 'string')
    }
  })
}

async function testReturnGroupsSearchIsCaseInsensitive() {
  await withStubbedPool({ secondLineFails: false, issueLines: pagedIssueLines() }, async () => {
    const byPo = await getPaged('?page=1&search=po-005')
    assert.equal(byPo.payload.data.total, 1)
    assert.equal(byPo.payload.data.items[0].po_number, 'PO-005')

    const byStyle = await getPaged('?page=1&search=sty-x')
    assert.equal(byStyle.payload.data.total, OUTSTANDING_GROUPS)

    const none = await getPaged('?page=1&search=khong-co')
    assert.equal(none.payload.data.total, 0)
    assert.deepEqual(none.payload.data.items, [])
  })
}

async function testReturnGroupsOutstandingOnlyToggle() {
  await withStubbedPool({ secondLineFails: false, issueLines: pagedIssueLines() }, async () => {
    const defaultFilter = await getPaged('?page=1&limit=100')
    assert.equal(defaultFilter.payload.data.total, OUTSTANDING_GROUPS)
    assert.ok(!defaultFilter.payload.data.items.some((g) => g.po_number === FULLY_RETURNED_PO))

    const all = await getPaged('?page=1&limit=100&outstanding_only=false')
    assert.equal(all.payload.data.total, OUTSTANDING_GROUPS + 1)
    assert.ok(all.payload.data.items.some((g) => g.po_number === FULLY_RETURNED_PO))
  })
}

async function main() {
  await testCommitsWhenEveryLineSucceeds()
  await testChosenWarehouseAndLogIdReachTheRpc()
  await testRevertNeedsReasonAndCallsRpc()
  await testRollsBackWhenOneLineFails()
  await testFailureIsStillRecordedOutsideTransaction()
  await testCompletedGroupIsHiddenEvenBeyondFiveHundredCompletions()
  await testReturnGroupsWithoutParamsStaysAnArray()
  await testReturnGroupsPaginatesInStableOrder()
  await testReturnGroupsRejectsInvalidPaging()
  await testReturnGroupsSearchIsCaseInsensitive()
  await testReturnGroupsOutstandingOnlyToggle()
  await testMessagesAreProperVietnamese()
  console.log('return-grouped transaction tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
