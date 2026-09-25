import { apiClient } from '../../../infrastructure/api/apiClient'
import {
  AppointmentRequest,
  AppointmentResponse,
  AppointmentStatusRequest,
  ProfessionalResponse,
} from '../types/citas.types'

export const citasService = {
  async getAll(): Promise<AppointmentResponse[]> {
    const { data } = await apiClient.get<AppointmentResponse[]>('/appointments')
    return data
  },

  async getById(id: number): Promise<AppointmentResponse> {
    const { data } = await apiClient.get<AppointmentResponse>(`/appointments/${id}`)
    return data
  },

  async create(appointment: AppointmentRequest): Promise<AppointmentResponse> {
    const { data } = await apiClient.post<AppointmentResponse>('/appointments', appointment)
    return data
  },

  async update(id: number, appointment: AppointmentRequest): Promise<AppointmentResponse> {
    const { data } = await apiClient.put<AppointmentResponse>(`/appointments/${id}`, appointment)
    return data
  },

  async changeStatus(id: number, req: AppointmentStatusRequest): Promise<AppointmentResponse> {
    const { data } = await apiClient.patch<AppointmentResponse>(`/appointments/${id}/status`, req)
    return data
  },

  async getProfessionals(): Promise<ProfessionalResponse[]> {
    const { data } = await apiClient.get<ProfessionalResponse[]>('/professionals')
    return data
  },
}
