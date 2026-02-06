// Purchase Order Types

export interface PurchaseOrder {
  id: number
  po_number: string
  customer_name: string | null
  order_date: string | null
  delivery_date: string | null
  status: 'pending' | 'confirmed' | 'in_production' | 'completed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreatePurchaseOrderDTO {
  po_number: string
  customer_name?: string
  order_date?: string
  delivery_date?: string
  status?: 'pending' | 'confirmed' | 'in_production' | 'completed' | 'cancelled'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  notes?: string
}

export interface UpdatePurchaseOrderDTO {
  po_number?: string
  customer_name?: string
  order_date?: string
  delivery_date?: string
  status?: 'pending' | 'confirmed' | 'in_production' | 'completed' | 'cancelled'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  notes?: string
}

export interface PurchaseOrderFilter {
  status?: string
  priority?: string
  customer_name?: string
  po_number?: string
}
