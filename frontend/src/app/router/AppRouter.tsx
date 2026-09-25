import { Navigate, Route, Routes } from 'react-router-dom'
import { DesktopLayout } from '../layouts/DesktopLayout'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { DashboardPage } from '../../features/dashboard/DashboardPage'
import { PacientesPage } from '../../features/pacientes/pages/PacientesPage'
import { PatientDetailPage } from '../../features/pacientes/pages/PatientDetailPage'
import { CitasPage } from '../../features/citas/pages/CitasPage'
import { HistorialClinicoPage } from '../../features/historial-clinico/pages/HistorialClinicoPage'
import { PagosPage } from '../../features/pagos/pages/PagosPage'
import { useAuth } from '../../features/auth/hooks/useAuth'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DesktopLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/patients" element={<PacientesPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
        <Route path="/appointments" element={<CitasPage />} />
        <Route path="/clinical-history" element={<HistorialClinicoPage />} />
        <Route path="/payments" element={<PagosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
