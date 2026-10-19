import { query } from '../../db/query'
import { MAX_TOOL_ROWS } from '../paging'

export interface ThreadUsageFilter {
  term: string
  tex: string | null
}

export interface UsageSection {
  total: number
  rows: Record<string, unknown>[]
}

const THREAD_MATCH = `(tt.code ILIKE $1 OR tt.name ILIKE $1 OR c.name ILIKE $1)
    AND ($2::text IS NULL OR tt.tex_number = $2 OR tt.tex_number ~ ('(^|[^0-9/])' || $2 || '($|[^0-9/])'))`

const MATCHED_SPECS = `WITH matched AS (
      SELECT DISTINCT sts.style_id, scts.style_color_id
      FROM style_color_thread_specs scts
      JOIN style_thread_specs sts ON sts.id = scts.style_thread_spec_id
      JOIN thread_types tt ON tt.id = scts.thread_type_id
      LEFT JOIN colors c ON c.id = scts.thread_color_id
      WHERE ${THREAD_MATCH}
    )`

export const THREAD_USAGE_SQL = {
  styles: `SELECT st.style_code, st.style_name, sc.color_name AS style_color, sts.process_name,
            s.name AS supplier_name, tt.tex_number, c.name AS thread_color, sts.meters_per_unit,
            COUNT(*) OVER()::int AS total
     FROM style_color_thread_specs scts
     JOIN style_thread_specs sts ON sts.id = scts.style_thread_spec_id
     JOIN styles st ON st.id = sts.style_id AND st.deleted_at IS NULL
     JOIN thread_types tt ON tt.id = scts.thread_type_id
     LEFT JOIN suppliers s ON s.id = tt.supplier_id
     LEFT JOIN colors c ON c.id = scts.thread_color_id
     LEFT JOIN style_colors sc ON sc.id = scts.style_color_id
     WHERE ${THREAD_MATCH}
     ORDER BY st.style_code, sc.color_name, sts.display_order
     LIMIT ${MAX_TOOL_ROWS}`,
  purchaseOrders: `${MATCHED_SPECS}
     SELECT po.po_number, po.customer_name, po.status, po.week, po.delivery_date, st.style_code,
            SUM(pi.quantity)::int AS quantity, COUNT(*) OVER()::int AS total
     FROM po_items pi
     JOIN purchase_orders po ON po.id = pi.po_id
     JOIN styles st ON st.id = pi.style_id
     WHERE pi.deleted_at IS NULL AND po.deleted_at IS NULL
       AND po.status NOT IN ('COMPLETED', 'CANCELLED')
       AND pi.style_id IN (SELECT style_id FROM matched)
     GROUP BY po.id, po.po_number, po.customer_name, po.status, po.week, po.delivery_date, st.style_code
     ORDER BY po.id DESC
     LIMIT ${MAX_TOOL_ROWS}`,
  weeklyOrders: `${MATCHED_SPECS}
     SELECT w.week_name, po.po_number, st.style_code, sc.color_name AS style_color_name,
            SUM(toi.quantity)::int AS quantity, COUNT(*) OVER()::int AS total
     FROM thread_order_items toi
     JOIN thread_order_weeks w ON w.id = toi.week_id
     JOIN styles st ON st.id = toi.style_id
     LEFT JOIN purchase_orders po ON po.id = toi.po_id
     LEFT JOIN style_colors sc ON sc.id = toi.style_color_id
     WHERE w.status = 'CONFIRMED'
       AND EXISTS (
         SELECT 1 FROM matched m
         WHERE m.style_id = toi.style_id
           AND (toi.style_color_id IS NULL OR m.style_color_id IS NULL OR m.style_color_id = toi.style_color_id)
       )
     GROUP BY w.id, w.week_name, po.po_number, st.style_code, sc.color_name
     ORDER BY w.id DESC
     LIMIT ${MAX_TOOL_ROWS}`,
  issued: `SELECT po.po_number, st.style_code, sc.color_name AS style_color_name, s.name AS supplier_name,
            tt.tex_number, c.name AS color_name,
            SUM(l.issued_full)::int AS issued_full, SUM(l.issued_partial)::int AS issued_partial,
            SUM(l.returned_full)::int AS returned_full, SUM(l.returned_partial)::int AS returned_partial,
            MAX(i.created_at) AS last_issued_at, COUNT(*) OVER()::int AS total
     FROM thread_issue_lines l
     JOIN thread_issues i ON i.id = l.issue_id
     JOIN thread_types tt ON tt.id = l.thread_type_id
     LEFT JOIN colors c ON c.id = l.thread_color_id
     LEFT JOIN suppliers s ON s.id = tt.supplier_id
     LEFT JOIN purchase_orders po ON po.id = l.po_id
     LEFT JOIN styles st ON st.id = l.style_id
     LEFT JOIN style_colors sc ON sc.id = l.style_color_id
     WHERE i.status IN ('CONFIRMED', 'RETURNED')
       AND l.issued_full + l.issued_partial > 0
       AND ${THREAD_MATCH}
     GROUP BY po.po_number, st.style_code, sc.color_name, s.name, l.thread_type_id, tt.tex_number, l.thread_color_id, c.name
     ORDER BY MAX(i.created_at) DESC
     LIMIT ${MAX_TOOL_ROWS}`,
}

async function runSection(sql: string, filter: ThreadUsageFilter): Promise<UsageSection> {
  const rows = await query<Record<string, unknown> & { total: number }>(sql, [`%${filter.term}%`, filter.tex])
  return {
    total: rows[0]?.total ?? 0,
    rows: rows.map(({ total: _total, ...rest }) => rest),
  }
}

export const findStyleUsage = (filter: ThreadUsageFilter) => runSection(THREAD_USAGE_SQL.styles, filter)
export const findOpenPurchaseOrders = (filter: ThreadUsageFilter) => runSection(THREAD_USAGE_SQL.purchaseOrders, filter)
export const findWeeklyOrders = (filter: ThreadUsageFilter) => runSection(THREAD_USAGE_SQL.weeklyOrders, filter)
export const findIssuedLines = (filter: ThreadUsageFilter) => runSection(THREAD_USAGE_SQL.issued, filter)
