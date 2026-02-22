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

/** Joined thread_type shape from: thread_types:thread_type_id (id, name, tex_number) */
interface ColorThreadTypeJoin {
  id: number
  name: string
  tex_number: string
}

/** Row shape from style_color_thread_specs with joined colors and thread_types */
interface ColorSpecRow {
  style_thread_spec_id: number
  color_id: number
  thread_type_id: number
  colors: ColorJoin | null
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
  calculations: {
    spec_id: number
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
      total_meters: number
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
  thread_types:thread_type_id (id, tex_number, name, meters_per_cone, color_id, color_data:colors(name, hex_code))
` as const

const COLOR_SPEC_SELECT = `
  style_thread_spec_id,
  color_id,
  thread_type_id,
  colors:color_id (id, name),
  thread_types:thread_type_id (id, name, tex_number)
` as const

/**
 * Query available inventory cones grouped by thread_type_id
 * Returns a Map of thread_type_id -> available cone count
 */
async function getAvailableInventory(threadTypeIds: number[]): Promise<Map<number, number>> {
  if (threadTypeIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('thread_inventory')
    .select('thread_type_id')
    .eq('status', 'AVAILABLE')
    .in('thread_type_id', threadTypeIds)

  if (error) throw error

  // Count cones per thread_type_id
  const inventoryMap = new Map<number, number>()
  for (const row of data || []) {
    const current = inventoryMap.get(row.thread_type_id) || 0
    inventoryMap.set(row.thread_type_id, current + 1)
  }

  return inventoryMap
}

/**
 * Apply preview allocation to calculation results
 * Modifies results in-place to add inventory preview fields
 */
async function applyInventoryPreview(results: CalculationResult[]): Promise<void> {
  // Collect all thread_type_ids from color_breakdown
  const threadTypeIds = new Set<number>()
  for (const result of results) {
    for (const calc of result.calculations) {
      if (calc.color_breakdown) {
        for (const cb of calc.color_breakdown) {
          threadTypeIds.add(cb.thread_type_id)
        }
      }
    }
  }

  if (threadTypeIds.size === 0) return

  // Get available inventory
  const inventoryMap = await getAvailableInventory([...threadTypeIds])

  // Track running balance per thread_type_id
  const runningBalance = new Map<number, number>()
  for (const [threadTypeId, available] of inventoryMap) {
    runningBalance.set(threadTypeId, available)
  }

  // Process each calculation in order (position determines priority)
  for (const result of results) {
    for (const calc of result.calculations) {
      // Calculate total needed cones for this calculation
      const metersPerCone = calc.meters_per_cone || 0
      const totalCones = metersPerCone > 0 ? Math.ceil(calc.total_meters / metersPerCone) : 0

      if (totalCones === 0) {
        calc.inventory_available = 0
        calc.shortage_cones = 0
        calc.is_fully_stocked = true
        continue
      }

      // Get the primary thread_type_id for this calculation
      // If color_breakdown exists, aggregate inventory across all thread types
      let totalAvailable = 0
      const threadTypesUsed: number[] = []

      if (calc.color_breakdown && calc.color_breakdown.length > 0) {
        // For each color, check its thread type's inventory
        for (const cb of calc.color_breakdown) {
          const cbNeededCones = metersPerCone > 0 ? Math.ceil(cb.total_meters / metersPerCone) : 0
          const available = runningBalance.get(cb.thread_type_id) || 0
          const allocated = Math.min(cbNeededCones, available)
          totalAvailable += allocated
          // Decrement running balance
          runningBalance.set(cb.thread_type_id, available - allocated)
          if (!threadTypesUsed.includes(cb.thread_type_id)) {
            threadTypesUsed.push(cb.thread_type_id)
          }
        }
      }

      calc.inventory_available = totalAvailable
      calc.shortage_cones = Math.max(0, totalCones - totalAvailable)
      calc.is_fully_stocked = calc.shortage_cones === 0
    }
  }
}

/** Build a single calculation entry from a spec row, quantity, and optional color data */
function buildCalculation(
  spec: SpecRow,
  quantity: number,
  colorBreakdown: { color_id: number; quantity: number }[] | undefined,
  colorSpecs: ColorSpecRow[]
) {
  const baseCalculation: CalculationResult['calculations'][number] = {
    spec_id: spec.id,
    process_name: spec.process_name,
    supplier_name: spec.suppliers?.name || '',
    tex_number: spec.thread_types?.tex_number || '',
    meters_per_unit: spec.meters_per_unit,
    total_meters: spec.meters_per_unit * quantity,
    meters_per_cone: spec.thread_types?.meters_per_cone || null,
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

    baseCalculation.color_breakdown = colorBreakdown.map((cb) => {
      const colorSpec = specColorSpecs.find(
        (sc) => sc.color_id === cb.color_id
      )

      return {
        color_id: cb.color_id,
        color_name: colorSpec?.colors?.name || '',
        quantity: cb.quantity,
        thread_type_id: colorSpec?.thread_type_id || spec.thread_type_id,
        thread_type_name: colorSpec?.thread_types?.name || spec.thread_types?.name || '',
        total_meters: spec.meters_per_unit * cb.quantity,
      }
    })
  }

  return baseCalculation
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
        .in('color_id', colorIds)

      if (csError) throw csError
      colorSpecs = (cs || []) as unknown as ColorSpecRow[]
    }

    // Calculate results
    const calculations = typedSpecs.map((spec) =>
      buildCalculation(spec, body.quantity, body.color_breakdown, colorSpecs)
    )

    const result: CalculationResult = {
      style_id: (style as StyleRow).id,
      style_code: (style as StyleRow).style_code,
      style_name: (style as StyleRow).style_name,
      total_quantity: body.quantity,
      calculations,
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
        .in('color_id', [...allColorIds])

      if (csError) throw csError
      allColorSpecs = (cs || []) as unknown as ColorSpecRow[]
    }

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

      const calculations = specs.map((spec) =>
        buildCalculation(spec, item.quantity, item.color_breakdown, relevantColorSpecs)
      )

      results.push({
        style_id: style.id,
        style_code: style.style_code,
        style_name: style.style_name,
        total_quantity: item.quantity,
        calculations,
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
        .in('color_id', allColorIds)

      if (csError) throw csError
      allColorSpecs = (cs || []) as unknown as ColorSpecRow[]
    }

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

      const calculations = specs.map((spec) => {
        const colorBreakdown = skus.map((sku) => {
          const colorSpec = relevantColorSpecs.find(
            (cs) => cs.style_thread_spec_id === spec.id && cs.color_id === sku.color_id
          )

          return {
            color_id: sku.color_id,
            color_name: sku.colors?.name || '',
            quantity: sku.quantity,
            thread_type_id: colorSpec?.thread_type_id || spec.thread_type_id,
            thread_type_name: colorSpec?.thread_types?.name || spec.thread_types?.name || '',
            total_meters: spec.meters_per_unit * sku.quantity,
          }
        })

        return {
          spec_id: spec.id,
          process_name: spec.process_name,
          supplier_name: spec.suppliers?.name || '',
          tex_number: spec.thread_types?.tex_number || '',
          meters_per_unit: spec.meters_per_unit,
          total_meters: spec.meters_per_unit * item.quantity,
          meters_per_cone: spec.thread_types?.meters_per_cone || null,
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
      })
    }

    return c.json({ data: results, error: null })
  } catch (err) {
    console.error('Error calculating thread requirements by PO:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default threadCalculation
