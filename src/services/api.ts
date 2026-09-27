import axios from 'axios'
import {
  User,
  Professional,
  Patient,
  Appointment,
  ClinicalRecord,
  Payment,
  AuditLog,
  AppointmentStatus,
  PaymentStatus,
} from '../types'

const BASE_URL = '/api/v1'

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach auth token if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('ortho_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const api = {
  // Auth
  login: async (username: string, password: string): Promise<User> => {
    const res = await client.post<User>('/auth/login', { username, password })
    return res.data
  },
  logout: async () => {
    try {
      await client.post('/auth/logout')
    } catch {
      // ignore
    }
  },

  // Patients
  getPatients: async (query?: string): Promise<Patient[]> => {
    const res = await client.get<Patient[]>('/patients', {
      params: query ? { q: query } : undefined,
    })
    return res.data
  },
  getPatient: async (id: number): Promise<Patient> => {
    const res = await client.get<Patient>(`/patients/${id}`)
    return res.data
  },
  createPatient: async (data: Partial<Patient>): Promise<Patient> => {
    const res = await client.post<Patient>('/patients', data)
    return res.data
  },
  updatePatient: async (id: number, data: Partial<Patient>): Promise<Patient> => {
    const res = await client.put<Patient>(`/patients/${id}`, data)
    return res.data
  },
  togglePatientStatus: async (id: number, active: boolean): Promise<Patient> => {
    const res = await client.patch<Patient>(`/patients/${id}/status`, { active }, {
      params: { active: String(active) },
    })
    return res.data
  },

  // Professionals
  getProfessionals: async (): Promise<Professional[]> => {
    const res = await client.get<Professional[]>('/professionals')
    return res.data
  },
  getProfessional: async (id: number): Promise<Professional> => {
    const res = await client.get<Professional>(`/professionals/${id}`)
    return res.data
  },
  createProfessional: async (data: Partial<Professional>): Promise<Professional> => {
    const res = await client.post<Professional>('/professionals', data)
    return res.data
  },
  updateProfessional: async (id: number, data: Partial<Professional>): Promise<Professional> => {
    const res = await client.put<Professional>(`/professionals/${id}`, data)
    return res.data
  },
  toggleProfessionalStatus: async (id: number, active: boolean): Promise<Professional> => {
    const res = await client.patch<Professional>(`/professionals/${id}/status`, { active }, {
      params: { active: String(active) },
    })
    return res.data
  },

  // Appointments
  getAppointments: async (): Promise<Appointment[]> => {
    const res = await client.get<Appointment[]>('/appointments')
    return res.data
  },
  getAppointment: async (id: number): Promise<Appointment> => {
    const res = await client.get<Appointment>(`/appointments/${id}`)
    return res.data
  },
  createAppointment: async (data: Partial<Appointment>): Promise<Appointment> => {
    const res = await client.post<Appointment>('/appointments', data)
    return res.data
  },
  updateAppointment: async (id: number, data: Partial<Appointment>): Promise<Appointment> => {
    const res = await client.put<Appointment>(`/appointments/${id}`, data)
    return res.data
  },
  updateAppointmentStatus: async (
    id: number,
    status: AppointmentStatus,
    canceledReason?: string
  ): Promise<Appointment> => {
    const res = await client.patch<Appointment>(`/appointments/${id}/status`, {
      status,
      canceledReason,
    })
    return res.data
  },

  // Clinical Records
  getClinicalRecordsByPatient: async (patientId: number): Promise<ClinicalRecord[]> => {
    const res = await client.get<ClinicalRecord[]>(`/clinical-history/patients/${patientId}`)
    return res.data
  },
  getClinicalRecord: async (id: number): Promise<ClinicalRecord> => {
    const res = await client.get<ClinicalRecord>(`/clinical-history/${id}`)
    return res.data
  },
  createClinicalRecord: async (data: Partial<ClinicalRecord>): Promise<ClinicalRecord> => {
    const res = await client.post<ClinicalRecord>('/clinical-history', data)
    return res.data
  },

  // Payments
  getPayments: async (patientId?: number): Promise<Payment[]> => {
    const res = await client.get<Payment[]>('/payments', {
      params: patientId ? { patientId } : undefined,
    })
    return res.data
  },
  createPayment: async (data: Partial<Payment>): Promise<Payment> => {
    const res = await client.post<Payment>('/payments', data)
    return res.data
  },

  // Audit
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await client.get<AuditLog[]>('/audit-logs')
    return res.data
  },
}
