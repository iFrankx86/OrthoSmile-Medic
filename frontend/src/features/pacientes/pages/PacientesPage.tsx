import { useState, useTransition } from 'react'
import { Link } from 'react-router-dom'
import { usePacientes } from '../hooks/usePacientes'
import { PatientRequest, PatientResponse, DocumentType } from '../types/paciente.types'

export function PacientesPage() {
  const {
    patients,
    loading,
    error,
    fetchPatients,
    createPatient,
    updatePatient,
    togglePatientStatus,
  } = usePacientes()

  const [search, setSearch] = useState('')
  const [, startTransition] = useTransition()

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientResponse | null>(null)
  const [formData, setFormData] = useState<PatientRequest>({
    firstName: '',
    lastName: '',
    documentType: 'DNI',
    documentNumber: '',
    birthDate: '1990-01-01',
    email: '',
    phone: '',
    address: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    startTransition(() => {
      fetchPatients(val)
    })
  }

  const openCreateModal = () => {
    setEditingPatient(null)
    setFormData({
      firstName: '',
      lastName: '',
      documentType: 'DNI',
      documentNumber: '',
      birthDate: '1995-01-01',
      email: '',
      phone: '',
      address: '',
    })
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (patient: PatientResponse) => {
    setEditingPatient(patient)
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      documentType: patient.documentType,
      documentNumber: patient.documentNumber,
      birthDate: patient.birthDate,
      email: patient.email || '',
      phone: patient.phone || '',
      address: patient.address || '',
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSaving(true)
    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, formData)
      } else {
        await createPatient(formData)
      }
      setShowModal(false)
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar paciente')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Directorio de Pacientes</h1>
          <p className="text-muted mb-0">Gestión de expedientes clínicos, información de contacto y altas.</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary d-flex align-items-center gap-2">
          <span>➕</span> Nuevo Paciente
        </button>
      </div>

      {/* Search and Filters Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">🔍</span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Buscar por nombre, apellido o número de documento..."
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <div className="col-12 col-md-6 text-md-end text-muted small">
              Total registrados: <strong className="text-dark">{patients.length}</strong> paciente(s)
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Patients Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Paciente</th>
                <th>Documento</th>
                <th>Contacto</th>
                <th>Fecha Nac.</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="text-muted mt-2 mb-0">Cargando pacientes...</p>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No se encontraron pacientes registrados.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="fw-semibold text-dark">
                        {p.firstName} {p.lastName}
                      </div>
                      <small className="text-muted">{p.address || 'Sin dirección registrada'}</small>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border me-1">{p.documentType}</span>
                      <span className="fw-medium">{p.documentNumber}</span>
                    </td>
                    <td>
                      <div>{p.phone || <span className="text-muted">—</span>}</div>
                      <small className="text-muted">{p.email || '—'}</small>
                    </td>
                    <td>{p.birthDate}</td>
                    <td>
                      {p.active ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          Activo
                        </span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <Link to={`/patients/${p.id}`} className="btn btn-outline-primary" title="Ver Expediente">
                          Expediente
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => openEditModal(p)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className={`btn ${p.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => togglePatientStatus(p.id, p.active)}
                          title={p.active ? 'Desactivar' : 'Activar'}
                        >
                          {p.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingPatient ? 'Editar Paciente' : 'Nuevo Paciente'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger small py-2">{formError}</div>}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Nombres *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Apellidos *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Tipo Documento *</label>
                      <select
                        className="form-select"
                        value={formData.documentType}
                        onChange={(e) =>
                          setFormData({ ...formData, documentType: e.target.value as DocumentType })
                        }
                      >
                        <option value="DNI">DNI</option>
                        <option value="PASSPORT">Pasaporte</option>
                        <option value="OTHER">Otro</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Número de Documento *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.documentNumber}
                        onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Fecha de Nacimiento *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Teléfono</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="+51 999 999 999"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Correo Electrónico</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="paciente@correo.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Dirección</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Av. Principal 123, Distrito"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} className="btn btn-primary">
                    {isSaving ? 'Guardando...' : 'Guardar Paciente'}
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
