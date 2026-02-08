/**
 * Weekly Order Calculation Composable
 *
 * Manages multi-style selection, parallel calculation, and aggregation
 * for weekly thread ordering.
 */

import { ref, computed } from 'vue'
import { threadCalculationService } from '@/services/threadCalculationService'
import type {
  StyleOrderEntry,
  AggregatedRow,
  ThreadOrderItem,
  CalculationResult,
  CalculationInput,
} from '@/types/thread'

export function useWeeklyOrderCalculation() {
  // State
  const orderEntries = ref<StyleOrderEntry[]>([])
  const perStyleResults = ref<CalculationResult[]>([])
  const aggregatedResults = ref<AggregatedRow[]>([])
  const isCalculating = ref(false)
  const calculationProgress = ref({ current: 0, total: 0 })
  const calculationErrors = ref<
    Array<{ style_id: number; style_code: string; error: string }>
  >([])
  const lastCalculatedAt = ref<number | null>(null)
  const lastModifiedAt = ref<number | null>(null)

  // Computed
  const canCalculate = computed(() => {
    return orderEntries.value.some((entry) =>
      entry.colors.some((c) => c.quantity > 0)
    )
  })

  const hasResults = computed(() => perStyleResults.value.length > 0)

  const isResultsStale = computed(() => {
    return (
      lastModifiedAt.value !== null &&
      lastCalculatedAt.value !== null &&
      lastModifiedAt.value > lastCalculatedAt.value
    )
  })

  /**
   * Add a style to orderEntries if not already present
   */
  const addStyle = (style: {
    id: number
    style_code: string
    style_name: string
  }) => {
    const exists = orderEntries.value.some((e) => e.style_id === style.id)
    if (exists) return

    orderEntries.value.push({
      style_id: style.id,
      style_code: style.style_code,
      style_name: style.style_name,
      colors: [],
    })
    lastModifiedAt.value = Date.now()
  }

  /**
   * Remove a style from orderEntries
   */
  const removeStyle = (styleId: number) => {
    orderEntries.value = orderEntries.value.filter(
      (e) => e.style_id !== styleId
    )
    lastModifiedAt.value = Date.now()
  }

  /**
   * Add a color to a style entry with default quantity 1
   */
  const addColorToStyle = (
    styleId: number,
    color: { color_id: number; color_name: string; hex_code: string }
  ) => {
    const entry = orderEntries.value.find((e) => e.style_id === styleId)
    if (!entry) return

    const colorExists = entry.colors.some((c) => c.color_id === color.color_id)
    if (colorExists) return

    entry.colors.push({
      color_id: color.color_id,
      color_name: color.color_name,
      hex_code: color.hex_code,
      quantity: 1,
    })
    lastModifiedAt.value = Date.now()
  }

  /**
   * Remove a color from a style entry
   */
  const removeColorFromStyle = (styleId: number, colorId: number) => {
    const entry = orderEntries.value.find((e) => e.style_id === styleId)
    if (!entry) return

    entry.colors = entry.colors.filter((c) => c.color_id !== colorId)
    lastModifiedAt.value = Date.now()
  }

  /**
   * Update the quantity for a specific color in a style entry
   */
  const updateColorQuantity = (
    styleId: number,
    colorId: number,
    qty: number
  ) => {
    const entry = orderEntries.value.find((e) => e.style_id === styleId)
    if (!entry) return

    const color = entry.colors.find((c) => c.color_id === colorId)
    if (!color) return

    color.quantity = qty
    lastModifiedAt.value = Date.now()
  }

  /**
   * Aggregate per-style calculation results into a combined summary keyed by thread_type_id
   */
  const aggregateResults = (results: CalculationResult[]) => {
    const map = new Map<number, AggregatedRow>()

    for (const result of results) {
      for (const calc of result.calculations) {
        if (calc.color_breakdown) {
          for (const cb of calc.color_breakdown) {
            const existing = map.get(cb.thread_type_id)

            if (existing) {
              existing.total_meters += cb.total_meters
            } else {
              map.set(cb.thread_type_id, {
                thread_type_id: cb.thread_type_id,
                thread_type_name: cb.thread_type_name,
                supplier_name: calc.supplier_name,
                tex_number: calc.tex_number,
                total_meters: cb.total_meters,
                total_cones: 0,
                meters_per_cone: calc.meters_per_cone ?? null,
                thread_color: calc.thread_color ?? null,
                thread_color_code: calc.thread_color_code ?? null,
              })
            }
          }
        } else {
          // No color_breakdown -- aggregate by spec-level data
          const key = calc.spec_id
          const existing = map.get(key)

          if (existing) {
            existing.total_meters += calc.total_meters
          } else {
            map.set(key, {
              thread_type_id: key,
              thread_type_name: calc.process_name,
              supplier_name: calc.supplier_name,
              tex_number: calc.tex_number,
              total_meters: calc.total_meters,
              total_cones: 0,
              meters_per_cone: calc.meters_per_cone ?? null,
              thread_color: calc.thread_color ?? null,
              thread_color_code: calc.thread_color_code ?? null,
            })
          }
        }
      }
    }

    // Recalculate total_cones for each aggregated row
    for (const row of map.values()) {
      if (row.meters_per_cone && row.meters_per_cone > 0) {
        row.total_cones = Math.ceil(row.total_meters / row.meters_per_cone)
      } else {
        row.total_cones = 0
      }
    }

    aggregatedResults.value = Array.from(map.values())
  }

  /**
   * Run calculations for all style entries in parallel
   */
  const calculateAll = async () => {
    isCalculating.value = true
    calculationErrors.value = []
    perStyleResults.value = []

    // Filter entries that have at least one color with qty > 0
    const validEntries = orderEntries.value.filter((entry) =>
      entry.colors.some((c) => c.quantity > 0)
    )

    calculationProgress.value = { current: 0, total: validEntries.length }

    const promises = validEntries.map((entry) => {
      const totalQty = entry.colors.reduce((sum, c) => sum + c.quantity, 0)

      const input: CalculationInput = {
        style_id: entry.style_id,
        quantity: totalQty,
        color_breakdown: entry.colors
          .filter((c) => c.quantity > 0)
          .map((c) => ({
            color_id: c.color_id,
            quantity: c.quantity,
          })),
      }

      return threadCalculationService
        .calculate(input)
        .then((result) => {
          calculationProgress.value = {
            ...calculationProgress.value,
            current: calculationProgress.value.current + 1,
          }
          return { status: 'fulfilled' as const, value: result, entry }
        })
        .catch((err: unknown) => {
          calculationProgress.value = {
            ...calculationProgress.value,
            current: calculationProgress.value.current + 1,
          }
          return {
            status: 'rejected' as const,
            reason: err instanceof Error ? err.message : 'Lỗi không xác định',
            entry,
          }
        })
    })

    const settled = await Promise.all(promises)

    const successResults: CalculationResult[] = []

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        successResults.push(result.value)
      } else {
        calculationErrors.value.push({
          style_id: result.entry.style_id,
          style_code: result.entry.style_code,
          error: result.reason,
        })
      }
    }

    perStyleResults.value = successResults
    aggregateResults(successResults)
    lastCalculatedAt.value = Date.now()
    isCalculating.value = false
  }

  /**
   * Reset all state to initial values
   */
  const clearAll = () => {
    orderEntries.value = []
    perStyleResults.value = []
    aggregatedResults.value = []
    isCalculating.value = false
    calculationProgress.value = { current: 0, total: 0 }
    calculationErrors.value = []
    lastCalculatedAt.value = null
    lastModifiedAt.value = null
  }

  /**
   * Populate orderEntries from saved ThreadOrderItems (for loading from history)
   */
  const setFromWeekItems = (items: ThreadOrderItem[]) => {
    const entryMap = new Map<number, StyleOrderEntry>()

    for (const item of items) {
      const styleId = item.style_id

      if (!entryMap.has(styleId)) {
        entryMap.set(styleId, {
          style_id: styleId,
          style_code: item.style?.style_code || `Style #${styleId}`,
          style_name: item.style?.style_name || '',
          colors: [],
        })
      }

      const entry = entryMap.get(styleId)!

      const colorExists = entry.colors.some((c) => c.color_id === item.color_id)
      if (!colorExists) {
        entry.colors.push({
          color_id: item.color_id,
          color_name: item.color?.name || `Color #${item.color_id}`,
          hex_code: item.color?.hex_code || '#000000',
          quantity: item.quantity,
        })
      }
    }

    orderEntries.value = Array.from(entryMap.values())
    lastModifiedAt.value = Date.now()
    lastCalculatedAt.value = null
  }

  return {
    // State
    orderEntries,
    perStyleResults,
    aggregatedResults,
    isCalculating,
    calculationProgress,
    calculationErrors,
    lastCalculatedAt,
    lastModifiedAt,

    // Computed
    canCalculate,
    hasResults,
    isResultsStale,

    // Actions
    addStyle,
    removeStyle,
    addColorToStyle,
    removeColorFromStyle,
    updateColorQuantity,
    calculateAll,
    aggregateResults,
    clearAll,
    setFromWeekItems,
  }
}
