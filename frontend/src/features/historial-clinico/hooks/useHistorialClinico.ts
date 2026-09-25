import { useState, useCallback } from 'react'
import {
  ClinicalRecordRequest,
  ClinicalRecordResponse,
} from '../types/HistorialClinico.types'
import { historialclinicoService } from '../services/historialclinicoService'

export function useHistorialClinico() {
  const [records, setRecords] = useState<ClinicalRecordResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecordsByPatient = useCallback(async (patientId: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await historialclinicoService.getByPatient(patientId)
      setRecords(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar historias clínicas')
    } finally {
      setLoading(false)
    }
  }, [])

  const createRecord = async (req: ClinicalRecordRequest) => {
    const created = await historialclinicoService.create(req)
    setRecords((prev) => [created, ...prev])
    return created
  }

  return {
    records,
    loading,
    error,
    fetchRecordsByPatient,
    createRecord,
  }
}
