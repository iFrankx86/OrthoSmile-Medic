import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, UserCheck } from 'lucide-react'

export const PatientFormPage: React.FC = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentType: 'DNI',
    documentNumber: '',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/v1/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        navigate('/pacientes')
      } else {
        alert('Error al guardar el paciente. Verifique los datos.')
      }
    } catch (e) {
      alert('Error de conexión con el servidor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <button onClick={() => navigate('/pacientes')} className="btn btn-outline-secondary btn-sm mb-3 d-flex align-items-center gap-1">
        <ArrowLeft size={16} /> Volver a Pacientes
      </button>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom py-3">
          <h4 className="fw-bold text-dark mb-0">Registrar Nuevo Paciente</h4>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Nombres *</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Ej: Carlos Alberto"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Apellidos *</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Ej: Mendoza Quispe"
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label small fw-semibold text-secondary">Tipo de Documento</label>
                <select name="documentType" className="form-select" value={formData.documentType} onChange={handleChange}>
                  <option value="DNI">DNI (Perú)</option>
                  <option value="PASSPORT">Pasaporte</option>
                  <option value="OTHER">Otro Documento</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold text-secondary">Número de Documento *</label>
                <input
                  type="text"
                  name="documentNumber"
                  className="form-control"
                  required
                  value={formData.documentNumber}
                  onChange={handleChange}
                  placeholder="8 dígitos"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold text-secondary">Fecha de Nacimiento</label>
                <input
                  type="date"
                  name="birthDate"
                  className="form-control"
                  value={formData.birthDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+51 987 654 321"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="paciente@correo.com"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">Dirección Domiciliaria</label>
              <textarea
                name="address"
                className="form-control"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                placeholder="Av. Principal 123, Urb. Los Olivos..."
              ></textarea>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" onClick={() => navigate('/pacientes')} className="btn btn-light border px-4">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary px-4 d-flex align-items-center gap-2 shadow-sm" disabled={isSubmitting}>
                <Save size={18} />
                {isSubmitting ? 'Guardando en Supabase...' : 'Guardar Paciente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
