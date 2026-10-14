import assert from 'node:assert/strict'
import { z } from 'zod'
import { limitResult, RESULT_LIMIT_BYTES } from './limit-result'
import { buildAiTestApp, callTool, listTools } from './testing'
import { defineTool } from './types'

const echoRows = defineTool({
  name: 'echo_rows',
  description: 'Trả về số dòng theo yêu cầu',
  permissions: ['thread.inventory.view'],
  input: z.object({ count: z.number().int().min(0).max(5000) }),
  run: async (input) => ({
    result: Array.from({ length: input.count }, (_, index) => ({ id: index, note: 'x'.repeat(40) })),
    total: input.count,
  }),
})

const slowTool = defineTool({
  name: 'slow_tool',
  description: 'Chạy lâu hơn giới hạn',
  permissions: [],
  input: z.object({}),
  run: () => new Promise((resolve) => setTimeout(() => resolve({ result: [], total: 0 }), 200)),
})

const tools = [echoRows, slowTool]

async function testMissingConfigReturns503() {
  const saved = process.env.CHATBOT_INTERNAL_TOKEN
  delete process.env.CHATBOT_INTERNAL_TOKEN
  try {
    const { status } = await listTools(buildAiTestApp({ tools }))
    assert.equal(status, 503)
  } finally {
    process.env.CHATBOT_INTERNAL_TOKEN = saved
  }
}

async function testWrongInternalTokenIsRejected() {
  const app = buildAiTestApp({ tools })
  assert.equal((await listTools(app, 'root', 'sai-token')).status, 403)
  assert.equal((await listTools(app, 'root', '')).status, 403)
  assert.equal((await callTool(app, 'echo_rows', { count: 1 }, 'root', 'sai-token')).status, 403)
}

async function testToolListFollowsPermissions() {
  const app = buildAiTestApp({ tools })
  const names = async (user: string) => (await listTools(app, user)).body.data?.tools.map((tool) => tool.name) ?? []
  assert.deepEqual(await names('root'), ['echo_rows', 'slow_tool'])
  assert.deepEqual(await names('kho'), ['echo_rows', 'slow_tool'])
  assert.deepEqual(await names('xem'), ['slow_tool'])

  const { body } = await listTools(app, 'root')
  assert.equal(body.data?.contract_version, 1)
  assert.ok(body.data?.instructions.includes('Loại chỉ'))
  const schema = body.data?.tools[0]?.input_schema
  assert.equal(schema?.type, 'object')
  assert.equal(schema?.$schema, undefined)
}

async function testCallChecksPermissionAgain() {
  const { status, body } = await callTool(buildAiTestApp({ tools }), 'echo_rows', { count: 1 }, 'xem')
  assert.equal(status, 403)
  assert.equal(body.error?.code, 'forbidden')
}

async function testUnknownTool() {
  const { status, body } = await callTool(buildAiTestApp({ tools }), 'khong_co', {})
  assert.equal(status, 404)
  assert.equal(body.error?.code, 'unknown_tool')
}

async function testInvalidInput() {
  const { status, body } = await callTool(buildAiTestApp({ tools }), 'echo_rows', { count: 'abc' })
  assert.equal(status, 400)
  assert.equal(body.error?.code, 'invalid_input')
}

async function testSmallResultIsNotTruncated() {
  const { status, body } = await callTool(buildAiTestApp({ tools }), 'echo_rows', { count: 3 })
  assert.equal(status, 200)
  assert.equal(body.data?.truncated, false)
  assert.equal(body.data?.total, 3)
  assert.equal((body.data?.result as unknown[]).length, 3)
}

async function testLargeResultIsTruncatedButKeepsTotal() {
  const { status, body } = await callTool(buildAiTestApp({ tools }), 'echo_rows', { count: 2000 })
  assert.equal(status, 200)
  assert.equal(body.data?.truncated, true)
  assert.equal(body.data?.total, 2000)
  const rows = body.data?.result as unknown[]
  assert.ok(rows.length > 0 && rows.length < 2000)
  assert.ok(Buffer.byteLength(JSON.stringify(rows)) <= RESULT_LIMIT_BYTES)
}

async function testSlowToolTimesOut() {
  const { status, body } = await callTool(buildAiTestApp({ tools, timeoutMs: 50 }), 'slow_tool', {})
  assert.equal(status, 500)
  assert.equal(body.error?.code, 'upstream_error')
}

function testLimitResultTrimsArraysInsideObject() {
  const big = {
    styles_total: 500,
    styles: Array.from({ length: 500 }, (_, index) => ({ index, text: 'y'.repeat(60) })),
    note: 'giữ nguyên',
  }
  const limited = limitResult(big)
  assert.equal(limited.truncated, true)
  const output = limited.result as Record<string, unknown>
  assert.equal(output.styles_total, 500)
  assert.equal(output.note, 'giữ nguyên')
  assert.ok(Buffer.byteLength(JSON.stringify(output)) <= RESULT_LIMIT_BYTES)
}

async function main() {
  await testMissingConfigReturns503()
  await testWrongInternalTokenIsRejected()
  await testToolListFollowsPermissions()
  await testCallChecksPermissionAgain()
  await testUnknownTool()
  await testInvalidInput()
  await testSmallResultIsNotTruncated()
  await testLargeResultIsTruncatedButKeepsTotal()
  await testSlowToolTimesOut()
  testLimitResultTrimsArraysInsideObject()
  console.log('ai-tools router tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
