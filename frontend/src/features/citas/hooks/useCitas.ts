import { useState, useEffect, useCallback } from 'react'
import {
  AppointmentRequest,
  AppointmentResponse,
  AppointmentStatusRequest,
  ProfessionalResponse,
} from '../types/citas.types'
import { citasService } from '../services/citasService'

export function useCitas() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [professionals, setProfessionals] = useState<ProfessionalResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [appts, profs] = await Promise.all([
        citasService.getAll(),
        citasService.getProfessionals(),
      ])
      setAppointments(appts)
      setProfessionals(profs)
    } catch (err: any) {
      setError(err.message || 'Error al cargar citas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const createAppointment = async (req: AppointmentRequest) => {
    const created = await citasService.create(req)
    setAppointments((prev) => [created, ...prev])
    return created
  }

  const updateAppointment = async (id: number, req: AppointmentRequest) => {
    const updated = await citasService.update(id, req)
    setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)))
    return updated
  }

  const changeStatus = async (id: number, req: AppointmentStatusRequest) => {
    const updated = await citasService.changeStatus(id, req)
    setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)))
    return updated
  }

  return {
    appointments,
    professionals,
    loading,
    error,
    refresh: fetchData,
    createAppointment,
    updateAppointment,
    changeStatus,
  }
}
