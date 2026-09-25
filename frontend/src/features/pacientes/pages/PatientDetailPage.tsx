import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { pacienteService } from '../services/pacienteService'
import { PatientResponse } from '../types/paciente.types'
import { apiClient } from '../../../infrastructure/api/apiClient'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [patient, setPatient] = useState<PatientResponse | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [clinicalRecords, setClinicalRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const loadData = async () => {
      setLoading(true)
      try {
        const [patData, apptData, recData] = await Promise.all([
          pacienteService.getById(Number(id)),
          apiClient.get('/appointments').then((res) => res.data.filter((a: any) => a.patientId === Number(id))),
          apiClient.get(`/clinical-history/patients/${id}`).then((res) => res.data),
        ])
        setPatient(patData)
        setAppointments(apptData)
        setClinicalRecords(recData)
      } catch (err: any) {
        setError(err.message || 'Error al cargar expediente del paciente')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted mt-2">Cargando expediente clínico...</p>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="py-5 text-center">
        <div className="alert alert-danger d-inline-block px-4">{error || 'Paciente no encontrado'}</div>
        <div className="mt-3">
          <Link to="/patients" className="btn btn-outline-primary">
            ← Volver a Pacientes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4">
      {/* Breadcrumb */}
      <div className="mb-3">
        <Link to="/patients" className="text-decoration-none text-muted small">
          ← Volver a Directorio de Pacientes
        </Link>
      </div>

      {/* Patient Header Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle fs-3 fw-bold"
                style={{ width: 64, height: 64 }}
              >
                {patient.firstName.charAt(0)}
                {patient.lastName.charAt(0)}
              </div>
              <div>
                <h1 className="h3 fw-bold text-dark mb-1">
                  {patient.firstName} {patient.lastName}
                </h1>
                <div className="d-flex flex-wrap gap-2 align-items-center text-muted small">
                  <span className="badge bg-light text-dark border">
                    {patient.documentType}: {patient.documentNumber}
                  </span>
                  <span>• Nacimiento: {patient.birthDate}</span>
                  <span>• Estado: {patient.active ? '🟢 Activo' : '🔴 Inactivo'}</span>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2">
              <Link to="/appointments" className="btn btn-primary d-flex align-items-center gap-1">
                <span>📅</span> Agendar Cita
              </Link>
            </div>
          </div>

          <hr className="my-3" />

          <div className="row g-3 text-secondary small">
            <div className="col-12 col-md-4">
              <strong>📞 Teléfono:</strong> {patient.phone || 'No registrado'}
            </div>
            <div className="col-12 col-md-4">
              <strong>✉️ Correo:</strong> {patient.email || 'No registrado'}
            </div>
            <div className="col-12 col-md-4">
              <strong>📍 Dirección:</strong> {patient.address || 'No registrada'}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Historial Clínico Column */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h2 className="h5 fw-bold mb-0 text-dark">🩺 Historial de Atenciones Clínicas</h2>
              <span className="badge bg-primary rounded-pill">{clinicalRecords.length}</span>
            </div>
            <div className="card-body">
              {clinicalRecords.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  No hay atenciones clínicas registradas para este paciente.
                </div>
              ) : (
                <div className="timeline">
                  {clinicalRecords.map((rec) => (
                    <div key={rec.id} className="border-start border-3 border-primary ps-3 pb-4 mb-3 position-relative">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong className="text-primary">
                          {rec.attentionDate ? new Date(rec.attentionDate).toLocaleDateString('es-PE') : 'Fecha no especificada'}
                        </strong>
                        <span className="badge bg-secondary-subtle text-secondary">
                          Atendido por: Dr(a). #{rec.professionalId}
                        </span>
                      </div>
                      <div className="mb-2">
                        <strong className="text-dark d-block">Motivo de consulta:</strong>
                        <p className="text-secondary mb-1">{rec.chiefComplaint}</p>
                      </div>
                      {rec.diagnosis && (
                        <div className="mb-2">
                          <strong className="text-dark d-block">Diagnóstico:</strong>
                          <p className="text-secondary mb-1">{rec.diagnosis}</p>
                        </div>
                      )}
                      {rec.treatmentPlan && (
                        <div className="mb-2">
                          <strong className="text-dark d-block">Plan de tratamiento:</strong>
                          <p className="text-secondary mb-1">{rec.treatmentPlan}</p>
                        </div>
                      )}
                      <div>
                        <strong className="text-dark d-block">Notas clínicas:</strong>
                        <p className="text-muted mb-0 small">{rec.clinicalNotes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Citas Asociadas Column */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h2 className="h5 fw-bold mb-0 text-dark">📅 Citas del Paciente</h2>
              <span className="badge bg-secondary rounded-pill">{appointments.length}</span>
            </div>
            <div className="card-body">
              {appointments.length === 0 ? (
                <div className="text-center py-4 text-muted">No tiene citas registradas.</div>
              ) : (
                <div className="list-group list-group-flush">
                  {appointments.map((a) => (
                    <div key={a.id} className="list-group-item px-0 py-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-semibold text-dark">
                          {new Date(a.scheduledStart).toLocaleDateString('es-PE', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
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
                      </div>
                      <p className="text-muted small mb-1">{a.reason || 'Sin motivo especificado'}</p>
                      {a.notes && <small className="text-secondary italic">Nota: {a.notes}</small>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
