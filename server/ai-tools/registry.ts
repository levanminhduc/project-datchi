import { findThreadUsage } from './tools/find-thread-usage'
import { getInventoryByWarehouse } from './tools/get-inventory-by-warehouse'
import { getStyleThreadSpecs } from './tools/get-style-thread-specs'
import { searchInventory } from './tools/search-inventory'
import { searchPurchaseOrders } from './tools/search-purchase-orders'
import { searchStyles } from './tools/search-styles'
import type { AiAuth, AiTool } from './types'

export const AI_TOOLS: AiTool[] = [
  searchInventory,
  getInventoryByWarehouse,
  searchStyles,
  getStyleThreadSpecs,
  searchPurchaseOrders,
  findThreadUsage,
]

export function canUseTool(auth: AiAuth, tool: AiTool): boolean {
  return auth.isRoot || tool.permissions.every((permission) => auth.permissions.includes(permission))
}
