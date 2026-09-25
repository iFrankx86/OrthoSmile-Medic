import { useState, useEffect, useCallback } from 'react'
import { PatientRequest, PatientResponse } from '../types/paciente.types'
import { pacienteService } from '../services/pacienteService'

export function usePacientes() {
  const [patients, setPatients] = useState<PatientResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPatients = useCallback(async (query?: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await pacienteService.getAll(query)
      setPatients(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los pacientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const createPatient = async (patient: PatientRequest) => {
    const created = await pacienteService.create(patient)
    setPatients((prev) => [created, ...prev])
    return created
  }

  const updatePatient = async (id: number, patient: PatientRequest) => {
    const updated = await pacienteService.update(id, patient)
    setPatients((prev) => prev.map((p) => (p.id === id ? updated : p)))
    return updated
  }

  const togglePatientStatus = async (id: number, currentStatus: boolean) => {
    const updated = await pacienteService.changeStatus(id, !currentStatus)
    setPatients((prev) => prev.map((p) => (p.id === id ? updated : p)))
    return updated
  }

  return {
    patients,
    loading,
    error,
    fetchPatients,
    createPatient,
    updatePatient,
    togglePatientStatus,
  }
}
