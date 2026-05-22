import { Hono, type Context } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'
import type { AppEnv } from '../types/hono-env'

const styleThreadSpecs = new Hono<AppEnv>()

const AUDIT_IGNORE_FIELDS = new Set([
  'id', 'created_at', 'updated_at', 'created_by', 'updated_by',
])

async function resolvePerformer(c: Context<AppEnv>): Promise<string> {
  const auth = c.get('auth')
  if (!auth?.employeeId) return 'system'
  const { data } = await supabase
    .from('employees')
    .select('full_name')
    .eq('id', auth.employeeId)
    .single()
  return data?.full_name || `employee#${auth.employeeId}`
}

type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'

interface LogAuditInput {
  tableName: 'style_thread_specs' | 'style_color_thread_specs'
  recordId: number
  action: AuditAction
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  performedBy: string
  /**
   * Whitelist of fields the user directly intended to update.
   * If provided, changed_fields is intersected with this list so cascade
   * side-effects (e.g. clearing thread_type_id when supplier changes) are
   * NOT recorded as user edits.
   */
  userTouchedFields?: string[]
}

function stripJoinedFields(row: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!row) return null
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) {
      out[k] = v
    }
  }
  return out
}

async function logAudit(args: LogAuditInput): Promise<void> {
  const oldClean = stripJoinedFields(args.oldValues)
  const newClean = stripJoinedFields(args.newValues)
  let changedFields: string[] | null = null
  if (args.action === 'UPDATE' && oldClean && newClean) {
    const allKeys = args.userTouchedFields
      ? args.userTouchedFields.filter(k => !AUDIT_IGNORE_FIELDS.has(k))
      : Object.keys({ ...oldClean, ...newClean }).filter(k => !AUDIT_IGNORE_FIELDS.has(k))
    changedFields = allKeys.filter((k) => {
      return JSON.stringify(oldClean[k]) !== JSON.stringify(newClean[k])
    })
    if (changedFields.length === 0) return
  }
  const { error } = await supabase.from('thread_audit_log').insert({
    table_name: args.tableName,
    record_id: args.recordId,
    action: args.action,
    old_values: oldClean,
    new_values: newClean,
    changed_fields: changedFields,
    performed_by: args.performedBy,
  })
  if (error) console.error('[styleThreadSpecs] audit log insert failed:', error)
}

interface RawAuditRow {
  id: number
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  performed_by: string | null
  created_at: string
  changed_fields: string[] | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
}

interface AuditEnriched {
  id: number
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  performed_by: string | null
  created_at: string
  summary: string | null
  changes: Array<{ field: string; label: string; old: string; new: string }> | null
}

const FIELD_LABELS_SERVER: Record<string, string> = {
  process_name: 'Công đoạn',
  supplier_id: 'NCC',
  thread_type_id: 'Loại chỉ (Tex)',
  meters_per_unit: 'Mét/SP',
  notes: 'Ghi chú',
  display_order: 'Thứ tự',
  thread_color_id: 'Màu chỉ',
  style_color_id: 'Mã màu hàng',
  style_id: 'Mã hàng',
  color_id: 'Màu',
}

function collectIds(
  rows: RawAuditRow[],
  fields: string[],
): Set<number> {
  const ids = new Set<number>()
  for (const row of rows) {
    for (const f of fields) {
      const oldV = row.old_values?.[f]
      const newV = row.new_values?.[f]
      if (typeof oldV === 'number') ids.add(oldV)
      if (typeof newV === 'number') ids.add(newV)
    }
  }
  return ids
}

function formatTex(tt: { tex_number?: string | null; tex_label?: string | null } | undefined): string {
  if (!tt) return ''
  const num = tt.tex_number?.trim()
  const lbl = tt.tex_label?.trim()
  if (num && lbl) return `${num} - ${lbl}`
  if (num) return `Tex ${num}`
  if (lbl) return lbl
  return ''
}

async function buildLookups(rows: RawAuditRow[]) {
  const supplierIds = collectIds(rows, ['supplier_id'])
  const threadTypeIds = collectIds(rows, ['thread_type_id'])
  const colorIds = collectIds(rows, ['thread_color_id', 'color_id'])
  const styleColorIds = collectIds(rows, ['style_color_id'])

  const suppliers = new Map<number, string>()
  const threadTypes = new Map<number, string>()
  const colors = new Map<number, string>()
  const styleColors = new Map<number, string>()

  if (supplierIds.size > 0) {
    const { data } = await supabase
      .from('suppliers')
      .select('id, name')
      .in('id', [...supplierIds])
    for (const r of data ?? []) suppliers.set(r.id, r.name)
  }
  if (threadTypeIds.size > 0) {
    const { data } = await supabase
      .from('thread_types')
      .select('id, tex_number, tex_label, name, suppliers:supplier_id(name)')
      .in('id', [...threadTypeIds])
    for (const r of data ?? []) {
      const tex = formatTex(r)
      const sup = (r as { suppliers?: { name?: string } | null }).suppliers?.name
      threadTypes.set(r.id, [sup, tex].filter(Boolean).join(' - ') || r.name || String(r.id))
    }
  }
  if (colorIds.size > 0) {
    const { data } = await supabase
      .from('colors')
      .select('id, name')
      .in('id', [...colorIds])
    for (const r of data ?? []) colors.set(r.id, r.name)
  }
  if (styleColorIds.size > 0) {
    const { data } = await supabase
      .from('style_colors')
      .select('id, color_name')
      .in('id', [...styleColorIds])
    for (const r of data ?? []) styleColors.set(r.id, r.color_name)
  }

  return { suppliers, threadTypes, colors, styleColors }
}

type Lookups = Awaited<ReturnType<typeof buildLookups>>

function renderValue(field: string, value: unknown, l: Lookups): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'number') {
    if (field === 'supplier_id') return l.suppliers.get(value) ?? `#${value}`
    if (field === 'thread_type_id') return l.threadTypes.get(value) ?? `#${value}`
    if (field === 'thread_color_id' || field === 'color_id') return l.colors.get(value) ?? `#${value}`
    if (field === 'style_color_id') return l.styleColors.get(value) ?? `#${value}`
    if (field === 'meters_per_unit') return `${value.toFixed(2)} m`
    return String(value)
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function summaryFor(
  tableName: 'style_thread_specs' | 'style_color_thread_specs',
  values: Record<string, unknown>,
  l: Lookups,
): string {
  if (tableName === 'style_thread_specs') {
    const parts = [
      values.process_name ? String(values.process_name) : null,
      renderValue('supplier_id', values.supplier_id, l) !== '—' ? renderValue('supplier_id', values.supplier_id, l) : null,
      renderValue('thread_type_id', values.thread_type_id, l) !== '—' ? renderValue('thread_type_id', values.thread_type_id, l) : null,
      renderValue('meters_per_unit', values.meters_per_unit, l) !== '—' ? renderValue('meters_per_unit', values.meters_per_unit, l) : null,
    ].filter(Boolean)
    return parts.join(' · ')
  }
  const parts = [
    renderValue('style_color_id', values.style_color_id, l) !== '—' ? `Màu hàng: ${renderValue('style_color_id', values.style_color_id, l)}` : null,
    renderValue('thread_type_id', values.thread_type_id, l) !== '—' ? renderValue('thread_type_id', values.thread_type_id, l) : null,
    renderValue('thread_color_id', values.thread_color_id, l) !== '—' ? `Màu chỉ: ${renderValue('thread_color_id', values.thread_color_id, l)}` : null,
  ].filter(Boolean)
  return parts.join(' · ')
}

async function enrichAuditEntries(
  tableName: 'style_thread_specs' | 'style_color_thread_specs',
  rows: RawAuditRow[],
): Promise<AuditEnriched[]> {
  const lookups = await buildLookups(rows)

  return rows.map((row) => {
    let summary: string | null = null
    let changes: AuditEnriched['changes'] = null

    if (row.action === 'INSERT' && row.new_values) {
      summary = summaryFor(tableName, row.new_values, lookups)
    } else if (row.action === 'DELETE' && row.old_values) {
      summary = summaryFor(tableName, row.old_values, lookups)
    } else if (row.action === 'UPDATE' && row.changed_fields) {
      const isJoinObj = (v: unknown) => v !== null && typeof v === 'object' && !Array.isArray(v)
      changes = row.changed_fields
        .filter((field) => {
          const oldV = row.old_values?.[field]
          const newV = row.new_values?.[field]
          return !isJoinObj(oldV) && !isJoinObj(newV)
        })
        .map((field) => ({
          field,
          label: FIELD_LABELS_SERVER[field] ?? field,
          old: renderValue(field, row.old_values?.[field], lookups),
          new: renderValue(field, row.new_values?.[field], lookups),
        }))
    }

    return {
      id: row.id,
      action: row.action,
      performed_by: row.performed_by,
      created_at: row.created_at,
      summary,
      changes,
    }
  })
}

async function ensureColorSpecs(
  specId: number,
  styleId: number,
  threadTypeId: number | null,
  performedBy: string,
) {
  if (!threadTypeId) return

  const { data: styleColors } = await supabase
    .from('style_colors')
    .select('id')
    .eq('style_id', styleId)

  if (!styleColors || styleColors.length === 0) return

  const { data: existing } = await supabase
    .from('style_color_thread_specs')
    .select('*')
    .eq('style_thread_spec_id', specId)

  const existingColorIds = new Set((existing || []).map(e => e.style_color_id))
  const missing = styleColors.filter(sc => !existingColorIds.has(sc.id))

  if (missing.length > 0) {
    const { data: inserted } = await supabase
      .from('style_color_thread_specs')
      .insert(missing.map(sc => ({
        style_thread_spec_id: specId,
        style_color_id: sc.id,
        thread_type_id: threadTypeId,
        created_by: performedBy,
        updated_by: performedBy,
      })))
      .select('*')

    for (const row of inserted ?? []) {
      await logAudit({
        tableName: 'style_color_thread_specs',
        recordId: row.id,
        action: 'INSERT',
        oldValues: null,
        newValues: row,
        performedBy,
      })
    }
  }

  if (existing && existing.length > 0) {
    const stale = existing.filter(e => e.thread_type_id !== threadTypeId)

    if (stale.length > 0) {
      const staleIds = stale.map(s => s.id)
      const { data: updated } = await supabase
        .from('style_color_thread_specs')
        .update({
          thread_type_id: threadTypeId,
          updated_at: new Date().toISOString(),
          updated_by: performedBy,
        })
        .in('id', staleIds)
        .select('*')

      for (const newRow of updated ?? []) {
        const oldRow = stale.find(s => s.id === newRow.id)
        if (!oldRow) continue
        await logAudit({
          tableName: 'style_color_thread_specs',
          recordId: newRow.id,
          action: 'UPDATE',
          oldValues: oldRow,
          newValues: newRow,
          performedBy,
          userTouchedFields: ['thread_type_id'],
        })
      }
    }
  }
}

/**
 * GET /api/style-thread-specs - List all style thread specs with optional filtering
 */
styleThreadSpecs.get('/', requirePermission('thread.styles.view'), async (c) => {
  try {
    const query = c.req.query()
    
    let dbQuery = supabase
      .from('style_thread_specs')
      .select(`
        *,
        styles:style_id (id, style_code, style_name),
        suppliers:supplier_id (id, name),
        thread_types:thread_type_id (id, tex_number, tex_label, name, meters_per_cone, color_data:colors!color_id(name, hex_code))
      `)
      .order('display_order', { ascending: true })

    // Apply filters
    if (query.style_id) {
      dbQuery = dbQuery.eq('style_id', query.style_id)
    }
    if (query.supplier_id) {
      dbQuery = dbQuery.eq('supplier_id', query.supplier_id)
    }

    const { data, error } = await dbQuery

    if (error) throw error

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching style thread specs:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/style-thread-specs/process-names - Distinct process names
 */
styleThreadSpecs.get('/process-names', requirePermission('thread.styles.view'), async (c) => {
  try {
    const { data, error } = await supabase
      .from('style_thread_specs')
      .select('process_name')
      .not('process_name', 'eq', '')
      .not('process_name', 'is', null)
      .order('process_name')

    if (error) throw error

    const names = [...new Set((data || []).map(r => r.process_name as string))]
    return c.json({ data: names, error: null })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/style-thread-specs/color-specs/:id/audit-history
 * Audit history for a single color spec row (registered BEFORE /:id to avoid match collision).
 */
styleThreadSpecs.get('/color-specs/:id/audit-history', requirePermission('thread.styles.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('thread_audit_log')
      .select('id, action, performed_by, created_at, changed_fields, old_values, new_values')
      .eq('table_name', 'style_color_thread_specs')
      .eq('record_id', id)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const enriched = await enrichAuditEntries('style_color_thread_specs', (data ?? []) as RawAuditRow[])
    return c.json({ data: enriched, error: null })
  } catch (err) {
    console.error('Error fetching audit history (style_color_thread_specs):', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/style-thread-specs/:id/audit-history
 * Audit history for a single style thread spec row.
 */
styleThreadSpecs.get('/:id/audit-history', requirePermission('thread.styles.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('thread_audit_log')
      .select('id, action, performed_by, created_at, changed_fields, old_values, new_values')
      .eq('table_name', 'style_thread_specs')
      .eq('record_id', id)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const enriched = await enrichAuditEntries('style_thread_specs', (data ?? []) as RawAuditRow[])
    return c.json({ data: enriched, error: null })
  } catch (err) {
    console.error('Error fetching audit history (style_thread_specs):', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/style-thread-specs/:id - Get a single style thread spec by ID
 */
styleThreadSpecs.get('/:id', requirePermission('thread.styles.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('style_thread_specs')
      .select(`
        *,
        styles:style_id (id, style_code, style_name),
        suppliers:supplier_id (id, name),
        thread_types:thread_type_id (id, tex_number, tex_label, name, meters_per_cone, color_data:colors!color_id(name, hex_code))
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy định mức chỉ' }, 404)
      }
      throw error
    }

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching style thread spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/style-thread-specs - Create a new style thread spec
 */
styleThreadSpecs.post('/', requirePermission('thread.styles.create'), async (c) => {
  try {
    const body = await c.req.json()
    
    // Validate required fields
    if (!body.style_id) {
      return c.json({ data: null, error: 'Mã hàng (style_id) là bắt buộc' }, 400)
    }
    if (!body.supplier_id) {
      return c.json({ data: null, error: 'Nhà cung cấp (supplier_id) là bắt buộc' }, 400)
    }

    const auth = c.get('auth')
    let createdBy: string | null = null
    if (auth?.employeeId) {
      const { data: emp } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', auth.employeeId)
        .single()
      createdBy = emp?.full_name || null
    }

    const addToTop = body.add_to_top === true
    let displayOrder = 0

    if (addToTop) {
      await supabase.rpc('fn_increment_style_thread_spec_order', { p_style_id: body.style_id })
      displayOrder = 0
    } else {
      // Get MAX display_order + 1 for this style
      const { data: maxRow } = await supabase
        .from('style_thread_specs')
        .select('display_order')
        .eq('style_id', body.style_id)
        .order('display_order', { ascending: false })
        .limit(1)
        .single()
      
      displayOrder = maxRow ? maxRow.display_order + 1 : 0
    }

    const { data, error } = await supabase
      .from('style_thread_specs')
      .insert([{
        style_id: body.style_id,
        supplier_id: body.supplier_id,
        process_name: body.process_name,
        thread_type_id: body.thread_type_id,
        meters_per_unit: body.meters_per_unit || 0,
        notes: body.notes,
        display_order: displayOrder,
        created_by: createdBy,
        updated_by: createdBy,
      }])
      .select()
      .single()

    if (error) throw error

    await ensureColorSpecs(data.id, body.style_id, body.thread_type_id, createdBy ?? 'system')

    await logAudit({
      tableName: 'style_thread_specs',
      recordId: data.id,
      action: 'INSERT',
      oldValues: null,
      newValues: data,
      performedBy: createdBy ?? 'system',
    })

    return c.json({ data, error: null, message: 'Tạo định mức chỉ thành công' })
  } catch (err) {
    console.error('Error creating style thread spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * PUT /api/style-thread-specs/:id - Update a style thread spec
 */
styleThreadSpecs.put('/:id', requirePermission('thread.styles.edit'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    const { data: oldRow, error: oldErr } = await supabase
      .from('style_thread_specs')
      .select('*')
      .eq('id', id)
      .single()
    if (oldErr) {
      if (oldErr.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy định mức chỉ' }, 404)
      }
      throw oldErr
    }

    const auth = c.get('auth')
    let updatedBy: string | null = null
    if (auth?.employeeId) {
      const { data: emp } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', auth.employeeId)
        .single()
      updatedBy = emp?.full_name || null
    }

    const userTouchedFields = Object.keys(body).filter(k => !AUDIT_IGNORE_FIELDS.has(k))

    const updatePayload: Record<string, unknown> = {
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    }
    for (const k of ['style_id', 'supplier_id', 'process_name', 'thread_type_id', 'meters_per_unit', 'notes'] as const) {
      if (body[k] !== undefined) updatePayload[k] = body[k]
    }

    if (
      body.supplier_id !== undefined &&
      body.supplier_id !== oldRow.supplier_id &&
      body.thread_type_id === undefined
    ) {
      updatePayload.thread_type_id = null
    }

    const { data, error } = await supabase
      .from('style_thread_specs')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        suppliers:supplier_id (id, name),
        thread_types:thread_type_id (id, tex_number, tex_label, name, meters_per_cone, color_data:colors!color_id(name, hex_code))
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy định mức chỉ' }, 404)
      }
      throw error
    }

    if (body.thread_type_id) {
      const styleId = body.style_id || data.style_id
      await ensureColorSpecs(id, styleId, body.thread_type_id, updatedBy ?? 'system')
    }

    await logAudit({
      tableName: 'style_thread_specs',
      recordId: id,
      action: 'UPDATE',
      oldValues: oldRow,
      newValues: data,
      performedBy: updatedBy ?? 'system',
      userTouchedFields,
    })

    return c.json({ data, error: null, message: 'Cập nhật định mức chỉ thành công' })
  } catch (err) {
    console.error('Error updating style thread spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * DELETE /api/style-thread-specs/:id - Delete a style thread spec
 */
styleThreadSpecs.delete('/:id', requirePermission('thread.styles.delete'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data: oldRow, error: selErr } = await supabase
      .from('style_thread_specs')
      .select('*')
      .eq('id', id)
      .single()
    if (selErr) {
      if (selErr.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy định mức chỉ' }, 404)
      }
      throw selErr
    }

    const { error } = await supabase
      .from('style_thread_specs')
      .delete()
      .eq('id', id)

    if (error) throw error

    const performedBy = await resolvePerformer(c)
    await logAudit({
      tableName: 'style_thread_specs',
      recordId: id,
      action: 'DELETE',
      oldValues: oldRow,
      newValues: null,
      performedBy,
    })

    return c.json({ data: null, error: null, message: 'Xoa dinh muc chi thanh cong' })
  } catch (err) {
    console.error('Error deleting style thread spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/style-thread-specs/:id/color-specs - Get color-specific specs for a template
 */
styleThreadSpecs.get('/:id/color-specs', requirePermission('thread.styles.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('style_color_thread_specs')
      .select(`
        *,
        style_color:style_colors!style_color_id (id, color_name, hex_code, style_id),
        thread_types:thread_type_id (id, tex_number, tex_label, name, meters_per_cone, color_data:colors!color_id(name, hex_code), supplier_id),
        thread_color:colors!thread_color_id (id, name, hex_code)
      `)
      .eq('style_thread_spec_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching color specs:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/style-thread-specs/:id/color-specs - Add color-specific spec
 */
styleThreadSpecs.post('/:id/color-specs', requirePermission('thread.styles.create'), async (c) => {
  try {
    const styleThreadSpecId = parseInt(c.req.param('id'))
    
    if (isNaN(styleThreadSpecId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    if (!body.style_color_id) {
      return c.json({ data: null, error: 'Mã màu hàng (style_color_id) là bắt buộc' }, 400)
    }

    const performedBy = await resolvePerformer(c)

    const insertData: Record<string, unknown> = {
      style_thread_spec_id: styleThreadSpecId,
      style_color_id: body.style_color_id,
      notes: body.notes,
      created_by: performedBy,
      updated_by: performedBy,
    }
    if (body.thread_type_id) insertData.thread_type_id = body.thread_type_id
    if (body.thread_color_id) insertData.thread_color_id = body.thread_color_id

    const { data, error } = await supabase
      .from('style_color_thread_specs')
      .insert([insertData])
      .select(`
        *,
        style_color:style_colors!style_color_id (id, color_name, hex_code, style_id),
        thread_types:thread_type_id (id, tex_number, tex_label, name, meters_per_cone, color_data:colors!color_id(name, hex_code), supplier_id),
        thread_color:colors!thread_color_id (id, name, hex_code)
      `)
      .single()

    if (error) throw error

    await logAudit({
      tableName: 'style_color_thread_specs',
      recordId: data.id,
      action: 'INSERT',
      oldValues: null,
      newValues: data,
      performedBy,
    })

    return c.json({ data, error: null, message: 'Them dinh muc chi theo mau thanh cong' })
  } catch (err) {
    console.error('Error creating color spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/style-thread-specs/by-style/:styleId/all-color-specs
 * Batch fetch ALL color specs for ALL specs belonging to a style.
 * Returns flat array of color specs with joined color + thread_type data.
 */
styleThreadSpecs.get('/by-style/:styleId/all-color-specs', requirePermission('thread.styles.view'), async (c) => {
  try {
    const styleId = parseInt(c.req.param('styleId'))

    if (isNaN(styleId)) {
      return c.json({ data: null, error: 'Style ID không hợp lệ' }, 400)
    }

    // First get all spec IDs for this style
    const { data: specs, error: specsError } = await supabase
      .from('style_thread_specs')
      .select('id')
      .eq('style_id', styleId)

    if (specsError) throw specsError

    if (!specs || specs.length === 0) {
      return c.json({ data: [], error: null })
    }

    const specIds = specs.map(s => s.id)

    // Fetch all color specs for these spec IDs
    const { data, error } = await supabase
      .from('style_color_thread_specs')
      .select(`
        *,
        style_color:style_colors!style_color_id (id, color_name, hex_code, style_id),
        thread_types:thread_type_id (id, tex_number, tex_label, name, color_data:colors!color_id(name, hex_code), supplier_id, meters_per_cone),
        thread_color:colors!thread_color_id (id, name, hex_code)
      `)
      .in('style_thread_spec_id', specIds)
      .order('created_at', { ascending: true })

    if (error) throw error

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching all color specs for style:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * PUT /api/style-thread-specs/color-specs/:id - Update a color spec (inline edit)
 */
styleThreadSpecs.put('/color-specs/:id', requirePermission('thread.styles.edit'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    const { data: oldRow, error: oldErr } = await supabase
      .from('style_color_thread_specs')
      .select('*')
      .eq('id', id)
      .single()
    if (oldErr) {
      if (oldErr.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy định mức màu' }, 404)
      }
      throw oldErr
    }

    const performedBy = await resolvePerformer(c)

    const userTouchedFields = Object.keys(body).filter(k => !AUDIT_IGNORE_FIELDS.has(k))

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: performedBy,
    }

    if (body.thread_type_id !== undefined) updateData.thread_type_id = body.thread_type_id
    if (body.thread_color_id !== undefined) updateData.thread_color_id = body.thread_color_id
    if (body.notes !== undefined) updateData.notes = body.notes

    const { data, error } = await supabase
      .from('style_color_thread_specs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        style_color:style_colors!style_color_id (id, color_name, hex_code, style_id),
        thread_types:thread_type_id (id, tex_number, tex_label, name, color_data:colors!color_id(name, hex_code), supplier_id, meters_per_cone),
        thread_color:colors!thread_color_id (id, name, hex_code)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy định mức màu' }, 404)
      }
      throw error
    }

    await logAudit({
      tableName: 'style_color_thread_specs',
      recordId: id,
      action: 'UPDATE',
      oldValues: oldRow,
      newValues: data,
      performedBy,
      userTouchedFields,
    })

    return c.json({ data, error: null, message: 'Cập nhật định mức màu thành công' })
  } catch (err) {
    console.error('Error updating color spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * DELETE /api/style-thread-specs/color-specs/by-style-color/:styleColorId
 * Batch delete ALL color specs for a given style_color_id (1 query thay vì N)
 */
styleThreadSpecs.delete('/color-specs/by-style-color/:styleColorId', requirePermission('thread.styles.delete'), async (c) => {
  try {
    const styleColorId = parseInt(c.req.param('styleColorId'))

    if (isNaN(styleColorId)) {
      return c.json({ data: null, error: 'Style Color ID không hợp lệ' }, 400)
    }

    const { data: oldRows, error: selErr } = await supabase
      .from('style_color_thread_specs')
      .select('*')
      .eq('style_color_id', styleColorId)

    if (selErr) throw selErr

    const { error, count } = await supabase
      .from('style_color_thread_specs')
      .delete({ count: 'exact' })
      .eq('style_color_id', styleColorId)

    if (error) throw error

    const performedBy = await resolvePerformer(c)
    for (const row of oldRows ?? []) {
      await logAudit({
        tableName: 'style_color_thread_specs',
        recordId: row.id,
        action: 'DELETE',
        oldValues: row,
        newValues: null,
        performedBy,
      })
    }

    return c.json({ data: { deleted: count }, error: null, message: `Đã xóa ${count ?? 0} định mức màu` })
  } catch (err) {
    console.error('Error batch deleting color specs by style_color:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * DELETE /api/style-thread-specs/color-specs/:id - Delete a color spec
 */
styleThreadSpecs.delete('/color-specs/:id', requirePermission('thread.styles.delete'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data: oldRow, error: selErr } = await supabase
      .from('style_color_thread_specs')
      .select('*')
      .eq('id', id)
      .single()
    if (selErr) {
      if (selErr.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy định mức màu' }, 404)
      }
      throw selErr
    }

    const { error } = await supabase
      .from('style_color_thread_specs')
      .delete()
      .eq('id', id)

    if (error) throw error

    const performedBy = await resolvePerformer(c)
    await logAudit({
      tableName: 'style_color_thread_specs',
      recordId: id,
      action: 'DELETE',
      oldValues: oldRow,
      newValues: null,
      performedBy,
    })

    return c.json({ data: null, error: null, message: 'Xóa định mức màu thành công' })
  } catch (err) {
    console.error('Error deleting color spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default styleThreadSpecs
