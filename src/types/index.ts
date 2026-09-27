export type UserRole = 'ADMINISTRADOR' | 'ODONTOLOGO' | 'RECEPCIONISTA'

export interface User {
  id: number
  userId?: number
  username: string
  fullName?: string
  role: UserRole
  email?: string
  token?: string
}

export interface Professional {
  id: number
  userId?: number
  firstName: string
  lastName: string
  licenseNumber: string
  specialty: string
  phone?: string
  active: boolean
}

export type DocumentType = 'DNI' | 'PASSPORT' | 'OTHER'

export interface Patient {
  id: number
  firstName: string
  lastName: string
  documentType: DocumentType
  documentNumber: string
  birthDate: string
  email?: string
  phone?: string
  address?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export type AppointmentStatus = 'PROGRAMADA' | 'CONFIRMADA' | 'CANCELADA' | 'ATENDIDA' | 'NO_ASISTIO'

export interface Appointment {
  id: number
  patientId: number
  professionalId: number
  scheduledStart: string
  scheduledEnd: string
  status: AppointmentStatus
  reason?: string
  notes?: string
  canceledAt?: string
  canceledReason?: string
  createdAt?: string
  updatedAt?: string
}

export interface ClinicalRecord {
  id: number
  appointmentId: number
  patientId: number
  professionalId: number
  attentionDate: string
  chiefComplaint: string
  diagnosis?: string
  treatmentPlan?: string
  clinicalNotes: string
  createdAt?: string
  updatedAt?: string
}

export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTRO'
export type PaymentStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'ANULADO'

export interface Payment {
  id: number
  clinicalRecordId: number
  patientId?: number
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  status: PaymentStatus
  reference?: string
  notes?: string
  paidAt: string
  createdAt?: string
  updatedAt?: string
}

export interface AuditLog {
  id: number
  action: string
  entityName: string
  entityId: number | string
  username?: string
  timestamp: string
  details?: string
}
