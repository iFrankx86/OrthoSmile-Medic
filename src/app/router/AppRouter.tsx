import { Navigate, Route, Routes } from 'react-router-dom'
import { DesktopLayout } from '/src/app/layouts/DesktopLayout'
import { LoginPage } from '/src/features/auth/pages/LoginPage'
import { PatientsPage } from '/src/features/patients/pages/PatientsPage'
import { PatientDetailPage } from '/src/features/patients/pages/PatientDetailPage'

function DashboardPage() {
	return (
		<div className="card page-card">
			<div className="card-body">
				<h1 className="h4 mb-2">Dashboard</h1>
				<p className="text-muted mb-0">Panel inicial de gestión clínica odontológica.</p>
			</div>
		</div>
	)
}

function PlaceholderPage({ title }: { title: string }) {
	return (
		<div className="card page-card">
			<div className="card-body">
				<h1 className="h4 mb-2">{title}</h1>
				<p className="text-muted mb-0">Módulo en construcción en esta fase.</p>
			</div>
		</div>
	)
}

export function AppRouter() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />

			<Route element={<DesktopLayout />}>
				<Route path="/" element={<DashboardPage />} />
				<Route path="/patients" element={<PatientsPage />} />
				<Route path="/patients/:id" element={<PatientDetailPage />} />
				<Route path="/appointments" element={<PlaceholderPage title="Citas" />} />
				<Route path="/clinical-history" element={<PlaceholderPage title="Historial clínico" />} />
				<Route path="/payments" element={<PlaceholderPage title="Pagos" />} />
			</Route>

			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	)
}

