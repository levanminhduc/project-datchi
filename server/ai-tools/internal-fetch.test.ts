import assert from 'node:assert/strict'
import { z } from 'zod'
import { createInternalGet, type AppFetch } from './internal-fetch'
import { AiToolError, type AiToolErrorCode } from './types'

const schema = z.looseObject({ data: z.array(z.looseObject({ id: z.number() })) })

function fakeFetch(status: number, body: unknown, seen: Request[] = []): AppFetch {
  return async (request) => {
    seen.push(request)
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  }
}

async function expectCode(task: Promise<unknown>, code: AiToolErrorCode, message?: string) {
  await assert.rejects(task, (err: unknown) => {
    assert.ok(err instanceof AiToolError, 'phải là AiToolError')
    assert.equal(err.code, code)
    if (message) assert.equal(err.message, message)
    return true
  })
}

async function testForwardsAuthorizationAndParses() {
  const seen: Request[] = []
  const get = createInternalGet(fakeFetch(200, { data: [{ id: 1 }], error: null }, seen), 'Bearer abc')
  const body = await get('/api/styles?search=ST', schema)
  assert.deepEqual(body.data, [{ id: 1 }])
  const [request] = seen
  assert.ok(request)
  assert.equal(request.method, 'GET')
  assert.equal(request.headers.get('Authorization'), 'Bearer abc')
  assert.equal(new URL(request.url).pathname, '/api/styles')
  assert.equal(new URL(request.url).searchParams.get('search'), 'ST')
}

async function testMapsStatusCodes() {
  const call = (status: number, body: unknown) => createInternalGet(fakeFetch(status, body), 'Bearer x')('/api/styles', schema)
  await expectCode(call(401, { error: true, message: 'Token không hợp lệ' }), 'unauthorized', 'Token không hợp lệ')
  await expectCode(call(403, { error: true, message: 'Bạn không có quyền thực hiện thao tác này' }), 'forbidden')
  await expectCode(call(400, { data: null, error: 'ID loại chỉ không hợp lệ' }), 'invalid_input', 'ID loại chỉ không hợp lệ')
  await expectCode(call(500, { data: null, error: 'Lỗi hệ thống' }), 'upstream_error')
}

async function testNormalizesErrorEnvelopes() {
  const call = (body: unknown) => createInternalGet(fakeFetch(200, body), 'Bearer x')('/api/styles', schema)
  await expectCode(call({ success: false, data: null, error: 'Không đủ tồn' }), 'upstream_error', 'Không đủ tồn')
  await expectCode(call({ data: null, error: 'Lỗi khi tải' }), 'upstream_error', 'Lỗi khi tải')
}

async function testShapeMismatchIsContractError() {
  const get = createInternalGet(fakeFetch(200, { data: [{ id: 'abc' }], error: null }), 'Bearer x')
  await expectCode(get('/api/styles', schema), 'contract_mismatch')
}

async function testRejectsPathsOutsideAllowlist() {
  const seen: Request[] = []
  const get = createInternalGet(fakeFetch(200, { data: [] }, seen), 'Bearer x')
  await expectCode(get('/api/employees', schema), 'upstream_error')
  await expectCode(get('/api/inventory/summary/by-cone/abc/warehouses', schema), 'upstream_error')
  await expectCode(get('/api/issues/v2/1/return-logs', schema), 'upstream_error')
  await expectCode(get('/api/weekly-orders/1/warehouses', schema), 'upstream_error')
  await expectCode(get('/api/dept-allocations/department-quota', schema), 'upstream_error')
  assert.equal(seen.length, 0, 'đường dẫn ngoài allowlist không được gọi')
}

async function main() {
  await testForwardsAuthorizationAndParses()
  await testMapsStatusCodes()
  await testNormalizesErrorEnvelopes()
  await testShapeMismatchIsContractError()
  await testRejectsPathsOutsideAllowlist()
  console.log('internal-fetch tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
