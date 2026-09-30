export type UserRole = 'ADMINISTRADOR' | 'RECEPCIONISTA' | 'ODONTOLOGO' | 'CAJA'

export interface User {
  id: number
  username: string
  role: UserRole
  email: string
  fullName?: string
  token?: string
  active?: boolean
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

export interface Patient {
  id: number
  firstName: string
  lastName: string
  documentType: 'DNI' | 'PASSPORT' | 'OTHER'
  documentNumber: string
  birthDate: string
  email?: string
  phone?: string
  address?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type AppointmentStatus = 'PROGRAMADA' | 'CONFIRMADA' | 'CANCELADA' | 'ATENDIDA' | 'NO_ASISTIO'

export interface Appointment {
  id: number
  patientId: number
  professionalId: number
  scheduledStart: string
  scheduledEnd: string
  status: AppointmentStatus
  turnNumber?: number
  orderNumber?: number
  reason?: string
  notes?: string
  canceledAt?: string
  canceledReason?: string
  createdAt: string
  updatedAt: string
}

export interface ClinicalRecord {
  id: number
  patientId: number
  professionalId: number
  appointmentId?: number
  diagnosis: string
  treatmentPlan: string
  prescriptions?: string
  odontogramData?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: number
  clinicalRecordId?: number
  patientId: number
  amount: number
  currency: string
  paymentMethod: 'EFECTIVO' | 'CARTERA_DIGITAL' | 'YAPE_PLIN' | 'DEPOSITO_BBVA' | 'TARJETA' | 'TRANSFERENCIA'
  status: 'PENDIENTE' | 'COMPLETADO' | 'PAGADO' | 'ANULADO'
  reference?: string
  notes?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: number
  userId?: number
  action: string
  entity: string
  entityId?: number
  details?: Record<string, any>
  ipAddress?: string
  createdAt: string
}
