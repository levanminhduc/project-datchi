import { z } from 'zod'
import { collectPages } from '../paging'
import { AiToolError, defineTool, type AiToolContext } from '../types'

const ISSUE_STATUSES = ['DRAFT', 'CONFIRMED', 'RETURNED'] as const
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const issuesSchema = z.looseObject({
  data: z.looseObject({
    data: z.array(z.looseObject({
      id: z.number(),
      issue_code: z.string(),
      department: z.string(),
      status: z.string(),
      created_by: z.string().nullable(),
      notes: z.string().nullable(),
      created_at: z.string(),
      line_count: z.coerce.number(),
      po_number: z.string().optional(),
      style_code: z.string().optional(),
      color_names: z.array(z.string()).optional(),
    })),
    total: z.number(),
  }),
})

const departmentsSchema = z.looseObject({ data: z.array(z.string()) })

function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase().replace(/\s+/g, ' ').trim()
}

async function resolveDepartment(ctx: AiToolContext, department: string): Promise<string> {
  const { data: departments } = await ctx.get('/api/employees/issue-departments', departmentsSchema)
  const needle = fold(department)
  const exact = departments.find((name) => fold(name) === needle)
  if (exact) return exact
  const candidates = departments.filter((name) => fold(name).includes(needle))
  if (candidates.length === 1) return candidates[0] as string
  if (candidates.length > 1) {
    throw new AiToolError('invalid_input', `Có nhiều bộ phận khớp "${department}": ${candidates.join(', ')}. Hãy chọn đúng một tên.`)
  }
  return department
}

export const searchIssues = defineTool({
  name: 'search_issues',
  description: [
    'Tìm phiếu xuất kho (Xuất kho V2) theo PO, mã hàng, màu hàng, bộ phận nhận, trạng thái hoặc khoảng ngày tạo, mới nhất trước, tối đa 500 phiếu.',
    'department là bộ phận nhận chỉ; created_by là người lập phiếu xuất (người xuất).',
    'Trạng thái: DRAFT là phiếu nháp, chưa xuất chỉ ra; CONFIRMED là đã xuất; RETURNED là đã xuất và đã nhận trả lại.',
    'Dùng issue_id để gọi get_issue_detail xem từng loại chỉ đã xuất.',
  ].join(' '),
  permissions: ['thread.allocations.view', 'thread.issues.return'],
  input: z.object({
    po: z.string().trim().min(1).max(100).optional().describe('Một phần số PO'),
    style: z.string().trim().min(1).max(100).optional().describe('Một phần mã hàng'),
    color: z.string().trim().min(1).max(100).optional().describe('Một phần tên màu hàng'),
    department: z.string().trim().min(1).max(100).optional().describe('Mã hoặc tên bộ phận nhận chỉ, ví dụ XN07'),
    status: z.enum(ISSUE_STATUSES).optional().describe('Trạng thái phiếu'),
    from: z.string().regex(DATE_PATTERN).optional().describe('Từ ngày tạo phiếu, dạng YYYY-MM-DD'),
    to: z.string().regex(DATE_PATTERN).optional().describe('Đến ngày tạo phiếu, dạng YYYY-MM-DD'),
  }),
  run: async (input, ctx) => {
    const filters = new URLSearchParams()
    for (const key of ['po', 'style', 'color', 'status', 'from', 'to'] as const) {
      const value = input[key]
      if (value) filters.set(key, value)
    }
    if (input.department) filters.set('department', await resolveDepartment(ctx, input.department))

    const { rows, total } = await collectPages(async (page, pageSize) => {
      const params = new URLSearchParams(filters)
      params.set('page', String(page))
      params.set('limit', String(pageSize))
      const body = await ctx.get(`/api/issues/v2?${params.toString()}`, issuesSchema)
      return { rows: body.data.data, total: body.data.total }
    })
    return {
      total,
      result: rows.map((issue) => ({
        issue_id: issue.id,
        issue_code: issue.issue_code,
        department: issue.department,
        created_by: issue.created_by,
        status: issue.status,
        created_at: issue.created_at,
        po_number: issue.po_number ?? null,
        style_code: issue.style_code ?? null,
        style_colors: issue.color_names ?? [],
        line_count: issue.line_count,
        notes: issue.notes,
      })),
    }
  },
})
