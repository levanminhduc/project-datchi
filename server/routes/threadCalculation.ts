import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'

const threadCalculation = new Hono()

threadCalculation.use('*', requirePermission('thread.inventory.view'))

// ============ Supabase Query Result Types ============

/** Row shape from: styles.select('id, style_code, style_name') */
interface StyleRow {
  id: number
  style_code: string
  style_name: string
}

/** Joined supplier shape from: suppliers:supplier_id (id, name, lead_time_days) */
interface SupplierJoin {
  id: number
  name: string
  lead_time_days: number | null
}

interface ThreadTypeJoin {
  id: number
  tex_number: string
  tex_label: string | null
  name: string
  meters_per_cone: number | null
  color_id: number | null
  color_data: { name: string; hex_code: string | null } | null
}

/** Row shape from style_thread_specs with joined suppliers and thread_types */
interface SpecRow {
  id: number
  style_id: number
  process_name: string
  meters_per_unit: number
  thread_type_id: number
  suppliers: SupplierJoin | null
  thread_types: ThreadTypeJoin | null
}

/** Joined color shape from: colors:color_id (id, name) */
interface ColorJoin {
  id: number
  name: string
}

/** Joined thread_type shape from: thread_types:thread_type_id (id, name, tex_number, tex_label) */
interface ColorThreadTypeJoin {
  id: number
  name: string
  tex_number: string
  tex_label: string | null
  meters_per_cone: number | null
  supplier_id: number | null
  suppliers: SupplierJoin | null
  color_data: { name: string; hex_code: string | null } | null
}

/** Row shape from style_color_thread_specs with joined colors and thread_types */
interface ColorSpecRow {
  style_thread_spec_id: number
  color_id: number
  style_color_id: number
  thread_type_id: number
  thread_color_id: number | null
  colors: ColorJoin | null
  thread_color: { name: string; hex_code: string | null } | null
  thread_types: ColorThreadTypeJoin | null
}

/** Row shape from po_items with joined styles */
interface PoItemRow {
  id: number
  quantity: number
  styles: StyleRow | null
}

/** Row shape from skus with joined colors */
interface SkuRow {
  po_item_id: number
  color_id: number
  quantity: number
  colors: ColorJoin | null
}

// ============ Request/Response Interfaces ============

interface CalculationInput {
  style_id: number
  quantity: number
  color_breakdown?: { color_id: number; quantity: number }[]
}

interface BatchCalculationRequest {
  items: CalculationInput[]
  include_inventory_preview?: boolean
}

interface CalculationResult {
  style_id: number
  style_code: string
  style_name: string
  total_quantity: number
  warnings?: string[]
  calculations: {
    spec_id: number
    thread_type_id: number
    thread_type_name: string
    process_name: string
    supplier_name: string
    tex_number: string
    meters_per_unit: number
    total_meters: number
    meters_per_cone?: number | null
    thread_color?: string | null
    thread_color_code?: string | null
    supplier_id?: number | null
    lead_time_days?: number | null
    delivery_date?: string | null
    color_breakdown?: {
      color_id: number
      color_name: string
      quantity: number
      thread_type_id: number
      thread_type_name: string
      thread_color: string | null
      thread_color_code: string | null
      total_meters: number
      process_name: string
      supplier_name: string
      supplier_id?: number | null
      tex_number: string
      meters_per_unit: number
      meters_per_cone: number | null
    }[]
    // Inventory preview fields
    inventory_available?: number
    shortage_cones?: number
    is_fully_stocked?: boolean
  }[]
}

// ============ Shared Helpers ============

const SPEC_SELECT = `
  id,
  style_id,
  process_name,
  meters_per_unit,
  thread_type_id,
  suppliers:supplier_id (id, name, lead_time_days),
  thread_types:thread_type_id (id, tex_number, tex_label, name, meters_per_cone, color_id, color_data:colors(name, hex_code))
` as const

const COLOR_SPEC_SELECT = `
  style_thread_spec_id,
  color_id,
  style_color_id,
  thread_type_id,
  thread_color_id,
  colors:color_id (id, name),
  thread_color:colors!thread_color_id (name, hex_code),
  thread_types:thread_type_id (
    id,
    name,
    tex_number,
    tex_label,
    meters_per_cone,
    supplier_id,
    suppliers:supplier_id (id, name, lead_time_days),
    color_data:colors!color_id(name, hex_code)
  )
` as const

type SupplierMpcMap = Map<string, number>

function mpcKey(threadTypeId: number, supplierId: number | null | undefined): string {
  return `${threadTypeId}-${supplierId ?? 0}`
}

async function getSupplierMetersPerCone(
  threadTypeIds: number[],
  supplierIds: number[]
): Promise<SupplierMpcMap> {
  const map: SupplierMpcMap = new Map()
  if (threadTypeIds.length === 0 || supplierIds.length === 0) return map

  const { data, error } = await supabase
    .from('thread_type_supplier')
    .select('thread_type_id, supplier_id, meters_per_cone')
    .in('thread_type_id', threadTypeIds)
    .in('supplier_id', supplierIds)
    .not('meters_per_cone', 'is', null)

  if (error || !data) return map

  for (const row of data) {
    if (row.meters_per_cone != null) {
      map.set(mpcKey(row.thread_type_id, row.supplier_id), Number(row.meters_per_cone))
    }
  }
  return map
}

async function getAvailableInventory(threadTypeIds: number[]): Promise<Map<string, number>> {
  if (threadTypeIds.length === 0) return new Map()

  const usableStatuses = ['RECEIVED', 'INSPECTED', 'AVAILABLE', 'SOFT_ALLOCATED', 'HARD_ALLOCATED']
  const { data, error } = await supabase
    .from('thread_inventory')
    .select('thread_type_id, color_id')
    .in('status', usableStatuses)
    .in('thread_type_id', threadTypeIds)
    .limit(50000)

  if (error) throw error

  const colorIds = [...new Set(
    (data || [])
      .map(r => r.color_id as number | null)
      .filter((id): id is number => id != null),
  )]

  const colorIdToName = new Map<number, string>()
  if (colorIds.length > 0) {
    const { data: colorRows } = await supabase
      .from('colors')
      .select('id, name')
      .in('id', colorIds)
      .limit(colorIds.length)

    for (const c of colorRows || []) {
      colorIdToName.set(c.id, c.name)
    }
  }

  const inventoryMap = new Map<string, number>()
  for (const row of data || []) {
    const colorName = row.color_id ? colorIdToName.get(row.color_id as number) ?? '' : ''
    const key = `${row.thread_type_id}_${colorName}`
    inventoryMap.set(key, (inventoryMap.get(key) || 0) + 1)
  }

  return inventoryMap
}

/**
 * Apply preview allocation to calculation results
 * Modifies results in-place to add inventory preview fields
 */
async function applyInventoryPreview(results: CalculationResult[]): Promise<void> {
  const threadTypeIds = new Set<number>()
  for (const result of results) {
    for (const calc of result.calculations) {
      if (calc.color_breakdown && calc.color_breakdown.length > 0) {
        for (const cb of calc.color_breakdown) {
          if (cb.thread_type_id) threadTypeIds.add(cb.thread_type_id)
        }
      } else {
        if (calc.thread_type_id) threadTypeIds.add(calc.thread_type_id)
      }
    }
  }

  if (threadTypeIds.size === 0) return

  const inventoryMap = await getAvailableInventory([...threadTypeIds])

  const runningBalance = new Map<string, number>()
  for (const [key, available] of inventoryMap) {
    runningBalance.set(key, available)
  }

  for (const result of results) {
    for (const calc of result.calculations) {
      const metersPerCone = calc.meters_per_cone || 0
      const totalCones = metersPerCone > 0 ? Math.ceil(calc.total_meters / metersPerCone) : 0

      if (totalCones === 0) {
        calc.inventory_available = 0
        calc.shortage_cones = 0
        calc.is_fully_stocked = true
        continue
      }

      if (calc.color_breakdown && calc.color_breakdown.length > 0) {
        const neededByKey = new Map<string, number>()
        for (const cb of calc.color_breakdown) {
          if (!cb.thread_type_id) continue
          const key = `${cb.thread_type_id}_${cb.thread_color ?? ''}`
          const mpc = cb.meters_per_cone ?? metersPerCone
          const cbCones = mpc > 0 ? Math.ceil(cb.total_meters / mpc) : 0
          neededByKey.set(key, (neededByKey.get(key) || 0) + cbCones)
        }

        let totalAvailable = 0
        for (const [key, needed] of neededByKey) {
          const available = runningBalance.get(key) || 0
          const allocated = Math.min(needed, available)
          totalAvailable += allocated
          runningBalance.set(key, available - allocated)
        }

        calc.inventory_available = totalAvailable
        calc.shortage_cones = Math.max(0, totalCones - totalAvailable)
        calc.is_fully_stocked = calc.shortage_cones === 0
      } else {
        const key = `${calc.thread_type_id}_${calc.thread_color ?? ''}`
        const available = runningBalance.get(key) || 0
        const allocated = Math.min(totalCones, available)
        calc.inventory_available = allocated
        calc.shortage_cones = Math.max(0, totalCones - allocated)
        calc.is_fully_stocked = calc.shortage_cones === 0
        runningBalance.set(key, available - allocated)
      }
    }
  }
}

function buildCalculation(
  spec: SpecRow,
  styleCode: string,
  quantity: number,
  colorBreakdown: { color_id: number; quantity: number }[] | undefined,
  colorSpecs: ColorSpecRow[],
  supplierMpcMap: SupplierMpcMap = new Map()
): { calculation: CalculationResult['calculations'][number]; warnings: string[] } {
  const warnings: string[] = []

  const baseMpc =
    supplierMpcMap.get(mpcKey(spec.thread_type_id, spec.suppliers?.id)) ??
    spec.thread_types?.meters_per_cone ?? null

  const calculation: CalculationResult['calculations'][number] = {
    spec_id: spec.id,
    thread_type_id: spec.thread_type_id,
    thread_type_name: spec.thread_types?.name || '',
    process_name: spec.process_name,
    supplier_name: spec.suppliers?.name || '',
    tex_number: spec.thread_types?.tex_label || spec.thread_types?.tex_number || '',
    meters_per_unit: spec.meters_per_unit,
    total_meters: spec.meters_per_unit * quantity,
    meters_per_cone: baseMpc,
    thread_color: spec.thread_types?.color_data?.name || null,
    thread_color_code: spec.thread_types?.color_data?.hex_code || null,
    supplier_id: spec.suppliers?.id || null,
    lead_time_days: (() => {
      if (!spec.suppliers) return null
      const lt = spec.suppliers.lead_time_days
      return (lt && lt > 0) ? lt : 7
    })(),
    delivery_date: (() => {
      if (!spec.suppliers) return null
      const lt = spec.suppliers.lead_time_days
      const days = (lt && lt > 0) ? lt : 7
      const date = new Date()
      date.setDate(date.getDate() + days)
      return date.toISOString().split('T')[0]
    })(),
  }

  if (colorBreakdown && colorBreakdown.length > 0) {
    const specColorSpecs = colorSpecs.filter(
      (cs) => cs.style_thread_spec_id === spec.id
    )

    calculation.color_breakdown = colorBreakdown.map((cb) => {
      const colorSpec = specColorSpecs.find(
        (sc) => sc.style_color_id === cb.color_id
      )

      if (!colorSpec?.thread_type_id) {
        const colorName = colorSpec?.colors?.name || `color_id=${cb.color_id}`
        warnings.push(
          `Mã hàng ${styleCode}: màu ${colorName} chưa có định mức chỉ chi tiết, dùng loại chỉ mặc định`
        )
      }

      const resolvedSupplierName =
        colorSpec?.thread_types?.suppliers?.name ||
        spec.suppliers?.name ||
        ''
      const resolvedSupplierId =
        colorSpec?.thread_types?.supplier_id ??
        spec.suppliers?.id ??
        null
      const resolvedTexNumber =
        colorSpec?.thread_types?.tex_label ||
        colorSpec?.thread_types?.tex_number ||
        spec.thread_types?.tex_label ||
        spec.thread_types?.tex_number ||
        ''

      const resolvedThreadTypeId = colorSpec?.thread_type_id || spec.thread_type_id
      const colorMpc =
        supplierMpcMap.get(mpcKey(resolvedThreadTypeId, resolvedSupplierId)) ??
        colorSpec?.thread_types?.meters_per_cone ??
        spec.thread_types?.meters_per_cone ?? null

      return {
        color_id: cb.color_id,
        color_name: colorSpec?.colors?.name || '',
        quantity: cb.quantity,
        thread_type_id: resolvedThreadTypeId,
        thread_type_name: colorSpec?.thread_types?.name || spec.thread_types?.name || '',
        thread_color: colorSpec?.thread_color?.name || colorSpec?.thread_types?.color_data?.name || spec.thread_types?.color_data?.name || null,
        thread_color_code: colorSpec?.thread_color?.hex_code || colorSpec?.thread_types?.color_data?.hex_code || spec.thread_types?.color_data?.hex_code || null,
        total_meters: spec.meters_per_unit * cb.quantity,
        process_name: spec.process_name,
        supplier_name: resolvedSupplierName,
        supplier_id: resolvedSupplierId,
        tex_number: resolvedTexNumber,
        meters_per_unit: spec.meters_per_unit,
        meters_per_cone: colorMpc,
      }
    })
  }

  return { calculation, warnings }
}

// ============ Endpoints ============

/**
 * POST /api/thread-calculation/calculate - Calculate thread requirements
 *
 * Request body:
 * {
 *   style_id: number,
 *   quantity: number,
 *   color_breakdown?: [{ color_id: number, quantity: number }]
 * }
 */
threadCalculation.post('/calculate', async (c) => {
  try {
    const body: CalculationInput = await c.req.json()

    // Validate required fields
    if (!body.style_id || isNaN(body.style_id)) {
      return c.json({ data: null, error: 'Ma hang (style_id) la bat buoc' }, 400)
    }
    if (!body.quantity || body.quantity <= 0) {
      return c.json({ data: null, error: 'So luong phai lon hon 0' }, 400)
    }

    // Get style info
    const { data: style, error: styleError } = await supabase
      .from('styles')
      .select('id, style_code, style_name')
      .eq('id', body.style_id)
      .single()

    if (styleError || !style) {
      return c.json({ data: null, error: 'Khong tim thay ma hang' }, 404)
    }

    // Get thread specs for this style
    const { data: specs, error: specsError } = await supabase
      .from('style_thread_specs')
      .select(SPEC_SELECT)
      .eq('style_id', body.style_id)

    if (specsError) throw specsError

    if (!specs || specs.length === 0) {
      return c.json({ data: null, error: 'Ma hang chua co dinh muc chi' }, 400)
    }

    const typedSpecs = specs as unknown as SpecRow[]

    // Get color-specific specs if color breakdown provided
    let colorSpecs: ColorSpecRow[] = []
    if (body.color_breakdown && body.color_breakdown.length > 0) {
      const specIds = typedSpecs.map(s => s.id)
      const colorIds = body.color_breakdown.map(c => c.color_id)

      const { data: cs, error: csError } = await supabase
        .from('style_color_thread_specs')
        .select(COLOR_SPEC_SELECT)
        .in('style_thread_spec_id', specIds)
        .in('style_color_id', colorIds)

      if (csError) throw csError
      colorSpecs = (cs || []) as unknown as ColorSpecRow[]
    }

    // Get supplier-specific meters_per_cone from thread_type_supplier
    const ttIds = [...new Set(typedSpecs.map(s => s.thread_type_id))]
    const supIds = [...new Set([
      ...typedSpecs.map(s => s.suppliers?.id).filter((id): id is number => id != null),
      ...colorSpecs.map(cs => cs.thread_types?.supplier_id).filter((id): id is number => id != null),
    ])]
    const supplierMpcMap = await getSupplierMetersPerCone(ttIds, supIds)

    // Calculate results
    const allWarnings: string[] = []
    const calculations = typedSpecs.map((spec) => {
      const { calculation, warnings } = buildCalculation(spec, (style as StyleRow).style_code, body.quantity, body.color_breakdown, colorSpecs, supplierMpcMap)
      allWarnings.push(...warnings)
      return calculation
    })

    const result: CalculationResult = {
      style_id: (style as StyleRow).id,
      style_code: (style as StyleRow).style_code,
      style_name: (style as StyleRow).style_name,
      total_quantity: body.quantity,
      calculations,
      ...(allWarnings.length > 0 && { warnings: allWarnings }),
    }

    return c.json({ data: result, error: null })
  } catch (err) {
    console.error('Error calculating thread requirements:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/thread-calculation/calculate-batch - Calculate thread requirements for multiple styles
 *
 * Request body:
 * {
 *   items: CalculationInput[]  (max 100)
 *   include_inventory_preview?: boolean  // Add inventory availability preview
 * }
 *
 * Uses bulk .in() queries instead of per-item sequential queries.
 */
threadCalculation.post('/calculate-batch', async (c) => {
  try {
    const body = await c.req.json<BatchCalculationRequest>()

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return c.json({ data: null, error: 'Danh sach items la bat buoc va khong duoc rong' }, 400)
    }

    if (body.items.length > 100) {
      return c.json({ data: null, error: 'Toi da 100 items moi lan tinh' }, 400)
    }

    // Validate each item
    for (const item of body.items) {
      if (!item.style_id || isNaN(item.style_id)) {
        return c.json({ data: null, error: `Ma hang (style_id) khong hop le: ${item.style_id}` }, 400)
      }
      if (!item.quantity || item.quantity <= 0) {
        return c.json({ data: null, error: `So luong phai lon hon 0 cho style_id ${item.style_id}` }, 400)
      }
    }

    // Collect all unique style_ids
    const styleIds = [...new Set(body.items.map(item => item.style_id))]

    // Bulk query 1: Get all styles
    const { data: styles, error: stylesError } = await supabase
      .from('styles')
      .select('id, style_code, style_name')
      .in('id', styleIds)

    if (stylesError) throw stylesError

    const typedStyles = (styles || []) as unknown as StyleRow[]
    const styleMap = new Map(typedStyles.map(s => [s.id, s]))

    // Bulk query 2: Get all specs for all styles
    const { data: allSpecs, error: specsError } = await supabase
      .from('style_thread_specs')
      .select(SPEC_SELECT)
      .in('style_id', styleIds)

    if (specsError) throw specsError

    const typedSpecs = (allSpecs || []) as unknown as SpecRow[]

    // Group specs by style_id for lookup
    const specsByStyleId = new Map<number, SpecRow[]>()
    for (const spec of typedSpecs) {
      const existing = specsByStyleId.get(spec.style_id) || []
      existing.push(spec)
      specsByStyleId.set(spec.style_id, existing)
    }

    // Collect all spec IDs and color IDs for color specs query
    const allSpecIds = typedSpecs.map(s => s.id)
    const allColorIds = new Set<number>()
    for (const item of body.items) {
      if (item.color_breakdown) {
        for (const cb of item.color_breakdown) {
          allColorIds.add(cb.color_id)
        }
      }
    }

    // Bulk query 3: Get all color specs (only if any color breakdowns exist)
    let allColorSpecs: ColorSpecRow[] = []
    if (allColorIds.size > 0 && allSpecIds.length > 0) {
      const { data: cs, error: csError } = await supabase
        .from('style_color_thread_specs')
        .select(COLOR_SPEC_SELECT)
        .in('style_thread_spec_id', allSpecIds)
        .in('style_color_id', [...allColorIds])

      if (csError) throw csError
      allColorSpecs = (cs || []) as unknown as ColorSpecRow[]
    }

    // Get supplier-specific meters_per_cone
    const batchTtIds = [...new Set(typedSpecs.map(s => s.thread_type_id))]
    const batchSupIds = [...new Set([
      ...typedSpecs.map(s => s.suppliers?.id).filter((id): id is number => id != null),
      ...allColorSpecs.map(cs => cs.thread_types?.supplier_id).filter((id): id is number => id != null),
    ])]
    const batchMpcMap = await getSupplierMetersPerCone(batchTtIds, batchSupIds)

    // Map results in-memory
    const results: CalculationResult[] = []
    for (const item of body.items) {
      const style = styleMap.get(item.style_id)
      if (!style) continue // Skip unknown styles

      const specs = specsByStyleId.get(item.style_id)
      if (!specs || specs.length === 0) continue // Skip styles without specs

      // Filter color specs relevant to this style's specs
      const styleSpecIds = new Set(specs.map(s => s.id))
      const relevantColorSpecs = allColorSpecs.filter(
        cs => styleSpecIds.has(cs.style_thread_spec_id)
      )

      const styleWarnings: string[] = []
      const calculations = specs.map((spec) => {
        const { calculation, warnings } = buildCalculation(spec, style.style_code, item.quantity, item.color_breakdown, relevantColorSpecs, batchMpcMap)
        styleWarnings.push(...warnings)
        return calculation
      })

      results.push({
        style_id: style.id,
        style_code: style.style_code,
        style_name: style.style_name,
        total_quantity: item.quantity,
        calculations,
        ...(styleWarnings.length > 0 && { warnings: styleWarnings }),
      })
    }

    // Apply inventory preview if requested
    if (body.include_inventory_preview) {
      await applyInventoryPreview(results)
    }

    return c.json({ data: results, error: null })
  } catch (err) {
    console.error('Error in batch thread calculation:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/thread-calculation/calculate-by-po - Calculate thread requirements by PO
 *
 * Request body:
 * {
 *   po_id: number
 * }
 *
 * Optimized: uses bulk .in() queries instead of per-item sequential queries.
 */
threadCalculation.post('/calculate-by-po', async (c) => {
  try {
    const body = await c.req.json()

    if (!body.po_id || isNaN(body.po_id)) {
      return c.json({ data: null, error: 'Ma don hang (po_id) la bat buoc' }, 400)
    }

    // Get PO items with styles
    const { data: poItems, error: poError } = await supabase
      .from('po_items')
      .select(`
        id,
        quantity,
        styles:style_id (id, style_code, style_name)
      `)
      .eq('po_id', body.po_id)

    if (poError) throw poError

    if (!poItems || poItems.length === 0) {
      return c.json({ data: null, error: 'Don hang khong co chi tiet ma hang' }, 400)
    }

    const typedPoItems = poItems as unknown as PoItemRow[]

    // Filter out items without a valid style
    const validItems = typedPoItems.filter(item => item.styles !== null)
    if (validItems.length === 0) {
      return c.json({ data: null, error: 'Don hang khong co chi tiet ma hang hop le' }, 400)
    }

    // Collect all unique style_ids and po_item_ids
    const styleIds = [...new Set(validItems.map(item => item.styles!.id))]
    const poItemIds = validItems.map(item => item.id)

    // Bulk query 1: Get all specs for all styles
    const { data: allSpecs, error: specsError } = await supabase
      .from('style_thread_specs')
      .select(SPEC_SELECT)
      .in('style_id', styleIds)

    if (specsError) throw specsError

    const typedSpecs = (allSpecs || []) as unknown as SpecRow[]

    // Group specs by style_id
    const specsByStyleId = new Map<number, SpecRow[]>()
    for (const spec of typedSpecs) {
      const existing = specsByStyleId.get(spec.style_id) || []
      existing.push(spec)
      specsByStyleId.set(spec.style_id, existing)
    }

    // Bulk query 2: Get all SKUs for all PO items
    const { data: allSkus, error: skusError } = await supabase
      .from('skus')
      .select(`
        po_item_id,
        color_id,
        quantity,
        colors:color_id (id, name)
      `)
      .in('po_item_id', poItemIds)

    if (skusError) throw skusError

    const typedSkus = (allSkus || []) as unknown as SkuRow[]

    // Group SKUs by po_item_id
    const skusByPoItemId = new Map<number, SkuRow[]>()
    for (const sku of typedSkus) {
      const existing = skusByPoItemId.get(sku.po_item_id) || []
      existing.push(sku)
      skusByPoItemId.set(sku.po_item_id, existing)
    }

    // Bulk query 3: Get all color specs for all specs and colors
    const allSpecIds = typedSpecs.map(s => s.id)
    const allColorIds = [...new Set(typedSkus.map(s => s.color_id))]

    let allColorSpecs: ColorSpecRow[] = []
    if (allSpecIds.length > 0 && allColorIds.length > 0) {
      const { data: cs, error: csError } = await supabase
        .from('style_color_thread_specs')
        .select(COLOR_SPEC_SELECT)
        .in('style_thread_spec_id', allSpecIds)
        .in('style_color_id', allColorIds)

      if (csError) throw csError
      allColorSpecs = (cs || []) as unknown as ColorSpecRow[]
    }

    // Get supplier-specific meters_per_cone
    const poTtIds = [...new Set(typedSpecs.map(s => s.thread_type_id))]
    const poSupIds = [...new Set([
      ...typedSpecs.map(s => s.suppliers?.id).filter((id): id is number => id != null),
      ...allColorSpecs.map(cs => cs.thread_types?.supplier_id).filter((id): id is number => id != null),
    ])]
    const poMpcMap = await getSupplierMetersPerCone(poTtIds, poSupIds)

    // Map results in-memory
    const results = []
    for (const item of validItems) {
      const style = item.styles!
      const specs = specsByStyleId.get(style.id)
      if (!specs || specs.length === 0) continue

      const skus = skusByPoItemId.get(item.id) || []

      // Filter color specs relevant to this style's specs
      const styleSpecIds = new Set(specs.map(s => s.id))
      const relevantColorSpecs = allColorSpecs.filter(
        cs => styleSpecIds.has(cs.style_thread_spec_id)
      )

      const styleWarnings: string[] = []
      const calculations = specs.map((spec) => {
        const colorBreakdown = skus.map((sku) => {
          const colorSpec = relevantColorSpecs.find(
            (cs) => cs.style_thread_spec_id === spec.id && cs.style_color_id === sku.color_id
          )

          if (!colorSpec?.thread_type_id) {
            const colorName = sku.colors?.name || `color_id=${sku.color_id}`
            styleWarnings.push(
              `Mã hàng ${style.style_code}: màu ${colorName} chưa có định mức chỉ chi tiết, dùng loại chỉ mặc định`
            )
          }

          const resolvedSupplierName =
            colorSpec?.thread_types?.suppliers?.name ||
            spec.suppliers?.name ||
            ''
          const resolvedSupplierId =
            colorSpec?.thread_types?.supplier_id ??
            spec.suppliers?.id ??
            null
          const resolvedTexNumber =
            colorSpec?.thread_types?.tex_label ||
            colorSpec?.thread_types?.tex_number ||
            spec.thread_types?.tex_label ||
            spec.thread_types?.tex_number ||
            ''

          const resolvedThreadTypeId = colorSpec?.thread_type_id || spec.thread_type_id
          const colorMpc =
            poMpcMap.get(mpcKey(resolvedThreadTypeId, resolvedSupplierId)) ??
            colorSpec?.thread_types?.meters_per_cone ??
            spec.thread_types?.meters_per_cone ?? null

          return {
            color_id: sku.color_id,
            color_name: sku.colors?.name || '',
            quantity: sku.quantity,
            thread_type_id: resolvedThreadTypeId,
            thread_type_name: colorSpec?.thread_types?.name || spec.thread_types?.name || '',
            thread_color: colorSpec?.thread_color?.name || colorSpec?.thread_types?.color_data?.name || spec.thread_types?.color_data?.name || null,
            thread_color_code: colorSpec?.thread_color?.hex_code || colorSpec?.thread_types?.color_data?.hex_code || spec.thread_types?.color_data?.hex_code || null,
            total_meters: spec.meters_per_unit * sku.quantity,
            process_name: spec.process_name,
            supplier_name: resolvedSupplierName,
            supplier_id: resolvedSupplierId,
            tex_number: resolvedTexNumber,
            meters_per_unit: spec.meters_per_unit,
            meters_per_cone: colorMpc,
          }
        })

        const poBaseMpc =
          poMpcMap.get(mpcKey(spec.thread_type_id, spec.suppliers?.id)) ??
          spec.thread_types?.meters_per_cone ?? null

        return {
          spec_id: spec.id,
          process_name: spec.process_name,
          supplier_name: spec.suppliers?.name || '',
          tex_number: spec.thread_types?.tex_label || spec.thread_types?.tex_number || '',
          meters_per_unit: spec.meters_per_unit,
          total_meters: spec.meters_per_unit * item.quantity,
          meters_per_cone: poBaseMpc,
          thread_color: spec.thread_types?.color_data?.name || null,
          thread_color_code: spec.thread_types?.color_data?.hex_code || null,
          supplier_id: spec.suppliers?.id || null,
          lead_time_days: (() => {
            if (!spec.suppliers) return null
            const lt = spec.suppliers.lead_time_days
            return (lt && lt > 0) ? lt : 7
          })(),
          delivery_date: (() => {
            if (!spec.suppliers) return null
            const lt = spec.suppliers.lead_time_days
            const days = (lt && lt > 0) ? lt : 7
            const date = new Date()
            date.setDate(date.getDate() + days)
            return date.toISOString().split('T')[0]
          })(),
          color_breakdown: colorBreakdown,
        }
      })

      results.push({
        po_item_id: item.id,
        style_id: style.id,
        style_code: style.style_code,
        style_name: style.style_name,
        quantity: item.quantity,
        calculations,
        ...(styleWarnings.length > 0 && { warnings: styleWarnings }),
      })
    }

    return c.json({ data: results, error: null })
  } catch (err) {
    console.error('Error calculating thread requirements by PO:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default threadCalculation
