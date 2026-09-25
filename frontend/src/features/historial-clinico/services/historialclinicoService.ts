import { apiClient } from '../../../infrastructure/api/apiClient'
import {
  ClinicalRecordRequest,
  ClinicalRecordResponse,
} from '../types/HistorialClinico.types'

export const historialclinicoService = {
  async getByPatient(patientId: number): Promise<ClinicalRecordResponse[]> {
    const { data } = await apiClient.get<ClinicalRecordResponse[]>(
      `/clinical-history/patients/${patientId}`
    )
    return data
  },

  async getById(id: number): Promise<ClinicalRecordResponse> {
    const { data } = await apiClient.get<ClinicalRecordResponse>(
      `/clinical-history/${id}`
    )
    return data
  },

  async create(record: ClinicalRecordRequest): Promise<ClinicalRecordResponse> {
    const { data } = await apiClient.post<ClinicalRecordResponse>(
      '/clinical-history',
      record
    )
    return data
  },
}
