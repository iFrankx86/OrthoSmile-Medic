export type AppointmentStatus =
  | 'PROGRAMADA'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'ATENDIDA'
  | 'NO_ASISTIO'

export interface AppointmentResponse {
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
  createdAt: string
  updatedAt: string
}

export interface AppointmentRequest {
  patientId: number
  professionalId: number
  scheduledStart: string
  scheduledEnd: string
  reason?: string
  notes?: string
}

export interface AppointmentStatusRequest {
  status: AppointmentStatus
  canceledReason?: string
}

export interface ProfessionalResponse {
  id: number
  userId?: number
  firstName: string
  lastName: string
  licenseNumber: string
  specialty: string
  phone?: string
  active: boolean
}
