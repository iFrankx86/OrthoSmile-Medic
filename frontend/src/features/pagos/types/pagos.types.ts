export type PaymentMethod =
  | 'EFECTIVO'
  | 'TARJETA'
  | 'TRANSFERENCIA'
  | 'YAPE'
  | 'PLIN'
  | 'OTRO'

export type PaymentStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'ANULADO'

export interface PaymentResponse {
  id: number
  clinicalRecordId: number
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  status: PaymentStatus
  reference?: string
  notes?: string
  paidAt: string
  createdAt: string
  updatedAt: string
}

export interface PaymentRequest {
  clinicalRecordId: number
  amount: number
  currency?: string
  paymentMethod: PaymentMethod
  status: PaymentStatus
  reference?: string
  notes?: string
  paidAt: string
}
