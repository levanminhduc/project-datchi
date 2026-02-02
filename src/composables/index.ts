export { useDialog } from './useDialog'
export { useSnackbar } from './useSnackbar'
export { useLoading } from './useLoading'
export { useConfirm } from './useConfirm'
export { useDarkMode } from './useDarkMode'
export { useEmployees } from './useEmployees'
export { usePositions } from './usePositions'
export { useWarehouses } from './useWarehouses'
export { useSidebar } from './useSidebar'
export { useQrScanner } from './useQrScanner'
export { useThreadTypes } from './thread/useThreadTypes'
export { useInventory } from './thread/useInventory'
export { useAllocations } from './thread/useAllocations'
export { useRecovery } from './thread/useRecovery'
export { useDashboard } from './thread/useDashboard'
export { useConflicts } from './thread/useConflicts'
export { useThreadRequests } from './useThreadRequests'
export type {
  ThreadConflict,
  ConflictAllocation,
  ConflictResolutionType,
  ResolveConflictDTO,
  ConflictFilters,
} from './thread/useConflicts'

// Reports
export { useReports } from './useReports'

// Real-time subscriptions
export { useRealtime } from './useRealtime'
export type {
  RealtimeStatus,
  RealtimeEvent,
  UseRealtimeOptions,
  RealtimePayload,
  RealtimeCallback,
} from './useRealtime'

// Hardware composables
export { useScanner, useScale, useAudioFeedback } from './hardware'
export type { UseScannerOptions, ScaleReading, AudioFeedbackType } from './hardware'

// Offline sync
export { useOfflineSync } from './useOfflineSync'
export type { PendingOperation } from './useOfflineSync'

// Offline operation (queue-aware wrapper)
export { useOfflineOperation } from './useOfflineOperation'
export type {
  OperationType,
  OfflineOperationOptions,
  OfflineOperationResult,
} from './useOfflineOperation'
