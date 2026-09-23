import { query } from '../db/query'
import { from } from '../db/sql-builder'
import type { ConeStatus } from '../types/thread'
import type {
  ChatAssistantStockRow,
  ChatAssistantUsageRow,
  ColorSpecRow,
  StyleRow,
  StyleSpecRow,
  SummaryRpcRow,
  ThreadLookup,
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
