import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { LogOut, User, ShieldCheck } from 'lucide-react'

export const Header: React.FC = () => {
  const { user, logout } = useAuth()

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return <span className="badge bg-danger">Administrador</span>
      case 'ODONTOLOGO':
        return <span className="badge bg-primary">Odontólogo / Dr. Gustavo Chávez</span>
      case 'RECEPCIONISTA':
        return <span className="badge bg-success">Asistente Dental</span>
      default:
        return <span className="badge bg-secondary">{role}</span>
    }
  }

  return (
    <header className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top px-3 py-2 shadow-sm">
      <div className="container-fluid">
        <div className="d-flex align-items-center gap-2">
          <span className="fs-5 fw-bold text-primary">OrthoSmile</span>
          <span className="badge bg-light text-dark border">Medic v1.0</span>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle d-none d-md-inline">
            Dr. Gustavo Chávez
          </span>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-light p-2 rounded-circle border text-muted">
              <User size={18} />
            </div>
            <div className="d-none d-sm-block text-end">
              <div className="fw-semibold text-dark small">{user?.username}</div>
              <div className="extra-small">{getRoleBadge(user?.role)}</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 shadow-sm"
            title="Cerrar Sesión"
          >
            <LogOut size={16} />
            <span className="d-none d-md-inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  )
}
