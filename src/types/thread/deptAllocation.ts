export interface DeptAllocation {
  department: string
  product_quantity: number
  logs_count: number
}

export interface DeptAllocationSummary {
  total_product_quantity: number
  allocated: DeptAllocation[]
  total_allocated: number
  remaining: number
}

export interface DeptAllocateResponse {
  allocation_id: number
  department: string
  previous_quantity: number
  added_quantity: number
  new_total: number
  remaining_for_others: number
}

export interface DeptQuotaResponse {
  product_quantity: number
  quota_cones: number
  confirmed_issued_cones_net: number
  remaining_quota_cones: number
}

export interface DeptAllocationLog {
  id: number
  added_quantity: number
  total_after: number
  created_by: string | null
  created_at: string
}
