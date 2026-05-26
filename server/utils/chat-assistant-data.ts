import { supabaseAdmin as supabase } from '../db/supabase'
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
  const { data: colors, error: colorError } = await supabase
    .from('colors')
    .select('id')
    .ilike('name', `%${safe}%`)
    .limit(50)
  if (colorError) throw colorError

  const colorIds = (colors ?? []).map(row => row.id as number)
  const filters = [`code.ilike.%${safe}%`, `name.ilike.%${safe}%`]
  if (colorIds.length > 0) filters.push(`color_id.in.(${colorIds.join(',')})`)

  const { data, error } = await supabase
    .from('thread_types')
    .select('id, code, name, tex_number, supplier_id, color_id')
    .is('deleted_at', null)
    .or(filters.join(','))
    .limit(80)
  if (error) throw error

  const threadTypes = ((data ?? []) as ThreadLookup[]).filter(row => matchesChatTex(row, tex))
  const resolvedColorIds = new Set(colorIds)
  for (const thread of threadTypes) {
    if (thread.color_id != null) resolvedColorIds.add(thread.color_id)
  }

  return { threadTypes, colorIds: [...resolvedColorIds] }
}

export async function getChatStock(term: string, tex: string | null): Promise<ChatAssistantStockRow[]> {
  const statuses: ConeStatus[] = ['RECEIVED', 'INSPECTED', 'AVAILABLE']
  const { data, error } = await supabase.rpc('fn_cone_summary_filtered', {
    p_statuses: statuses,
    p_warehouse_ids: null,
    p_supplier_id: null,
    p_material: null,
    p_search: `%${sanitizeSearchTerm(term)}%`,
    p_only_unreserved: true,
  })
  if (error) throw error

  const rows = ((data ?? []) as SummaryRpcRow[]).filter(row => matchesChatTex(row, tex))
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

  const { data: specs, error: specsError } = await supabase
    .from('style_thread_specs')
    .select('id, style_id, process_name, meters_per_unit')
    .in('id', specIds)
  if (specsError) throw specsError

  const specRows = (specs ?? []) as StyleSpecRow[]
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
  const { data, error } = await supabase.from('suppliers').select('id, name').in('id', uniqueIds)
  if (error) throw error
  return new Map((data ?? []).map(row => [row.id as number, row.name as string]))
}

async function fetchColorSpecs(threadTypeIds: number[], colorIds: number[]): Promise<ColorSpecRow[]> {
  const filters = [
    threadTypeIds.length ? `thread_type_id.in.(${threadTypeIds.join(',')})` : null,
    colorIds.length ? `thread_color_id.in.(${colorIds.join(',')})` : null,
  ].filter(Boolean) as string[]
  if (filters.length === 0) return []
  const { data, error } = await supabase
    .from('style_color_thread_specs')
    .select('style_thread_spec_id, style_color_id')
    .or(filters.join(','))
    .limit(200)
  if (error) throw error
  return (data ?? []) as ColorSpecRow[]
}

async function fetchDirectSpecs(threadTypeIds: number[]): Promise<StyleSpecRow[]> {
  if (threadTypeIds.length === 0) return []
  const { data, error } = await supabase
    .from('style_thread_specs')
    .select('id, style_id, process_name, meters_per_unit')
    .in('thread_type_id', threadTypeIds)
    .limit(200)
  if (error) throw error
  return (data ?? []) as StyleSpecRow[]
}

async function usageLookups(specs: StyleSpecRow[], colorSpecs: ColorSpecRow[]) {
  const styleIds = [...new Set(specs.map(row => row.style_id))]
  const styleColorIds = [...new Set(colorSpecs.map(row => row.style_color_id).filter((id): id is number => id != null))]
  const [stylesResult, styleColorsResult] = await Promise.all([
    supabase.from('styles').select('id, style_code, style_name').in('id', styleIds).is('deleted_at', null),
    styleColorIds.length ? supabase.from('style_colors').select('id, color_name').in('id', styleColorIds) : Promise.resolve({ data: [], error: null }),
  ])
  if (stylesResult.error || styleColorsResult.error) throw stylesResult.error || styleColorsResult.error
  return {
    styles: new Map((stylesResult.data ?? []).map(row => [row.id as number, row as StyleRow])),
    styleColors: new Map((styleColorsResult.data ?? []).map(row => [row.id as number, row.color_name as string])),
  }
}
