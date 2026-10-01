import { query } from '../db/query'
import { from } from '../db/sql-builder'
import type { ConeStatus } from '../types/thread'
import type {
  ChatAssistantStockRow,
  ChatAssistantThreadOrders,
  ChatAssistantUsageRow,
  ChatAssistantWarehouseStockRow,
  ColorSpecRow,
  StyleRow,
  StyleSpecRow,
  SummaryRpcRow,
  ThreadLookup,
  WarehouseStockQueryRow,
} from '../types/chat-assistant'
import { matchesChatTex, sanitizeSearchTerm } from './chat-assistant-parser'

export async function resolveChatThreadRefs(term: string, tex: string | null) {
  const safe = sanitizeSearchTerm(term)
  const colors = await query<{ id: number }>(
    `SELECT id FROM colors WHERE name ILIKE $1 LIMIT 50`,
    [`%${safe}%`]
  )

  const colorIds = colors.map(row => row.id as number)

  const orParts: string[] = []
  const params: unknown[] = []
  params.push(`%${safe}%`)
  orParts.push(`code ILIKE $${params.length}`)
  params.push(`%${safe}%`)
  orParts.push(`name ILIKE $${params.length}`)
  if (colorIds.length > 0) {
    params.push(colorIds)
    orParts.push(`color_id = ANY($${params.length})`)
  }

  const data = await query<ThreadLookup>(
    `SELECT id, code, name, tex_number, supplier_id, color_id
     FROM thread_types
     WHERE deleted_at IS NULL AND (${orParts.join(' OR ')})
     LIMIT 80`,
    params
  )

  const threadTypes = data.filter(row => matchesChatTex(row, tex))
  const resolvedColorIds = new Set(colorIds)
  for (const thread of threadTypes) {
    if (thread.color_id != null) resolvedColorIds.add(thread.color_id)
  }

  return { threadTypes, colorIds: [...resolvedColorIds] }
}

export async function getChatStock(term: string, tex: string | null): Promise<ChatAssistantStockRow[]> {
  const statuses: ConeStatus[] = ['RECEIVED', 'INSPECTED', 'AVAILABLE']
  const data = await query<SummaryRpcRow>(
    'SELECT * FROM fn_cone_summary_filtered($1, $2, $3, $4, $5, $6)',
    [statuses, null, null, null, `%${sanitizeSearchTerm(term)}%`, true]
  )

  const rows = data.filter(row => matchesChatTex(row, tex))
  const suppliers = await supplierNames(rows.map(row => row.supplier_id))
  return rows.map(row => ({
    thread_type_id: row.thread_type_id,
    thread_code: row.thread_code,
    thread_name: row.thread_name,
    supplier_name: row.supplier_id ? suppliers.get(row.supplier_id) ?? null : null,
    tex_number: row.tex_number != null ? String(row.tex_number) : null,
    color_name: row.color_name,
    available_full_cones: Number(row.full_cones) || 0,
    available_partial_cones: Number(row.partial_cones) || 0,
    partial_meters: Number(row.partial_meters) || 0,
    partial_weight_grams: Number(row.partial_weight_grams) || 0,
  }))
}

export async function getChatStockByWarehouse(
  term: string,
  tex: string | null,
  warehouse: string | null,
): Promise<ChatAssistantWarehouseStockRow[]> {
  const safeWarehouse = warehouse ? sanitizeSearchTerm(warehouse) : ''
  const data = await query<WarehouseStockQueryRow>(
    `SELECT pw.name AS location_name, w.name AS warehouse_name, s.name AS supplier_name,
            tt.tex_number, c.name AS color_name,
            COUNT(*) FILTER (WHERE ti.status <> 'RESERVED_FOR_ORDER' AND NOT ti.is_partial) AS full_cones,
            COUNT(*) FILTER (WHERE ti.status <> 'RESERVED_FOR_ORDER' AND ti.is_partial) AS partial_cones,
            COALESCE(SUM(ti.quantity_meters) FILTER (WHERE ti.status <> 'RESERVED_FOR_ORDER' AND ti.is_partial), 0) AS partial_meters,
            COUNT(*) FILTER (WHERE ti.status = 'RESERVED_FOR_ORDER') AS reserved_cones
     FROM thread_inventory ti
     JOIN thread_types tt ON tt.id = ti.thread_type_id
     JOIN warehouses w ON w.id = ti.warehouse_id
     LEFT JOIN warehouses pw ON pw.id = w.parent_id
     LEFT JOIN colors c ON c.id = ti.color_id
     LEFT JOIN suppliers s ON s.id = tt.supplier_id
     WHERE ti.status = ANY($1)
       AND (tt.code ILIKE $2 OR tt.name ILIKE $2 OR c.name ILIKE $2)
       AND ($3::text IS NULL OR w.name ILIKE $3 OR w.code ILIKE $3 OR pw.name ILIKE $3 OR pw.code ILIKE $3)
       AND ($4::text IS NULL OR tt.tex_number = $4)
     GROUP BY pw.name, w.id, w.name, w.sort_order, s.name, ti.thread_type_id, tt.tex_number, ti.color_id, c.name
     ORDER BY w.sort_order, w.name, tt.tex_number, c.name
     LIMIT 80`,
    [
      ['RECEIVED', 'INSPECTED', 'AVAILABLE', 'RESERVED_FOR_ORDER'],
      `%${sanitizeSearchTerm(term)}%`,
      safeWarehouse ? `%${safeWarehouse}%` : null,
      tex ? sanitizeSearchTerm(tex) || null : null,
    ]
  )

  return data.map(row => ({
    location_name: row.location_name,
    warehouse_name: row.warehouse_name,
    supplier_name: row.supplier_name,
    tex_number: row.tex_number != null ? String(row.tex_number) : null,
    color_name: row.color_name,
    available_full_cones: Number(row.full_cones) || 0,
    available_partial_cones: Number(row.partial_cones) || 0,
    partial_meters: Number(row.partial_meters) || 0,
    reserved_cones: Number(row.reserved_cones) || 0,
  }))
}

export async function getChatThreadOrders(term: string, tex: string | null): Promise<ChatAssistantThreadOrders> {
  const safeTex = tex ? sanitizeSearchTerm(tex) : ''
  const params = [`%${sanitizeSearchTerm(term)}%`, safeTex || null]
  const threadMatch = `(tt.code ILIKE $1 OR tt.name ILIKE $1 OR c.name ILIKE $1)
    AND ($2::text IS NULL OR tt.tex_number = $2)`
  const matchedSpecs = `WITH matched AS (
      SELECT DISTINCT sts.style_id, scts.style_color_id
      FROM style_color_thread_specs scts
      JOIN style_thread_specs sts ON sts.id = scts.style_thread_spec_id
      JOIN thread_types tt ON tt.id = scts.thread_type_id
      LEFT JOIN colors c ON c.id = scts.thread_color_id
      WHERE ${threadMatch}
    )`

  const [purchaseOrders, weeklyOrders, issued] = await Promise.all([
    query<ChatAssistantThreadOrders['purchase_orders']['rows'][number] & { total: number }>(
      `${matchedSpecs}
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
       LIMIT 20`,
      params
    ),
    query<ChatAssistantThreadOrders['weekly_orders']['rows'][number] & { total: number }>(
      `${matchedSpecs}
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
       LIMIT 20`,
      params
    ),
    query<ChatAssistantThreadOrders['issued']['rows'][number] & { total: number }>(
      `SELECT po.po_number, st.style_code, sc.color_name AS style_color_name, s.name AS supplier_name,
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
       WHERE i.status = 'CONFIRMED'
         AND l.issued_full + l.issued_partial > 0
         AND ${threadMatch}
       GROUP BY po.po_number, st.style_code, sc.color_name, s.name, l.thread_type_id, tt.tex_number, l.thread_color_id, c.name
       ORDER BY MAX(i.created_at) DESC
       LIMIT 20`,
      params
    ),
  ])

  const strip = <T extends { total: number }>(rows: T[]) => ({
    total: rows[0]?.total ?? 0,
    rows: rows.map(({ total: _total, ...rest }) => rest),
  })

  return {
    purchase_orders: strip(purchaseOrders),
    weekly_orders: strip(weeklyOrders),
    issued: strip(issued),
  }
}

export async function getChatUsage(threadTypeIds: number[], colorIds: number[]): Promise<ChatAssistantUsageRow[]> {
  const colorRows = await fetchColorSpecs(threadTypeIds, colorIds)
  const directRows = await fetchDirectSpecs(threadTypeIds)
  const colorSpecIds = new Set(colorRows.map(row => row.style_thread_spec_id))
  const specIds = [...new Set([...colorSpecIds, ...directRows.map(row => row.id)])]
  if (specIds.length === 0) return []

  const specs = await query<StyleSpecRow>(
    `SELECT id, style_id, process_name, meters_per_unit
     FROM style_thread_specs
     WHERE id = ANY($1)`,
    [specIds]
  )

  const specRows = specs as StyleSpecRow[]
  const specMap = new Map(specRows.map(row => [row.id, row]))
  const { styles, styleColors } = await usageLookups(specRows, colorRows)
  const usage = new Map<string, ChatAssistantUsageRow>()

  const add = (spec: StyleSpecRow, styleColorId: number | null) => {
    const style = styles.get(spec.style_id)
    if (!style) return
    const key = `${style.id}|${styleColorId ?? 'all'}`
    const current = usage.get(key) ?? {
      style_id: style.id,
      style_code: style.style_code,
      style_name: style.style_name,
      style_color_name: styleColorId ? styleColors.get(styleColorId) ?? null : null,
      process_names: [],
      meters_per_unit: 0,
    }
    if (spec.process_name && !current.process_names.includes(spec.process_name)) current.process_names.push(spec.process_name)
    current.meters_per_unit += Number(spec.meters_per_unit) || 0
    usage.set(key, current)
  }

  for (const row of colorRows) {
    const spec = specMap.get(row.style_thread_spec_id)
    if (spec) add(spec, row.style_color_id)
  }
  for (const spec of directRows) {
    if (!colorSpecIds.has(spec.id)) add(spec, null)
  }

  return [...usage.values()].sort((a, b) => a.style_code.localeCompare(b.style_code, 'vi')).slice(0, 30)
}

async function supplierNames(ids: Array<number | null>): Promise<Map<number, string>> {
  const uniqueIds = [...new Set(ids.filter((id): id is number => id != null))]
  if (uniqueIds.length === 0) return new Map()
  const data = await query<{ id: number; name: string }>(
    `SELECT id, name FROM suppliers WHERE id = ANY($1)`,
    [uniqueIds]
  )
  return new Map(data.map(row => [row.id as number, row.name as string]))
}

async function fetchColorSpecs(threadTypeIds: number[], colorIds: number[]): Promise<ColorSpecRow[]> {
  const orParts: string[] = []
  const params: unknown[] = []
  if (threadTypeIds.length) {
    params.push(threadTypeIds)
    orParts.push(`thread_type_id = ANY($${params.length})`)
  }
  if (colorIds.length) {
    params.push(colorIds)
    orParts.push(`thread_color_id = ANY($${params.length})`)
  }
  if (orParts.length === 0) return []
  const data = await query<ColorSpecRow>(
    `SELECT style_thread_spec_id, style_color_id
     FROM style_color_thread_specs
     WHERE (${orParts.join(' OR ')})
     LIMIT 200`,
    params
  )
  return data as ColorSpecRow[]
}

export async function getChatStyles(search: string, limit = 10): Promise<Array<{ id: number; style_code: string; style_name: string | null; fabric_type: string | null }>> {
  const safe = sanitizeSearchTerm(search)
  if (!safe) return []
  const data = await query<{ id: number; style_code: string; style_name: string | null; fabric_type: string | null }>(
    `SELECT id, style_code, style_name, fabric_type
     FROM styles
     WHERE deleted_at IS NULL AND (style_code ILIKE $1 OR style_name ILIKE $1)
     ORDER BY style_code ASC
     LIMIT $2`,
    [`%${safe}%`, Math.min(limit, 20)]
  )
  return data as Array<{ id: number; style_code: string; style_name: string | null; fabric_type: string | null }>
}

export async function getChatPurchaseOrders(params: {
  po_number?: string
  customer_name?: string
  status?: string
  limit?: number
}): Promise<Array<{ id: number; po_number: string; customer_name: string | null; status: string; order_date: string | null; delivery_date: string | null; week: string | null }>> {
  const builder = from('purchase_orders')
    .select('id, po_number, customer_name, status, order_date, delivery_date, week')
    .is('deleted_at', null)

  if (params.po_number) {
    builder.ilike('po_number', `%${sanitizeSearchTerm(params.po_number)}%`)
  }
  if (params.customer_name) {
    builder.ilike('customer_name', `%${sanitizeSearchTerm(params.customer_name)}%`)
  }
  if (params.status) {
    builder.eq('status', params.status)
  }

  builder.order({ column: 'created_at', ascending: false }).limit(Math.min(params.limit ?? 10, 20))

  const data = await builder.list<{ id: number; po_number: string; customer_name: string | null; status: string; order_date: string | null; delivery_date: string | null; week: string | null }>()
  return data
}

async function fetchDirectSpecs(threadTypeIds: number[]): Promise<StyleSpecRow[]> {
  if (threadTypeIds.length === 0) return []
  const data = await query<StyleSpecRow>(
    `SELECT id, style_id, process_name, meters_per_unit
     FROM style_thread_specs
     WHERE thread_type_id = ANY($1)
     LIMIT 200`,
    [threadTypeIds]
  )
  return data as StyleSpecRow[]
}

async function usageLookups(specs: StyleSpecRow[], colorSpecs: ColorSpecRow[]) {
  const styleIds = [...new Set(specs.map(row => row.style_id))]
  const styleColorIds = [...new Set(colorSpecs.map(row => row.style_color_id).filter((id): id is number => id != null))]
  const [stylesData, styleColorsData] = await Promise.all([
    query<StyleRow>(
      `SELECT id, style_code, style_name FROM styles WHERE id = ANY($1) AND deleted_at IS NULL`,
      [styleIds]
    ),
    styleColorIds.length
      ? query<{ id: number; color_name: string }>(
          `SELECT id, color_name FROM style_colors WHERE id = ANY($1)`,
          [styleColorIds]
        )
      : Promise.resolve([] as Array<{ id: number; color_name: string }>),
  ])
  return {
    styles: new Map(stylesData.map(row => [row.id as number, row as StyleRow])),
    styleColors: new Map(styleColorsData.map(row => [row.id as number, row.color_name as string])),
  }
}
