import { useState, useEffect } from 'react'
import { useCitas } from '../hooks/useCitas'
import { AppointmentStatus, AppointmentRequest } from '../types/citas.types'
import { pacienteService } from '../../pacientes/services/pacienteService'
import { PatientResponse } from '../../pacientes/types/paciente.types'

export function CitasPage() {
  const {
    appointments,
    professionals,
    loading,
    error,
    createAppointment,
    changeStatus,
  } = useCitas()

  const [patients, setPatients] = useState<PatientResponse[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('TODAS')

  // Modal Agendar
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    patientId: 0,
    professionalId: 0,
    startDate: '',
    startTime: '09:00',
    durationMinutes: 60,
    reason: '',
    notes: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Cancel Modal
  const [cancelModalId, setCancelModalId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    pacienteService.getAll().then((data) => {
      setPatients(data)
      if (data.length > 0 && formData.patientId === 0) {
        setFormData((prev) => ({ ...prev, patientId: data[0].id }))
      }
    })
  }, [])

  useEffect(() => {
    if (professionals.length > 0 && formData.professionalId === 0) {
      setFormData((prev) => ({ ...prev, professionalId: professionals[0].id }))
    }
  }, [professionals])

  const openCreateModal = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]

    setFormData({
      patientId: patients[0]?.id || 0,
      professionalId: professionals[0]?.id || 0,
      startDate: dateStr,
      startTime: '10:00',
      durationMinutes: 60,
      reason: '',
      notes: '',
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSaving(true)

    try {
      const startDateTime = `${formData.startDate}T${formData.startTime}:00`
      const startDateObj = new Date(startDateTime)
      const endDateObj = new Date(startDateObj.getTime() + formData.durationMinutes * 60000)
      const endDateTime = endDateObj.toISOString().slice(0, 19)

      const payload: AppointmentRequest = {
        patientId: Number(formData.patientId),
        professionalId: Number(formData.professionalId),
        scheduledStart: startDateTime,
        scheduledEnd: endDateTime,
        reason: formData.reason || undefined,
        notes: formData.notes || undefined,
      }

      await createAppointment(payload)
      setShowModal(false)
    } catch (err: any) {
      setFormError(err.message || 'Error al agendar cita')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (id: number, status: AppointmentStatus) => {
    try {
      await changeStatus(id, { status })
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado de la cita')
    }
  }

  const handleConfirmCancel = async () => {
    if (!cancelModalId) return
    try {
      await changeStatus(cancelModalId, {
        status: 'CANCELADA',
        canceledReason: cancelReason || 'Cancelado por el usuario',
      })
      setCancelModalId(null)
      setCancelReason('')
    } catch (err: any) {
      alert(err.message || 'Error al cancelar la cita')
    }
  }

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter === 'TODAS') return true
    return a.status === statusFilter
  })

  const getPatientName = (patientId: number) => {
    const p = patients.find((pat) => pat.id === patientId)
    return p ? `${p.firstName} ${p.lastName}` : `Paciente #${patientId}`
  }

  const getProfessionalName = (profId: number) => {
    const prof = professionals.find((pr) => pr.id === profId)
    return prof ? `Dr(a). ${prof.firstName} ${prof.lastName} (${prof.specialty})` : `Dr. #${profId}`
  }

  return (
    <div className="py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Agenda y Gestión de Citas</h1>
          <p className="text-muted mb-0">Programa turnos odontológicos, confirmaciones y control de estados.</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary d-flex align-items-center gap-2">
          <span>📅</span> Agendar Nueva Cita
        </button>
      </div>

      {/* Filter tabs */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className="fw-semibold text-secondary me-2">Filtrar por estado:</span>
            {['TODAS', 'PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`btn btn-sm ${
                  statusFilter === st ? 'btn-primary fw-semibold' : 'btn-outline-secondary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Appointments List */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Fecha y Hora</th>
                <th>Paciente</th>
                <th>Especialista</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="text-muted mt-2 mb-0">Cargando citas...</p>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No hay citas registradas en este estado.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="fw-semibold text-dark">
                        {new Date(a.scheduledStart).toLocaleDateString('es-PE', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <small className="text-muted">
                        ⏰ {new Date(a.scheduledStart).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(a.scheduledEnd).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{getPatientName(a.patientId)}</span>
                    </td>
                    <td>
                      <span className="text-secondary small">{getProfessionalName(a.professionalId)}</span>
                    </td>
                    <td>
                      <div>{a.reason || <span className="text-muted">—</span>}</div>
                      {a.notes && <small className="text-muted d-block">{a.notes}</small>}
                      {a.canceledReason && (
                        <small className="text-danger d-block">Motivo cancel: {a.canceledReason}</small>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          a.status === 'CONFIRMADA'
                            ? 'bg-primary'
                            : a.status === 'ATENDIDA'
                            ? 'bg-success'
                            : a.status === 'CANCELADA'
                            ? 'bg-danger'
                            : 'bg-warning text-dark'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {a.status === 'PROGRAMADA' && (
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => handleStatusChange(a.id, 'CONFIRMADA')}
                          >
                            Confirmar
                          </button>
                        )}
                        {a.status === 'CONFIRMADA' && (
                          <button
                            type="button"
                            className="btn btn-outline-success"
                            onClick={() => handleStatusChange(a.id, 'ATENDIDA')}
                          >
                            Atendida
                          </button>
                        )}
                        {a.status !== 'CANCELADA' && a.status !== 'ATENDIDA' && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => {
                              setCancelModalId(a.id)
                              setCancelReason('')
                            }}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agendar Cita */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Agendar Nueva Cita</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSaveAppointment}>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger small py-2">{formError}</div>}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Paciente *</label>
                      <select
                        className="form-select"
                        required
                        value={formData.patientId}
                        onChange={(e) => setFormData({ ...formData, patientId: Number(e.target.value) })}
                      >
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName} ({p.documentType}: {p.documentNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Odontólogo Especialista *</label>
                      <select
                        className="form-select"
                        required
                        value={formData.professionalId}
                        onChange={(e) => setFormData({ ...formData, professionalId: Number(e.target.value) })}
                      >
                        {professionals.map((pr) => (
                          <option key={pr.id} value={pr.id}>
                            Dr(a). {pr.firstName} {pr.lastName} - {pr.specialty}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Fecha de la Cita *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Hora de Inicio *</label>
                      <input
                        type="time"
                        className="form-control"
                        required
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Duración Estimada *</label>
                      <select
                        className="form-select"
                        value={formData.durationMinutes}
                        onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                      >
                        <option value={30}>30 minutos</option>
                        <option value={45}>45 minutos</option>
                        <option value={60}>1 hora (60 min)</option>
                        <option value={90}>1 hora y media (90 min)</option>
                        <option value={120}>2 horas (120 min)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Motivo de la Cita</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. Evaluación de ortodoncia, limpieza, dolor molar..."
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Notas Adicionales</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Indicaciones previas o antecedentes..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} className="btn btn-primary">
                    {isSaving ? 'Agendando...' : 'Agendar Cita'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalId && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Cancelar Cita</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setCancelModalId(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-secondary">¿Está seguro de que desea cancelar esta cita odontológica?</p>
                <label className="form-label small fw-semibold">Motivo de la cancelación:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Paciente no podrá asistir, reprogramación..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setCancelModalId(null)}>
                  Volver
                </button>
                <button type="button" className="btn btn-danger" onClick={handleConfirmCancel}>
                  Confirmar Cancelación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
