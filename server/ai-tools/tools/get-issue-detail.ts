import { z } from 'zod'
import { defineTool } from '../types'

const issueSchema = z.looseObject({
  data: z.looseObject({
    id: z.number(),
    issue_code: z.string(),
    department: z.string(),
    status: z.string(),
    created_by: z.string().nullable(),
    notes: z.string().nullable(),
    created_at: z.string(),
    lines: z.array(z.looseObject({
      thread_name: z.string(),
      po_number: z.string().nullish(),
      style_code: z.string().nullish(),
      color_name: z.string().nullable(),
      sub_art_code: z.string().nullable(),
      quota_cones: z.coerce.number().nullable(),
      issued_full: z.coerce.number(),
      issued_partial: z.coerce.number(),
      returned_full: z.coerce.number(),
      returned_partial: z.coerce.number(),
      issued_equivalent: z.coerce.number(),
      is_over_quota: z.boolean(),
      over_quota_notes: z.string().nullable(),
    })),
  }),
})

export const getIssueDetail = defineTool({
  name: 'get_issue_detail',
  description: [
    'Chi tiết một phiếu xuất kho (Xuất kho V2): bộ phận nhận, người lập phiếu (người xuất), trạng thái, và từng dòng loại chỉ đã xuất theo PO, mã hàng, màu hàng.',
    'thread_name có dạng "NCC - Tex - màu chỉ". issued_full/issued_partial là cuộn nguyên/cuộn lẻ đã xuất; returned_* là số đã trả lại;',
    'issued_equivalent là số cuộn quy đổi; quota_cones là định mức cuộn của dòng (null là không giới hạn); is_over_quota cho biết xuất vượt định mức.',
  ].join(' '),
  permissions: ['thread.allocations.view', 'thread.issues.return'],
  input: z.object({
    issue_id: z.number().int().positive().describe('issue_id lấy từ search_issues'),
  }),
  run: async (input, ctx) => {
    const { data: issue } = await ctx.get(`/api/issues/v2/${input.issue_id}`, issueSchema)
    return {
      total: issue.lines.length,
      result: {
        issue_id: issue.id,
        issue_code: issue.issue_code,
        department: issue.department,
        created_by: issue.created_by,
        status: issue.status,
        created_at: issue.created_at,
        notes: issue.notes,
        lines: issue.lines.map((line) => ({
          thread: line.thread_name,
          po_number: line.po_number ?? null,
          style_code: line.style_code ?? null,
          style_color: line.color_name,
          sub_art: line.sub_art_code,
          quota_cones: line.quota_cones,
          issued_full: line.issued_full,
          issued_partial: line.issued_partial,
          returned_full: line.returned_full,
          returned_partial: line.returned_partial,
          issued_equivalent: line.issued_equivalent,
          is_over_quota: line.is_over_quota,
          over_quota_notes: line.over_quota_notes,
        })),
      },
    }
  },
})
