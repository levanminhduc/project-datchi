import assert from 'node:assert/strict'
import { Hono } from 'hono'
import styleCmptImport from './import-style-cmpt'
import stylesRoutes from './styles'
import type { AppEnv } from '../types/hono-env'
import { pool } from '../db/pool'
import type { StyleCmptPreview } from './import-style-cmpt'

interface Recorded {
  text: string
  params: unknown[]
}

const STYLES = [
  { id: 1, style_code: 'MH6940', style_name: 'Áo 6940', cm_price: '1.2500', p_price: null, t_price: '0.0800' },
  { id: 2, style_code: 'MH82004', style_name: 'Quần 82004', cm_price: null, p_price: null, t_price: null },
]

function buildApp(permissions: string[] = ['thread.styles.edit']) {
  const app = new Hono<AppEnv>()
  app.use('*', async (c, next) => {
    c.set('auth', {
      employeeId: 7,
      employeeCode: 'KH001',
      roles: ['planner'],
      isRoot: false,
      isAdmin: false,
      permissions,
    })
    await next()
  })
  app.route('/import', styleCmptImport)
  app.route('/styles', stylesRoutes)
  return app
}

function answer(text: string, params: unknown[] = []) {
  if (text.includes('FROM styles') && text.includes('ANY($1::text[])')) {
    const keys = params[0] as string[]
    return { rows: STYLES.filter(s => keys.includes(s.style_code.trim().toLowerCase())).map(s => ({ ...s })) }
  }
  if (text.startsWith('UPDATE styles SET')) {
    return { rows: [{ id: params[params.length - 1] }] }
  }
  return { rows: [] }
}

async function withStubbedPool(handler: (calls: Recorded[]) => Promise<void>) {
  const calls: Recorded[] = []
  const originalQuery = pool.query
  const originalConnect = pool.connect
  const record = async (text: string, params?: unknown[]) => {
    calls.push({ text, params: params ?? [] })
    return answer(text, params ?? [])
  }
  pool.query = record as unknown as typeof pool.query
  pool.connect = (async () => ({ query: record, release: () => {} })) as unknown as typeof pool.connect
  try {
    await handler(calls)
  } finally {
    pool.query = originalQuery
    pool.connect = originalConnect
  }
}

function post(app: Hono<AppEnv>, path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function testParseClassifiesRows() {
  await withStubbedPool(async () => {
    const res = await post(buildApp(), '/import/style-cmpt/parse', {
      rows: [
        { row_number: 2, style_code: 'mh6940 ', cm_price: 1.3, p_price: null, t_price: '0.08' },
        { row_number: 3, style_code: 'MH82004', cm_price: null, p_price: null, t_price: null },
        { row_number: 4, style_code: 'MH9999', cm_price: 1, p_price: 1, t_price: 1 },
        { row_number: 5, style_code: 'MH7000', cm_price: -1, p_price: null, t_price: null },
        { row_number: 6, style_code: '', cm_price: 1, p_price: null, t_price: null },
      ],
    })
    assert.equal(res.status, 200, await res.clone().text())
    const { data } = (await res.json()) as { data: StyleCmptPreview }
    const byRow = new Map(data.rows.map(r => [r.row_number, r]))

    assert.equal(byRow.get(2)?.status, 'UPDATE')
    assert.equal(byRow.get(2)?.style_id, 1)
    assert.deepEqual(byRow.get(2)?.new_prices, { cm_price: '1.3', p_price: null, t_price: '0.08' })
    assert.equal(byRow.get(3)?.status, 'UNCHANGED')
    assert.equal(byRow.get(4)?.status, 'STYLE_NOT_FOUND')
    assert.equal(byRow.get(4)?.error_message, 'Mã hàng chưa có trong hệ thống')
    assert.equal(byRow.get(5)?.status, 'ERROR')
    assert.match(byRow.get(5)?.error_message ?? '', /Giá CMPT phải là số không âm/)
    assert.equal(byRow.get(6)?.status, 'ERROR')
    assert.match(byRow.get(6)?.error_message ?? '', /Thiếu mã hàng/)
    assert.deepEqual(data.summary, { total: 5, update: 1, unchanged: 1, errors: 3 })
  })
}

async function testSamePriceIsUnchanged() {
  await withStubbedPool(async () => {
    const res = await post(buildApp(), '/import/style-cmpt/parse', {
      rows: [{ row_number: 2, style_code: 'MH6940', cm_price: '1.25', p_price: null, t_price: 0.08 }],
    })
    const { data } = (await res.json()) as { data: StyleCmptPreview }
    assert.equal(data.rows[0]?.status, 'UNCHANGED')
  })
}

async function testDuplicateCodeInFileIsError() {
  await withStubbedPool(async () => {
    const res = await post(buildApp(), '/import/style-cmpt/parse', {
      rows: [
        { row_number: 2, style_code: 'MH6940', cm_price: 2 },
        { row_number: 3, style_code: 'mh6940', cm_price: 3 },
      ],
    })
    const { data } = (await res.json()) as { data: StyleCmptPreview }
    assert.ok(data.rows.every(r => r.status === 'ERROR'))
    assert.ok(data.rows.every(r => r.error_message?.includes('Trùng mã hàng trong cùng file')))
  })
}

async function testExecuteOverwritesAndKeepsEmptyCells() {
  await withStubbedPool(async (calls) => {
    const res = await post(buildApp(), '/import/style-cmpt/execute', {
      rows: [
        { row_number: 2, style_code: 'MH6940', cm_price: 1.3, p_price: null, t_price: null },
        { row_number: 3, style_code: 'MH82004', cm_price: null, p_price: null, t_price: null },
      ],
    })
    assert.equal(res.status, 200, await res.clone().text())
    const { data } = (await res.json()) as { data: { updated: number; unchanged: number } }
    assert.deepEqual(data, { updated: 1, unchanged: 1 })

    const updates = calls.filter(c => c.text.includes('UPDATE styles'))
    assert.equal(updates.length, 1)
    assert.match(updates[0]!.text, /COALESCE\(\$3::numeric, p_price\)/)
    assert.deepEqual(updates[0]!.params, [1, '1.3', null, null])
    assert.ok(calls.some(c => c.text === 'BEGIN'))
    assert.ok(calls.some(c => c.text === 'COMMIT'))
    assert.ok(calls.some(c => c.text.includes('FOR UPDATE')))
  })
}

async function testExecuteRejectsFileWithErrors() {
  await withStubbedPool(async (calls) => {
    const res = await post(buildApp(), '/import/style-cmpt/execute', {
      rows: [
        { row_number: 2, style_code: 'MH6940', cm_price: 1.3 },
        { row_number: 3, style_code: 'MH9999', cm_price: 1 },
      ],
    })
    assert.equal(res.status, 400)
    const payload = (await res.json()) as { error: string }
    assert.equal(payload.error, 'File còn 1 dòng lỗi, sửa file rồi import lại')
    assert.ok(!calls.some(c => c.text.includes('UPDATE styles')))
    assert.ok(calls.some(c => c.text === 'ROLLBACK'))
  })
}

async function testImportNeedsStylesEditPermission() {
  await withStubbedPool(async () => {
    const res = await post(buildApp(['thread.styles.view']), '/import/style-cmpt/parse', {
      rows: [{ row_number: 2, style_code: 'MH6940', cm_price: 1 }],
    })
    assert.equal(res.status, 403)
  })
}

async function testUpdateStyleValidatesCmptPrices() {
  await withStubbedPool(async (calls) => {
    const app = buildApp()
    const put = (body: unknown) =>
      app.request('/styles/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

    const bad = await put({ cm_price: '1.23456' })
    assert.equal(bad.status, 400)
    assert.equal(((await bad.json()) as { error: string }).error, 'Giá CMPT phải là số không âm, tối đa 4 chữ số thập phân')

    const negative = await put({ t_price: '-0.5' })
    assert.equal(negative.status, 400)

    calls.length = 0
    const ok = await put({ style_name: 'Áo 6940', cm_price: '1,25', p_price: null })
    assert.equal(ok.status, 200, await ok.clone().text())
    const update = calls.find(c => c.text.startsWith('UPDATE styles SET'))
    assert.ok(update)
    assert.match(update.text, /cm_price = \$1, p_price = \$2/)
    assert.deepEqual(update.params.slice(0, 2), ['1.25', null])
    assert.ok(!update.text.includes('t_price'))
  })
}

async function main() {
  await testParseClassifiesRows()
  await testSamePriceIsUnchanged()
  await testDuplicateCodeInFileIsError()
  await testExecuteOverwritesAndKeepsEmptyCells()
  await testExecuteRejectsFileWithErrors()
  await testImportNeedsStylesEditPermission()
  await testUpdateStyleValidatesCmptPrices()
  console.log('style cmpt import tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
