import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'

const navItems = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/patients', label: '👥 Pacientes' },
  { to: '/appointments', label: '📅 Citas' },
  { to: '/clinical-history', label: '🩺 Historial Clínico' },
  { to: '/payments', label: '💳 Pagos y Caja' },
]

export function DesktopLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top py-2">
        <div className="container-fluid px-3 px-md-4">
          <NavLink to="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold text-primary">
            <span className="fs-4">🦷</span>
            <span>Orthosmille Medic</span>
          </NavLink>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
              {navItems.map((item) => (
                <li key={item.to} className="nav-item">
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `nav-link px-3 py-2 rounded-3 fw-medium ${
                        isActive ? 'active bg-primary text-white' : 'text-secondary hover-bg-light'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center gap-3">
              {user ? (
                <div className="d-flex align-items-center gap-2">
                  <div className="text-end d-none d-sm-block">
                    <span className="d-block fw-semibold text-dark small">{user.username}</span>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle extra-small">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                    title="Cerrar sesión"
                  >
                    <span>🚪</span> Salir
                  </button>
                </div>
              ) : (
                <NavLink to="/login" className="btn btn-primary btn-sm">
                  Iniciar Sesión
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow-1 container-fluid px-3 px-md-4 py-3">
        <Outlet />
      </main>

      <footer className="bg-white border-top py-3 text-center text-muted small mt-auto">
        <div className="container-fluid">
          Orthosmille Medic &copy; 2026 • Sistema de Servicios Cloud y Gestión Odontológica
        </div>
      </footer>
    </div>
  )
}
