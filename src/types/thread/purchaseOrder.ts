import type { POStatus } from './enums'

export interface PurchaseOrder {
  id: number
  po_number: string
  customer_name: string | null
  order_date: string | null
  delivery_date: string | null
  status: POStatus
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreatePurchaseOrderDTO {
  po_number: string
  customer_name?: string
  order_date?: string
  delivery_date?: string
  status?: POStatus
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  notes?: string
}

export interface UpdatePurchaseOrderDTO {
  po_number?: string
  customer_name?: string
  order_date?: string
  delivery_date?: string
  status?: POStatus
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  notes?: string
}

export interface PurchaseOrderFilter {
  status?: string
  priority?: string
  customer_name?: string
  po_number?: string
}

export interface POItem {
  id: number
  po_id: number
  style_id: number
  quantity: number
  style?: { id: number; style_code: string; style_name: string }
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items?: POItem[]
}
