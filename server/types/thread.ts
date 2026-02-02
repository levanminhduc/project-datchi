// Thread Management Backend Types
// Must match database schema and frontend types exactly

// ============ ENUMS ============
export type ConeStatus =
  | 'RECEIVED'
  | 'INSPECTED'
  | 'AVAILABLE'
  | 'SOFT_ALLOCATED'
  | 'HARD_ALLOCATED'
  | 'IN_PRODUCTION'
  | 'PARTIAL_RETURN'
  | 'PENDING_WEIGH'
  | 'CONSUMED'
  | 'WRITTEN_OFF'
  | 'QUARANTINE'

export type AllocationStatus =
  | 'PENDING'
  | 'SOFT'
  | 'HARD'
  | 'ISSUED'
  | 'CANCELLED'
  | 'WAITLISTED'
  | 'APPROVED'
  | 'READY_FOR_PICKUP'
  | 'RECEIVED'
  | 'REJECTED'

export type AllocationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type MovementType =
  | 'RECEIVE'
  | 'ISSUE'
  | 'RETURN'
  | 'TRANSFER'
  | 'ADJUSTMENT'
  | 'WRITE_OFF'

export type RecoveryStatus =
  | 'INITIATED'
  | 'PENDING_WEIGH'
  | 'WEIGHED'
  | 'CONFIRMED'
  | 'WRITTEN_OFF'
  | 'REJECTED'

export type ThreadMaterial =
  | 'polyester'
  | 'cotton'
  | 'nylon'
  | 'silk'
  | 'rayon'
  | 'mixed'

export type WarehouseType = 'LOCATION' | 'STORAGE'

// ============ DATABASE ROW TYPES ============
export interface ThreadTypeRow {
  id: number
  code: string
  name: string
  color: string | null
  color_code: string | null
  material: ThreadMaterial
  tex_number: number | null
  density_grams_per_meter: number
  meters_per_cone: number | null
  supplier: string | null
  reorder_level_meters: number
  lead_time_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ConeRow {
  id: number
  cone_id: string
  thread_type_id: number
  warehouse_id: number
  quantity_cones: number
  quantity_meters: number
  weight_grams: number | null
  is_partial: boolean
  status: ConeStatus
  lot_number: string | null
  expiry_date: string | null
  received_date: string
  location: string | null
  created_at: string
  updated_at: string
}

export interface AllocationRow {
  id: number
  order_id: string
  order_reference: string | null
  thread_type_id: number
  requested_meters: number
  allocated_meters: number
  status: AllocationStatus
  priority: AllocationPriority
  priority_score: number
  requested_date: string
  due_date: string | null
  notes: string | null
  created_by: string | null
  // Request workflow fields
  requesting_warehouse_id: number | null
  source_warehouse_id: number | null
  requested_by: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  received_by: string | null
  received_at: string | null
  // Timestamps
  created_at: string
  updated_at: string
}

export interface RecoveryRow {
  id: number
  cone_id: number
  original_meters: number
  returned_weight_grams: number | null
  calculated_meters: number | null
  tare_weight_grams: number
  consumption_meters: number | null
  status: RecoveryStatus
  initiated_by: string | null
  weighed_by: string | null
  confirmed_by: string | null
  notes: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface WarehouseRow {
  id: number
  code: string
  name: string
  location: string | null
  parent_id: number | null
  type: WarehouseType
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WarehouseTreeNode extends WarehouseRow {
  children: WarehouseRow[]
}

// ============ DTOs ============
export interface CreateThreadTypeDTO {
  code: string
  name: string
  color?: string
  color_code?: string
  material?: ThreadMaterial
  tex_number?: number
  density_grams_per_meter: number
  meters_per_cone?: number
  supplier?: string
  reorder_level_meters?: number
  lead_time_days?: number
}

export interface UpdateThreadTypeDTO extends Partial<CreateThreadTypeDTO> {
  is_active?: boolean
}

export interface ReceiveStockDTO {
  thread_type_id: number
  warehouse_id: number
  quantity_cones: number
  weight_per_cone_grams?: number
  lot_number?: string
  expiry_date?: string
  location?: string
}

export interface CreateAllocationDTO {
  order_id: string
  order_reference?: string
  thread_type_id: number
  requested_meters: number
  priority: AllocationPriority
  due_date?: string
  notes?: string
  // Request workflow fields
  requesting_warehouse_id?: number
  source_warehouse_id?: number
  requested_by?: string
}

export interface IssueAllocationDTO {
  allocation_id: number
  confirmed_by?: string
}

export interface InitiateReturnDTO {
  cone_id: string
  notes?: string
  initiated_by?: string
}

export interface WeighConeDTO {
  recovery_id: number
  weight_grams: number
  tare_weight_grams?: number
  weighed_by?: string
}

export interface ConfirmRecoveryDTO {
  recovery_id: number
  confirmed_by?: string
  notes?: string
}

export interface StocktakeDTO {
  warehouse_id: number
  scanned_cone_ids: string[]
  notes?: string
  performed_by?: string
}

export interface StocktakeResult {
  stocktake_id: number
  warehouse_id: number
  total_in_db: number
  total_scanned: number
  matched: number
  missing: string[]
  extra: string[]
  match_rate: number
  performed_at: string
}

// ============ RPC RESPONSE TYPES ============
export interface AllocateThreadResult {
  success: boolean
  allocation_id: number | null
  allocated_meters: number
  waitlisted_meters: number
  conflict_id: number | null
  message: string
}

export interface IssueConeResult {
  success: boolean
  movement_id: number | null
  cone_ids: number[]
  message: string
}

export interface RecoverConeResult {
  success: boolean
  recovery_id: number
  calculated_meters: number
  is_write_off: boolean
  message: string
}

// ============ API RESPONSE ============
export interface ThreadApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

// ============ REQUEST WORKFLOW DTOs ============
export interface ApproveRequestDTO {
  approved_by: string
}

export interface RejectRequestDTO {
  rejected_by: string
  reason: string
}

export interface MarkReadyDTO {
  prepared_by?: string
}

export interface ConfirmReceiptDTO {
  received_by: string
}

export type WorkflowStatusFilter = 
  | 'pending_approval' 
  | 'pending_preparation' 
  | 'pending_pickup'
  | 'completed'
