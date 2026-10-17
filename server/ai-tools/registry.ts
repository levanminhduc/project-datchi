import { findThreadUsage } from './tools/find-thread-usage'
import { getDeptAllocation } from './tools/get-dept-allocation'
import { getInventoryByWarehouse } from './tools/get-inventory-by-warehouse'
import { getIssueDetail } from './tools/get-issue-detail'
import { getStyleThreadSpecs } from './tools/get-style-thread-specs'
import { getWeeklyOrder } from './tools/get-weekly-order'
import { getWeeklyOrderThreads } from './tools/get-weekly-order-threads'
import { searchInventory } from './tools/search-inventory'
import { searchIssues } from './tools/search-issues'
import { searchPurchaseOrders } from './tools/search-purchase-orders'
import { searchStyles } from './tools/search-styles'
import { searchWeeklyOrders } from './tools/search-weekly-orders'
import type { AiAuth, AiTool } from './types'

export const AI_TOOLS: AiTool[] = [
  searchInventory,
  getInventoryByWarehouse,
  searchStyles,
  getStyleThreadSpecs,
  searchPurchaseOrders,
  findThreadUsage,
  searchWeeklyOrders,
  getWeeklyOrder,
  getWeeklyOrderThreads,
  searchIssues,
  getIssueDetail,
  getDeptAllocation,
]

export function canUseTool(auth: AiAuth, tool: AiTool): boolean {
  return auth.isRoot || tool.permissions.every((permission) => auth.permissions.includes(permission))
}
