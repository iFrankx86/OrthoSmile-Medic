import { apiClient } from '../../../infrastructure/api/apiClient'
import { PaymentRequest, PaymentResponse } from '../types/pagos.types'

export const pagosService = {
  async getAll(patientId?: number): Promise<PaymentResponse[]> {
    const params = patientId ? { patientId } : {}
    const { data } = await apiClient.get<PaymentResponse[]>('/payments', { params })
    return data
  },

  async getById(id: number): Promise<PaymentResponse> {
    const { data } = await apiClient.get<PaymentResponse>(`/payments/${id}`)
    return data
  },

  async create(payment: PaymentRequest): Promise<PaymentResponse> {
    const { data } = await apiClient.post<PaymentResponse>('/payments', payment)
    return data
  },
}
