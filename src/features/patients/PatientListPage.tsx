import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Patient } from '../../types/models'
import { UserPlus, Search, Edit2, FileText, Phone, Mail, Calendar } from 'lucide-react'

export const PatientListPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const queryParam = searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ''
      const res = await fetch(`/api/v1/patients${queryParam}`)
      const data = await res.json()
      setPatients(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [searchTerm])

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Directorio de Pacientes</h3>
          <p className="text-muted small mb-0">Gestión de expedientes clínicos y datos de contacto</p>
        </div>
        <Link to="/pacientes/nuevo" className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
          <UserPlus size={18} />
          <span>Nuevo Paciente</span>
        </Link>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0 text-muted">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Buscar por DNI, nombres, apellidos o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Documento</th>
                  <th>Paciente</th>
                  <th>Contacto</th>
                  <th>Fecha Nacimiento</th>
                  <th>Estado</th>
                  <th className="text-end pe-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                      Cargando pacientes desde Supabase...
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No se encontraron pacientes registrados.
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <tr key={p.id}>
                      <td className="ps-4 font-monospace fw-semibold text-secondary">
                        <span className="badge bg-light text-dark border me-1">{p.documentType}</span>
                        {p.documentNumber}
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{p.firstName} {p.lastName}</div>
                        <div className="extra-small text-muted">{p.address || 'Sin dirección registrada'}</div>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1 extra-small">
                          {p.phone && (
                            <span className="d-flex align-items-center gap-1 text-muted">
                              <Phone size={12} /> {p.phone}
                            </span>
                          )}
                          {p.email && (
                            <span className="d-flex align-items-center gap-1 text-muted">
                              <Mail size={12} /> {p.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="small text-muted">
                        <span className="d-flex align-items-center gap-1">
                          <Calendar size={13} /> {p.birthDate || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                          {p.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="btn-group btn-group-sm">
                          <Link
                            to={`/historias?patientId=${p.id}`}
                            className="btn btn-outline-primary"
                            title="Ver Historia Clínica"
                          >
                            <FileText size={15} />
                          </Link>
                          <Link
                            to={`/pacientes/${p.id}/editar`}
                            className="btn btn-outline-secondary"
                            title="Editar Datos"
                          >
                            <Edit2 size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
