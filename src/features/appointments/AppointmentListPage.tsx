import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Appointment, Patient, Professional } from '../../types'
import { api } from '../../services/api'
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  Stethoscope,
  Filter,
  RefreshCw,
  Search,
  UserPlus,
} from 'lucide-react'

export const AppointmentListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('TODAS')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [refreshingPatients, setRefreshingPatients] = useState(false)

  const [newAppt, setNewAppt] = useState({
    patientId: '',
    professionalId: '',
    scheduledStart: '',
    reason: '',
    notes: '',
  })

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      // Direct Firebase Firestore retrieval for live consistency
      const [apptsData, patsData, profsData] = await Promise.all([
        api.getAppointments(),
        api.getPatients(),
        api.getProfessionals(),
      ])
      setAppointments(Array.isArray(apptsData) ? apptsData : [])
      setPatients(Array.isArray(patsData) ? patsData : [])
      setProfessionals(Array.isArray(profsData) ? profsData : [])
    } catch (e) {
      console.error('[Firebase Appointments Fetch Error]:', e)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const handleFocus = () => loadData(true)
    const handlePatientCreated = (e: any) => {
      loadData(true)
      if (e?.detail?.id) {
        setNewAppt((prev) => ({ ...prev, patientId: String(e.detail.id) }))
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('orthosmile:patient-created', handlePatientCreated)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('orthosmile:patient-created', handlePatientCreated)
    }
  }, [])

  useEffect(() => {
    const patientIdParam = searchParams.get('patientId')
    const actionParam = searchParams.get('action')
    if (patientIdParam || actionParam === 'new') {
      setShowModal(true)
      setNewAppt((prev) => ({
        ...prev,
        patientId: patientIdParam ? String(patientIdParam) : prev.patientId,
        professionalId: prev.professionalId || (professionals[0]?.id ? String(professionals[0].id) : '1'),
      }))
      loadData(true)
    }
  }, [searchParams, professionals])

  const filteredPatients = useMemo(() => {
    let result = patients
    if (patientSearch.trim()) {
      const q = patientSearch.toLowerCase().trim()
      result = patients.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.documentNumber.includes(q) ||
          (p.phone && p.phone.includes(q))
      )
    }
    if (newAppt.patientId && !result.some((p) => String(p.id) === String(newAppt.patientId))) {
      const selected = patients.find((p) => String(p.id) === String(newAppt.patientId))
      if (selected) {
        return [selected, ...result]
      }
    }
    return result
  }, [patients, patientSearch, newAppt.patientId])

  const handleOpenModal = () => {
    setErrorMsg(null)
    setPatientSearch('')
    setShowModal(true)
    setNewAppt((prev) => ({
      ...prev,
      professionalId: prev.professionalId || (professionals[0]?.id ? String(professionals[0].id) : '1'),
    }))
    loadData(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!newAppt.patientId) {
      setErrorMsg('Por favor seleccione un paciente.')
      return
    }
    const chosenProfId = newAppt.professionalId || (professionals[0]?.id ? String(professionals[0].id) : '1')
    if (!chosenProfId) {
      setErrorMsg('Por favor seleccione el odontólogo.')
      return
    }
    if (!newAppt.scheduledStart) {
      setErrorMsg('Por favor seleccione la fecha y hora de la cita.')
      return
    }

    try {
      const start = new Date(newAppt.scheduledStart)
      const end = new Date(start.getTime() + 45 * 60000) // 45 min duration
      const payload = {
        patientId: Number(newAppt.patientId) || (newAppt.patientId as any),
        professionalId: Number(chosenProfId) || 1,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        status: 'PROGRAMADA' as const,
        reason: newAppt.reason || 'Consulta Odontológica',
        notes: newAppt.notes || '',
      }

      // 1. Direct Firebase Firestore Persistence
      await api.createAppointment(payload)

      // 2. Also notify backend non-blocking
      fetch('/api/v1/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})

      setShowModal(false)
      setNewAppt({ patientId: '', professionalId: '', scheduledStart: '', reason: '', notes: '' })
      await loadData(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al agendar cita en Firebase Firestore.')
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.updateAppointmentStatus(id, status as any)
      fetch(`/api/v1/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {})
      await loadData(true)
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROGRAMADA':
        return {
          label: 'Programada',
          style: 'bg-amber-50 text-amber-700 border-amber-200',
        }
      case 'CONFIRMADA':
        return {
          label: 'Confirmada',
          style: 'bg-sky-50 text-sky-700 border-sky-200',
        }
      case 'ATENDIDA':
        return {
          label: 'Atendida',
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        }
      case 'CANCELADA':
        return {
          label: 'Cancelada',
          style: 'bg-rose-50 text-rose-700 border-rose-200',
        }
      default:
        return {
          label: status,
          style: 'bg-slate-100 text-slate-700 border-slate-200',
        }
    }
  }

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter === 'TODAS') return true
    return a.status === statusFilter
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Agenda de Citas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 m-0">
            Control de citas clínicas, turnos de odontología y confirmaciones
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-sm font-semibold shadow-xs transition-all min-h-[44px]"
        >
          <Plus size={18} />
          <span>Nueva Cita</span>
        </button>
      </div>

      {/* Segmented Filter Bar (Mobile-friendly horizontal scroll) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl overflow-x-auto no-scrollbar">
        {[
          { key: 'TODAS', label: 'Todas' },
          { key: 'PROGRAMADA', label: 'Programadas' },
          { key: 'CONFIRMADA', label: 'Confirmadas' },
          { key: 'ATENDIDA', label: 'Atendidas' },
          { key: 'CANCELADA', label: 'Canceladas' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] ${
              statusFilter === tab.key
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointment Cards (Mobile + Desktop Responsive) */}
      {loading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 m-0">Cargando agenda de citas...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <CalendarIcon size={32} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 m-0">No hay citas en este estado</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {statusFilter === 'TODAS'
              ? 'Aún no se han agendado citas clínicas.'
              : `No se encontraron citas con el estado "${statusFilter}".`}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 pt-2"
          >
            <Plus size={16} />
            <span>Agendar nueva cita ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAppointments.map((appt) => {
            const pat = patients.find((p) => String(p.id) === String(appt.patientId))
            const prof = professionals.find((pr) => String(pr.id) === String(appt.professionalId))
            const badge = getStatusBadge(appt.status)
            const startDate = new Date(appt.scheduledStart)
            const formattedDate = startDate.toLocaleDateString('es-PE', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })
            const formattedTime = startDate.toLocaleTimeString('es-PE', {
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Top Bar: Date, Time & Status */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 font-mono">
                      <Clock size={14} className="text-sky-600" />
                      <span className="capitalize">{formattedDate}</span>
                      <span>·</span>
                      <span className="text-sky-700 tabular-nums">{formattedTime}</span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.style}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Patient Info */}
                  <div className="pt-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {pat?.firstName ? pat.firstName[0].toUpperCase() : 'P'}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900 leading-tight">
                          {pat ? `${pat.firstName} ${pat.lastName}` : `Paciente #${appt.patientId}`}
                        </div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums">
                          {pat?.phone || pat?.documentNumber || 'Sin teléfono'}
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">Motivo: </span>
                      <span>{appt.reason}</span>
                      {appt.notes && (
                        <p className="text-slate-500 text-[11px] mt-1 m-0 italic">"{appt.notes}"</p>
                      )}
                    </div>

                    {/* Doctor */}
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <Stethoscope size={13} className="text-slate-400" />
                      <span>
                        {prof
                          ? `Dr. ${prof.firstName} ${prof.lastName} (${prof.specialty})`
                          : 'Dr. Manuel Gustavo Chavez Sevillano (Orthodontist, MSc, PhD)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Touch Quick Status Transitions */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  {appt.status !== 'ATENDIDA' && (
                    <button
                      onClick={() => handleStatusChange(appt.id, 'ATENDIDA')}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors min-h-[40px]"
                    >
                      <Check size={14} />
                      <span>Marcar Atendida</span>
                    </button>
                  )}

                  {appt.status !== 'CONFIRMADA' && appt.status !== 'ATENDIDA' && (
                    <button
                      onClick={() => handleStatusChange(appt.id, 'CONFIRMADA')}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold border border-sky-200 transition-colors min-h-[40px]"
                    >
                      <CheckCircle2 size={14} />
                      <span>Confirmar</span>
                    </button>
                  )}

                  {appt.status !== 'CANCELADA' && (
                    <button
                      onClick={() => handleStatusChange(appt.id, 'CANCELADA')}
                      className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-medium transition-colors"
                    >
                      <X size={13} />
                      <span>Cancelar Cita</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal / Bottom Sheet for New Appointment */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setShowModal(false)}
          />

          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="font-bold text-base sm:text-lg text-slate-900 m-0">Agendar Nueva Cita</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Paciente <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setRefreshingPatients(true)
                        await loadData(true)
                        setRefreshingPatients(false)
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-800 transition-colors"
                      title="Refrescar lista de pacientes al instante"
                    >
                      <RefreshCw size={11} className={refreshingPatients ? 'animate-spin' : ''} />
                      <span>{refreshingPatients ? 'Actualizando...' : 'Actualizar lista'}</span>
                    </button>
                    <span className="text-slate-300">·</span>
                    <Link
                      to="/pacientes/nuevo"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                      title="Registrar nuevo paciente en la clínica"
                    >
                      <UserPlus size={11} />
                      <span>+ Nuevo</span>
                    </Link>
                  </div>
                </div>

                {/* Live filter input */}
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Search size={13} />
                  </div>
                  <input
                    type="text"
                    placeholder="Filtrar por nombre o DNI..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                  />
                  {patientSearch && (
                    <button
                      type="button"
                      onClick={() => setPatientSearch('')}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <select
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white min-h-[44px]"
                  value={newAppt.patientId}
                  onChange={(e) => setNewAppt({ ...newAppt, patientId: e.target.value })}
                >
                  <option value="">
                    {filteredPatients.length === 0
                      ? 'No hay pacientes que coincidan'
                      : `Seleccione un paciente (${filteredPatients.length} disponibles)...`}
                  </option>
                  {filteredPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} — {p.documentType}: {p.documentNumber} {p.phone ? `· Tel: ${p.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profesional Odontólogo <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white min-h-[44px]"
                  value={newAppt.professionalId || (professionals[0]?.id ? String(professionals[0].id) : '1')}
                  onChange={(e) => setNewAppt({ ...newAppt, professionalId: e.target.value })}
                >
                  {professionals.length === 0 ? (
                    <option value="1">Dr. Manuel Gustavo Chavez Sevillano (Orthodontist, MSc, PhD)</option>
                  ) : (
                    professionals.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        Dr. {pr.firstName} {pr.lastName} ({pr.specialty})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha y Hora <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[44px]"
                  value={newAppt.scheduledStart}
                  onChange={(e) => setNewAppt({ ...newAppt, scheduledStart: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo de la Consulta <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Evaluación de Ortodoncia, Limpieza Dental, Curación..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[44px]"
                  value={newAppt.reason}
                  onChange={(e) => setNewAppt({ ...newAppt, reason: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas Adicionales (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Instrucciones previas, alergias o solicitudes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  value={newAppt.notes}
                  onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-xs min-h-[44px]"
                >
                  Confirmar y Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
