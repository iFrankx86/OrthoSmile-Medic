import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DesktopLayout } from '../layouts/DesktopLayout'
import { LoginPage } from '../../features/auth/LoginPage'
import { DashboardPage } from '../../features/dashboard/DashboardPage'
import { PatientsPage } from '../../features/patients/PatientsPage'
import { AppointmentsPage } from '../../features/appointments/AppointmentsPage'
import { ClinicalHistoryPage } from '../../features/clinical/ClinicalHistoryPage'
import { PaymentsPage } from '../../features/payments/PaymentsPage'
import { ProfessionalsPage } from '../../features/professionals/ProfessionalsPage'
import { AuditPage } from '../../features/audit/AuditPage'
import { useAuth } from '../providers/AppProviders'

import { UserRole } from '../../types'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[]
  children: React.ReactNode
}) {
  const { user, hasRole } = useAuth()
  if (!user || !hasRole(...allowedRoles)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DesktopLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="clinical-history" element={<ClinicalHistoryPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route
            path="professionals"
            element={
              <RoleGuard allowedRoles={['ADMINISTRADOR', 'ODONTOLOGO']}>
                <ProfessionalsPage />
              </RoleGuard>
            }
          />
          <Route
            path="audit"
            element={
              <RoleGuard allowedRoles={['ADMINISTRADOR', 'ODONTOLOGO']}>
                <AuditPage />
              </RoleGuard>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
