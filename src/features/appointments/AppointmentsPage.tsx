import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  FileCheck2,
  X,
  User
} from 'lucide-react'
import { api } from '../../services/api'
import { Appointment, Patient, Professional, AppointmentStatus } from '../../types'
import { useToast } from '../../app/providers/AppProviders'

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [profFilter, setProfFilter] = useState<string>('all')

  // Modal Create/Edit
  const [showModal, setShowModal] = useState(false)
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)
  const [formData, setFormData] = useState({
    patientId: '',
    professionalId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    durationMinutes: 45,
    reason: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Status Change Modal
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedApptForStatus, setSelectedApptForStatus] = useState<Appointment | null>(null)
  const [nextStatus, setNextStatus] = useState<AppointmentStatus>('CONFIRMADA')
  const [canceledReason, setCanceledReason] = useState('')

  const loadAll = async () => {
    try {
      setLoading(true)
      const [appts, pats, profs] = await Promise.all([
        api.getAppointments(),
        api.getPatients(),
        api.getProfessionals(),
      ])
      setAppointments(appts)
      setPatients(pats)
      setProfessionals(profs)
    } catch {
      showToast('Error al cargar datos de citas', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenCreate()
    }
  }, [searchParams])

  const handleOpenCreate = () => {
    setEditingAppt(null)
    const now = new Date()
    const currentHour = now.getHours().toString().padStart(2, '0')
    setFormData({
      patientId: patients.length ? String(patients[0].id) : '',
      professionalId: professionals.length ? String(professionals[0].id) : '',
      date: now.toISOString().split('T')[0],
      startTime: `${currentHour}:00`,
      durationMinutes: 45,
      reason: '',
      notes: '',
    })
    setShowModal(true)
  }

  const handleOpenEdit = (appt: Appointment) => {
    setEditingAppt(appt)
    const startDate = new Date(appt.scheduledStart)
    const endDate = new Date(appt.scheduledEnd)
    const diffMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000)

    const dateStr = startDate.toISOString().split('T')[0]
    const hours = startDate.getHours().toString().padStart(2, '0')
    const mins = startDate.getMinutes().toString().padStart(2, '0')

    setFormData({
      patientId: String(appt.patientId),
      professionalId: String(appt.professionalId),
      date: dateStr,
      startTime: `${hours}:${mins}`,
      durationMinutes: diffMinutes > 0 ? diffMinutes : 45,
      reason: appt.reason || '',
      notes: appt.notes || '',
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAppt(null)
    if (searchParams.get('action')) {
      searchParams.delete('action')
      setSearchParams(searchParams)
    }
  }

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.patientId || !formData.professionalId || !formData.date || !formData.startTime) {
      showToast('Por favor complete todos los datos requeridos', 'warning')
      return
    }

    const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`)
    const endDateTime = new Date(startDateTime.getTime() + formData.durationMinutes * 60000)

    if (endDateTime <= startDateTime) {
      showToast('La hora de fin debe ser posterior a la de inicio', 'error')
      return
    }

    // Check conflict with active appointments of same professional
    const profId = Number(formData.professionalId)
    const overlap = appointments.find((a) => {
      if (editingAppt && a.id === editingAppt.id) return false
      if (a.professionalId !== profId) return false
      if (a.status === 'CANCELADA') return false

      const aStart = new Date(a.scheduledStart).getTime()
      const aEnd = new Date(a.scheduledEnd).getTime()
      const newStart = startDateTime.getTime()
      const newEnd = endDateTime.getTime()

      return Math.max(aStart, newStart) < Math.min(aEnd, newEnd)
    })

    if (overlap) {
      showToast('Conflicto de horario: El odontólogo ya tiene una cita agendada en ese intervalo', 'error')
      return
    }

    try {
      setSubmitting(true)
      const payload: Partial<Appointment> = {
        patientId: Number(formData.patientId),
        professionalId: Number(formData.professionalId),
        scheduledStart: startDateTime.toISOString(),
        scheduledEnd: endDateTime.toISOString(),
        reason: formData.reason,
        notes: formData.notes,
      }

      if (editingAppt) {
        await api.updateAppointment(editingAppt.id, payload)
        showToast('Cita reprogramada con éxito', 'success')
      } else {
        await api.createAppointment(payload)
        showToast('Cita programada correctamente', 'success')
      }
      handleCloseModal()
      loadAll()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al agendar cita', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenStatusModal = (appt: Appointment, targetStatus: AppointmentStatus) => {
    setSelectedApptForStatus(appt)
    setNextStatus(targetStatus)
    setCanceledReason('')
    setShowStatusModal(true)
  }

  const handleConfirmStatusChange = async () => {
    if (!selectedApptForStatus) return
    try {
      await api.updateAppointmentStatus(
        selectedApptForStatus.id,
        nextStatus,
        nextStatus === 'CANCELADA' ? canceledReason : undefined
      )
      showToast(`Estado de la cita actualizado a ${nextStatus}`, 'success')
      setShowStatusModal(false)
      setSelectedApptForStatus(null)
      loadAll()
    } catch {
      showToast('Error al actualizar el estado de la cita', 'error')
    }
  }

  const getPatient = (id: number) => patients.find((p) => p.id === id)
  const getProfessional = (id: number) => professionals.find((pr) => pr.id === id)

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return d.toLocaleString('es-PE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'CONFIRMADA':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Confirmada
          </span>
        )
      case 'ATENDIDA':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Atendida
          </span>
        )
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelada
          </span>
        )
      case 'NO_ASISTIO':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            No Asistió
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            Programada
          </span>
        )
    }
  }

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (profFilter !== 'all' && a.professionalId !== Number(profFilter)) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Agenda y Programación de Citas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Control de turnos, disponibilidades y estados de atención odontológica.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors min-h-[44px]"
        >
          <Plus size={18} />
          <span>Agendar Cita</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Profesional
          </label>
          <select
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
            value={profFilter}
            onChange={(e) => setProfFilter(e.target.value)}
          >
            <option value="all">Todos los profesionales</option>
            {professionals.map((pr) => (
              <option key={pr.id} value={pr.id}>
                Dr. {pr.firstName} {pr.lastName} ({pr.specialty})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Estado
          </label>
          <select
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="PROGRAMADA">Programada</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="ATENDIDA">Atendida</option>
            <option value="CANCELADA">Cancelada</option>
            <option value="NO_ASISTIO">No Asistió</option>
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-1 flex items-end justify-between lg:justify-end text-xs text-slate-400 pb-2">
          <span>Mostrando {filteredAppointments.length} de {appointments.length} citas</span>
        </div>
      </div>

      {/* Appointments List: Desktop Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Cargando citas odontológicas...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No hay citas registradas para los filtros aplicados.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Horario</th>
                    <th className="px-5 py-3.5">Paciente</th>
                    <th className="px-5 py-3.5">Especialista</th>
                    <th className="px-5 py-3.5">Motivo</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((appt) => {
                    const patient = getPatient(appt.patientId)
                    const prof = getProfessional(appt.professionalId)
                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-slate-900 font-semibold">
                            <Clock size={15} className="text-sky-600 shrink-0" />
                            <span>{formatDateTime(appt.scheduledStart)}</span>
                          </div>
                          <div className="text-xs text-slate-400 pl-6">
                            Fin: {formatDateTime(appt.scheduledEnd)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            {patient ? `${patient.firstName} ${patient.lastName}` : `ID #${appt.patientId}`}
                          </div>
                          <div className="text-xs text-slate-400">
                            {patient?.phone || patient?.documentNumber}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-800">
                            {prof ? `Dr. ${prof.firstName} ${prof.lastName}` : `ID #${appt.professionalId}`}
                          </div>
                          <div className="text-xs text-slate-400">{prof?.specialty}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs text-slate-700 font-medium truncate max-w-[180px]">
                            {appt.reason || 'Sin motivo'}
                          </div>
                          {appt.notes && (
                            <div className="text-xs text-slate-400 truncate max-w-[180px]">
                              {appt.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {renderBadge(appt.status)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {appt.status !== 'ATENDIDA' && appt.status !== 'CANCELADA' && (
                              <>
                                {appt.status === 'PROGRAMADA' && (
                                  <button
                                    onClick={() => handleOpenStatusModal(appt, 'CONFIRMADA')}
                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                                    title="Confirmar Cita"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/clinical-history?action=new&appointmentId=${appt.id}&patientId=${appt.patientId}&professionalId=${appt.professionalId}`
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors min-h-[36px]"
                                  title="Atender Cita"
                                >
                                  <FileCheck2 size={14} />
                                  <span>Atender</span>
                                </button>
                                <button
                                  onClick={() => handleOpenStatusModal(appt, 'CANCELADA')}
                                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                                  title="Cancelar Cita"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleOpenEdit(appt)}
                              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Reprogramar / Editar"
                            >
                              <Edit size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards View (QA Mobile Approved) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredAppointments.map((appt) => {
                const patient = getPatient(appt.patientId)
                const prof = getProfessional(appt.professionalId)
                return (
                  <div key={appt.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {patient ? `${patient.firstName} ${patient.lastName}` : `Paciente #${appt.patientId}`}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {prof ? `Dr. ${prof.firstName} ${prof.lastName}` : `ID ${appt.professionalId}`}
                        </div>
                      </div>
                      {renderBadge(appt.status)}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                      <Clock size={14} className="text-sky-600 shrink-0" />
                      <span>{formatDateTime(appt.scheduledStart)}</span>
                    </div>

                    {appt.reason && (
                      <p className="text-xs text-slate-600 bg-slate-50/50 p-2 rounded-lg">
                        {appt.reason}
                      </p>
                    )}

                    {/* Touch Action Buttons >= 44px */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {appt.status !== 'ATENDIDA' && appt.status !== 'CANCELADA' ? (
                        <>
                          <button
                            onClick={() =>
                              navigate(
                                `/clinical-history?action=new&appointmentId=${appt.id}&patientId=${appt.patientId}&professionalId=${appt.professionalId}`
                              )
                            }
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs min-h-[44px]"
                          >
                            <FileCheck2 size={16} />
                            <span>Atender</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(appt)}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 min-h-[44px]"
                          >
                            <Edit size={16} />
                            <span>Reprogramar</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleOpenEdit(appt)}
                          className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 min-h-[44px]"
                        >
                          <Edit size={16} />
                          <span>Ver Detalles</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal Agendar / Editar Cita */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingAppt ? 'Reprogramar / Editar Cita' : 'Agendar Nueva Cita'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paciente *
                </label>
                <select
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                >
                  <option value="">Seleccione paciente...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.documentType}: {p.documentNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Odontólogo / Especialista *
                </label>
                <select
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                  value={formData.professionalId}
                  onChange={(e) => setFormData({ ...formData, professionalId: e.target.value })}
                >
                  <option value="">Seleccione especialista...</option>
                  {professionals.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      Dr. {pr.firstName} {pr.lastName} - {pr.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hora de Inicio *
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Duración Estimada
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                >
                  <option value={30}>30 minutos (Control breve / Evaluación)</option>
                  <option value={45}>45 minutos (Ajuste de brackets / Profilaxis)</option>
                  <option value={60}>60 minutos (Tratamiento estándar / Curaciones)</option>
                  <option value={90}>90 minutos (Cirugía / Extracción compleja)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo de Consulta
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                  placeholder="Ej: Evaluación ortodoncia, dolor molar"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas Adicionales
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  placeholder="Instrucciones previas o notas para recepción"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors min-h-[44px]"
                >
                  {submitting ? 'Guardando...' : editingAppt ? 'Guardar Cambios' : 'Agendar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Status Change (Confirm/Cancel/No Asistió) */}
      {showStatusModal && selectedApptForStatus && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Actualizar Estado</h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nuevo Estado:
              </label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as AppointmentStatus)}
              >
                <option value="CONFIRMADA">Confirmada (Paciente contactado)</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="NO_ASISTIO">No Asistió (Inasistencia)</option>
              </select>
            </div>

            {nextStatus === 'CANCELADA' && (
              <div>
                <label className="block text-xs font-bold text-rose-600 mb-1">
                  Motivo de Cancelación *
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-rose-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Ej: Paciente solicitó postergación"
                  value={canceledReason}
                  onChange={(e) => setCanceledReason(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors min-h-[44px]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
