import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
	{ to: '/', label: 'Dashboard' },
	{ to: '/patients', label: 'Pacientes' },
	{ to: '/appointments', label: 'Citas' },
	{ to: '/clinical-history', label: 'Historial' },
	{ to: '/payments', label: 'Pagos' },
]

export function DesktopLayout() {
	return (
		<div className="app-shell">
			<nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
				<div className="container-fluid">
					<span className="navbar-brand fw-semibold">Orthosmille Medic</span>
					<div className="navbar-nav gap-1">
						{navItems.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								end={item.to === '/'}
								className={({ isActive }) =>
									`nav-link px-3 rounded ${isActive ? 'active fw-semibold text-primary' : ''}`
								}
							>
								{item.label}
							</NavLink>
						))}
					</div>
				</div>
			</nav>

			<main className="app-content container-fluid">
				<Outlet />
			</main>
		</div>
	)
}

