import { apiClient } from '../../../infrastructure/api/apiClient'
import { PatientRequest, PatientResponse } from '../types/paciente.types'

export const pacienteService = {
  async getAll(q?: string): Promise<PatientResponse[]> {
    const params = q ? { q } : {}
    const { data } = await apiClient.get<PatientResponse[]>('/patients', { params })
    return data
  },

  async getById(id: number): Promise<PatientResponse> {
    const { data } = await apiClient.get<PatientResponse>(`/patients/${id}`)
    return data
  },

  async create(patient: PatientRequest): Promise<PatientResponse> {
    const { data } = await apiClient.post<PatientResponse>('/patients', patient)
    return data
  },

  async update(id: number, patient: PatientRequest): Promise<PatientResponse> {
    const { data } = await apiClient.put<PatientResponse>(`/patients/${id}`, patient)
    return data
  },

  async changeStatus(id: number, active: boolean): Promise<PatientResponse> {
    const { data } = await apiClient.patch<PatientResponse>(`/patients/${id}/status`, null, {
      params: { active },
    })
    return data
  },
}
