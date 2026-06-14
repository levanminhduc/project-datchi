/**
 * Issue V2 Routes
 * Thread Issue Management API - Simplified cone-based tracking
 *
 * Key features:
 * - Multi-line issues (multiple thread types per issue)
 * - Quantity-based tracking (full cones + partial cones)
 * - Quota from thread_order_items
 * - Backend handles ALL calculations
 */

import { Hono } from 'hono'
import type { Context } from 'hono'
import { ZodError } from 'zod'
import { createHash } from 'crypto'
import { query, queryOne, queryCount } from '../db/query'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'
import { getPartialConeRatio } from '../utils/settings-helper'
import {
  CreateIssueV2Schema,
  CreateIssueWithLineSchema,
  AddIssueLineV2Schema,
  BatchAddLinesSchema,
  ValidateIssueLineV2Schema,
  IssueV2FiltersSchema,
  FormDataQuerySchema,
  ReturnIssueV2Schema,
  ConfirmIssueV2Schema,
  OrderOptionsQuerySchema,
  StockRefreshSchema,
  ReturnListFiltersSchema,
} from '../validation/issuesV2'
import type { ThreadApiResponse } from '../types/thread'
import type { AppEnv } from '../types/hono-env'
import returnGroupedRoutes from './issues-v2-return-grouped'
import issueActivityRoutes from './issue-activity'
import {
  batchLookupThreadColorIds,
  batchFindConfirmedWeekIds,
  batchLoadInventoryData,
} from '../utils/issue-v2-batch-lookups'
import {
  detectWarehouseFromData,
  computeStockFromData,
  batchGetStockBreakdownByWarehouse,
  batchGetConfirmedIssuedGross,
} from '../utils/issue-v2-batch-stock'
import {
  batchGetBaseQuotaCones,
  batchGetQuotaCones,
  batchGetQuotaConesWithPending,
  compositeKey,
  type ThreadColorItem,
} from '../utils/issue-v2-batch-quota'

const issuesV2 = new Hono<AppEnv>()

issuesV2.use('*', requirePermission('thread.allocations.view'))

// ============================================================================
// Helper Functions
// ============================================================================

function formatZodError(err: ZodError): string {
  return err.issues.map((e) => e.message).join('; ')
}

function getPerformedBy(c: Context<AppEnv>, confirmedByFromBody?: string): string {
  const auth = c.get('auth')
  return auth?.employeeCode || (auth?.employeeId ? String(auth.employeeId) : '') || confirmedByFromBody || ''
}

function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

/**
 * Get partial cone ratio from system_settings
 * Default: 0.3 (30%)
 */
/**
 * Get meters_per_cone from thread_types table
 */
async function getMetersPerCone(threadTypeId: number): Promise<number | null> {
  try {
    const data = await queryOne<{ meters_per_cone: number }>(
      'SELECT meters_per_cone FROM thread_types WHERE id = $1',
      [threadTypeId]
    )

    if (!data) {
      console.error(`Failed to get meters_per_cone for thread_type_id ${threadTypeId}: not found`)
      return null
    }

    return data.meters_per_cone
  } catch (err) {
    console.error(`Failed to get meters_per_cone for thread_type_id ${threadTypeId}:`, err)
    return null
  }
}

/**
 * Calculate issued equivalent cones
 * Formula: issued_full + (issued_partial × partial_cone_ratio)
 */
function calculateIssuedEquivalent(
  issuedFull: number,
  issuedPartial: number,
  ratio: number
): number {
  return issuedFull + issuedPartial * ratio
}

function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

interface ReturnValidationResult {
  valid: boolean
  errors: string[]
}

interface IssueLine {
  id: number
  thread_type_id: number
  thread_color_id: number | null
  issued_full: number
  issued_partial: number
  returned_full: number
  returned_partial: number
}

interface ReturnLineInput {
  line_id: number
  returned_full: number
  returned_partial: number
}

interface ReturnPartialPayloadItem {
  original_cone_id: number
  return_quantity_meters: number
}

interface ReturnRpcResult {
  success?: boolean
  full_returns?: number
  partial_returns?: number
  full_returned?: number
  partial_existing_returned?: number
  partial_created_returned?: number
  line_id?: number
}

interface ProcessReturnLineResult {
  success: boolean
  line_id: number
  returned_full: number
  returned_partial: number
  error?: string
}

interface PrefetchedReturnData {
  fullCones: Array<{ id: number; quantity_meters: number; status: string }>
  partialCones: Array<{ id: number; status: string }>
  metersPerCone: number | null
}

async function processReturnForLine(
  lineId: number,
  line: IssueLine,
  requestedFull: number,
  requestedPartial: number,
  performedBy: string,
  partialConeRatio: number,
  prefetchedData?: PrefetchedReturnData,
): Promise<ProcessReturnLineResult> {
  if (requestedFull <= 0 && requestedPartial <= 0) {
    return { success: true, line_id: lineId, returned_full: 0, returned_partial: 0 }
  }

  let returnableFullConesRaw: Array<{ id: number; quantity_meters: number; status: string }> | null
  let returnablePartialConesRaw: Array<{ id: number; status: string }> | null

  if (prefetchedData) {
    returnableFullConesRaw = prefetchedData.fullCones
    returnablePartialConesRaw = prefetchedData.partialCones
  } else {
    try {
      returnableFullConesRaw = await query<{ id: number; quantity_meters: number; status: string }>(
        `SELECT id, quantity_meters, status FROM thread_inventory
         WHERE issued_line_id = $1 AND status IN ('IN_PRODUCTION', 'HARD_ALLOCATED') AND is_partial = false
         ORDER BY id ASC LIMIT 10000`,
        [lineId]
      )
    } catch {
      return {
        success: false,
        line_id: lineId,
        returned_full: 0,
        returned_partial: 0,
        error: `Khong the tai cuon nguyen dang xuat cho dong ${lineId}`,
      }
    }

    try {
      returnablePartialConesRaw = await query<{ id: number; status: string }>(
        `SELECT id, status FROM thread_inventory
         WHERE issued_line_id = $1 AND status IN ('IN_PRODUCTION', 'HARD_ALLOCATED') AND is_partial = true
         ORDER BY id ASC LIMIT 10000`,
        [lineId]
      )
    } catch {
      return {
        success: false,
        line_id: lineId,
        returned_full: 0,
        returned_partial: 0,
        error: `Khong the tai cuon le dang xuat cho dong ${lineId}`,
      }
    }
  }

  const statusRank = (status: string): number => {
    if (status === 'IN_PRODUCTION') return 0
    if (status === 'HARD_ALLOCATED') return 1
    return 2
  }

  const fullCones = (returnableFullConesRaw || []).sort((a, b) => {
    const rankDiff = statusRank(a.status) - statusRank(b.status)
    return rankDiff !== 0 ? rankDiff : a.id - b.id
  })
  const partialCones = (returnablePartialConesRaw || []).sort((a, b) => {
    const rankDiff = statusRank(a.status) - statusRank(b.status)
    return rankDiff !== 0 ? rankDiff : a.id - b.id
  })

  if (requestedFull > fullCones.length) {
    return {
      success: false,
      line_id: lineId,
      returned_full: 0,
      returned_partial: 0,
      error: `Dong ${line.id}: Khong du cuon nguyen de tra (${requestedFull}/${fullCones.length})`,
    }
  }

  const fullConesForReturn = fullCones.slice(0, requestedFull)
  const remainingFullCones = fullCones.slice(requestedFull)
  const partialFromExistingCount = Math.min(requestedPartial, partialCones.length)
  const partialConesForReturn = partialCones.slice(0, partialFromExistingCount)
  const partialNeedConvertCount = requestedPartial - partialFromExistingCount

  if (partialNeedConvertCount > remainingFullCones.length) {
    const availableEquivalentPartial = partialCones.length + remainingFullCones.length
    return {
      success: false,
      line_id: lineId,
      returned_full: 0,
      returned_partial: 0,
      error: `Dong ${line.id}: Khong du cuon le de tra (${requestedPartial}/${availableEquivalentPartial})`,
    }
  }

  const partialReturnsPayload: ReturnPartialPayloadItem[] = []
  if (partialNeedConvertCount > 0) {
    const metersPerCone = prefetchedData ? prefetchedData.metersPerCone : await getMetersPerCone(line.thread_type_id)
    if (!metersPerCone || metersPerCone <= 0) {
      return {
        success: false,
        line_id: lineId,
        returned_full: 0,
        returned_partial: 0,
        error: `Dong ${line.id}: Khong lay duoc meters_per_cone hop le`,
      }
    }

    const partialMeters = Number((metersPerCone * partialConeRatio).toFixed(4))
    if (partialMeters <= 0 || partialMeters >= metersPerCone) {
      return {
        success: false,
        line_id: lineId,
        returned_full: 0,
        returned_partial: 0,
        error: `Dong ${line.id}: Ty le cuon le khong hop le cho phep tach cuon (${partialConeRatio})`,
      }
    }

    const sourceFullCones = remainingFullCones.slice(0, partialNeedConvertCount)
    for (const sourceCone of sourceFullCones) {
      if ((sourceCone as any).quantity_meters < partialMeters) {
        return {
          success: false,
          line_id: lineId,
          returned_full: 0,
          returned_partial: 0,
          error: `Dong ${line.id}: Cuon ${sourceCone.id} khong du met de tach cuon le`,
        }
      }
      partialReturnsPayload.push({
        original_cone_id: sourceCone.id,
        return_quantity_meters: partialMeters,
      })
    }
  }

  const coneIdsForDirectReturn = [
    ...fullConesForReturn.map((c) => c.id),
    ...partialConesForReturn.map((c) => c.id),
  ]

  let rpcResultRaw: ReturnRpcResult | null
  try {
    const rpcRows = await query<{ result: ReturnRpcResult }>(
      'SELECT fn_return_cones_with_movements($1, $2, $3, $4) AS result',
      [
        coneIdsForDirectReturn.length > 0 ? coneIdsForDirectReturn : null,
        lineId,
        performedBy,
        partialReturnsPayload.length > 0 ? JSON.stringify(partialReturnsPayload) : null,
      ]
    )
    rpcResultRaw = rpcRows.length > 0 ? rpcRows[0].result : null
  } catch (err) {
    return {
      success: false,
      line_id: lineId,
      returned_full: 0,
      returned_partial: 0,
      error: getErrorMessage(err) || 'Loi xu ly tra hang',
    }
  }

  const rpcResult = (rpcResultRaw || {}) as ReturnRpcResult
  const actualReturnedFull =
    typeof rpcResult.full_returned === 'number'
      ? rpcResult.full_returned
      : fullConesForReturn.length
  const actualReturnedPartial =
    typeof rpcResult.partial_existing_returned === 'number' ||
    typeof rpcResult.partial_created_returned === 'number'
      ? (rpcResult.partial_existing_returned || 0) + (rpcResult.partial_created_returned || 0)
      : partialConesForReturn.length + partialReturnsPayload.length

  if (actualReturnedFull !== requestedFull || actualReturnedPartial !== requestedPartial) {
    return {
      success: false,
      line_id: lineId,
      returned_full: 0,
      returned_partial: 0,
      error: `Dong ${line.id}: Ket qua tra kho khong khop yeu cau`,
    }
  }

  const newReturnedFull = (line.returned_full || 0) + actualReturnedFull
  const newReturnedPartial = (line.returned_partial || 0) + actualReturnedPartial

  try {
    await query(
      'UPDATE thread_issue_lines SET returned_full = $1, returned_partial = $2 WHERE id = $3',
      [newReturnedFull, newReturnedPartial, lineId]
    )
  } catch {
    return {
      success: false,
      line_id: lineId,
      returned_full: 0,
      returned_partial: 0,
      error: 'Khong the cap nhat dong tra',
    }
  }

  return { success: true, line_id: lineId, returned_full: actualReturnedFull, returned_partial: actualReturnedPartial }
}

function validateReturnQuantities(
  returnLines: ReturnLineInput[],
  lineMap: Map<number, IssueLine>
): ReturnValidationResult {
  const errors: string[] = []

  for (const returnLine of returnLines) {
    const line = lineMap.get(returnLine.line_id)
    if (!line) {
      errors.push(`Dong ID ${returnLine.line_id} khong ton tai`)
      continue
    }

    const totalReturnedFull = (line.returned_full || 0) + returnLine.returned_full
    const totalReturnedPartial = (line.returned_partial || 0) + returnLine.returned_partial
    const totalReturned = totalReturnedFull + totalReturnedPartial
    const totalIssued = (line.issued_full || 0) + (line.issued_partial || 0)

    if (totalReturnedFull > (line.issued_full || 0)) {
      errors.push(
        `Dong ${line.id}: Tra nguyen ${totalReturnedFull} > xuat ${line.issued_full || 0}`
      )
    }

    if (totalReturned > totalIssued) {
      errors.push(
        `Dong ${line.id}: Tong tra (${totalReturned}) > tong xuat (${totalIssued})`
      )
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Generate issue code in format XK-YYYYMMDD-NNN
 */
async function generateIssueCode(): Promise<string> {
  const today = new Date()
  const dateStr =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0')

  const prefix = `XK-${dateStr}-`

  // Find the latest issue code for today
  let data: { issue_code: string } | null = null
  try {
    data = await queryOne<{ issue_code: string }>(
      `SELECT issue_code FROM thread_issues WHERE issue_code LIKE $1 ORDER BY issue_code DESC LIMIT 1`,
      [`${prefix}%`]
    )
  } catch {
    data = null
  }

  let sequence = 1
  if (data?.issue_code) {
    const lastSequence = parseInt(data.issue_code.slice(-3))
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1
    }
  }

  return `${prefix}${sequence.toString().padStart(3, '0')}`
}

/**
 * Get stock availability for a thread type
 * Returns { full_cones, partial_cones }
 * Queries thread_inventory (same as Weekly Order) for consistency
 */
async function getStockAvailability(
  threadTypeId: number,
  warehouseId?: number,
  weekIds?: number[],
  colorId?: number
): Promise<{ full_cones: number; partial_cones: number }> {
  let fullCount = 0
  let partialCount = 0

  if (weekIds && weekIds.length > 0) {
    const reservedParams: unknown[] = [threadTypeId, weekIds]
    let reservedSql = `SELECT is_partial FROM thread_inventory
      WHERE thread_type_id = $1 AND status = 'RESERVED_FOR_ORDER' AND reserved_week_id = ANY($2)`

    if (warehouseId) {
      reservedParams.push(warehouseId)
      reservedSql += ` AND warehouse_id = $${reservedParams.length}`
    }

    if (colorId) {
      reservedParams.push(colorId)
      reservedSql += ` AND color_id = $${reservedParams.length}`
    }

    reservedSql += ' LIMIT 1000000'

    const reserved = await query<{ is_partial: boolean }>(reservedSql, reservedParams)

    fullCount += reserved.filter((r) => !r.is_partial).length
    partialCount += reserved.filter((r) => r.is_partial).length
  }

  const freeParams: unknown[] = [threadTypeId]
  let freeSql = `SELECT is_partial FROM thread_inventory
    WHERE thread_type_id = $1 AND status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED')`

  if (warehouseId) {
    freeParams.push(warehouseId)
    freeSql += ` AND warehouse_id = $${freeParams.length}`
  }

  if (colorId) {
    freeParams.push(colorId)
    freeSql += ` AND color_id = $${freeParams.length}`
  }

  freeSql += ' LIMIT 1000000'

  const free = await query<{ is_partial: boolean }>(freeSql, freeParams)

  fullCount += free.filter((r) => !r.is_partial).length
  partialCount += free.filter((r) => r.is_partial).length

  return { full_cones: fullCount, partial_cones: partialCount }
}

async function validateSubArtId(
  styleId: number | null | undefined,
  subArtId: number | null | undefined
): Promise<string | null> {
  if (!styleId) {
    if (subArtId) return 'Khong the chon sub-art khi chua chon ma hang'
    return null
  }

  const subArts = await query<{ id: number }>(
    'SELECT id FROM sub_arts WHERE style_id = $1 LIMIT 1',
    [styleId]
  )

  const hasSubArts = subArts && subArts.length > 0

  if (hasSubArts && !subArtId) {
    return 'Ma hang nay yeu cau chon sub-art'
  }

  if (!hasSubArts && subArtId) {
    return 'Ma hang nay khong co sub-art'
  }

  if (subArtId) {
    const subArt = await queryOne<{ id: number }>(
      'SELECT id FROM sub_arts WHERE id = $1 AND style_id = $2',
      [subArtId, styleId]
    )

    if (!subArt) {
      return 'Sub-art khong thuoc ma hang da chon'
    }
  }

  return null
}

async function getSubArtCode(subArtId: number | null | undefined): Promise<string | null> {
  if (!subArtId) return null
  const data = await queryOne<{ sub_art_code: string }>(
    'SELECT sub_art_code FROM sub_arts WHERE id = $1',
    [subArtId]
  )
  return data?.sub_art_code || null
}

async function lookupThreadColorId(
  threadTypeId: number,
  styleColorId?: number | null
): Promise<number | undefined> {
  if (!styleColorId) return undefined

  const data = await queryOne<{ thread_color_id: number }>(
    `SELECT thread_color_id FROM style_color_thread_specs
     WHERE thread_type_id = $1 AND style_color_id = $2 AND thread_color_id IS NOT NULL
     LIMIT 1`,
    [threadTypeId, styleColorId]
  )

  return data?.thread_color_id ?? undefined
}

async function getConfirmedIssuedEquivalent(
  poId: number,
  styleId: number,
  colorId: number,
  threadTypeId: number,
  ratio: number,
  threadColorId?: number | null
): Promise<number> {
  const params: unknown[] = [poId, styleId, colorId, threadTypeId]
  let sql = `SELECT til.issued_full, til.issued_partial, til.returned_full, til.returned_partial
    FROM thread_issue_lines til
    INNER JOIN thread_issues ti ON ti.id = til.issue_id
    WHERE til.po_id = $1 AND til.style_id = $2 AND til.style_color_id = $3
      AND til.thread_type_id = $4 AND ti.status = 'CONFIRMED'`

  if (threadColorId !== undefined) {
    if (threadColorId === null) {
      sql += ' AND til.thread_color_id IS NULL'
    } else {
      params.push(threadColorId)
      sql += ` AND til.thread_color_id = $${params.length}`
    }
  }

  sql += ' LIMIT 10000'

  let issuedLines: Array<{ issued_full: number; issued_partial: number; returned_full: number; returned_partial: number }>
  try {
    issuedLines = await query(sql, params)
  } catch (err) {
    console.error('Error fetching confirmed issued lines:', err)
    return 0
  }

  return roundToTwoDecimals(
    (issuedLines || []).reduce((total, line: any) => {
      const issuedEquivalent = calculateIssuedEquivalent(
        line.issued_full || 0,
        line.issued_partial || 0,
        ratio
      )
      const returnedEquivalent = calculateIssuedEquivalent(
        line.returned_full || 0,
        line.returned_partial || 0,
        ratio
      )
      return total + Math.max(0, issuedEquivalent - returnedEquivalent)
    }, 0)
  )
}

async function getConfirmedIssuedEquivalentByDept(
  poId: number,
  styleId: number,
  colorId: number,
  threadTypeId: number,
  department: string,
  ratio: number,
  threadColorId?: number | null
): Promise<number> {
  const params: unknown[] = [poId, styleId, colorId, threadTypeId, department]
  let sql = `SELECT til.issued_full, til.issued_partial, til.returned_full, til.returned_partial
    FROM thread_issue_lines til
    INNER JOIN thread_issues ti ON ti.id = til.issue_id
    WHERE til.po_id = $1 AND til.style_id = $2 AND til.style_color_id = $3
      AND til.thread_type_id = $4 AND ti.status = 'CONFIRMED' AND ti.department = $5`

  if (threadColorId !== undefined) {
    if (threadColorId === null) {
      sql += ' AND til.thread_color_id IS NULL'
    } else {
      params.push(threadColorId)
      sql += ` AND til.thread_color_id = $${params.length}`
    }
  }

  sql += ' LIMIT 10000'

  let issuedLines: Array<{ issued_full: number; issued_partial: number; returned_full: number; returned_partial: number }>
  try {
    issuedLines = await query(sql, params)
  } catch (err) {
    console.error('Error fetching dept confirmed issued lines:', err)
    return 0
  }

  return roundToTwoDecimals(
    (issuedLines || []).reduce((total, line: any) => {
      const issuedEquivalent = calculateIssuedEquivalent(line.issued_full || 0, line.issued_partial || 0, ratio)
      const returnedEquivalent = calculateIssuedEquivalent(line.returned_full || 0, line.returned_partial || 0, ratio)
      return total + Math.max(0, issuedEquivalent - returnedEquivalent)
    }, 0)
  )
}

async function getDeptAllocation(
  poId: number,
  styleId: number,
  colorId: number,
  department: string
): Promise<{ id: number; product_quantity: number } | null> {
  try {
    const data = await queryOne<{ id: number; product_quantity: number }>(
      `SELECT id, product_quantity FROM dept_product_allocations
       WHERE po_id = $1 AND style_id = $2 AND style_color_id = $3 AND department = $4 AND deleted_at IS NULL`,
      [poId, styleId, colorId, department]
    )
    return data
  } catch (err) {
    console.error('Error fetching dept allocation:', err)
    return null
  }
}

async function _getConfirmedIssuedGross(
  poId: number,
  styleId: number,
  colorId: number,
  threadTypeId: number,
  ratio: number,
  threadColorId?: number | null
): Promise<number> {
  const params: unknown[] = [poId, styleId, colorId, threadTypeId]
  let sql = `SELECT til.issued_full, til.issued_partial
    FROM thread_issue_lines til
    INNER JOIN thread_issues ti ON ti.id = til.issue_id
    WHERE til.po_id = $1 AND til.style_id = $2 AND til.style_color_id = $3
      AND til.thread_type_id = $4 AND ti.status = 'CONFIRMED'`

  if (threadColorId !== undefined) {
    if (threadColorId === null) {
      sql += ' AND til.thread_color_id IS NULL'
    } else {
      params.push(threadColorId)
      sql += ` AND til.thread_color_id = $${params.length}`
    }
  }

  sql += ' LIMIT 10000'

  let issuedLines: Array<{ issued_full: number; issued_partial: number }>
  try {
    issuedLines = await query(sql, params)
  } catch (err) {
    console.error('Error fetching confirmed issued gross:', err)
    return 0
  }

  return roundToTwoDecimals(
    (issuedLines || []).reduce((total, line: any) => {
      return total + calculateIssuedEquivalent(line.issued_full || 0, line.issued_partial || 0, ratio)
    }, 0)
  )
}

async function _getBaseQuotaCones(
  poId: number,
  styleId: number,
  colorId: number,
  threadTypeId: number,
  threadColorId?: number | null
): Promise<number | null> {
  let orderItems: Array<{ quantity: number | null }>
  try {
    orderItems = await query<{ quantity: number | null }>(
      `SELECT toi.quantity FROM thread_order_items toi
       INNER JOIN thread_order_weeks tow ON tow.id = toi.week_id
       WHERE toi.po_id = $1 AND toi.style_id = $2 AND toi.style_color_id = $3
         AND tow.status = 'CONFIRMED' LIMIT 10000`,
      [poId, styleId, colorId]
    )
  } catch {
    return null
  }

  const totalOrderedQuantity = (orderItems || []).reduce(
    (sum, item: { quantity: number | null }) => sum + (item.quantity || 0),
    0
  )
  if (totalOrderedQuantity <= 0) return null

  const specs = await query<{
    thread_type_id: number
    thread_color_id: number | null
    style_thread_specs: { style_id: number; meters_per_unit: number } | null
  }>(
    `SELECT scts.thread_type_id, scts.thread_color_id,
       CASE WHEN sts.id IS NULL THEN NULL
         ELSE json_build_object('style_id', sts.style_id, 'meters_per_unit', sts.meters_per_unit)
       END AS style_thread_specs
     FROM style_color_thread_specs scts
     LEFT JOIN style_thread_specs sts ON sts.id = scts.style_thread_spec_id
     WHERE scts.style_color_id = $1 AND scts.thread_type_id = $2 LIMIT 10000`,
    [colorId, threadTypeId]
  )

  const specFilter = (s: any) =>
    s.style_thread_specs?.style_id === styleId &&
    (threadColorId !== undefined ? (s.thread_color_id ?? null) === threadColorId : true)

  const matchingSpecs = (specs || []).filter(specFilter) as any[]
  if (matchingSpecs.length === 0) return null

  const totalMetersPerUnit = matchingSpecs.reduce(
    (sum: number, s: any) => sum + (s.style_thread_specs.meters_per_unit as number), 0
  )

  const threadType = await queryOne<{ meters_per_cone: number }>(
    'SELECT meters_per_cone FROM thread_types WHERE id = $1',
    [threadTypeId]
  )

  if (!threadType?.meters_per_cone) return null

  const totalMeters = totalOrderedQuantity * totalMetersPerUnit
  return Math.ceil(totalMeters / threadType.meters_per_cone)
}

/**
 * Get remaining quota_cones for a specific PO/style/color/thread_type combination.
 * Remaining quota = confirmed weekly-order demand - net confirmed issued quantity.
 */
async function getQuotaCones(
  poId: number | null | undefined,
  styleId: number | null | undefined,
  colorId: number | null | undefined,
  threadTypeId: number,
  partialConeRatio?: number,
  department?: string,
  threadColorId?: number | null
): Promise<number | null> {
  if (!poId || !styleId || !colorId) {
    return null
  }

  const ratio = partialConeRatio ?? (await getPartialConeRatio())

  const specFilter = (s: any) =>
    s.style_thread_specs?.style_id === styleId &&
    (threadColorId !== undefined ? (s.thread_color_id ?? null) === threadColorId : true)

  if (department && poId && styleId && colorId) {
    const allocation = await getDeptAllocation(poId, styleId, colorId, department)
    if (allocation) {
      const specs = await query<{
        thread_type_id: number
        thread_color_id: number | null
        style_thread_specs: { style_id: number; meters_per_unit: number } | null
      }>(
        `SELECT scts.thread_type_id, scts.thread_color_id,
           CASE WHEN sts.id IS NULL THEN NULL
             ELSE json_build_object('style_id', sts.style_id, 'meters_per_unit', sts.meters_per_unit)
           END AS style_thread_specs
         FROM style_color_thread_specs scts
         LEFT JOIN style_thread_specs sts ON sts.id = scts.style_thread_spec_id
         WHERE scts.style_color_id = $1 AND scts.thread_type_id = $2 LIMIT 10000`,
        [colorId, threadTypeId]
      )

      const matchingSpecs = (specs || []).filter(specFilter) as any[]
      if (matchingSpecs.length === 0) return null

      const totalMetersPerUnit = matchingSpecs.reduce(
        (sum: number, s: any) => sum + (s.style_thread_specs.meters_per_unit as number), 0
      )

      const threadType = await queryOne<{ meters_per_cone: number }>(
        'SELECT meters_per_cone FROM thread_types WHERE id = $1',
        [threadTypeId]
      )

      if (!threadType?.meters_per_cone) return null

      const totalMeters = allocation.product_quantity * totalMetersPerUnit
      const baseQuota = Math.ceil(totalMeters / threadType.meters_per_cone)
      const issuedNet = await getConfirmedIssuedEquivalentByDept(
        poId, styleId, colorId, threadTypeId, department, ratio, threadColorId
      )
      const deptRemaining = roundToTwoDecimals(Math.max(0, baseQuota - issuedNet))

      const globalBaseQuota = await _getBaseQuotaCones(poId, styleId, colorId, threadTypeId, threadColorId)
      if (globalBaseQuota === null) return null
      const globalIssued = await getConfirmedIssuedEquivalent(poId, styleId, colorId, threadTypeId, ratio, threadColorId)
      const globalRemaining = Math.max(0, globalBaseQuota - globalIssued)
      return roundToTwoDecimals(Math.min(deptRemaining, globalRemaining))
    }
  }

  let orderItems: Array<{ quantity: number | null }>
  try {
    orderItems = await query<{ quantity: number | null }>(
      `SELECT toi.quantity FROM thread_order_items toi
       INNER JOIN thread_order_weeks tow ON tow.id = toi.week_id
       WHERE toi.po_id = $1 AND toi.style_id = $2 AND toi.style_color_id = $3
         AND tow.status = 'CONFIRMED' LIMIT 10000`,
      [poId, styleId, colorId]
    )
  } catch (err) {
    console.error('Error fetching confirmed weekly-order items:', err)
    return null
  }

  const totalOrderedQuantity = (orderItems || []).reduce(
    (sum, item: { quantity: number | null }) => sum + (item.quantity || 0),
    0
  )

  if (totalOrderedQuantity <= 0) {
    return null
  }

  let specs: Array<{
    thread_type_id: number
    thread_color_id: number | null
    style_thread_specs: { style_id: number; meters_per_unit: number } | null
  }>
  try {
    specs = await query(
      `SELECT scts.thread_type_id, scts.thread_color_id,
         CASE WHEN sts.id IS NULL THEN NULL
           ELSE json_build_object('style_id', sts.style_id, 'meters_per_unit', sts.meters_per_unit)
         END AS style_thread_specs
       FROM style_color_thread_specs scts
       LEFT JOIN style_thread_specs sts ON sts.id = scts.style_thread_spec_id
       WHERE scts.style_color_id = $1 AND scts.thread_type_id = $2 LIMIT 10000`,
      [colorId, threadTypeId]
    )
  } catch (err) {
    console.error('Error fetching spec:', err)
    return null
  }

  const matchingSpecs = (specs || []).filter(specFilter) as any[]
  if (matchingSpecs.length === 0) {
    return null
  }

  const consumptionPerUnit = matchingSpecs.reduce(
    (sum: number, s: any) => sum + (s.style_thread_specs.meters_per_unit as number), 0
  )

  const threadType = await queryOne<{ meters_per_cone: number }>(
    'SELECT meters_per_cone FROM thread_types WHERE id = $1',
    [threadTypeId]
  )

  if (!threadType || !threadType.meters_per_cone) {
    return null
  }

  const totalMeters = totalOrderedQuantity * consumptionPerUnit
  const baseQuotaCones = Math.ceil(totalMeters / threadType.meters_per_cone)

  const confirmedIssuedEquivalent = await getConfirmedIssuedEquivalent(
    poId,
    styleId,
    colorId,
    threadTypeId,
    ratio,
    threadColorId
  )

  const remainingQuotaCones = Math.max(0, baseQuotaCones - confirmedIssuedEquivalent)

  return roundToTwoDecimals(remainingQuotaCones)
}

async function findConfirmedWeekIds(
  poId: number | null | undefined,
  styleId: number | null | undefined,
  styleColorId: number | null | undefined
): Promise<number[]> {
  if (!poId || !styleId || !styleColorId) return []

  let items: Array<{ week_id: number }>
  try {
    items = await query<{ week_id: number }>(
      `SELECT toi.week_id FROM thread_order_items toi
       INNER JOIN thread_order_weeks tow ON tow.id = toi.week_id
       WHERE toi.po_id = $1 AND toi.style_id = $2 AND toi.style_color_id = $3
         AND tow.status = 'CONFIRMED'`,
      [poId, styleId, styleColorId]
    )
  } catch {
    return []
  }

  return [...new Set(items.map((i: { week_id: number }) => i.week_id))]
}

async function isComboCompletedInAllWeeks(
  poId: number | null | undefined,
  styleId: number | null | undefined,
  styleColorId: number | null | undefined
): Promise<boolean> {
  if (!poId || !styleId || !styleColorId) return false

  let items: Array<{ thread_order_weeks: { status: string } | null }>
  try {
    items = await query<{ thread_order_weeks: { status: string } | null }>(
      `SELECT json_build_object('status', tow.status) AS thread_order_weeks
       FROM thread_order_items toi
       INNER JOIN thread_order_weeks tow ON tow.id = toi.week_id
       WHERE toi.po_id = $1 AND toi.style_id = $2 AND toi.style_color_id = $3`,
      [poId, styleId, styleColorId]
    )
  } catch {
    return false
  }

  if (items.length === 0) return false

  return items.every((i: any) => i.thread_order_weeks?.status === 'COMPLETED')
}

async function detectWarehouseForThread(
  threadTypeId: number,
  weekIds: number[],
  colorId?: number
): Promise<number | undefined> {
  if (weekIds.length > 0) {
    const reservedParams: unknown[] = [threadTypeId, weekIds]
    let reservedSql = `SELECT warehouse_id FROM thread_inventory
      WHERE thread_type_id = $1 AND status = 'RESERVED_FOR_ORDER' AND reserved_week_id = ANY($2)`

    if (colorId) {
      reservedParams.push(colorId)
      reservedSql += ` AND color_id = $${reservedParams.length}`
    }

    reservedSql += ' LIMIT 1'

    const reserved = await query<{ warehouse_id: number }>(reservedSql, reservedParams)

    if (reserved && reserved.length > 0) {
      return reserved[0].warehouse_id
    }
  }

  const freeParams: unknown[] = [threadTypeId]
  let freeSql = `SELECT warehouse_id FROM thread_inventory
    WHERE thread_type_id = $1 AND status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED')`

  if (colorId) {
    freeParams.push(colorId)
    freeSql += ` AND color_id = $${freeParams.length}`
  }

  freeSql += ' LIMIT 1000000'

  const freeCones = await query<{ warehouse_id: number }>(freeSql, freeParams)

  if (!freeCones || freeCones.length === 0) return undefined

  const counts = new Map<number, number>()
  for (const cone of freeCones) {
    counts.set(cone.warehouse_id, (counts.get(cone.warehouse_id) || 0) + 1)
  }

  let bestWarehouseId: number | undefined
  let maxCount = 0
  for (const [whId, count] of counts) {
    if (count > maxCount) {
      maxCount = count
      bestWarehouseId = whId
    }
  }

  return bestWarehouseId
}

async function getStockBreakdownByWarehouse(
  threadTypeId: number,
  weekIds: number[],
  colorId?: number
): Promise<{ warehouse_id: number; warehouse_name: string; full_cones: number; partial_cones: number }[]> {
  const warehouseMap = new Map<number, { warehouse_name: string; full_cones: number; partial_cones: number }>()

  if (weekIds.length > 0) {
    const reservedParams: unknown[] = [threadTypeId, weekIds]
    let reservedSql = `SELECT ti.warehouse_id, ti.is_partial,
        json_build_object('name', w.name) AS warehouses
      FROM thread_inventory ti
      INNER JOIN warehouses w ON w.id = ti.warehouse_id
      WHERE ti.thread_type_id = $1 AND ti.status = 'RESERVED_FOR_ORDER' AND ti.reserved_week_id = ANY($2)`

    if (colorId) {
      reservedParams.push(colorId)
      reservedSql += ` AND ti.color_id = $${reservedParams.length}`
    }

    reservedSql += ' LIMIT 10000'

    const reserved = await query<{ warehouse_id: number; is_partial: boolean; warehouses: { name: string } | null }>(
      reservedSql,
      reservedParams
    )

    for (const cone of reserved) {
      const whId = cone.warehouse_id
      const whName = (cone.warehouses as any)?.name || ''
      if (!warehouseMap.has(whId)) {
        warehouseMap.set(whId, { warehouse_name: whName, full_cones: 0, partial_cones: 0 })
      }
      const entry = warehouseMap.get(whId)!
      if (cone.is_partial) entry.partial_cones++
      else entry.full_cones++
    }
  }

  const freeParams: unknown[] = [threadTypeId]
  let freeSql = `SELECT ti.warehouse_id, ti.is_partial,
      json_build_object('name', w.name) AS warehouses
    FROM thread_inventory ti
    INNER JOIN warehouses w ON w.id = ti.warehouse_id
    WHERE ti.thread_type_id = $1 AND ti.status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED')`

  if (colorId) {
    freeParams.push(colorId)
    freeSql += ` AND ti.color_id = $${freeParams.length}`
  }

  freeSql += ' LIMIT 10000'

  const free = await query<{ warehouse_id: number; is_partial: boolean; warehouses: { name: string } | null }>(
    freeSql,
    freeParams
  )

  for (const cone of free) {
    const whId = cone.warehouse_id
    const whName = (cone.warehouses as any)?.name || ''
    if (!warehouseMap.has(whId)) {
      warehouseMap.set(whId, { warehouse_name: whName, full_cones: 0, partial_cones: 0 })
    }
    const entry = warehouseMap.get(whId)!
    if (cone.is_partial) entry.partial_cones++
    else entry.full_cones++
  }

  return Array.from(warehouseMap.entries()).map(([warehouse_id, data]) => ({
    warehouse_id,
    ...data,
  }))
}

async function transferConesForIssue(
  threadTypeId: number,
  fromWarehouseId: number,
  toWarehouseId: number,
  fullCount: number,
  partialCount: number,
  performedBy: string,
  issueId: number,
  colorId?: number
): Promise<{ success: boolean; transferred_full: number; transferred_partial: number }> {
  const coneIds: number[] = []
  let transferredFull = 0
  let transferredPartial = 0

  if (fullCount > 0) {
    const fullParams: unknown[] = [threadTypeId, fromWarehouseId]
    let fullSql = `SELECT id FROM thread_inventory
      WHERE thread_type_id = $1 AND warehouse_id = $2
        AND status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED') AND is_partial = false`

    if (colorId) {
      fullParams.push(colorId)
      fullSql += ` AND color_id = $${fullParams.length}`
    }

    fullParams.push(fullCount)
    fullSql += ` ORDER BY expiry_date ASC NULLS LAST, received_date ASC LIMIT $${fullParams.length}`

    const fullCones = await query<{ id: number }>(fullSql, fullParams)
    coneIds.push(...fullCones.map((c) => c.id))
    transferredFull = fullCones.length
  }

  if (partialCount > 0) {
    const partialParams: unknown[] = [threadTypeId, fromWarehouseId]
    let partialSql = `SELECT id FROM thread_inventory
      WHERE thread_type_id = $1 AND warehouse_id = $2
        AND status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED') AND is_partial = true`

    if (colorId) {
      partialParams.push(colorId)
      partialSql += ` AND color_id = $${partialParams.length}`
    }

    partialParams.push(partialCount)
    partialSql += ` ORDER BY expiry_date ASC NULLS LAST, received_date ASC LIMIT $${partialParams.length}`

    const partialCones = await query<{ id: number }>(partialSql, partialParams)
    coneIds.push(...partialCones.map((c) => c.id))
    transferredPartial = partialCones.length
  }

  if (coneIds.length === 0) {
    return { success: false, transferred_full: 0, transferred_partial: 0 }
  }

  try {
    await query(
      'UPDATE thread_inventory SET warehouse_id = $1 WHERE id = ANY($2)',
      [toWarehouseId, coneIds]
    )
  } catch (updateError) {
    console.error('[transferConesForIssue] Update error:', updateError)
    return { success: false, transferred_full: 0, transferred_partial: 0 }
  }

  await query(
    `INSERT INTO batch_transactions
       (operation_type, from_warehouse_id, to_warehouse_id, cone_ids, cone_count, notes, performed_by, performed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      'TRANSFER',
      fromWarehouseId,
      toWarehouseId,
      coneIds,
      coneIds.length,
      `Muon kho cho phieu xuat #${issueId}`,
      performedBy,
      new Date().toISOString(),
    ]
  )

  return { success: true, transferred_full: transferredFull, transferred_partial: transferredPartial }
}

/**
 * Deduct stock using FEFO (First Expired First Out)
 * Uses RPC fn_issue_cones_with_movements for atomic operation with movement logging
 */
async function deductStock(
  threadTypeId: number,
  deductFull: number,
  deductPartial: number,
  issueLineId: number,
  performedBy: string,
  weekIds: number[] = [],
  warehouseId?: number,
  colorId?: number
): Promise<{ success: boolean; message?: string; allocatedConeIds?: number[] }> {
  const totalCones = deductFull + deductPartial
  if (totalCones === 0) {
    return { success: true, allocatedConeIds: [] }
  }

  const fullIds: number[] = []
  const partialIds: number[] = []

  let remainingFull = deductFull
  let remainingPartial = deductPartial

  if (weekIds.length > 0) {
    if (remainingFull > 0) {
      const rfParams: unknown[] = [threadTypeId, weekIds]
      let rfSql = `SELECT id FROM thread_inventory
        WHERE thread_type_id = $1 AND status = 'RESERVED_FOR_ORDER'
          AND reserved_week_id = ANY($2) AND is_partial = false`

      if (warehouseId) {
        rfParams.push(warehouseId)
        rfSql += ` AND warehouse_id = $${rfParams.length}`
      }

      if (colorId) {
        rfParams.push(colorId)
        rfSql += ` AND color_id = $${rfParams.length}`
      }

      rfParams.push(remainingFull)
      rfSql += ` ORDER BY expiry_date ASC NULLS LAST, received_date ASC LIMIT $${rfParams.length}`

      const reservedFull = await query<{ id: number }>(rfSql, rfParams)

      if (reservedFull?.length) {
        fullIds.push(...reservedFull.map((c) => c.id))
        remainingFull -= reservedFull.length
      }
    }

    if (remainingPartial > 0) {
      const rpParams: unknown[] = [threadTypeId, weekIds]
      let rpSql = `SELECT id FROM thread_inventory
        WHERE thread_type_id = $1 AND status = 'RESERVED_FOR_ORDER'
          AND reserved_week_id = ANY($2) AND is_partial = true`

      if (warehouseId) {
        rpParams.push(warehouseId)
        rpSql += ` AND warehouse_id = $${rpParams.length}`
      }

      if (colorId) {
        rpParams.push(colorId)
        rpSql += ` AND color_id = $${rpParams.length}`
      }

      rpParams.push(remainingPartial)
      rpSql += ` ORDER BY expiry_date ASC NULLS LAST, received_date ASC LIMIT $${rpParams.length}`

      const reservedPartial = await query<{ id: number }>(rpSql, rpParams)

      if (reservedPartial?.length) {
        partialIds.push(...reservedPartial.map((c) => c.id))
        remainingPartial -= reservedPartial.length
      }
    }
  }

  if (remainingFull > 0) {
    const afParams: unknown[] = [threadTypeId]
    let afSql = `SELECT id FROM thread_inventory
      WHERE thread_type_id = $1 AND status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED') AND is_partial = false`

    if (fullIds.length > 0) {
      afParams.push(fullIds)
      afSql += ` AND NOT (id = ANY($${afParams.length}))`
    }

    if (warehouseId) {
      afParams.push(warehouseId)
      afSql += ` AND warehouse_id = $${afParams.length}`
    }

    if (colorId) {
      afParams.push(colorId)
      afSql += ` AND color_id = $${afParams.length}`
    }

    afParams.push(remainingFull)
    afSql += ` ORDER BY expiry_date ASC NULLS LAST, received_date ASC LIMIT $${afParams.length}`

    let availFull: Array<{ id: number }>
    try {
      availFull = await query<{ id: number }>(afSql, afParams)
    } catch {
      return { success: false, message: 'Loi truy van ton kho cuon nguyen' }
    }

    if (!availFull || availFull.length < remainingFull) {
      return {
        success: false,
        message: `Khong du cuon nguyen. Can ${deductFull}, co ${fullIds.length + (availFull?.length || 0)}`,
      }
    }

    fullIds.push(...availFull.map((c) => c.id))
  }

  if (remainingPartial > 0) {
    const apParams: unknown[] = [threadTypeId]
    let apSql = `SELECT id FROM thread_inventory
      WHERE thread_type_id = $1 AND status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED') AND is_partial = true`

    if (partialIds.length > 0) {
      apParams.push(partialIds)
      apSql += ` AND NOT (id = ANY($${apParams.length}))`
    }

    if (warehouseId) {
      apParams.push(warehouseId)
      apSql += ` AND warehouse_id = $${apParams.length}`
    }

    if (colorId) {
      apParams.push(colorId)
      apSql += ` AND color_id = $${apParams.length}`
    }

    apParams.push(remainingPartial)
    apSql += ` ORDER BY expiry_date ASC NULLS LAST, received_date ASC LIMIT $${apParams.length}`

    let availPartial: Array<{ id: number }>
    try {
      availPartial = await query<{ id: number }>(apSql, apParams)
    } catch {
      return { success: false, message: 'Loi truy van ton kho cuon le' }
    }

    if (!availPartial || availPartial.length < remainingPartial) {
      return {
        success: false,
        message: `Khong du cuon le. Can ${deductPartial}, co ${partialIds.length + (availPartial?.length || 0)}`,
      }
    }

    partialIds.push(...availPartial.map((c) => c.id))
  }

  const allConeIds = [...fullIds, ...partialIds]

  if (allConeIds.length === 0) {
    return { success: true, allocatedConeIds: [] }
  }

  try {
    await query(
      'SELECT fn_issue_cones_with_movements($1, $2, $3) AS result',
      [allConeIds, issueLineId, performedBy]
    )
  } catch (rpcError) {
    console.error('[deductStock] RPC error:', rpcError)
    return { success: false, message: getErrorMessage(rpcError) || 'Loi xu ly xuat kho' }
  }

  return { success: true, allocatedConeIds: allConeIds }
}

// Note: addStock function was inlined into the return endpoint for better
// atomicity (three-phase preflight approach with cross-line ID tracking).
// The return endpoint at POST /:id/return now handles stock operations directly.

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/issues/v2/order-options - Get order options for cascading selects
 *
 * Query params:
 * - No params: Return distinct POs from confirmed weekly orders
 * - ?po_id=X: Return distinct Styles for that PO
 * - ?po_id=X&style_id=Y: Return distinct Colors for that PO+Style
 *
 * Returns: { data: [...], error: null }
 */
issuesV2.get('/order-options', async (c) => {
  try {
    const rawQuery = c.req.query()
    const validated = OrderOptionsQuerySchema.parse(rawQuery)
    const { po_id, style_id } = validated

    // Case 3: Return Colors for specific PO + Style
    if (po_id && style_id) {
      const weekIds = await query<{ id: number }>(
        `SELECT id FROM thread_order_weeks WHERE status = 'CONFIRMED'`
      )

      if (!weekIds || weekIds.length === 0) {
        return c.json({ data: [], error: null })
      }

      let colorItems: Array<{
        style_color_id: number | null
        style_colors: { id: number; color_name: string; hex_code: string | null } | null
      }>
      try {
        colorItems = await query(
          `SELECT toi.style_color_id,
             CASE WHEN sc.id IS NULL THEN NULL
               ELSE json_build_object('id', sc.id, 'color_name', sc.color_name, 'hex_code', sc.hex_code)
             END AS style_colors
           FROM thread_order_items toi
           LEFT JOIN style_colors sc ON sc.id = toi.style_color_id
           WHERE toi.po_id = $1 AND toi.style_id = $2 AND toi.style_color_id IS NOT NULL
             AND toi.week_id = ANY($3)`,
          [po_id, style_id, weekIds.map((w) => w.id)]
        )
      } catch {
        return c.json({ data: null, error: 'Loi truy van mau sac' }, 500)
      }

      const uniqueColors = new Map()
      for (const item of colorItems || []) {
        if (item.style_colors && !uniqueColors.has(item.style_color_id)) {
          const sc = item.style_colors as unknown as { id: number; color_name: string; hex_code: string | null }
          uniqueColors.set(item.style_color_id, {
            id: sc.id,
            name: sc.color_name,
            hex_code: sc.hex_code,
          })
        }
      }

      return c.json({ data: Array.from(uniqueColors.values()), error: null })
    }

    // Case 2: Return Styles for specific PO
    if (po_id) {
      // Get confirmed week IDs first
      const weekIds = await query<{ id: number }>(
        `SELECT id FROM thread_order_weeks WHERE status = 'CONFIRMED'`
      )

      if (!weekIds || weekIds.length === 0) {
        return c.json({
          data: [],
          error: null,
        })
      }

      let styleItems: Array<{
        style_id: number | null
        styles: { id: number; style_code: string; style_name: string } | null
      }>
      try {
        styleItems = await query(
          `SELECT toi.style_id,
             CASE WHEN s.id IS NULL THEN NULL
               ELSE json_build_object('id', s.id, 'style_code', s.style_code, 'style_name', s.style_name)
             END AS styles
           FROM thread_order_items toi
           LEFT JOIN styles s ON s.id = toi.style_id
           WHERE toi.po_id = $1 AND toi.style_id IS NOT NULL AND toi.week_id = ANY($2)`,
          [po_id, weekIds.map((w) => w.id)]
        )
      } catch {
        return c.json(
          {
            data: null,
            error: 'Loi truy van style',
          },
          500
        )
      }

      // Extract unique styles
      const uniqueStyles = new Map()
      for (const item of styleItems || []) {
        if (item.styles && !uniqueStyles.has(item.style_id)) {
          uniqueStyles.set(item.style_id, item.styles)
        }
      }

      const styleIds = Array.from(uniqueStyles.keys())
      const subArtStyleIds = new Set<number>()
      if (styleIds.length > 0) {
        const subArtRows = await query<{ style_id: number }>(
          `SELECT style_id FROM sub_arts WHERE style_id = ANY($1)`,
          [styleIds]
        )
        for (const row of subArtRows) {
          subArtStyleIds.add(row.style_id)
        }
      }

      return c.json({
        data: Array.from(uniqueStyles.entries()).map(([styleId, style]) => ({
          ...style,
          has_sub_arts: subArtStyleIds.has(styleId),
        })),
        error: null,
      })
    }

    // Case 1: Return distinct POs (no params)
    // Get confirmed week IDs first
    const weekIds = await query<{ id: number }>(
      `SELECT id FROM thread_order_weeks WHERE status = 'CONFIRMED'`
    )

    if (!weekIds || weekIds.length === 0) {
      return c.json({
        data: [],
        error: null,
      })
    }

    let poItems: Array<{
      po_id: number | null
      purchase_orders: { id: number; po_number: string } | null
    }>
    try {
      poItems = await query(
        `SELECT toi.po_id,
           CASE WHEN po.id IS NULL THEN NULL
             ELSE json_build_object('id', po.id, 'po_number', po.po_number)
           END AS purchase_orders
         FROM thread_order_items toi
         LEFT JOIN purchase_orders po ON po.id = toi.po_id
         WHERE toi.po_id IS NOT NULL AND toi.week_id = ANY($1)`,
        [weekIds.map((w) => w.id)]
      )
    } catch {
      return c.json(
        {
          data: null,
          error: 'Loi truy van PO',
        },
        500
      )
    }

    // Extract unique POs
    const uniquePOs = new Map()
    for (const item of poItems || []) {
      if (item.purchase_orders && !uniquePOs.has(item.po_id)) {
        uniquePOs.set(item.po_id, item.purchase_orders)
      }
    }

    return c.json({
      data: Array.from(uniquePOs.values()),
      error: null,
    })
  } catch (err) {
    console.error('Error in GET /api/issues/v2/order-options:', err)
    if (err instanceof ZodError) {
      return c.json(
        {
          data: null,
          error: formatZodError(err),
        },
        400
      )
    }
    return c.json(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * POST /api/issues/v2 - Create new issue
 *
 * Creates a new issue with status=DRAFT and auto-generated issue_code
 * Body: { department, created_by, notes? }
 * Returns: { issue_id, issue_code }
 */
issuesV2.post('/', async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = CreateIssueV2Schema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    // Generate unique issue code
    const issueCode = await generateIssueCode()

    // Insert new issue
    let issue: { id: number; issue_code: string }
    try {
      issue = await query<{ id: number; issue_code: string }>(
        `INSERT INTO thread_issues (issue_code, department, created_by, notes, status)
         VALUES ($1, $2, $3, $4, 'DRAFT')
         RETURNING id, issue_code`,
        [issueCode, validated.department, validated.created_by, validated.notes || null]
      ).then((rows) => rows[0])
    } catch (error) {
      console.error('Error creating issue:', error)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tao phieu xuat: ' + getErrorMessage(error),
        },
        500
      )
    }

    return c.json({
      data: { issue_id: issue.id, issue_code: issue.issue_code },
      error: null,
      message: 'Tao phieu xuat thanh cong',
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

issuesV2.post('/validate-line', async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = ValidateIssueLineV2Schema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const { thread_type_id, thread_color_id, issued_full, issued_partial, po_id, style_id, style_color_id, color_id, sub_art_id, department, warehouse_id } = validated
    const effectiveColorId = style_color_id || color_id

    const subArtError = await validateSubArtId(style_id, sub_art_id)
    if (subArtError) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: subArtError },
        400
      )
    }

    const ratio = await getPartialConeRatio()

    const issuedEquivalent = calculateIssuedEquivalent(issued_full || 0, issued_partial || 0, ratio)

    const threadColorId = thread_color_id !== undefined ? thread_color_id : await lookupThreadColorId(thread_type_id, effectiveColorId)
    const quotaCones = await getQuotaCones(po_id, style_id, effectiveColorId, thread_type_id, ratio, department, threadColorId)

    const isOverQuota = quotaCones !== null && issuedEquivalent > quotaCones

    const weekIds = await findConfirmedWeekIds(po_id, style_id, effectiveColorId)
    const effectiveWarehouseId = warehouse_id || await detectWarehouseForThread(thread_type_id, weekIds, threadColorId)
    const stock = await getStockAvailability(thread_type_id, effectiveWarehouseId, weekIds, threadColorId)

    const stockSufficient =
      (issued_full || 0) <= stock.full_cones && (issued_partial || 0) <= stock.partial_cones

    let canBorrowFromOther = false
    if (!stockSufficient && warehouse_id) {
      const totalStock = await getStockAvailability(thread_type_id, undefined, weekIds, threadColorId)
      canBorrowFromOther = (issued_full || 0) <= totalStock.full_cones && (issued_partial || 0) <= totalStock.partial_cones
    }

    let message: string | undefined
    if (isOverQuota) {
      message = `Vuot dinh muc ${(issuedEquivalent - (quotaCones || 0)).toFixed(2)} cuon`
    }
    if (!stockSufficient) {
      const shortFull = Math.max(0, (issued_full || 0) - stock.full_cones)
      const shortPartial = Math.max(0, (issued_partial || 0) - stock.partial_cones)
      const borrowHint = canBorrowFromOther ? ' (co the muon tu kho khac)' : ''
      message = message
        ? `${message}. Thieu ${shortFull} cuon nguyen, ${shortPartial} cuon le${borrowHint}`
        : `Thieu ${shortFull} cuon nguyen, ${shortPartial} cuon le${borrowHint}`
    }

    return c.json({
      data: {
        issued_equivalent: issuedEquivalent,
        is_over_quota: isOverQuota,
        stock_sufficient: stockSufficient,
        can_borrow: canBorrowFromOther,
        quota_cones: quotaCones,
        stock_available_full: stock.full_cones,
        stock_available_partial: stock.partial_cones,
        message,
      },
      error: null,
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/validate-line:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

issuesV2.post('/create-with-lines', async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = CreateIssueWithLineSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const {
      department,
      created_by,
      notes,
      po_id,
      style_id,
      style_color_id,
      color_id,
      sub_art_id,
      thread_type_id,
      thread_color_id,
      warehouse_id,
      issued_full,
      issued_partial,
      over_quota_notes,
    } = validated
    const effectiveColorId = style_color_id || color_id

    const subArtError = await validateSubArtId(style_id, sub_art_id)
    if (subArtError) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: subArtError },
        400
      )
    }

    const ratio = await getPartialConeRatio()
    const issuedEquivalent = calculateIssuedEquivalent(issued_full || 0, issued_partial || 0, ratio)

    const createThreadColorId = thread_color_id !== undefined ? thread_color_id : await lookupThreadColorId(thread_type_id, effectiveColorId)
    const quotaCones = await getQuotaCones(po_id, style_id, effectiveColorId, thread_type_id, ratio, department, createThreadColorId)
    const isOverQuota = quotaCones !== null && issuedEquivalent > quotaCones

    if (isOverQuota && !over_quota_notes?.trim()) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Vuot dinh muc, yeu cau ghi chu ly do',
        },
        400
      )
    }

    const weekIds = await findConfirmedWeekIds(po_id, style_id, effectiveColorId)
    const effectiveWarehouseId = warehouse_id || await detectWarehouseForThread(thread_type_id, weekIds, createThreadColorId)
    const stock = await getStockAvailability(thread_type_id, effectiveWarehouseId, weekIds, createThreadColorId)
    const stockSufficient =
      (issued_full || 0) <= stock.full_cones && (issued_partial || 0) <= stock.partial_cones

    if (!stockSufficient) {
      const shortFull = Math.max(0, (issued_full || 0) - stock.full_cones)
      const shortPartial = Math.max(0, (issued_partial || 0) - stock.partial_cones)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: `Khong du ton kho. Thieu ${shortFull > 0 ? shortFull + ' cuon nguyen' : ''}${shortFull > 0 && shortPartial > 0 ? ', ' : ''}${shortPartial > 0 ? shortPartial + ' cuon le' : ''}. Ton kho hien tai: ${stock.full_cones} nguyen, ${stock.partial_cones} le.`,
        },
        400
      )
    }

    const issueCode = await generateIssueCode()

    let issue: Record<string, any> | null
    try {
      const issueRows = await query<Record<string, any>>(
        `INSERT INTO thread_issues (issue_code, department, created_by, notes, status)
         VALUES ($1, $2, $3, $4, 'DRAFT')
         RETURNING *`,
        [issueCode, department, created_by, notes || null]
      )
      issue = issueRows.length > 0 ? issueRows[0] : null
    } catch (issueError) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tao phieu xuat: ' + (getErrorMessage(issueError) || 'Loi khong xac dinh'),
        },
        500
      )
    }

    if (!issue) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tao phieu xuat: Loi khong xac dinh',
        },
        500
      )
    }

    let line: Record<string, any> | null
    try {
      const lineRows = await query<Record<string, any>>(
        `INSERT INTO thread_issue_lines
           (issue_id, po_id, style_id, style_color_id, color_id, sub_art_id, thread_type_id,
            thread_color_id, quota_cones, issued_full, issued_partial, returned_full, returned_partial, over_quota_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 0, $12)
         RETURNING *`,
        [
          issue.id,
          po_id || null,
          style_id || null,
          style_color_id || null,
          color_id || null,
          sub_art_id || null,
          thread_type_id,
          createThreadColorId || null,
          quotaCones,
          issued_full || 0,
          issued_partial || 0,
          over_quota_notes || null,
        ]
      )
      line = lineRows.length > 0 ? lineRows[0] : null
    } catch (lineError) {
      await query('DELETE FROM thread_issues WHERE id = $1', [issue.id])
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the them dong: ' + (getErrorMessage(lineError) || 'Loi khong xac dinh'),
        },
        500
      )
    }

    if (!line) {
      await query('DELETE FROM thread_issues WHERE id = $1', [issue.id])
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the them dong: Loi khong xac dinh',
        },
        500
      )
    }

    const threadType = await queryOne<{ code: string; name: string }>(
      'SELECT code, name FROM thread_types WHERE id = $1',
      [thread_type_id]
    )

    const poData = po_id
      ? await queryOne<{ id: number; po_number: string }>(
          'SELECT id, po_number FROM purchase_orders WHERE id = $1',
          [po_id]
        )
      : null

    const styleData = style_id
      ? await queryOne<{ id: number; style_code: string; style_name: string }>(
          'SELECT id, style_code, style_name FROM styles WHERE id = $1',
          [style_id]
        )
      : null

    const colorData = style_color_id
      ? await queryOne<{ id: number; color_name: string }>(
          'SELECT id, color_name FROM style_colors WHERE id = $1',
          [style_color_id]
        )
      : color_id
        ? await queryOne<{ id: number; name: string }>(
            'SELECT id, name FROM colors WHERE id = $1',
            [color_id]
          )
        : null

    const subArtCode = await getSubArtCode(sub_art_id)

    const lineWithComputed = {
      ...line,
      issued_equivalent: issuedEquivalent,
      is_over_quota: isOverQuota,
      stock_available_full: stock.full_cones,
      stock_available_partial: stock.partial_cones,
      thread_color_id: createThreadColorId ?? null,
      thread_code: threadType?.code,
      thread_name: threadType?.name,
      po_number: (poData as any)?.po_number,
      style_code: (styleData as any)?.style_code,
      style_name: (styleData as any)?.style_name,
      color_name: (colorData as any)?.color_name ?? (colorData as any)?.name ?? null,
      sub_art_code: subArtCode,
    }

    return c.json({
      data: {
        ...issue,
        lines: [lineWithComputed],
      },
      error: null,
      message: 'Tao phieu xuat thanh cong',
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/create-with-lines:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

issuesV2.post('/stock-refresh', async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = StockRefreshSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const { po_id, style_id, items, department, ratio: requestRatio } = validated

    const colorGroups = new Map<number, typeof items>()
    for (const item of items) {
      const group = colorGroups.get(item.color_id) || []
      group.push(item)
      colorGroups.set(item.color_id, group)
    }

    const allWeekIds = new Set<number>()
    for (const colorId of colorGroups.keys()) {
      const weekIds = await findConfirmedWeekIds(po_id, style_id, colorId)
      for (const wid of weekIds) allWeekIds.add(wid)
    }

    const allThreadTypeIds = [...new Set(items.map((i) => i.thread_type_id))]

    let reservedRows: { thread_type_id: number; color_id: number | null; warehouse_id: number | null; is_partial: boolean }[] = []
    if (allWeekIds.size > 0) {
      reservedRows = await query<typeof reservedRows[number]>(
        `SELECT thread_type_id, color_id, warehouse_id, is_partial FROM thread_inventory
         WHERE thread_type_id = ANY($1) AND status = 'RESERVED_FOR_ORDER'
           AND reserved_week_id = ANY($2) LIMIT 1000000`,
        [allThreadTypeIds, [...allWeekIds]]
      )
    }

    const freeRows = await query<typeof reservedRows[number]>(
      `SELECT thread_type_id, color_id, warehouse_id, is_partial FROM thread_inventory
       WHERE thread_type_id = ANY($1) AND status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED') LIMIT 1000000`,
      [allThreadTypeIds]
    )

    const allRows = [...reservedRows, ...freeRows]

    const stocks: Array<{
      thread_type_id: number
      thread_color_id: number | null
      full_cones: number
      partial_cones: number
      quota_cones: number | null
      base_quota_cones: number | null
      confirmed_issued_gross: number | null
    }> = items.map((item) => {
      const matching = allRows.filter((r) => {
        if (r.thread_type_id !== item.thread_type_id) return false
        if (item.thread_color_id && r.color_id !== item.thread_color_id) return false
        if (item.warehouse_id && r.warehouse_id !== item.warehouse_id) return false
        return true
      })
      return {
        thread_type_id: item.thread_type_id,
        thread_color_id: item.thread_color_id ?? null,
        full_cones: matching.filter((r) => !r.is_partial).length,
        partial_cones: matching.filter((r) => r.is_partial).length,
        quota_cones: null,
        base_quota_cones: null,
        confirmed_issued_gross: null,
      }
    })

    try {
      const ratio = requestRatio ?? await getPartialConeRatio()

      for (const [colorId, groupItems] of colorGroups) {
        const batchItems: ThreadColorItem[] = [
          ...new Map(
            groupItems.map((i) => [compositeKey(i.thread_type_id, i.thread_color_id ?? null), { threadTypeId: i.thread_type_id, threadColorId: i.thread_color_id ?? null }])
          ).values(),
        ]

        const [quotaMap, baseQuotaMap, issuedMap] = await Promise.all([
          batchGetQuotaCones(batchItems, po_id, style_id, colorId, ratio, department),
          batchGetBaseQuotaCones(batchItems, po_id, style_id, colorId),
          batchGetConfirmedIssuedGross(batchItems, po_id, style_id, colorId, ratio),
        ])

        for (const stock of stocks) {
          const matchesGroup = groupItems.some(
            (gi) => gi.thread_type_id === stock.thread_type_id && (gi.thread_color_id ?? null) === stock.thread_color_id
          )
          if (!matchesGroup) continue

          const key = compositeKey(stock.thread_type_id, stock.thread_color_id)
          stock.quota_cones = quotaMap.get(key) ?? null
          stock.base_quota_cones = baseQuotaMap.get(key) ?? null
          stock.confirmed_issued_gross = issuedMap.get(key) ?? null
        }
      }
    } catch (quotaErr) {
      console.error('[stock-refresh] Quota computation failed, returning stock only:', quotaErr)
    }

    return c.json({ data: { stocks }, error: null })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/stock-refresh:', err)
    return c.json<ThreadApiResponse<null>>({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/issues/v2/form-data - Load thread types with quota & stock for a product color
 *
 * Query: ?po_id=X&style_id=Y&color_id=Z
 * Returns: { thread_types: [{ thread_type_id, thread_name, quota_cones, stock_available_full, stock_available_partial }] }
 */
issuesV2.get('/form-data', async (c) => {
  try {
    const reqQuery = c.req.query()

    let validated
    try {
      validated = FormDataQuerySchema.parse(reqQuery)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const { po_id, style_id, style_color_id, color_id, department, warehouse_id } = validated
    const effectiveColorId = style_color_id || color_id

    // Get thread types from BOM (style_color_thread_specs -> style_thread_specs)
    // style_color_thread_specs has: style_thread_spec_id, color_id, thread_type_id
    // style_thread_specs has: style_id, meters_per_unit (consumption)
    let specs: Array<Record<string, any>>
    try {
      specs = await query<Record<string, any>>(
        `SELECT scts.thread_type_id, scts.thread_color_id, scts.style_color_id,
           CASE WHEN tc.id IS NULL THEN NULL ELSE json_build_object('name', tc.name) END AS thread_color,
           CASE WHEN sts.id IS NULL THEN NULL
             ELSE json_build_object('id', sts.id, 'style_id', sts.style_id, 'meters_per_unit', sts.meters_per_unit)
           END AS style_thread_specs,
           CASE WHEN tt.id IS NULL THEN NULL
             ELSE json_build_object(
               'id', tt.id, 'code', tt.code, 'name', tt.name,
               'meters_per_cone', tt.meters_per_cone, 'tex_number', tt.tex_number, 'tex_label', tt.tex_label,
               'supplier_data', CASE WHEN sup.id IS NULL THEN NULL ELSE json_build_object('name', sup.name) END
             )
           END AS thread_types
         FROM style_color_thread_specs scts
         LEFT JOIN colors tc ON tc.id = scts.thread_color_id
         LEFT JOIN style_thread_specs sts ON sts.id = scts.style_thread_spec_id
         LEFT JOIN thread_types tt ON tt.id = scts.thread_type_id
         LEFT JOIN suppliers sup ON sup.id = tt.supplier_id
         WHERE scts.style_color_id = $1`,
        [effectiveColorId]
      )
    } catch (specsError) {
      console.error('Error fetching thread specs:', specsError)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai dinh muc chi',
        },
        500
      )
    }

    const filteredSpecs = (specs || []).filter((spec: any) => {
      return spec.style_thread_specs?.style_id === style_id
    })

    const uniqueKeys = [...new Set(filteredSpecs.map((s: any) => `${s.thread_type_id}-${s.thread_color_id ?? 'null'}`))]

    const ratio = await getPartialConeRatio()
    const weekIds = await findConfirmedWeekIds(po_id, style_id, effectiveColorId)

    const items = uniqueKeys.map((key) => {
      const [ttIdStr, tcIdStr] = key.split('-')
      const threadTypeId = Number(ttIdStr)
      const threadColorId = tcIdStr === 'null' ? undefined : Number(tcIdStr)
      const spec = filteredSpecs.find((s: any) =>
        s.thread_type_id === threadTypeId &&
        (s.thread_color_id ?? 'null').toString() === (threadColorId?.toString() ?? 'null')
      ) as any
      return { threadTypeId, threadColorId, spec }
    })

    const allThreadTypeIds = [...new Set(items.map((i) => i.threadTypeId))]
    const batchItems: ThreadColorItem[] = items.map((i) => ({ threadTypeId: i.threadTypeId, threadColorId: i.threadColorId ?? null }))
    const inventoryData = await batchLoadInventoryData(allThreadTypeIds, weekIds, warehouse_id)

    const [quotaMap, baseQuotaMap, grossMap, breakdownMap] = await Promise.all([
      batchGetQuotaCones(batchItems, po_id!, style_id!, effectiveColorId!, ratio, department),
      batchGetBaseQuotaCones(batchItems, po_id!, style_id!, effectiveColorId!),
      batchGetConfirmedIssuedGross(batchItems, po_id!, style_id!, effectiveColorId!, ratio),
      warehouse_id
        ? batchGetStockBreakdownByWarehouse(
            items.map((i) => ({ threadTypeId: i.threadTypeId, colorId: i.threadColorId })),
            weekIds
          )
        : Promise.resolve(null),
    ])

    const threadTypes = items.map((item) => {
      const { threadTypeId, threadColorId, spec } = item
      const threadType = spec?.thread_types as any
      const detectedWarehouseId = detectWarehouseFromData(threadTypeId, weekIds, threadColorId, inventoryData)
      const effectiveWarehouseId = warehouse_id || detectedWarehouseId
      const stock = computeStockFromData(threadTypeId, effectiveWarehouseId, weekIds, threadColorId, inventoryData)

      const supplierName = (threadType?.supplier_data as any)?.name || ''
      const texPart = (threadType as any)?.tex_label || (threadType?.tex_number ? `TEX ${threadType.tex_number}` : '')
      const colorName = (spec as any)?.thread_color?.name || ''
      const displayName = [supplierName, texPart, colorName].filter(Boolean).join(' - ') || threadType?.name || ''

      const key = compositeKey(threadTypeId, threadColorId ?? null)
      const result: any = {
        thread_type_id: threadTypeId,
        thread_color_id: threadColorId ?? null,
        thread_code: threadType?.code || '',
        thread_name: displayName,
        quota_cones: quotaMap.get(key) ?? null,
        base_quota_cones: baseQuotaMap.get(key) ?? null,
        confirmed_issued_gross: grossMap.get(key) ?? 0,
        stock_available_full: stock.full_cones,
        stock_available_partial: stock.partial_cones,
        detected_warehouse_id: detectedWarehouseId,
      }

      if (warehouse_id && breakdownMap) {
        const bdKey = `${threadTypeId}-${threadColorId ?? 'null'}`
        result.stock_by_warehouse = breakdownMap.get(bdKey) ?? []
      }

      return result
    })

    return c.json({
      data: { thread_types: threadTypes },
      error: null,
    })
  } catch (err) {
    console.error('Error in GET /api/issues/v2/form-data:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * POST /api/issues/v2/:id/lines/validate - Validate line before adding
 *
 * Body: { thread_type_id, issued_full, issued_partial, po_id?, style_id?, color_id? }
 * Returns: { issued_equivalent, is_over_quota, stock_sufficient, quota_cones, stock_available_full, stock_available_partial, message? }
 */
/**
 * GET /api/issues/v2/return-list - List confirmed issues for return page
 */
issuesV2.get('/return-list', requirePermission('thread.issues.return'), async (c) => {
  try {
    const rawQuery = c.req.query()

    let validated
    try {
      validated = ReturnListFiltersSchema.parse(rawQuery)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: formatZodError(err) },
          400
        )
      }
      throw err
    }

    const { search, from, to, page = 1, limit = 20 } = validated

    let matchingIssueIds: number[] | null = null

    if (search && search.length >= 2) {
      try {
        const idRows = await query<{ result: number[] }>(
          'SELECT fn_search_return_issue_ids($1) AS result',
          [search]
        )
        matchingIssueIds = (idRows.length > 0 ? idRows[0].result : null) || []
      } catch (rpcError) {
        console.error('Error searching return issues:', rpcError)
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: 'Lỗi tìm kiếm' },
          500
        )
      }

      if (matchingIssueIds.length === 0) {
        return c.json({
          data: { data: [], total: 0, page, limit, totalPages: 0 },
          error: null,
        })
      }
    }

    // Step 2: Query thread_issues with filters
    const conditions: string[] = [`ti.status = 'CONFIRMED'`]
    const params: unknown[] = []

    // Permission filter: non-admin only sees own issues
    const auth = c.get('auth')
    if (auth && !auth.isAdmin) {
      const emp = await queryOne<{ full_name: string }>(
        'SELECT full_name FROM employees WHERE id = $1',
        [auth.employeeId]
      )

      if (emp?.full_name) {
        params.push(emp.full_name)
        conditions.push(`ti.created_by = $${params.length}`)
      }
    }

    if (matchingIssueIds) {
      params.push(matchingIssueIds)
      conditions.push(`ti.id = ANY($${params.length})`)
    }

    if (from) {
      params.push(`${from}T00:00:00`)
      conditions.push(`ti.created_at >= $${params.length}`)
    }
    if (to) {
      params.push(`${to}T23:59:59`)
      conditions.push(`ti.created_at <= $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const count = await query<{ count: string }>(
      `SELECT count(*)::int AS count FROM thread_issues ti ${whereClause}`,
      params
    ).then((rows) => (rows.length > 0 ? Number(rows[0].count) : 0))

    const offset = (page - 1) * limit
    const listParams = [...params, limit, offset]
    let data: Array<Record<string, any>>
    try {
      data = await query<Record<string, any>>(
        `SELECT ti.*,
           COALESCE(
             (SELECT json_agg(json_build_object('count', lc.cnt))
              FROM (SELECT count(*) AS cnt FROM thread_issue_lines til WHERE til.issue_id = ti.id) lc),
             '[]'::json
           ) AS line_count
         FROM thread_issues ti ${whereClause}
         ORDER BY ti.created_at DESC
         LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
        listParams
      )
    } catch (error) {
      console.error('Error listing return issues:', error)
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Không thể tải danh sách phiếu trả kho' },
        500
      )
    }

    // Step 3: Fetch line summary (PO, style, colors) - same pattern as GET /
    const issueIds = (data || []).map((row: any) => row.id)
    const lineSummaryMap: Record<number, { po_number?: string; style_code?: string; sub_art_code?: string; color_names: string[] }> = {}

    if (issueIds.length > 0) {
      const linesSummary = await query<Record<string, any>>(
        `SELECT til.issue_id,
           CASE WHEN po.id IS NULL THEN NULL ELSE json_build_object('po_number', po.po_number) END AS purchase_orders,
           CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('style_code', s.style_code) END AS styles,
           CASE WHEN sa.id IS NULL THEN NULL ELSE json_build_object('sub_art_code', sa.sub_art_code) END AS sub_arts,
           CASE WHEN sc.id IS NULL THEN NULL ELSE json_build_object('color_name', sc.color_name) END AS style_colors,
           CASE WHEN col.id IS NULL THEN NULL ELSE json_build_object('name', col.name) END AS colors
         FROM thread_issue_lines til
         LEFT JOIN purchase_orders po ON po.id = til.po_id
         LEFT JOIN styles s ON s.id = til.style_id
         LEFT JOIN sub_arts sa ON sa.id = til.sub_art_id
         LEFT JOIN style_colors sc ON sc.id = til.style_color_id
         LEFT JOIN colors col ON col.id = til.color_id
         WHERE til.issue_id = ANY($1)
         ORDER BY til.created_at ASC`,
        [issueIds]
      )

      for (const line of linesSummary) {
        const colorName = (line.style_colors as any)?.color_name ?? (line.colors as any)?.name
        if (!lineSummaryMap[line.issue_id]) {
          lineSummaryMap[line.issue_id] = {
            po_number: (line.purchase_orders as any)?.po_number || undefined,
            style_code: (line.styles as any)?.style_code || undefined,
            sub_art_code: (line.sub_arts as any)?.sub_art_code || undefined,
            color_names: colorName ? [colorName] : [],
          }
        } else if (colorName && !lineSummaryMap[line.issue_id].color_names.includes(colorName)) {
          lineSummaryMap[line.issue_id].color_names.push(colorName)
        }
      }
    }

    const result = (data || []).map((row: any) => ({
      ...row,
      line_count: row.line_count?.[0]?.count ?? 0,
      ...(lineSummaryMap[row.id] || {}),
    }))

    const total = count ?? 0

    return c.json({
      data: {
        data: result,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      error: null,
    })
  } catch (err) {
    console.error('Error in GET /api/issues/v2/return-list:', err)
    return c.json<ThreadApiResponse<null>>(
      { data: null, error: getErrorMessage(err) },
      500
    )
  }
})

issuesV2.route('/', issueActivityRoutes)
issuesV2.route('/', returnGroupedRoutes)

issuesV2.post('/:id/lines/validate', async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = ValidateIssueLineV2Schema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const { thread_type_id, thread_color_id: validateThreadColorIdInput, issued_full, issued_partial, po_id, style_id, style_color_id: validateStyleColorId, color_id: validateColorId, sub_art_id: validateSubArt, department: validateDepartment, warehouse_id: validateWarehouseId } = validated
    const validateEffectiveColorId = validateStyleColorId || validateColorId

    if (await isComboCompletedInAllWeeks(po_id, style_id, validateEffectiveColorId)) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'PO-Style-Màu này đã hoàn tất xuất trong tất cả tuần đặt hàng' },
        400
      )
    }

    const subArtValidateError = await validateSubArtId(style_id, validateSubArt)
    if (subArtValidateError) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: subArtValidateError },
        400
      )
    }

    // Get partial cone ratio
    const ratio = await getPartialConeRatio()

    // Calculate issued equivalent
    const issuedEquivalent = calculateIssuedEquivalent(issued_full || 0, issued_partial || 0, ratio)

    const validateThreadColorId = validateThreadColorIdInput !== undefined ? validateThreadColorIdInput : await lookupThreadColorId(thread_type_id, validateEffectiveColorId)
    const quotaCones = await getQuotaCones(po_id, style_id, validateEffectiveColorId, thread_type_id, ratio, validateDepartment, validateThreadColorId)

    const isOverQuota = quotaCones !== null && issuedEquivalent > quotaCones

    const weekIds = await findConfirmedWeekIds(po_id, style_id, validateEffectiveColorId)
    const effectiveWarehouseId = validateWarehouseId || await detectWarehouseForThread(thread_type_id, weekIds, validateThreadColorId)
    const stock = await getStockAvailability(thread_type_id, effectiveWarehouseId, weekIds, validateThreadColorId)

    // Check if stock is sufficient
    const stockSufficient =
      (issued_full || 0) <= stock.full_cones && (issued_partial || 0) <= stock.partial_cones

    let canBorrowFromOther = false
    if (!stockSufficient && validateWarehouseId) {
      const totalStock = await getStockAvailability(thread_type_id, undefined, weekIds, validateThreadColorId)
      canBorrowFromOther = (issued_full || 0) <= totalStock.full_cones && (issued_partial || 0) <= totalStock.partial_cones
    }

    // Build message
    let message: string | undefined
    if (isOverQuota) {
      message = `Vuot dinh muc ${(issuedEquivalent - (quotaCones || 0)).toFixed(2)} cuon`
    }
    if (!stockSufficient) {
      const shortFull = Math.max(0, (issued_full || 0) - stock.full_cones)
      const shortPartial = Math.max(0, (issued_partial || 0) - stock.partial_cones)
      const borrowHint = canBorrowFromOther ? ' (co the muon tu kho khac)' : ''
      message = message
        ? `${message}. Thieu ${shortFull} cuon nguyen, ${shortPartial} cuon le${borrowHint}`
        : `Thieu ${shortFull} cuon nguyen, ${shortPartial} cuon le${borrowHint}`
    }

    return c.json({
      data: {
        issued_equivalent: issuedEquivalent,
        is_over_quota: isOverQuota,
        stock_sufficient: stockSufficient,
        can_borrow: canBorrowFromOther,
        quota_cones: quotaCones,
        stock_available_full: stock.full_cones,
        stock_available_partial: stock.partial_cones,
        message,
      },
      error: null,
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/:id/lines/validate:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * POST /api/issues/v2/:id/batch-lines - Add multiple lines to issue atomically
 *
 * Body: { lines: AddIssueLineV2DTO[] }
 * Returns: array of created lines with computed fields
 */
issuesV2.post('/:id/batch-lines', async (c) => {
  try {
    const issueId = parseInt(c.req.param('id'))
    if (isNaN(issueId)) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'ID phieu xuat khong hop le' },
        400
      )
    }

    const body = await c.req.json()

    let validated
    try {
      validated = BatchAddLinesSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: formatZodError(err) },
          400
        )
      }
      throw err
    }

    const issue = await queryOne<{ id: number; status: string; department: string | null }>(
      'SELECT id, status, department FROM thread_issues WHERE id = $1',
      [issueId]
    )

    if (!issue) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Khong tim thay phieu xuat' },
        404
      )
    }

    if (issue.status !== 'DRAFT') {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Chi co the them dong vao phieu nhap - Phieu da xac nhan' },
        400
      )
    }

    const ratio = await getPartialConeRatio()
    const insertRows: Array<Record<string, unknown>> = []
    const lineResults: Array<Record<string, unknown>> = []
    const batchPending = new Map<string, Map<string, number>>()

    for (let i = 0; i < validated.lines.length; i++) {
      const line = validated.lines[i]
      const {
        po_id, style_id, style_color_id, color_id, sub_art_id,
        thread_type_id, thread_color_id, warehouse_id, issued_full, issued_partial, over_quota_notes,
      } = line
      const effectiveColorId = style_color_id || color_id

      const subArtError = await validateSubArtId(style_id, sub_art_id)
      if (subArtError) {
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: `Dong ${i + 1}: ${subArtError}` },
          400
        )
      }

      if (await isComboCompletedInAllWeeks(po_id, style_id, effectiveColorId)) {
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: `Dong ${i + 1}: PO-Style-Mau da hoan tat xuat trong tat ca tuan` },
          400
        )
      }

      const batchThreadColorId = thread_color_id !== undefined ? thread_color_id : await lookupThreadColorId(thread_type_id, effectiveColorId)

      let quotaCones: number | null = null
      if (po_id && style_id && effectiveColorId) {
        const groupKey = `${po_id}:${style_id}:${effectiveColorId}`
        if (!batchPending.has(groupKey)) batchPending.set(groupKey, new Map())
        const groupPending = batchPending.get(groupKey)!
        const items: ThreadColorItem[] = [{ threadTypeId: thread_type_id, threadColorId: batchThreadColorId ?? null }]
        const quotaResult = await batchGetQuotaConesWithPending(
          items, po_id, style_id, effectiveColorId, ratio,
          issue.department || undefined, groupPending
        )
        const cKey = compositeKey(thread_type_id, batchThreadColorId ?? null)
        quotaCones = quotaResult.get(cKey) ?? null
      }

      const issuedEquivalent = calculateIssuedEquivalent(issued_full || 0, issued_partial || 0, ratio)
      const isOverQuota = quotaCones !== null && issuedEquivalent > quotaCones

      if (isOverQuota && !over_quota_notes?.trim()) {
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: `Dong ${i + 1}: Vuot dinh muc, yeu cau ghi chu ly do` },
          400
        )
      }

      if (po_id && style_id && effectiveColorId) {
        const groupKey = `${po_id}:${style_id}:${effectiveColorId}`
        const groupPending = batchPending.get(groupKey)!
        const cKey = compositeKey(thread_type_id, batchThreadColorId ?? null)
        const prev = groupPending.get(cKey) || 0
        groupPending.set(cKey, prev + issuedEquivalent)
      }

      const weekIds = await findConfirmedWeekIds(po_id, style_id, effectiveColorId)
      const effectiveWarehouseId = warehouse_id || await detectWarehouseForThread(thread_type_id, weekIds, batchThreadColorId)
      const stock = await getStockAvailability(thread_type_id, effectiveWarehouseId, weekIds, batchThreadColorId)
      const stockSufficient =
        (issued_full || 0) <= stock.full_cones && (issued_partial || 0) <= stock.partial_cones

      if (!stockSufficient) {
        const shortFull = Math.max(0, (issued_full || 0) - stock.full_cones)
        const shortPartial = Math.max(0, (issued_partial || 0) - stock.partial_cones)
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: `Dong ${i + 1}: Khong du ton kho. Thieu ${shortFull > 0 ? shortFull + ' cuon nguyen' : ''}${shortFull > 0 && shortPartial > 0 ? ', ' : ''}${shortPartial > 0 ? shortPartial + ' cuon le' : ''}`,
          },
          400
        )
      }

      insertRows.push({
        issue_id: issueId,
        po_id: po_id || null,
        style_id: style_id || null,
        style_color_id: style_color_id || null,
        color_id: color_id || null,
        sub_art_id: sub_art_id || null,
        thread_type_id,
        thread_color_id: batchThreadColorId || null,
        quota_cones: quotaCones,
        issued_full: issued_full || 0,
        issued_partial: issued_partial || 0,
        returned_full: 0,
        returned_partial: 0,
        over_quota_notes: over_quota_notes || null,
      })

      lineResults.push({
        issuedEquivalent,
        isOverQuota,
        stock,
        thread_type_id,
        sub_art_id,
      })
    }

    const insertCols = [
      'issue_id', 'po_id', 'style_id', 'style_color_id', 'color_id', 'sub_art_id',
      'thread_type_id', 'thread_color_id', 'quota_cones', 'issued_full', 'issued_partial',
      'returned_full', 'returned_partial', 'over_quota_notes',
    ]
    const insertParams: unknown[] = []
    const valueGroups = insertRows.map((row) => {
      const placeholders = insertCols.map((col) => {
        insertParams.push(row[col] ?? null)
        return `$${insertParams.length}`
      })
      return `(${placeholders.join(', ')})`
    })

    let insertedLines: Array<Record<string, unknown>>
    try {
      insertedLines = await query<Record<string, unknown>>(
        `INSERT INTO thread_issue_lines (${insertCols.join(', ')}) VALUES ${valueGroups.join(', ')} RETURNING *`,
        insertParams
      )
    } catch (insertErr) {
      console.error('Error batch inserting lines:', insertErr)
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Khong the them cac dong: ' + getErrorMessage(insertErr) },
        500
      )
    }

    const threadTypeIds = [...new Set(insertedLines.map((l) => l.thread_type_id as number))]
    const threadTypes = threadTypeIds.length > 0
      ? await query<{ id: number; code: string; name: string }>(
          'SELECT id, code, name FROM thread_types WHERE id = ANY($1)',
          [threadTypeIds]
        )
      : []

    const ttMap = new Map((threadTypes || []).map((t: { id: number; code: string; name: string }) => [t.id, t]))

    const subArtIds = [...new Set(insertedLines.map((l) => l.sub_art_id as number | null).filter(Boolean))] as number[]
    let subArtMap = new Map<number, string>()
    if (subArtIds.length > 0) {
      const subArts = await query<{ id: number; sub_art_code: string }>(
        'SELECT id, sub_art_code FROM sub_arts WHERE id = ANY($1)',
        [subArtIds]
      )
      subArtMap = new Map((subArts || []).map((s: { id: number; sub_art_code: string }) => [s.id, s.sub_art_code]))
    }

    const enrichedLines = insertedLines.map((line: Record<string, unknown>, idx: number) => {
      const meta = lineResults[idx]
      const tt = ttMap.get(line.thread_type_id as number)
      return {
        ...line,
        issued_equivalent: meta.issuedEquivalent,
        is_over_quota: meta.isOverQuota,
        stock_available_full: (meta.stock as { full_cones: number }).full_cones,
        stock_available_partial: (meta.stock as { partial_cones: number }).partial_cones,
        thread_code: tt?.code,
        thread_name: tt?.name,
        sub_art_code: line.sub_art_id ? subArtMap.get(line.sub_art_id as number) || null : null,
      }
    })

    return c.json({
      data: enrichedLines,
      error: null,
      message: `Them ${enrichedLines.length} dong thanh cong`,
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/:id/batch-lines:', err)
    return c.json<ThreadApiResponse<null>>(
      { data: null, error: getErrorMessage(err) },
      500
    )
  }
})

/**
 * POST /api/issues/v2/:id/lines - Add line to issue
 *
 * Body: { po_id?, style_id?, color_id?, thread_type_id, issued_full, issued_partial, over_quota_notes? }
 * Returns: created line with computed fields
 */
issuesV2.post('/:id/lines', async (c) => {
  try {
    const issueId = parseInt(c.req.param('id'))
    if (isNaN(issueId)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID phieu xuat khong hop le',
        },
        400
      )
    }

    const body = await c.req.json()

    let validated
    try {
      validated = AddIssueLineV2Schema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    // Check if issue exists and is in DRAFT status
    const issue = await queryOne<{ id: number; status: string; department: string | null }>(
      'SELECT id, status, department FROM thread_issues WHERE id = $1',
      [issueId]
    )

    if (!issue) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong tim thay phieu xuat',
        },
        404
      )
    }

    if (issue.status !== 'DRAFT') {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Chi co the them dong vao phieu nhap - Phieu da xac nhan',
        },
        400
      )
    }

    const {
      po_id,
      style_id,
      style_color_id,
      color_id,
      sub_art_id,
      thread_type_id,
      thread_color_id,
      warehouse_id,
      issued_full,
      issued_partial,
      over_quota_notes,
    } = validated
    const effectiveColorId = style_color_id || color_id

    const subArtError = await validateSubArtId(style_id, sub_art_id)
    if (subArtError) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: subArtError },
        400
      )
    }

    if (await isComboCompletedInAllWeeks(po_id, style_id, effectiveColorId)) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'PO-Style-Màu này đã hoàn tất xuất trong tất cả tuần đặt hàng' },
        400
      )
    }

    // Get quota
    // Get partial cone ratio and calculate issued equivalent
    const ratio = await getPartialConeRatio()
    const addLineThreadColorId = thread_color_id !== undefined ? thread_color_id : await lookupThreadColorId(thread_type_id, effectiveColorId)
    const quotaCones = await getQuotaCones(po_id, style_id, effectiveColorId, thread_type_id, ratio, issue.department ?? undefined, addLineThreadColorId)
    const issuedEquivalent = calculateIssuedEquivalent(issued_full || 0, issued_partial || 0, ratio)

    const isOverQuota = quotaCones !== null && issuedEquivalent > quotaCones

    if (isOverQuota && !over_quota_notes?.trim()) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Vuot dinh muc, yeu cau ghi chu ly do',
        },
        400
      )
    }

    const weekIds = await findConfirmedWeekIds(po_id, style_id, effectiveColorId)
    const effectiveWarehouseId = warehouse_id || await detectWarehouseForThread(thread_type_id, weekIds, addLineThreadColorId)
    const stock = await getStockAvailability(thread_type_id, effectiveWarehouseId, weekIds, addLineThreadColorId)
    const stockSufficient =
      (issued_full || 0) <= stock.full_cones && (issued_partial || 0) <= stock.partial_cones

    if (!stockSufficient) {
      const shortFull = Math.max(0, (issued_full || 0) - stock.full_cones)
      const shortPartial = Math.max(0, (issued_partial || 0) - stock.partial_cones)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: `Khong du ton kho. Thieu ${shortFull > 0 ? shortFull + ' cuon nguyen' : ''}${shortFull > 0 && shortPartial > 0 ? ', ' : ''}${shortPartial > 0 ? shortPartial + ' cuon le' : ''}. Ton kho hien tai: ${stock.full_cones} nguyen, ${stock.partial_cones} le.`,
        },
        400
      )
    }

    // Insert line
    let line: Record<string, unknown>
    try {
      const inserted = await query<Record<string, unknown>>(
        `INSERT INTO thread_issue_lines (
          issue_id, po_id, style_id, style_color_id, color_id, sub_art_id,
          thread_type_id, thread_color_id, quota_cones, issued_full, issued_partial,
          returned_full, returned_partial, over_quota_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 0, $12) RETURNING *`,
        [
          issueId,
          po_id || null,
          style_id || null,
          style_color_id || null,
          color_id || null,
          sub_art_id || null,
          thread_type_id,
          addLineThreadColorId || null,
          quotaCones,
          issued_full || 0,
          issued_partial || 0,
          over_quota_notes || null,
        ]
      )
      line = inserted[0]
    } catch (lineErr) {
      console.error('Error adding line:', lineErr)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the them dong: ' + getErrorMessage(lineErr),
        },
        500
      )
    }

    // Stock already fetched above for validation, reuse it
    // Get thread type name
    const threadType = await queryOne<{ code: string; name: string }>(
      'SELECT code, name FROM thread_types WHERE id = $1',
      [thread_type_id]
    )

    const lineSubArtCode = await getSubArtCode(sub_art_id)

    return c.json({
      data: {
        ...line,
        issued_equivalent: issuedEquivalent,
        is_over_quota: isOverQuota,
        stock_available_full: stock.full_cones,
        stock_available_partial: stock.partial_cones,
        thread_color_id: addLineThreadColorId ?? null,
        thread_code: threadType?.code,
        thread_name: threadType?.name,
        sub_art_code: lineSubArtCode,
      },
      error: null,
      message: 'Them dong thanh cong',
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/:id/lines:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

issuesV2.get('/:id/return-logs', async (c) => {
  try {
    const issueId = parseInt(c.req.param('id'))
    if (isNaN(issueId)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID khong hop le',
        },
        400
      )
    }

    const issue = await queryOne<{ id: number }>(
      'SELECT id FROM thread_issues WHERE id = $1',
      [issueId]
    )

    if (!issue) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong tim thay phieu xuat',
        },
        404
      )
    }

    let logs: Array<Record<string, any>>
    try {
      logs = await query<Record<string, any>>(
        `SELECT id, issue_id, line_id, returned_full, returned_partial, created_at
         FROM thread_issue_return_logs
         WHERE issue_id = $1
         ORDER BY created_at DESC`,
        [issueId]
      )
    } catch (logsErr) {
      console.error('Error fetching return logs:', logsErr)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai lich su tra hang',
        },
        500
      )
    }

    const lineIds = [...new Set((logs || []).map((l: any) => l.line_id))]
    const linesMap: Record<number, any> = {}

    if (lineIds.length > 0) {
      const lines = await query<Record<string, any>>(
        `SELECT
           til.id,
           til.thread_type_id,
           CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object('id', tt.id, 'name', tt.name, 'code', tt.code) END AS thread_types,
           til.style_color_id,
           CASE WHEN sc.id IS NULL THEN NULL ELSE json_build_object('id', sc.id, 'color_name', sc.color_name) END AS style_colors,
           til.color_id,
           CASE WHEN co.id IS NULL THEN NULL ELSE json_build_object('id', co.id, 'name', co.name) END AS colors
         FROM thread_issue_lines til
         LEFT JOIN thread_types tt ON tt.id = til.thread_type_id
         LEFT JOIN style_colors sc ON sc.id = til.style_color_id
         LEFT JOIN colors co ON co.id = til.color_id
         WHERE til.id = ANY($1)`,
        [lineIds]
      )

      if (lines) {
        for (const line of lines) {
          linesMap[(line as any).id] = line
        }
      }
    }

    const formattedLogs = (logs || []).map((log: any) => {
      const line = linesMap[log.line_id]
      return {
        id: log.id,
        issue_id: log.issue_id,
        line_id: log.line_id,
        returned_full: log.returned_full,
        returned_partial: log.returned_partial,
        created_at: log.created_at,
        thread_name: line?.thread_types?.name || '',
        thread_code: line?.thread_types?.code || '',
        color_name: line?.style_colors?.color_name ?? line?.colors?.name ?? null,
      }
    })

    return c.json({
      data: formattedLogs,
      error: null,
    })
  } catch (err) {
    console.error('Error in GET /api/issues/v2/:id/return-logs:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * GET /api/issues/v2/:id - Get issue with all lines and computed fields
 */
issuesV2.get('/:id', async (c) => {
  try {
    const issueId = parseInt(c.req.param('id'))
    if (isNaN(issueId)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID khong hop le',
        },
        400
      )
    }

    // Get issue
    const issue = await queryOne<Record<string, unknown>>(
      'SELECT * FROM thread_issues WHERE id = $1',
      [issueId]
    )

    if (!issue) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong tim thay phieu xuat',
        },
        404
      )
    }

    // Get lines with joined data
    let lines: Array<Record<string, any>>
    try {
      lines = await query<Record<string, any>>(
        `SELECT
           til.*,
           json_build_object('id', tt.id, 'code', tt.code, 'name', tt.name, 'supplier_id', tt.supplier_id, 'tex_number', tt.tex_number, 'tex_label', tt.tex_label) AS thread_types,
           CASE WHEN po.id IS NULL THEN NULL ELSE json_build_object('id', po.id, 'po_number', po.po_number) END AS purchase_orders,
           CASE WHEN st.id IS NULL THEN NULL ELSE json_build_object('id', st.id, 'style_code', st.style_code, 'style_name', st.style_name) END AS styles,
           CASE WHEN sc.id IS NULL THEN NULL ELSE json_build_object('id', sc.id, 'color_name', sc.color_name) END AS style_colors,
           CASE WHEN co.id IS NULL THEN NULL ELSE json_build_object('id', co.id, 'name', co.name) END AS colors,
           CASE WHEN sa.id IS NULL THEN NULL ELSE json_build_object('id', sa.id, 'sub_art_code', sa.sub_art_code) END AS sub_arts
         FROM thread_issue_lines til
         INNER JOIN thread_types tt ON tt.id = til.thread_type_id
         LEFT JOIN purchase_orders po ON po.id = til.po_id
         LEFT JOIN styles st ON st.id = til.style_id
         LEFT JOIN style_colors sc ON sc.id = til.style_color_id
         LEFT JOIN colors co ON co.id = til.color_id
         LEFT JOIN sub_arts sa ON sa.id = til.sub_art_id
         WHERE til.issue_id = $1
         ORDER BY til.created_at ASC`,
        [issueId]
      )
    } catch (linesErr) {
      console.error('Error fetching lines:', linesErr)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai chi tiet phieu xuat',
        },
        500
      )
    }

    // Get partial cone ratio
    const ratio = await getPartialConeRatio()

    // Batch lookups instead of N+1
    const lineItems = (lines || []).map((line: any) => ({
      thread_type_id: line.thread_type_id,
      style_color_id: line.style_color_id || line.color_id,
      po_id: line.po_id,
      style_id: line.style_id,
    }))

    const [threadColorMap, weekIdsMap] = await Promise.all([
      batchLookupThreadColorIds(lineItems),
      batchFindConfirmedWeekIds(lineItems.map((i) => ({
        po_id: i.po_id,
        style_id: i.style_id,
        style_color_id: i.style_color_id,
      }))),
    ])

    const allThreadTypeIds = [...new Set(lineItems.map((i) => i.thread_type_id))]
    const allWeekIds = [...new Set([...weekIdsMap.values()].flat())]

    const supplierIds = new Set<number>()
    for (const l of lines || []) {
      const tt = (l as any).thread_types as any
      if (tt?.supplier_id) supplierIds.add(tt.supplier_id)
    }

    const [inventoryData, supplierResult, threadColorResult] = await Promise.all([
      batchLoadInventoryData(allThreadTypeIds, allWeekIds),
      supplierIds.size > 0
        ? query<{ id: number; name: string }>('SELECT id, name FROM suppliers WHERE id = ANY($1)', [[...supplierIds]])
        : null,
      allThreadTypeIds.length > 0
        ? query<{ thread_type_id: number; color_id: number | null; colors: { name: string } | null }>(
            `SELECT ti.thread_type_id, ti.color_id,
               CASE WHEN co.id IS NULL THEN NULL ELSE json_build_object('name', co.name) END AS colors
             FROM thread_inventory ti
             LEFT JOIN colors co ON co.id = ti.color_id
             WHERE ti.thread_type_id = ANY($1)`,
            [allThreadTypeIds]
          )
        : null,
    ])

    const supplierMap = new Map((supplierResult || []).map((s) => [s.id, s.name]))
    const ttColorMap = new Map<number, string>()
    for (const inv of threadColorResult || []) {
      const i = inv as any
      if (i.thread_type_id && !ttColorMap.has(i.thread_type_id)) {
        ttColorMap.set(i.thread_type_id, (i.colors as any)?.name || '')
      }
    }

    const allColorIds = new Set<number>()
    for (const line of lines || []) {
      const tcKey = `${(line as any).thread_type_id}-${(line as any).style_color_id || (line as any).color_id}`
      const tcIds = threadColorMap.get(tcKey)
      if (tcIds) {
        for (const id of tcIds) allColorIds.add(id)
      }
      if ((line as any).thread_color_id) allColorIds.add((line as any).thread_color_id)
    }
    const colorNameMap = new Map<number, string>()
    if (allColorIds.size > 0) {
      const colorRows = await query<{ id: number; name: string }>('SELECT id, name FROM colors WHERE id = ANY($1)', [[...allColorIds]])
      for (const c of colorRows || []) colorNameMap.set(c.id, c.name)
    }

    const buildThreadDisplayName = (tt: any, threadColorId?: number | null): string => {
      const supplierName = tt?.supplier_id ? supplierMap.get(tt.supplier_id) || '' : ''
      const texPart = tt?.tex_label || (tt?.tex_number ? `TEX ${tt.tex_number}` : '')
      const threadColor = threadColorId ? colorNameMap.get(threadColorId) || '' : (tt?.id ? ttColorMap.get(tt.id) || '' : '')
      return [supplierName, texPart, threadColor].filter(Boolean).join(' - ') || tt?.name || ''
    }

    const linesWithComputed = (lines || []).map((line: any) => {
      const issuedEquivalent = calculateIssuedEquivalent(
        line.issued_full,
        line.issued_partial,
        ratio
      )
      const isOverQuota = line.quota_cones !== null && issuedEquivalent > line.quota_cones
      const lineColorId = line.style_color_id || line.color_id
      const tcKey = `${line.thread_type_id}-${lineColorId}`
      const lookupColors = threadColorMap.get(tcKey)
      const lineThreadColorId = line.thread_color_id !== undefined ? line.thread_color_id : lookupColors?.[0]
      const wKey = `${line.po_id}-${line.style_id}-${lineColorId}`
      const lineWeekIds = weekIdsMap.get(wKey) ?? []
      const detectedWarehouseId = detectWarehouseFromData(line.thread_type_id, lineWeekIds, lineThreadColorId, inventoryData)
      const stock = computeStockFromData(line.thread_type_id, detectedWarehouseId, lineWeekIds, lineThreadColorId, inventoryData)

      return {
        ...line,
        issued_equivalent: issuedEquivalent,
        is_over_quota: isOverQuota,
        stock_available_full: stock.full_cones,
        stock_available_partial: stock.partial_cones,
        thread_color_id: lineThreadColorId ?? null,
        thread_code: line.thread_types?.code,
        thread_name: buildThreadDisplayName(line.thread_types, lineThreadColorId),
        po_number: line.purchase_orders?.po_number,
        style_code: line.styles?.style_code,
        style_name: line.styles?.style_name,
        color_name: line.style_colors?.color_name ?? line.colors?.name ?? null,
        sub_art_code: line.sub_arts?.sub_art_code || null,
        thread_types: undefined,
        purchase_orders: undefined,
        styles: undefined,
        style_colors: undefined,
        colors: undefined,
        sub_arts: undefined,
      }
    })

    return c.json({
      data: {
        ...issue,
        lines: linesWithComputed,
      },
      error: null,
    })
  } catch (err) {
    console.error('Error in GET /api/issues/v2/:id:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * GET /api/issues/v2 - List issues with filters
 *
 * Query: ?department=X&status=DRAFT&from=2026-02-01&to=2026-02-28&page=1&limit=20
 */
issuesV2.get('/', async (c) => {
  try {
    const rawQuery = c.req.query()

    let validated
    try {
      validated = IssueV2FiltersSchema.parse(rawQuery)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const { department, status, from, to, page = 1, limit = 20 } = validated

    const conditions: string[] = []
    const params: unknown[] = []

    if (department) {
      params.push(department)
      conditions.push(`department = $${params.length}`)
    }
    if (status) {
      params.push(status)
      conditions.push(`status = $${params.length}`)
    }
    if (from) {
      params.push(`${from}T00:00:00`)
      conditions.push(`created_at >= $${params.length}`)
    }
    if (to) {
      params.push(`${to}T23:59:59`)
      conditions.push(`created_at <= $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''

    let data: Array<Record<string, any>>
    let count: number
    try {
      count = await queryCount(
        `SELECT count(*)::int AS count FROM thread_issues${whereClause}`,
        params
      )

      const offset = (page - 1) * limit
      const listParams = [...params, limit, offset]
      data = await query<Record<string, any>>(
        `SELECT ti.*,
           COALESCE((
             SELECT json_agg(json_build_object('count', sub.count))
             FROM (SELECT count(*)::int AS count FROM thread_issue_lines til WHERE til.issue_id = ti.id) sub
           ), '[]'::json) AS line_count
         FROM thread_issues ti${whereClause}
         ORDER BY ti.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        listParams
      )
    } catch (listErr) {
      console.error('Error listing issues:', listErr)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai danh sach phieu xuat',
        },
        500
      )
    }

    const issueIds = (data || []).map((row: any) => row.id)
    const lineSummaryMap: Record<number, { po_number?: string; style_code?: string; sub_art_code?: string; color_names: string[] }> = {}

    if (issueIds.length > 0) {
      const linesSummary = await query<Record<string, any>>(
        `SELECT
           til.issue_id,
           CASE WHEN po.id IS NULL THEN NULL ELSE json_build_object('po_number', po.po_number) END AS purchase_orders,
           CASE WHEN st.id IS NULL THEN NULL ELSE json_build_object('style_code', st.style_code) END AS styles,
           CASE WHEN sa.id IS NULL THEN NULL ELSE json_build_object('sub_art_code', sa.sub_art_code) END AS sub_arts,
           CASE WHEN sc.id IS NULL THEN NULL ELSE json_build_object('color_name', sc.color_name) END AS style_colors,
           CASE WHEN co.id IS NULL THEN NULL ELSE json_build_object('name', co.name) END AS colors
         FROM thread_issue_lines til
         LEFT JOIN purchase_orders po ON po.id = til.po_id
         LEFT JOIN styles st ON st.id = til.style_id
         LEFT JOIN sub_arts sa ON sa.id = til.sub_art_id
         LEFT JOIN style_colors sc ON sc.id = til.style_color_id
         LEFT JOIN colors co ON co.id = til.color_id
         WHERE til.issue_id = ANY($1)
         ORDER BY til.created_at ASC`,
        [issueIds]
      )

      if (linesSummary) {
        for (const line of linesSummary) {
          const colorName = (line.style_colors as any)?.color_name ?? (line.colors as any)?.name
          if (!lineSummaryMap[line.issue_id]) {
            lineSummaryMap[line.issue_id] = {
              po_number: (line.purchase_orders as any)?.po_number || undefined,
              style_code: (line.styles as any)?.style_code || undefined,
              sub_art_code: (line.sub_arts as any)?.sub_art_code || undefined,
              color_names: colorName ? [colorName] : [],
            }
          } else if (colorName && !lineSummaryMap[line.issue_id].color_names.includes(colorName)) {
            lineSummaryMap[line.issue_id].color_names.push(colorName)
          }
        }
      }
    }

    // Flatten and merge
    const result = (data || []).map((row: any) => ({
      ...row,
      line_count: row.line_count?.[0]?.count ?? 0,
      ...(lineSummaryMap[row.id] || {}),
    }))

    const total = count ?? 0

    return c.json({
      data: {
        data: result,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      error: null,
    })
  } catch (err) {
    console.error('Error in GET /api/issues/v2:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * POST /api/issues/v2/:id/confirm - Confirm issue and deduct stock
 *
 * Checks:
 * - All lines have sufficient stock
 * - Over-quota lines have notes
 * Then deducts stock and sets status=CONFIRMED
 */
issuesV2.post('/:id/confirm', async (c) => {
  try {
    const issueId = parseInt(c.req.param('id'))
    if (isNaN(issueId)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID khong hop le',
        },
        400
      )
    }

    const body = await c.req.json()
    let validated
    try {
      validated = ConfirmIssueV2Schema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const { idempotency_key, confirmed_by, warehouse_id, allow_transfer } = validated
    const performedBy = getPerformedBy(c, confirmed_by)
    const requestHash = hashPayload({ issueId, ...body })

    const existingOp = await queryOne<Record<string, any>>(
      `SELECT * FROM issue_operations_log WHERE operation_type = $1 AND idempotency_key = $2`,
      ['CONFIRM', idempotency_key]
    )

    if (existingOp) {
      if (existingOp.request_hash !== requestHash) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: 'Idempotency key da duoc su dung voi payload khac',
          },
          409
        )
      }

      if (existingOp.status === 'COMPLETED') {
        const cachedIssue = await queryOne<Record<string, unknown>>(
          'SELECT * FROM thread_issues WHERE id = $1',
          [issueId]
        )
        return c.json({
          data: cachedIssue,
          error: null,
          message: 'Xac nhan xuat kho thanh cong (cached)',
        })
      }

      if (existingOp.status === 'IN_PROGRESS') {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: 'Operation dang xu ly, vui long doi',
          },
          409
        )
      }
    }

    try {
      await query(
        `INSERT INTO issue_operations_log (idempotency_key, operation_type, request_hash, request_payload, status, succeeded_line_ids)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (operation_type, idempotency_key) DO UPDATE SET
           request_hash = EXCLUDED.request_hash,
           request_payload = EXCLUDED.request_payload,
           status = EXCLUDED.status,
           succeeded_line_ids = EXCLUDED.succeeded_line_ids`,
        [idempotency_key, 'CONFIRM', requestHash, JSON.stringify(body), 'IN_PROGRESS', []]
      )
    } catch (insertOpError) {
      console.error('[confirm] Failed to create operation log:', insertOpError)
    }

    const issue = await queryOne<Record<string, any>>(
      'SELECT * FROM thread_issues WHERE id = $1',
      [issueId]
    )

    if (!issue) {
      await query(
        `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
         WHERE idempotency_key = $4 AND operation_type = $5`,
        ['FAILED', 'Khong tim thay phieu xuat', new Date().toISOString(), idempotency_key, 'CONFIRM']
      )
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong tim thay phieu xuat',
        },
        404
      )
    }

    if (issue.status !== 'DRAFT') {
      await query(
        `UPDATE issue_operations_log SET status = $1, completed_at = $2
         WHERE idempotency_key = $3 AND operation_type = $4`,
        ['COMPLETED', new Date().toISOString(), idempotency_key, 'CONFIRM']
      )
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Phieu da duoc xac nhan truoc do',
        },
        400
      )
    }

    let lines: Array<Record<string, any>>
    try {
      lines = await query<Record<string, any>>(
        'SELECT * FROM thread_issue_lines WHERE issue_id = $1',
        [issueId]
      )
    } catch {
      await query(
        `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
         WHERE idempotency_key = $4 AND operation_type = $5`,
        ['FAILED', 'Khong the tai chi tiet phieu xuat', new Date().toISOString(), idempotency_key, 'CONFIRM']
      )
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai chi tiet phieu xuat',
        },
        500
      )
    }

    if (!lines || lines.length === 0) {
      await query(
        `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
         WHERE idempotency_key = $4 AND operation_type = $5`,
        ['FAILED', 'Phieu xuat khong co dong nao', new Date().toISOString(), idempotency_key, 'CONFIRM']
      )
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Phieu xuat khong co dong nao',
        },
        400
      )
    }

    const ratio = await getPartialConeRatio()
    const errors: string[] = []

    const weekIdsMap = new Map<number, number[]>()
    const threadColorIdMap = new Map<number, number | undefined>()
    for (const line of lines) {
      const lineColorId = line.style_color_id || line.color_id

      if (await isComboCompletedInAllWeeks(line.po_id, line.style_id, lineColorId)) {
        const threadType = await queryOne<{ name: string }>(
          'SELECT name FROM thread_types WHERE id = $1',
          [line.thread_type_id]
        )
        errors.push(`${threadType?.name || 'Loại chỉ'}: PO-Style-Màu đã hoàn tất xuất trong tất cả tuần đặt hàng`)
      }

      const weekIds = await findConfirmedWeekIds(line.po_id, line.style_id, lineColorId)
      weekIdsMap.set(line.id, weekIds)

      const tcId = line.thread_color_id !== undefined ? line.thread_color_id : await lookupThreadColorId(line.thread_type_id, lineColorId)
      threadColorIdMap.set(line.id, tcId)
    }

    const warehouseCache = new Map<string, number | undefined>()

    async function getCachedWarehouse(threadTypeId: number, wIds: number[], colorId?: number): Promise<number | undefined> {
      if (warehouse_id) return warehouse_id
      const cacheKey = `${threadTypeId}:${[...wIds].sort().join(',')}:${colorId ?? ''}`
      if (warehouseCache.has(cacheKey)) return warehouseCache.get(cacheKey)
      const whId = await detectWarehouseForThread(threadTypeId, wIds, colorId)
      warehouseCache.set(cacheKey, whId)
      return whId
    }

    const quotaGroups = new Map<string, typeof lines>()
    for (const line of lines) {
      const groupKey = `${line.po_id}:${line.style_id}:${line.style_color_id || line.color_id}:${issue.department || ''}`
      const group = quotaGroups.get(groupKey) || []
      group.push(line)
      quotaGroups.set(groupKey, group)
    }

    const quotaSnapshotMap = new Map<number, number | null>()
    for (const [, groupLines] of quotaGroups) {
      const firstLine = groupLines[0]
      const groupColorId = firstLine.style_color_id || firstLine.color_id
      if (!firstLine.po_id || !firstLine.style_id || !groupColorId) {
        for (const line of groupLines) quotaSnapshotMap.set(line.id, null)
        continue
      }

      const pendingConsumption = new Map<string, number>()
      for (const line of groupLines) {
        const tcId = threadColorIdMap.get(line.id) ?? null
        const items: ThreadColorItem[] = [{ threadTypeId: line.thread_type_id, threadColorId: tcId ?? null }]
        const quotaResult = await batchGetQuotaConesWithPending(
          items, firstLine.po_id, firstLine.style_id, groupColorId, ratio,
          issue.department || undefined, pendingConsumption
        )
        const key = compositeKey(line.thread_type_id, tcId ?? null)
        const adjustedQuota = quotaResult.get(key) ?? null
        quotaSnapshotMap.set(line.id, adjustedQuota)

        const issuedEquivalent = calculateIssuedEquivalent(line.issued_full, line.issued_partial, ratio)
        const isOverQuota = adjustedQuota !== null && issuedEquivalent > adjustedQuota

        if (isOverQuota && !line.over_quota_notes?.trim()) {
          const threadType = await queryOne<{ name: string }>(
            'SELECT name FROM thread_types WHERE id = $1',
            [line.thread_type_id]
          )
          errors.push(`${threadType?.name || 'Loai chi'}: Vuot dinh muc nhung chua co ghi chu`)
        }

        if (!isOverQuota || line.over_quota_notes?.trim()) {
          const prev = pendingConsumption.get(key) || 0
          pendingConsumption.set(key, prev + issuedEquivalent)
        }
      }
    }

    if (errors.length > 0) {
      await query(
        `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
         WHERE idempotency_key = $4 AND operation_type = $5`,
        ['FAILED', errors.join('. '), new Date().toISOString(), idempotency_key, 'CONFIRM']
      )
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: errors.join('. '),
        },
        400
      )
    }

    if (warehouse_id && !allow_transfer) {
      const shortages: any[] = []

      for (const line of lines) {
        const lineWeekIds = weekIdsMap.get(line.id) || []
        const lineThreadColorId = threadColorIdMap.get(line.id)
        const stock = await getStockAvailability(line.thread_type_id, warehouse_id, lineWeekIds, lineThreadColorId)
        const shortFull = Math.max(0, line.issued_full - stock.full_cones)
        const shortPartial = Math.max(0, line.issued_partial - stock.partial_cones)

        if (shortFull > 0 || shortPartial > 0) {
          const threadType = await queryOne<{ name: string }>(
            'SELECT name FROM thread_types WHERE id = $1',
            [line.thread_type_id]
          )

          const otherWarehouses = (await getStockBreakdownByWarehouse(line.thread_type_id, lineWeekIds, lineThreadColorId))
            .filter((w) => w.warehouse_id !== warehouse_id)

          shortages.push({
            thread_type_id: line.thread_type_id,
            thread_name: threadType?.name || 'Loai chi',
            needed_full: line.issued_full,
            needed_partial: line.issued_partial,
            available_full: stock.full_cones,
            available_partial: stock.partial_cones,
            shortage_full: shortFull,
            shortage_partial: shortPartial,
            other_warehouses: otherWarehouses,
          })
        }
      }

      if (shortages.length > 0) {
        await query(
          `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
           WHERE idempotency_key = $4 AND operation_type = $5`,
          ['FAILED', 'INSUFFICIENT_STOCK', new Date().toISOString(), idempotency_key, 'CONFIRM']
        )
        return c.json({
          data: {
            status: 'INSUFFICIENT_STOCK' as const,
            shortages,
          },
          error: null,
        })
      }
    }

    if (!warehouse_id) {
      for (const line of lines) {
        const lineWeekIds = weekIdsMap.get(line.id) || []
        const lineThreadColorId = threadColorIdMap.get(line.id)
        const lineWarehouseId = await getCachedWarehouse(line.thread_type_id, lineWeekIds, lineThreadColorId)
        const stock = await getStockAvailability(line.thread_type_id, lineWarehouseId, lineWeekIds, lineThreadColorId)
        if (line.issued_full > stock.full_cones || line.issued_partial > stock.partial_cones) {
          const threadType = await queryOne<{ name: string }>(
            'SELECT name FROM thread_types WHERE id = $1',
            [line.thread_type_id]
          )
          const shortFull = Math.max(0, line.issued_full - stock.full_cones)
          const shortPartial = Math.max(0, line.issued_partial - stock.partial_cones)
          errors.push(
            `${threadType?.name || 'Loai chi'}: Thieu ${shortFull} cuon nguyen, ${shortPartial} cuon le`
          )
        }
      }

      if (errors.length > 0) {
        await query(
          `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
           WHERE idempotency_key = $4 AND operation_type = $5`,
          ['FAILED', errors.join('. '), new Date().toISOString(), idempotency_key, 'CONFIRM']
        )
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: errors.join('. '),
          },
          400
        )
      }
    }

    for (const line of lines) {
      const adjustedQuota = quotaSnapshotMap.get(line.id)
      if (adjustedQuota !== undefined && adjustedQuota !== line.quota_cones) {
        await query(
          'UPDATE thread_issue_lines SET quota_cones = $1 WHERE id = $2',
          [adjustedQuota, line.id]
        )
      }
    }

    const transfers: { from_warehouse: string; to_warehouse: string; thread_name: string; count: number }[] = []

    if (warehouse_id && allow_transfer) {
      const targetWh = await queryOne<{ name: string }>(
        'SELECT name FROM warehouses WHERE id = $1',
        [warehouse_id]
      )
      const targetWarehouseName = targetWh?.name || ''

      for (const line of lines) {
        const lineWeekIds = weekIdsMap.get(line.id) || []
        const lineThreadColorId = threadColorIdMap.get(line.id)
        const stock = await getStockAvailability(line.thread_type_id, warehouse_id, lineWeekIds, lineThreadColorId)
        const shortFull = Math.max(0, line.issued_full - stock.full_cones)
        const shortPartial = Math.max(0, line.issued_partial - stock.partial_cones)

        if (shortFull > 0 || shortPartial > 0) {
          const otherWarehouses = (await getStockBreakdownByWarehouse(line.thread_type_id, lineWeekIds, lineThreadColorId))
            .filter((w) => w.warehouse_id !== warehouse_id)
            .sort((a, b) => (b.full_cones + b.partial_cones) - (a.full_cones + a.partial_cones))

          if (otherWarehouses.length > 0) {
            const source = otherWarehouses[0]
            const transferResult = await transferConesForIssue(
              line.thread_type_id,
              source.warehouse_id,
              warehouse_id,
              shortFull,
              shortPartial,
              performedBy,
              issueId,
              lineThreadColorId
            )

            if (transferResult.success) {
              const threadType = await queryOne<{ name: string }>(
                'SELECT name FROM thread_types WHERE id = $1',
                [line.thread_type_id]
              )
              transfers.push({
                from_warehouse: source.warehouse_name,
                to_warehouse: targetWarehouseName,
                thread_name: threadType?.name || '',
                count: transferResult.transferred_full + transferResult.transferred_partial,
              })
            }
          }
        }
      }
    }

    const succeededLineIds: number[] = []
    for (const line of lines) {
      const weekIds = weekIdsMap.get(line.id) || []
      const lineThreadColorId = threadColorIdMap.get(line.id)
      const execWarehouseId = await getCachedWarehouse(line.thread_type_id, weekIds, lineThreadColorId)
      const result = await deductStock(line.thread_type_id, line.issued_full, line.issued_partial, line.id, performedBy, weekIds, execWarehouseId, lineThreadColorId)
      if (!result.success) {
        await query(
          `UPDATE issue_operations_log SET status = $1, succeeded_line_ids = $2, error_info = $3, completed_at = $4
           WHERE idempotency_key = $5 AND operation_type = $6`,
          ['FAILED', succeededLineIds, result.message || 'Loi tru ton kho', new Date().toISOString(), idempotency_key, 'CONFIRM']
        )
        return c.json<ThreadApiResponse<{ succeeded_line_ids: number[] }>>(
          {
            data: { succeeded_line_ids: succeededLineIds },
            error: result.message || 'Loi tru ton kho',
          },
          500
        )
      }
      succeededLineIds.push(line.id)
    }

    const firstLine = lines[0]
    const firstLineWeekIds = weekIdsMap.get(firstLine.id) || []
    const issueWarehouseId = warehouse_id || await getCachedWarehouse(firstLine.thread_type_id, firstLineWeekIds)

    let updatedIssue: Record<string, unknown> | null
    try {
      const updateRows = await query<Record<string, unknown>>(
        `UPDATE thread_issues
         SET status = $1, source_warehouse_id = $2, updated_at = $3, notes = $4
         WHERE id = $5 RETURNING *`,
        [
          'CONFIRMED',
          issueWarehouseId || null,
          new Date().toISOString(),
          confirmed_by ? `${issue.notes || ''}\nXac nhan boi: ${confirmed_by}`.trim() : issue.notes,
          issueId,
        ]
      )
      updatedIssue = updateRows[0] ?? null
    } catch (updateErr) {
      console.error('Error updating issue status:', updateErr)
      await query(
        `UPDATE issue_operations_log SET status = $1, succeeded_line_ids = $2, error_info = $3, completed_at = $4
         WHERE idempotency_key = $5 AND operation_type = $6`,
        ['FAILED', succeededLineIds, 'Khong the cap nhat trang thai phieu xuat', new Date().toISOString(), idempotency_key, 'CONFIRM']
      )
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the cap nhat trang thai phieu xuat',
        },
        500
      )
    }

    await query(
      `UPDATE issue_operations_log SET status = $1, succeeded_line_ids = $2, completed_at = $3
       WHERE idempotency_key = $4 AND operation_type = $5`,
      ['COMPLETED', succeededLineIds, new Date().toISOString(), idempotency_key, 'CONFIRM']
    )

    return c.json({
      data: transfers.length > 0 ? { ...updatedIssue, transfers } : updatedIssue,
      error: null,
      message: 'Xac nhan xuat kho thanh cong',
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/:id/confirm:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * POST /api/issues/v2/:id/return - Return items and add stock back
 *
 * Body: { lines: [{ line_id, returned_full, returned_partial }], idempotency_key: string }
 * Validates: returned_full <= issued_full AND (returned_full + returned_partial) <= (issued_full + issued_partial)
 * Enforces exact cone availability by line before updating counters
 * Supports partial return conversion from full cones using partial_cone_ratio
 * Uses RPC fn_return_cones_with_movements for atomic operation with movement logging
 * Updates line returned quantities based on actual processed cones
 * If all returned (total_returned >= total_issued) → set status=RETURNED
 */
issuesV2.post('/:id/return', async (c) => {
  try {
    const issueId = parseInt(c.req.param('id'))
    if (isNaN(issueId)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID khong hop le',
        },
        400
      )
    }

    const body = await c.req.json()

    let validated
    try {
      validated = ReturnIssueV2Schema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const { idempotency_key } = validated
    const performedBy = getPerformedBy(c)
    const requestHash = hashPayload({ issueId, ...body })

    const existingOp = await queryOne<Record<string, any>>(
      `SELECT * FROM issue_operations_log WHERE operation_type = $1 AND idempotency_key = $2`,
      ['RETURN', idempotency_key]
    )

    if (existingOp) {
      if (existingOp.request_hash !== requestHash) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: 'Idempotency key da duoc su dung voi payload khac',
          },
          409
        )
      }

      if (existingOp.status === 'COMPLETED') {
        const cachedIssue = await queryOne<Record<string, unknown>>(
          'SELECT * FROM thread_issues WHERE id = $1',
          [issueId]
        )
        return c.json({
          data: cachedIssue,
          error: null,
          message: 'Tra hang thanh cong (cached)',
        })
      }

      if (existingOp.status === 'IN_PROGRESS') {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: 'Operation dang xu ly, vui long doi',
          },
          409
        )
      }
    }

    try {
      await query(
        `INSERT INTO issue_operations_log (idempotency_key, operation_type, request_hash, request_payload, status, succeeded_line_ids)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (operation_type, idempotency_key) DO UPDATE SET
           request_hash = EXCLUDED.request_hash,
           request_payload = EXCLUDED.request_payload,
           status = EXCLUDED.status,
           succeeded_line_ids = EXCLUDED.succeeded_line_ids`,
        [idempotency_key, 'RETURN', requestHash, JSON.stringify(body), 'IN_PROGRESS', []]
      )
    } catch (insertOpError) {
      console.error('[return] Failed to create operation log:', insertOpError)
    }

    const issue = await queryOne<Record<string, any>>(
      'SELECT * FROM thread_issues WHERE id = $1',
      [issueId]
    )

    if (!issue) {
      await query(
        `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
         WHERE idempotency_key = $4 AND operation_type = $5`,
        ['FAILED', 'Khong tim thay phieu xuat', new Date().toISOString(), idempotency_key, 'RETURN']
      )
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong tim thay phieu xuat',
        },
        404
      )
    }

    if (issue.status !== 'CONFIRMED') {
      await query(
        `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
         WHERE idempotency_key = $4 AND operation_type = $5`,
        ['FAILED', 'Chi co the tra hang tu phieu da xac nhan', new Date().toISOString(), idempotency_key, 'RETURN']
      )
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Chi co the tra hang tu phieu da xac nhan',
        },
        400
      )
    }

    let existingLines: Array<Record<string, any>>
    try {
      existingLines = await query<Record<string, any>>(
        'SELECT * FROM thread_issue_lines WHERE issue_id = $1',
        [issueId]
      )
    } catch {
      await query(
        `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
         WHERE idempotency_key = $4 AND operation_type = $5`,
        ['FAILED', 'Khong the tai chi tiet phieu xuat', new Date().toISOString(), idempotency_key, 'RETURN']
      )
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai chi tiet phieu xuat',
        },
        500
      )
    }

    const lineMap = new Map<number, IssueLine>(
      existingLines?.map((l) => [l.id, l as IssueLine]) || []
    )

    const validation = validateReturnQuantities(validated.lines, lineMap)
    if (!validation.valid) {
      await query(
        `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
         WHERE idempotency_key = $4 AND operation_type = $5`,
        ['FAILED', validation.errors.join('. '), new Date().toISOString(), idempotency_key, 'RETURN']
      )
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: validation.errors.join('. '),
        },
        400
      )
    }

    const partialConeRatio = await getPartialConeRatio()
    if (!partialConeRatio || partialConeRatio <= 0) {
      await query(
        `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
         WHERE idempotency_key = $4 AND operation_type = $5`,
        ['FAILED', `Ty le cuon le khong hop le (${partialConeRatio})`, new Date().toISOString(), idempotency_key, 'RETURN']
      )
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: `Ty le cuon le khong hop le (${partialConeRatio})`,
        },
        400
      )
    }

    const succeededLineIds: number[] = []
    const returnLogRows: Array<{ line_id: number; returned_full: number; returned_partial: number }> = []

    const allLineIds = validated.lines.map(l => l.line_id)

    const [allFullCones, allPartialCones] = await Promise.all([
      query<{ id: number; quantity_meters: number; status: string; issued_line_id: number }>(
        `SELECT id, quantity_meters, status, issued_line_id
         FROM thread_inventory
         WHERE issued_line_id = ANY($1)
           AND status = ANY($2)
           AND is_partial = false
         ORDER BY id ASC
         LIMIT 10000`,
        [allLineIds, ['IN_PRODUCTION', 'HARD_ALLOCATED']]
      ),
      query<{ id: number; status: string; issued_line_id: number }>(
        `SELECT id, status, issued_line_id
         FROM thread_inventory
         WHERE issued_line_id = ANY($1)
           AND status = ANY($2)
           AND is_partial = true
         ORDER BY id ASC
         LIMIT 10000`,
        [allLineIds, ['IN_PRODUCTION', 'HARD_ALLOCATED']]
      ),
    ])

    const fullConesByLine = new Map<number, Array<{ id: number; quantity_meters: number; status: string }>>()
    const partialConesByLine = new Map<number, Array<{ id: number; status: string }>>()

    for (const cone of allFullCones || []) {
      const lineIdKey = (cone as any).issued_line_id as number
      const arr = fullConesByLine.get(lineIdKey) || []
      arr.push({ id: cone.id, quantity_meters: cone.quantity_meters, status: cone.status })
      fullConesByLine.set(lineIdKey, arr)
    }

    for (const cone of allPartialCones || []) {
      const lineIdKey = (cone as any).issued_line_id as number
      const arr = partialConesByLine.get(lineIdKey) || []
      arr.push({ id: cone.id, status: cone.status })
      partialConesByLine.set(lineIdKey, arr)
    }

    const uniqueThreadTypeIds = [...new Set(validated.lines.map(l => lineMap.get(l.line_id)!.thread_type_id))]
    const threadTypesData = await query<{ id: number; meters_per_cone: number | null }>(
      'SELECT id, meters_per_cone FROM thread_types WHERE id = ANY($1)',
      [uniqueThreadTypeIds]
    )

    const metersPerConeMap = new Map<number, number | null>()
    for (const tt of threadTypesData || []) {
      metersPerConeMap.set(tt.id, tt.meters_per_cone)
    }

    for (const returnLine of validated.lines) {
      const line = lineMap.get(returnLine.line_id)!
      const result = await processReturnForLine(
        returnLine.line_id,
        line,
        returnLine.returned_full || 0,
        returnLine.returned_partial || 0,
        performedBy,
        partialConeRatio,
        {
          fullCones: fullConesByLine.get(returnLine.line_id) || [],
          partialCones: partialConesByLine.get(returnLine.line_id) || [],
          metersPerCone: metersPerConeMap.get(line.thread_type_id) ?? null,
        },
      )

      if (!result.success) {
        await query(
          `UPDATE issue_operations_log SET status = $1, succeeded_line_ids = $2, error_info = $3, completed_at = $4
           WHERE idempotency_key = $5 AND operation_type = $6`,
          ['FAILED', succeededLineIds, result.error || 'Loi xu ly tra hang', new Date().toISOString(), idempotency_key, 'RETURN']
        )
        return c.json<ThreadApiResponse<{ succeeded_line_ids: number[] }>>(
          {
            data: { succeeded_line_ids: succeededLineIds },
            error: result.error || 'Loi xu ly tra hang',
          },
          400
        )
      }

      if (result.returned_full === 0 && result.returned_partial === 0) {
        continue
      }

      succeededLineIds.push(returnLine.line_id)
      returnLogRows.push({
        line_id: returnLine.line_id,
        returned_full: result.returned_full,
        returned_partial: result.returned_partial,
      })
    }

    if (succeededLineIds.length === 0) {
      await query(
        `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
         WHERE idempotency_key = $4 AND operation_type = $5`,
        ['FAILED', 'Khong co so luong tra hop le', new Date().toISOString(), idempotency_key, 'RETURN']
      )
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong co so luong tra hop le',
        },
        400
      )
    }

    try {
      if (returnLogRows.length > 0) {
        const logParams: unknown[] = []
        const logGroups = returnLogRows.map((r) => {
          logParams.push(issueId, r.line_id, r.returned_full, r.returned_partial)
          const base = logParams.length
          return `($${base - 3}, $${base - 2}, $${base - 1}, $${base})`
        })
        await query(
          `INSERT INTO thread_issue_return_logs (issue_id, line_id, returned_full, returned_partial)
           VALUES ${logGroups.join(', ')}`,
          logParams
        )
      }
    } catch (logError) {
      console.error('[return] Failed to insert return log:', logError)
    }

    const updatedLines = await query<{ returned_full: number; returned_partial: number; issued_full: number; issued_partial: number }>(
      'SELECT * FROM thread_issue_lines WHERE issue_id = $1',
      [issueId]
    )

    const allReturned = updatedLines?.every(
      (l) => (l.returned_full + l.returned_partial) >= (l.issued_full + l.issued_partial)
    )

    if (allReturned) {
      await query(
        'UPDATE thread_issues SET status = $1, updated_at = $2 WHERE id = $3',
        ['RETURNED', new Date().toISOString(), issueId]
      )
    }

    const finalIssue = await queryOne<Record<string, unknown>>(
      'SELECT * FROM thread_issues WHERE id = $1',
      [issueId]
    )

    await query(
      `UPDATE issue_operations_log SET status = $1, succeeded_line_ids = $2, completed_at = $3
       WHERE idempotency_key = $4 AND operation_type = $5`,
      ['COMPLETED', succeededLineIds, new Date().toISOString(), idempotency_key, 'RETURN']
    )

    return c.json({
      data: finalIssue,
      error: null,
      message: allReturned ? 'Tra hang hoan tat' : 'Tra hang thanh cong',
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/:id/return:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

issuesV2.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID khong hop le',
        },
        400
      )
    }

    const issue = await queryOne<{ id: number; issue_code: string; status: string }>(
      'SELECT id, issue_code, status FROM thread_issues WHERE id = $1',
      [id]
    )

    if (!issue) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Không tìm thấy phiếu xuất',
        },
        404
      )
    }

    if (issue.status !== 'DRAFT') {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Chỉ có thể xóa phiếu xuất ở trạng thái Nháp',
        },
        400
      )
    }

    try {
      await query('DELETE FROM thread_issue_lines WHERE issue_id = $1', [id])
    } catch {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Không thể xóa các dòng của phiếu xuất',
        },
        500
      )
    }

    try {
      await query('DELETE FROM thread_issues WHERE id = $1', [id])
    } catch {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Không thể xóa phiếu xuất',
        },
        500
      )
    }

    return c.json({
      data: { id: issue.id, issue_code: issue.issue_code },
      error: null,
    })
  } catch (err) {
    console.error('Error in DELETE /api/issues/v2/:id:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

issuesV2.delete('/:id/lines/:lineId', async (c) => {
  try {
    const issueId = parseInt(c.req.param('id'))
    const lineId = parseInt(c.req.param('lineId'))

    if (isNaN(issueId) || isNaN(lineId)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID khong hop le',
        },
        400
      )
    }

    // Check issue status
    const issue = await queryOne<{ status: string }>(
      'SELECT status FROM thread_issues WHERE id = $1',
      [issueId]
    )

    if (!issue) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong tim thay phieu xuat',
        },
        404
      )
    }

    if (issue.status !== 'DRAFT') {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Chi co the xoa dong tu phieu nhap',
        },
        400
      )
    }

    // Delete line
    try {
      await query('DELETE FROM thread_issue_lines WHERE id = $1 AND issue_id = $2', [lineId, issueId])
    } catch {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the xoa dong',
        },
        500
      )
    }

    return c.json({
      data: null,
      error: null,
      message: 'Xoa dong thanh cong',
    })
  } catch (err) {
    console.error('Error in DELETE /api/issues/v2/:id/lines/:lineId:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

export {
  processReturnForLine,
  formatZodError,
  getPerformedBy,
  hashPayload,
  getMetersPerCone,
  type IssueLine,
  type ProcessReturnLineResult,
  type ReturnPartialPayloadItem,
  type PrefetchedReturnData,
}

export default issuesV2
