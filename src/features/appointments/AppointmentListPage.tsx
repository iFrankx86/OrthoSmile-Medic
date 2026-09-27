import React, { useState, useEffect } from 'react'
import { Appointment, Patient, Professional } from '../../types/models'
import { Calendar, Plus, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export const AppointmentListPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [newAppt, setNewAppt] = useState({
    patientId: '',
    professionalId: '',
    scheduledStart: '',
    reason: '',
    notes: '',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [apptsRes, patsRes, profsRes] = await Promise.all([
        fetch('/api/v1/appointments'),
        fetch('/api/v1/patients'),
        fetch('/api/v1/professionals'),
      ])
      const [apptsData, patsData, profsData] = await Promise.all([
        apptsRes.json(),
        patsRes.json(),
        profsRes.json(),
      ])
      setAppointments(Array.isArray(apptsData) ? apptsData : [])
      setPatients(Array.isArray(patsData) ? patsData : [])
      setProfessionals(Array.isArray(profsData) ? profsData : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const start = new Date(newAppt.scheduledStart)
      const end = new Date(start.getTime() + 45 * 60000) // 45 min duration
      const res = await fetch('/api/v1/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: Number(newAppt.patientId),
          professionalId: Number(newAppt.professionalId),
          scheduledStart: start.toISOString(),
          scheduledEnd: end.toISOString(),
          reason: newAppt.reason,
          notes: newAppt.notes,
        }),
      })
      if (res.ok) {
        setShowModal(false)
        setNewAppt({ patientId: '', professionalId: '', scheduledStart: '', reason: '', notes: '' })
        loadData()
      } else {
        alert('Error al agendar cita.')
      }
    } catch (e) {
      alert('Error de red.')
    }
  }

  const getPatientName = (id: number) => {
    const p = patients.find((pat) => pat.id === id)
    return p ? `${p.firstName} ${p.lastName}` : `Paciente #${id}`
  }

  const getDoctorName = (id: number) => {
    const d = professionals.find((prof) => prof.id === id)
    return d ? `Dr. ${d.firstName} ${d.lastName}` : `Especialista #${id}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMADA':
      case 'ATENDIDA':
        return <span className="badge bg-success-subtle text-success">Atendida / Confirmada</span>
      case 'CANCELADA':
        return <span className="badge bg-danger-subtle text-danger">Cancelada</span>
      default:
        return <span className="badge bg-primary-subtle text-primary">Programada</span>
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Agenda de Citas Odontológicas</h3>
          <p className="text-muted small mb-0">Control y calendarización de consultas clínicas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
          <Plus size={18} />
          <span>Agendar Nueva Cita</span>
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Fecha y Hora</th>
                  <th>Paciente</th>
                  <th>Especialista</th>
                  <th>Motivo de Consulta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                      Cargando agenda médica...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      No hay citas programadas actualmente.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a.id}>
                      <td className="ps-4">
                        <div className="fw-bold text-dark d-flex align-items-center gap-1">
                          <Calendar size={15} className="text-primary" />
                          {new Date(a.scheduledStart).toLocaleDateString()}
                        </div>
                        <div className="extra-small text-muted d-flex align-items-center gap-1">
                          <Clock size={12} />
                          {new Date(a.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{getPatientName(a.patientId)}</div>
                      </td>
                      <td>
                        <div className="small text-secondary">{getDoctorName(a.professionalId)}</div>
                      </td>
                      <td>
                        <div className="small text-dark">{a.reason || 'Consulta General'}</div>
                        {a.notes && <div className="extra-small text-muted fst-italic">{a.notes}</div>}
                      </td>
                      <td>{getStatusBadge(a.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3 shadow border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Nueva Cita Odontológica</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Paciente *</label>
                    <select
                      className="form-select"
                      required
                      value={newAppt.patientId}
                      onChange={(e) => setNewAppt({ ...newAppt, patientId: e.target.value })}
                    >
                      <option value="">Seleccione Paciente...</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} - DNI {p.documentNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Profesional Odontólogo *</label>
                    <select
                      className="form-select"
                      required
                      value={newAppt.professionalId}
                      onChange={(e) => setNewAppt({ ...newAppt, professionalId: e.target.value })}
                    >
                      <option value="">Seleccione Odontólogo...</option>
                      {professionals.map((d) => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.firstName} {d.lastName} ({d.specialty})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Fecha y Hora de Inicio *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      required
                      value={newAppt.scheduledStart}
                      onChange={(e) => setNewAppt({ ...newAppt, scheduledStart: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Motivo de Consulta *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Curación de caries, Limpieza profiláctica, Ortodoncia..."
                      required
                      value={newAppt.reason}
                      onChange={(e) => setNewAppt({ ...newAppt, reason: e.target.value })}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-secondary">Notas Adicionales</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Indicaciones preliminares..."
                      value={newAppt.notes}
                      onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light border" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm">
                    Confirmar Cita
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
