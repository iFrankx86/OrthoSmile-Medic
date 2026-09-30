import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginPage } from './features/auth/LoginPage'
import { MainLayout } from './components/layout/MainLayout'
import { PatientListPage } from './features/patients/PatientListPage'
import { PatientFormPage } from './features/patients/PatientFormPage'
import { AppointmentListPage } from './features/appointments/AppointmentListPage'
import { ClinicalHistoryPage } from './features/clinical/ClinicalHistoryPage'
import { OdontogramPage } from './features/clinical/OdontogramPage'
import { PaymentListPage } from './features/payments/PaymentListPage'
import { ProfessionalListPage } from './features/professionals/ProfessionalListPage'
import { DatabaseViewerPage } from './features/database/DatabaseViewerPage'
import { TechnicalReportPage } from './features/report/TechnicalReportPage'

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/pacientes" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/pacientes" replace />} />
            <Route path="pacientes" element={<PatientListPage />} />
            <Route path="pacientes/nuevo" element={<PatientFormPage />} />
            <Route path="pacientes/:id/editar" element={<PatientFormPage />} />
            <Route path="citas" element={<AppointmentListPage />} />
            <Route path="historias" element={<ClinicalHistoryPage />} />
            <Route path="odontograma" element={<OdontogramPage />} />
            <Route path="pagos" element={<PaymentListPage />} />
            <Route path="payments" element={<Navigate to="/pagos" replace />} />
            <Route path="caja" element={<Navigate to="/pagos" replace />} />
            <Route path="cobros" element={<Navigate to="/pagos" replace />} />
            <Route path="cobrar" element={<Navigate to="/pagos" replace />} />
            <Route path="profesionales" element={<ProfessionalListPage />} />
            <Route path="database" element={<DatabaseViewerPage />} />
            <Route
              path="informe"
              element={
                <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                  <TechnicalReportPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
