import assert from 'node:assert/strict'
import { buildAiTestApp, callTool, listTools, withStubbedPool } from '../testing'

function issuesResponder(text: string): Record<string, unknown>[] {
  if (text.includes('"employees"')) return [{ department: 'Tổ May 1' }, { department: 'Tổ May 2' }, { department: 'Cắt' }]
  if (text.includes('count(*)::int AS count FROM thread_issues ti')) return [{ count: 1 }]
  if (text.includes('SELECT ti.*')) {
    return [{
      id: 77, issue_code: 'XK2-20261015-001', department: 'Tổ May 1', status: 'CONFIRMED', created_by: 'Lê Văn C',
      notes: null, created_at: '2026-10-15T02:00:00.000Z', line_count: [{ count: 2 }],
    }]
  }
  if (text.includes('WHERE til.issue_id = ANY($1)')) {
    return [{
      issue_id: 77, purchase_orders: { po_number: 'PO-2026-001' }, styles: { style_code: 'ST-001' },
      sub_arts: null, style_colors: { color_name: 'Đen' }, colors: null,
    }]
  }
  return []
}

async function testSearchIssuesResolvesDepartment() {
  await withStubbedPool(issuesResponder, async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'search_issues', { department: 'to may 1', po: 'PO-2026' }, 'xuatkho')
    assert.equal(status, 200, JSON.stringify(body))
    assert.equal(body.data?.total, 1)
    assert.deepEqual(body.data?.result, [{
      issue_id: 77, issue_code: 'XK2-20261015-001', department: 'Tổ May 1', created_by: 'Lê Văn C', status: 'CONFIRMED',
      created_at: '2026-10-15T02:00:00.000Z', po_number: 'PO-2026-001', style_code: 'ST-001', style_colors: ['Đen'],
      line_count: 2, notes: null,
    }])
    const list = calls.find((call) => call.text.includes('SELECT ti.*'))
    assert.ok(list)
    assert.ok(list.params.includes('Tổ May 1'))
  })
}

async function testSearchIssuesAmbiguousDepartment() {
  await withStubbedPool(issuesResponder, async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'search_issues', { department: 'may' }, 'xuatkho')
    assert.equal(status, 400)
    assert.equal(body.error?.code, 'invalid_input')
    assert.ok(body.error?.message.includes('Tổ May 1'))
    assert.ok(!calls.some((call) => call.text.includes('SELECT ti.*')))
  })
}

async function testGetIssueDetail() {
  const responder = (text: string): Record<string, unknown>[] => {
    if (text.includes('SELECT * FROM thread_issues WHERE id = $1')) {
      return [{
        id: 77, issue_code: 'XK2-20261015-001', department: 'Tổ May 1', status: 'CONFIRMED', created_by: 'Lê Văn C',
        notes: null, created_at: '2026-10-15T02:00:00.000Z',
      }]
    }
    if (text.includes('til.*')) {
      return [{
        id: 1, issue_id: 77, po_id: 9, style_id: 5, style_color_id: 3, color_id: null, thread_type_id: 10, thread_color_id: 100,
        quota_cones: '4.00', issued_full: 4, issued_partial: 1, returned_full: 0, returned_partial: 0, over_quota_notes: 'Hư cuộn',
        thread_types: { id: 10, code: 'EP40', name: 'Epic 40', supplier_id: 1, tex_number: '40', tex_label: null },
        purchase_orders: { id: 9, po_number: 'PO-2026-001' }, styles: { id: 5, style_code: 'ST-001', style_name: 'Áo polo nam' },
        style_colors: { id: 3, color_name: 'Đen' }, colors: null, sub_arts: null,
      }]
    }
    if (text.includes('FROM system_settings')) return [{ value: 0.3 }]
    if (text.includes('SELECT id, name FROM suppliers')) return [{ id: 1, name: 'Coats' }]
    if (text.includes('SELECT id, name FROM colors')) return [{ id: 100, name: 'C9700' }]
    return []
  }
  await withStubbedPool(responder, async () => {
    const { status, body } = await callTool(buildAiTestApp(), 'get_issue_detail', { issue_id: 77 }, 'xuatkho')
    assert.equal(status, 200, JSON.stringify(body))
    const result = body.data?.result as { created_by: string; lines: Array<Record<string, unknown>> }
    assert.equal(result.created_by, 'Lê Văn C')
    assert.deepEqual(result.lines, [{
      thread: 'Coats - TEX 40 - C9700', po_number: 'PO-2026-001', style_code: 'ST-001', style_color: 'Đen', sub_art: null,
      quota_cones: 4, issued_full: 4, issued_partial: 1, returned_full: 0, returned_partial: 0, issued_equivalent: 4.3,
      is_over_quota: true, over_quota_notes: 'Hư cuộn',
    }])
  })
}

function deptResponder(text: string): Record<string, unknown>[] {
  if (text.includes('FROM thread_order_items toi')) return [{ quantity: 1000 }]
  if (text.includes('SELECT id, department, product_quantity')) return [{ id: 1, department: 'Tổ May 1', product_quantity: 600 }]
  if (text.includes('SELECT allocation_id FROM dept_product_allocation_logs')) return [{ allocation_id: 1 }]
  if (text.includes('SELECT dpal.*')) {
    return [{
      id: 5, allocation_id: 1, added_quantity: 600, total_after: 600, created_by: 'Phạm D', created_at: '2026-10-14T01:00:00.000Z',
      dept_product_allocations: { po_id: 9, style_id: 5, style_color_id: 3, department: 'Tổ May 1', deleted_at: null },
    }]
  }
  return []
}

async function testGetDeptAllocation() {
  await withStubbedPool(deptResponder, async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'get_dept_allocation', { po_id: 9, style_id: 5, style_color_id: 3 })
    assert.equal(status, 200, JSON.stringify(body))
    assert.deepEqual(body.data?.result, {
      total_product_quantity: 1000, total_allocated: 600, remaining: 400,
      departments: [{ department: 'Tổ May 1', product_quantity: 600 }],
      logs_total: 1,
      logs: [{ department: 'Tổ May 1', added_quantity: 600, total_after: 600, created_by: 'Phạm D', created_at: '2026-10-14T01:00:00.000Z' }],
    })
    const summary = calls.find((call) => call.text.includes('FROM thread_order_items toi'))
    assert.deepEqual(summary?.params, [9, 5, 3])
  })
}

async function testDeptAllocationNeedsManagePermission() {
  await withStubbedPool(deptResponder, async (calls) => {
    const { status } = await callTool(buildAiTestApp(), 'get_dept_allocation', { po_id: 9, style_id: 5, style_color_id: 3 }, 'kho')
    assert.equal(status, 403)
    assert.equal(calls.length, 0)
  })
}

async function testDeptAllocationHiddenWithoutWeekAccess() {
  await withStubbedPool(deptResponder, async (calls) => {
    const { body } = await listTools(buildAiTestApp(), 'phanbo')
    const names = body.data?.tools.map((tool) => tool.name) ?? []
    assert.ok(!names.includes('get_dept_allocation'))
    assert.ok(!names.includes('get_weekly_order'))
    const { status } = await callTool(buildAiTestApp(), 'get_dept_allocation', { po_id: 9, style_id: 5, style_color_id: 3 }, 'phanbo')
    assert.equal(status, 403)
    assert.equal(calls.length, 0)
  })
}

async function testIssueToolsNeedReturnPermission() {
  await withStubbedPool(issuesResponder, async (calls) => {
    assert.equal((await callTool(buildAiTestApp(), 'search_issues', {}, 'kho')).status, 403)
    assert.equal(calls.length, 0)
  })
}

async function main() {
  await testSearchIssuesResolvesDepartment()
  await testSearchIssuesAmbiguousDepartment()
  await testGetIssueDetail()
  await testIssueToolsNeedReturnPermission()
  await testGetDeptAllocation()
  await testDeptAllocationNeedsManagePermission()
  await testDeptAllocationHiddenWithoutWeekAccess()
  console.log('ai-tools issue tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
