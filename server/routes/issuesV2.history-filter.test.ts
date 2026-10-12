import assert from 'node:assert/strict'
import { Hono } from 'hono'
import issuesV2Routes from './issuesV2'
import type { AppEnv } from '../types/hono-env'
import { pool } from '../db/pool'

interface Recorded {
  text: string
  params: unknown[]
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
      permissions: ['thread.allocations.view'],
    })
    await next()
  })
  app.route('/', issuesV2Routes)
  return app
}

async function withStubbedPool(handler: (calls: Recorded[]) => Promise<void>) {
  const calls: Recorded[] = []
  const originalQuery = pool.query
  const originalConnect = pool.connect

  pool.query = (async (text: string, params?: unknown[]) => {
    calls.push({ text, params: params ?? [] })
    if (text.includes('count(*)::int AS count FROM thread_issues')) {
      return { rows: [{ count: 0 }] }
    }
    return { rows: [] }
  }) as unknown as typeof pool.query

  pool.connect = (async () => {
    throw new Error('lọc lịch sử chỉ được đọc, không được mở transaction')
  }) as unknown as typeof pool.connect

  try {
    await handler(calls)
  } finally {
    pool.query = originalQuery
    pool.connect = originalConnect
  }
}

function findCount(calls: Recorded[]) {
  const call = calls.find((c) => c.text.includes('count(*)::int AS count FROM thread_issues'))
  assert.ok(call, 'phải có câu đếm tổng')
  return call
}

function findList(calls: Recorded[]) {
  const call = calls.find((c) => c.text.includes('ORDER BY ti.created_at DESC'))
  assert.ok(call, 'phải có câu lấy danh sách')
  return call
}

async function testNoLineFilterHasNoExists() {
  await withStubbedPool(async (calls) => {
    const res = await buildApp().request('/?status=CONFIRMED&department=MAY')
    assert.equal(res.status, 200, await res.clone().text())

    for (const call of [findCount(calls), findList(calls)]) {
      assert.ok(!call.text.includes('EXISTS'), 'không lọc PO/Style/Màu thì không có EXISTS')
      assert.ok(call.text.includes('ti.department = $1'))
      assert.ok(call.text.includes('ti.status = $2'))
    }
    assert.match(findCount(calls).text, /FROM thread_issues ti WHERE/)
  })
}

async function testBlankLineFiltersAreIgnored() {
  await withStubbedPool(async (calls) => {
    const res = await buildApp().request('/?po=%20%20&style=&color=%20')
    assert.equal(res.status, 200, await res.clone().text())
    assert.ok(!findCount(calls).text.includes('EXISTS'))
    assert.ok(!findList(calls).text.includes('EXISTS'))
  })
}

async function testLineFiltersBuildSingleExistsWithIlike() {
  await withStubbedPool(async (calls) => {
    const res = await buildApp().request(
      '/?department=MAY&status=CONFIRMED&po=%20PO-1%20&style=ST&color=C5958&from=2026-01-01&to=2026-01-31',
    )
    assert.equal(res.status, 200, await res.clone().text())

    for (const call of [findCount(calls), findList(calls)]) {
      assert.equal(call.text.match(/EXISTS/g)?.length, 1, 'chỉ một EXISTS gom cả 3 điều kiện')
      assert.ok(call.text.includes('fl.issue_id = ti.id'))
      assert.ok(call.text.includes('fpo.po_number ILIKE'))
      assert.ok(call.text.includes('fst.style_code ILIKE'))
      assert.ok(call.text.includes('COALESCE(fsc.color_name, fco.name) ILIKE'))
      assert.ok(call.text.includes('ti.created_at >='))
      assert.ok(call.text.includes('ti.created_at <='))
      assert.ok(!/[^.\w]department = \$/.test(call.text), 'điều kiện cũ phải có alias ti.')
      assert.deepEqual(call.params.slice(0, 7), [
        'MAY',
        'CONFIRMED',
        '2026-01-01T00:00:00',
        '2026-01-31T23:59:59',
        '%PO-1%',
        '%ST%',
        '%C5958%',
      ])
    }

    const list = findList(calls)
    assert.deepEqual(list.params.slice(7), [20, 0])
    assert.ok(list.text.includes('LIMIT $8 OFFSET $9'))
  })
}

async function testOnlyRequestedLineConditionsAreAdded() {
  await withStubbedPool(async (calls) => {
    const res = await buildApp().request('/?color=C5958')
    assert.equal(res.status, 200, await res.clone().text())

    const count = findCount(calls)
    assert.ok(count.text.includes('COALESCE(fsc.color_name, fco.name) ILIKE $1'))
    assert.ok(!count.text.includes('fpo.po_number ILIKE'))
    assert.ok(!count.text.includes('fst.style_code ILIKE'))
    assert.deepEqual(count.params, ['%C5958%'])
  })
}

async function testLikeWildcardsAreEscaped() {
  await withStubbedPool(async (calls) => {
    const res = await buildApp().request(
      `/?po=${encodeURIComponent('50%_a\\b')}`,
    )
    assert.equal(res.status, 200, await res.clone().text())

    const count = findCount(calls)
    assert.deepEqual(count.params, ['%50\\%\\_a\\\\b%'])
    assert.ok(!count.text.includes('50%'), 'giá trị không được nội suy vào SQL')
  })
}

async function testTooLongValueIsRejected() {
  await withStubbedPool(async (calls) => {
    const res = await buildApp().request(`/?style=${'a'.repeat(101)}`)
    assert.equal(res.status, 400)
    assert.equal(calls.length, 0, 'tham số sai thì không được chạm DB')
  })
}

async function main() {
  await testNoLineFilterHasNoExists()
  await testBlankLineFiltersAreIgnored()
  await testLineFiltersBuildSingleExistsWithIlike()
  await testOnlyRequestedLineConditionsAreAdded()
  await testLikeWildcardsAreEscaped()
  await testTooLongValueIsRejected()
  console.log('history filter tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
