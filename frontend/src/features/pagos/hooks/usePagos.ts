import { useState, useEffect, useCallback } from 'react'
import { PaymentRequest, PaymentResponse } from '../types/pagos.types'
import { pagosService } from '../services/pagosService'

export function usePagos(patientId?: number) {
  const [payments, setPayments] = useState<PaymentResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await pagosService.getAll(patientId)
      setPayments(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar pagos')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const createPayment = async (req: PaymentRequest) => {
    const created = await pagosService.create(req)
    setPayments((prev) => [created, ...prev])
    return created
  }

  return {
    payments,
    loading,
    error,
    refresh: fetchPayments,
    createPayment,
  }
}
