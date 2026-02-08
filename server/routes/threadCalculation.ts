import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'

const threadCalculation = new Hono()

// Helper function to get error message
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

interface CalculationInput {
  style_id: number
  quantity: number
  color_breakdown?: { color_id: number; quantity: number }[]
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
    color_breakdown?: {
      color_id: number
      color_name: string
      quantity: number
      thread_type_id: number
      thread_type_name: string
      total_meters: number
    }[]
  }[]
}

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
      .select(`
        id,
        process_name,
        meters_per_unit,
        tex_id,
        suppliers:supplier_id (id, name),
        thread_types:tex_id (id, tex_number, name, meters_per_cone, color, color_code)
      `)
      .eq('style_id', body.style_id)

    if (specsError) throw specsError

    if (!specs || specs.length === 0) {
      return c.json({ data: null, error: 'Ma hang chua co dinh muc chi' }, 400)
    }

    // Get color-specific specs if color breakdown provided
    let colorSpecs: any[] = []
    if (body.color_breakdown && body.color_breakdown.length > 0) {
      const specIds = specs.map(s => s.id)
      const colorIds = body.color_breakdown.map(c => c.color_id)
      
      const { data: cs, error: csError } = await supabase
        .from('style_color_thread_specs')
        .select(`
          style_thread_spec_id,
          color_id,
          thread_type_id,
          colors:color_id (id, name),
          thread_types:thread_type_id (id, name, tex_number)
        `)
        .in('style_thread_spec_id', specIds)
        .in('color_id', colorIds)

      if (csError) throw csError
      colorSpecs = cs || []
    }

    // Calculate results
    const calculations = specs.map((spec: any) => {
      const baseCalculation = {
        spec_id: spec.id,
        process_name: spec.process_name,
        supplier_name: spec.suppliers?.name || '',
        tex_number: spec.thread_types?.tex_number || '',
        meters_per_unit: spec.meters_per_unit,
        total_meters: spec.meters_per_unit * body.quantity,
        meters_per_cone: spec.thread_types?.meters_per_cone || null,
        thread_color: spec.thread_types?.color || null,
        thread_color_code: spec.thread_types?.color_code || null,
      }

      // Add color breakdown if available
      if (body.color_breakdown && body.color_breakdown.length > 0) {
        const specColorSpecs = colorSpecs.filter(
          (cs: any) => cs.style_thread_spec_id === spec.id
        )

        baseCalculation.color_breakdown = body.color_breakdown.map((cb: any) => {
          const colorSpec = specColorSpecs.find(
            (sc: any) => sc.color_id === cb.color_id
          )
          
          return {
            color_id: cb.color_id,
            color_name: colorSpec?.colors?.name || '',
            quantity: cb.quantity,
            thread_type_id: colorSpec?.thread_type_id || spec.tex_id,
            thread_type_name: colorSpec?.thread_types?.name || spec.thread_types?.name || '',
            total_meters: spec.meters_per_unit * cb.quantity,
          }
        })
      }

      return baseCalculation
    })

    const result: CalculationResult = {
      style_id: style.id,
      style_code: style.style_code,
      style_name: style.style_name,
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
 * POST /api/thread-calculation/calculate-by-po - Calculate thread requirements by PO
 * 
 * Request body:
 * {
 *   po_id: number
 * }
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

    // Calculate for each PO item
    const results = []
    for (const item of poItems) {
      const style = item.styles as any
      if (!style) continue

      // Get thread specs for this style
      const { data: specs, error: specsError } = await supabase
        .from('style_thread_specs')
        .select(`
          id,
          process_name,
          meters_per_unit,
          tex_id,
          suppliers:supplier_id (id, name),
          thread_types:tex_id (id, tex_number, name, meters_per_cone, color, color_code)
        `)
        .eq('style_id', style.id)

      if (specsError || !specs || specs.length === 0) {
        continue // Skip styles without specs
      }

      // Get SKUs for color breakdown
      const { data: skus, error: skusError } = await supabase
        .from('skus')
        .select(`
          color_id,
          quantity,
          colors:color_id (id, name)
        `)
        .eq('po_item_id', item.id)

      if (skusError) throw skusError

      // Get color specs
      const specIds = specs.map((s: any) => s.id)
      const colorIds = skus?.map((s: any) => s.color_id) || []
      
      const { data: colorSpecs } = await supabase
        .from('style_color_thread_specs')
        .select(`
          style_thread_spec_id,
          color_id,
          thread_type_id,
          thread_types:thread_type_id (id, name, tex_number)
        `)
        .in('style_thread_spec_id', specIds)
        .in('color_id', colorIds)

      // Calculate
      const calculations = specs.map((spec: any) => {
        const colorBreakdown = skus?.map((sku: any) => {
          const colorSpec = colorSpecs?.find(
            (cs: any) => cs.style_thread_spec_id === spec.id && cs.color_id === sku.color_id
          )

          return {
            color_id: sku.color_id,
            color_name: (sku.colors as any)?.name || '',
            quantity: sku.quantity,
            thread_type_id: colorSpec?.thread_type_id || spec.tex_id,
            thread_type_name: colorSpec?.thread_types?.name || spec.thread_types?.name || '',
            total_meters: spec.meters_per_unit * sku.quantity,
          }
        }) || []

        return {
          spec_id: spec.id,
          process_name: spec.process_name,
          supplier_name: spec.suppliers?.name || '',
          tex_number: spec.thread_types?.tex_number || '',
          meters_per_unit: spec.meters_per_unit,
          total_meters: spec.meters_per_unit * item.quantity,
          meters_per_cone: spec.thread_types?.meters_per_cone || null,
          thread_color: spec.thread_types?.color || null,
          thread_color_code: spec.thread_types?.color_code || null,
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
