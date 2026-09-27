import React, { useState, useEffect } from 'react'
import { Professional } from '../../types/models'
import { UserCheck, Award, Phone, Shield } from 'lucide-react'

export const ProfessionalListPage: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/professionals')
      .then((r) => r.json())
      .then((data) => setProfessionals(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Cuerpo Médico Odontológico</h3>
          <p className="text-muted small mb-0">Especialistas registrados en la clínica</p>
        </div>
      </div>

      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5 text-muted">
            <div className="spinner-border spinner-border-sm me-2"></div>
            Cargando especialistas...
          </div>
        ) : (
          professionals.map((prof) => (
            <div key={prof.id} className="col-md-6 col-lg-4">
              <div className="card shadow-sm border-0 h-100 p-3">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                      <UserCheck size={28} />
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark mb-0">Dr. {prof.firstName} {prof.lastName}</h5>
                      <span className="badge bg-primary text-white extra-small mt-1">{prof.specialty}</span>
                    </div>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex flex-column gap-2 small text-muted mt-3">
                    <div className="d-flex align-items-center gap-2">
                      <Award size={16} className="text-warning" />
                      <span>Colegiatura: <strong className="text-dark">{prof.licenseNumber}</strong></span>
                    </div>
                    {prof.phone && (
                      <div className="d-flex align-items-center gap-2">
                        <Phone size={16} className="text-success" />
                        <span>Contacto: {prof.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
