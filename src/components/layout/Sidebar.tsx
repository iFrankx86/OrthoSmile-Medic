import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  Users, 
  Calendar, 
  FileText, 
  CreditCard, 
  UserCheck, 
  Database,
  Smile
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const { hasRole } = useAuth()

  const navItems = [
    {
      to: '/pacientes',
      icon: Users,
      label: 'Pacientes',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'ODONTOLOGO'],
    },
    {
      to: '/citas',
      icon: Calendar,
      label: 'Agenda de Citas',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'ODONTOLOGO'],
    },
    {
      to: '/historias',
      icon: FileText,
      label: 'Historias Clínicas',
      roles: ['ADMINISTRADOR', 'ODONTOLOGO'],
    },
    {
      to: '/odontograma',
      icon: Smile,
      label: 'Odontograma Dental',
      roles: ['ADMINISTRADOR', 'ODONTOLOGO'],
    },
    {
      to: '/pagos',
      icon: CreditCard,
      label: 'Caja y Pagos',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA'],
    },
    {
      to: '/profesionales',
      icon: UserCheck,
      label: 'Profesionales',
      roles: ['ADMINISTRADOR'],
    },
    {
      to: '/database',
      icon: Database,
      label: 'Base de Datos (Supabase)',
      roles: ['ADMINISTRADOR'],
    },
  ]

  return (
    <aside className="bg-white border-end shadow-sm" style={{ width: '250px', minHeight: 'calc(100vh - 56px)' }}>
      <div className="p-3">
        <div className="text-uppercase fw-bold text-muted extra-small px-3 mb-2" style={{ fontSize: '0.75rem' }}>
          Gestión Clínica
        </div>
        <ul className="nav nav-pills flex-column gap-1">
          {navItems.map((item) => {
            if (!hasRole(item.roles as any)) return null
            const Icon = item.icon
            return (
              <li className="nav-item" key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center gap-2 py-2 px-3 rounded-2 fw-medium ${
                      isActive ? 'active bg-primary text-white shadow-sm' : 'text-secondary hover-bg-light'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
