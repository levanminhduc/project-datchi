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
      permissions: ['thread.issues.create'],
    })
    await next()
  })
  app.route('/', issuesV2Routes)
  return app
}

async function withStubbedPool(
  claimSucceeds: boolean,
  handler: (calls: Recorded[]) => Promise<void>,
) {
  const calls: Recorded[] = []
  const originalQuery = pool.query

  pool.query = (async (text: string, params?: unknown[]) => {
    calls.push({ text, params: params ?? [] })

    if (text.includes('confirming_at = NOW()')) {
      return { rows: claimSucceeds ? [{ id: 90 }] : [] }
    }
    if (text.includes('FROM thread_issues WHERE id')) {
      return { rows: [{ id: 90, status: 'DRAFT', notes: null, department: 'MAY' }] }
    }
    if (text.includes('FROM issue_operations_log')) {
      return { rows: [] }
    }
    if (text.includes('FROM thread_issue_lines WHERE issue_id')) {
      return { rows: [] }
    }
    return { rows: [] }
  }) as unknown as typeof pool.query

  try {
    await handler(calls)
  } finally {
    pool.query = originalQuery
  }
}

function confirm(app: Hono<AppEnv>) {
  return app.request('/90/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idempotency_key: '22222222-3333-4444-8555-666666666666' }),
  })
}

async function testSecondConfirmIsRejectedBeforeDeductingStock() {
  await withStubbedPool(false, async (calls) => {
    const res = await confirm(buildApp())
    assert.equal(res.status, 409, await res.clone().text())

    const payload = (await res.json()) as { error: string | null }
    assert.match(payload.error ?? '', /đang được xác nhận/)

    assert.ok(
      !calls.some((c) => c.text.includes('fn_issue_cones_with_movements')),
      'phiếu đang được xác nhận thì không được trừ kho lần hai',
    )
  })
}

async function testClaimIsReleasedWhenConfirmFails() {
  await withStubbedPool(true, async (calls) => {
    const res = await confirm(buildApp())
    assert.equal(res.status, 400, await res.clone().text())

    assert.ok(
      calls.some((c) => c.text.includes('confirming_at = NOW()')),
      'phải giành quyền xác nhận trước khi xử lý',
    )
    assert.ok(
      calls.some((c) => c.text.includes('confirming_at = NULL')),
      'xác nhận lỗi thì phải nhả khoá để lần sau bấm lại được ngay',
    )
  })
}

async function main() {
  await testSecondConfirmIsRejectedBeforeDeductingStock()
  await testClaimIsReleasedWhenConfirmFails()
  console.log('confirm claim tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
