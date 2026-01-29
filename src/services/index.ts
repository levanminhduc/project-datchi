/**
 * Services barrel export
 */

export { employeeService } from './employeeService'
export { positionService } from './positionService'
export { fetchApi, ApiError } from './api'

// Thread management services
export { threadService } from './threadService'
export { inventoryService } from './inventoryService'
export { allocationService } from './allocationService'
export { recoveryService } from './recoveryService'
export { dashboardService } from './dashboardService'
export type {
  DashboardSummary,
  StockAlert,
  PendingItems,
  ActivityItem,
  ConflictsSummary,
} from './dashboardService'
