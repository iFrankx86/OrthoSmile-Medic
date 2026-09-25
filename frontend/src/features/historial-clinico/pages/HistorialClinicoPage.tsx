import { useState, useEffect } from 'react'
import { useHistorialClinico } from '../hooks/useHistorialClinico'
import { pacienteService } from '../../pacientes/services/pacienteService'
import { PatientResponse } from '../../pacientes/types/paciente.types'
import { citasService } from '../../citas/services/citasService'
import { AppointmentResponse } from '../../citas/types/citas.types'
import { ClinicalRecordRequest } from '../types/HistorialClinico.types'

export function HistorialClinicoPage() {
  const { records, loading, error, fetchRecordsByPatient, createRecord } = useHistorialClinico()

  const [patients, setPatients] = useState<PatientResponse[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<number>(0)
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    appointmentId: 0,
    professionalId: 0,
    attentionDate: new Date().toISOString().slice(0, 16),
    chiefComplaint: '',
    diagnosis: '',
    treatmentPlan: '',
    clinicalNotes: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    pacienteService.getAll().then((data) => {
      setPatients(data)
      if (data.length > 0) {
        setSelectedPatientId(data[0].id)
        fetchRecordsByPatient(data[0].id)
      }
    })
    citasService.getAll().then((data) => {
      setAppointments(data)
    })
  }, [fetchRecordsByPatient])

  const handlePatientChange = (patientId: number) => {
    setSelectedPatientId(patientId)
    fetchRecordsByPatient(patientId)
  }

  const openCreateModal = () => {
    // Find eligible appointments for this patient
    const patientAppts = appointments.filter((a) => a.patientId === selectedPatientId)
    const defaultAppt = patientAppts.length > 0 ? patientAppts[0] : null

    setFormData({
      appointmentId: defaultAppt ? defaultAppt.id : 0,
      professionalId: defaultAppt ? defaultAppt.professionalId : 1,
      attentionDate: new Date().toISOString().slice(0, 16),
      chiefComplaint: '',
      diagnosis: '',
      treatmentPlan: '',
      clinicalNotes: '',
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSaving(true)

    if (!formData.appointmentId) {
      setFormError('Debe seleccionar una cita válida para registrar la atención.')
      setIsSaving(false)
      return
    }

    try {
      const payload: ClinicalRecordRequest = {
        appointmentId: Number(formData.appointmentId),
        patientId: selectedPatientId,
        professionalId: Number(formData.professionalId),
        attentionDate: `${formData.attentionDate}:00`,
        chiefComplaint: formData.chiefComplaint,
        diagnosis: formData.diagnosis || undefined,
        treatmentPlan: formData.treatmentPlan || undefined,
        clinicalNotes: formData.clinicalNotes,
      }
      await createRecord(payload)
      setShowModal(false)
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar atención médica')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)
  const patientAppointments = appointments.filter((a) => a.patientId === selectedPatientId)

  return (
    <div className="py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Historial Clínico Odontológico</h1>
          <p className="text-muted mb-0">Evolución de tratamientos, diagnósticos y notas por paciente.</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={!selectedPatientId}
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          <span>🩺</span> Registrar Nueva Atención
        </button>
      </div>

      {/* Selector de Paciente */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-3">
              <label className="fw-semibold text-secondary mb-0">Seleccionar Paciente:</label>
            </div>
            <div className="col-12 col-md-6">
              <select
                className="form-select form-select-lg"
                value={selectedPatientId}
                onChange={(e) => handlePatientChange(Number(e.target.value))}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — {p.documentType}: {p.documentNumber}
                  </option>
                ))}
              </select>
            </div>
            {selectedPatient && (
              <div className="col-12 col-md-3 text-md-end text-muted small">
                Edad / F.Nac: <strong>{selectedPatient.birthDate}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Lista de Atenciones */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h2 className="h5 fw-bold mb-0 text-dark">
            Expediente de {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Paciente'}
          </h2>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
            {records.length} atención(es) registrada(s)
          </span>
        </div>
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted mt-2 mb-0">Cargando historial clínico...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div className="fs-1 mb-2">📋</div>
              <p className="mb-0">No se encontraron atenciones registradas para este paciente.</p>
              <small>Haga clic en "Registrar Nueva Atención" para crear la primera ficha clínica.</small>
            </div>
          ) : (
            <div className="d-flex flex-column gap-4">
              {records.map((rec) => (
                <div key={rec.id} className="card border rounded-3 shadow-none bg-light-subtle">
                  <div className="card-body p-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3 pb-2 border-bottom">
                      <div>
                        <span className="badge bg-primary me-2">Atención #{rec.id}</span>
                        <strong className="text-dark">
                          📅 {new Date(rec.attentionDate).toLocaleString('es-PE')}
                        </strong>
                      </div>
                      <div className="text-muted small">
                        Cita #{rec.appointmentId} • Odontólogo ID #{rec.professionalId}
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="fw-semibold text-secondary small d-block mb-1">
                          Motivo Principal de Consulta:
                        </label>
                        <p className="text-dark bg-white p-2 rounded border small mb-0">
                          {rec.chiefComplaint}
                        </p>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="fw-semibold text-secondary small d-block mb-1">
                          Diagnóstico:
                        </label>
                        <p className="text-dark bg-white p-2 rounded border small mb-0">
                          {rec.diagnosis || 'No especificado'}
                        </p>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="fw-semibold text-secondary small d-block mb-1">
                          Plan de Tratamiento / Procedimiento:
                        </label>
                        <p className="text-dark bg-white p-2 rounded border small mb-0">
                          {rec.treatmentPlan || 'No especificado'}
                        </p>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="fw-semibold text-secondary small d-block mb-1">
                          Notas Clínicas y Evolución:
                        </label>
                        <p className="text-dark bg-white p-2 rounded border small mb-0">
                          {rec.clinicalNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Registrar Atención */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Registrar Atención Clínica</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger small py-2">{formError}</div>}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Cita Asociada *</label>
                      {patientAppointments.length > 0 ? (
                        <select
                          className="form-select"
                          required
                          value={formData.appointmentId}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            const appt = appointments.find((a) => a.id === val)
                            setFormData({
                              ...formData,
                              appointmentId: val,
                              professionalId: appt ? appt.professionalId : formData.professionalId,
                            })
                          }}
                        >
                          {patientAppointments.map((a) => (
                            <option key={a.id} value={a.id}>
                              Cita #{a.id} - {new Date(a.scheduledStart).toLocaleDateString('es-PE')} (
                              {a.status})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          className="form-control"
                          placeholder="ID de cita"
                          required
                          value={formData.appointmentId || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, appointmentId: Number(e.target.value) })
                          }
                        />
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Fecha y Hora de Atención *</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        required
                        value={formData.attentionDate}
                        onChange={(e) => setFormData({ ...formData, attentionDate: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Motivo de Consulta *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="Ej. Dolor agudo en molar inferior derecho, sangrado de encías..."
                        value={formData.chiefComplaint}
                        onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Diagnóstico</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Ej. Pulpitis irreversible en pieza 4.6..."
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Plan de Tratamiento</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Ej. Endodoncia birradicular, colocación de corona de porcelana..."
                        value={formData.treatmentPlan}
                        onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Notas Clínicas y Observaciones *</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        required
                        placeholder="Detalle del procedimiento realizado y recetas médicas emitidas..."
                        value={formData.clinicalNotes}
                        onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} className="btn btn-primary">
                    {isSaving ? 'Guardando...' : 'Guardar Atención Clínica'}
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
