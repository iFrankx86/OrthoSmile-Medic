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
  Smile,
  X,
  ChevronRight,
} from 'lucide-react'

interface SidebarProps {
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { hasRole } = useAuth()

  const navItems = [
    {
      to: '/pacientes',
      icon: Users,
      label: 'Pacientes',
      badge: 'Directorio',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'ODONTOLOGO'],
    },
    {
      to: '/citas',
      icon: Calendar,
      label: 'Agenda de Citas',
      badge: 'Hoy',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'ODONTOLOGO'],
    },
    {
      to: '/historias',
      icon: FileText,
      label: 'Historias Clínicas',
      badge: 'Evolución',
      roles: ['ADMINISTRADOR', 'ODONTOLOGO'],
    },
    {
      to: '/odontograma',
      icon: Smile,
      label: 'Odontograma Dental',
      badge: 'FDI 2D',
      roles: ['ADMINISTRADOR', 'ODONTOLOGO'],
    },
    {
      to: '/pagos',
      icon: CreditCard,
      label: 'Caja y Pagos',
      badge: 'Ingresos',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA'],
    },
    {
      to: '/profesionales',
      icon: UserCheck,
      label: 'Profesionales',
      badge: 'Equipo COP',
      roles: ['ADMINISTRADOR'],
    },
    {
      to: '/database',
      icon: Database,
      label: 'Base de Datos',
      badge: 'Firebase',
      roles: ['ADMINISTRADOR'],
    },
  ]

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col shrink-0 ${
        mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
      }`}
    >
      {/* Mobile Header with close button */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-100">
        <span className="font-semibold text-slate-800 text-sm">Menú de Navegación</span>
        <button
          onClick={onCloseMobile}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          aria-label="Cerrar menú"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Módulos Clínicos
          </div>
          <nav className="space-y-1" aria-label="Navegación principal">
            {navItems.map((item) => {
              if (!hasRole(item.roles as any)) return null
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-50 text-sky-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <Icon
                          size={18}
                          className={`transition-colors shrink-0 ${
                            isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            isActive
                              ? 'bg-sky-100/80 text-sky-800 font-semibold'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/60'
                          }`}
                        >
                          {item.badge}
                        </span>
                        <ChevronRight
                          size={13}
                          className={`transition-transform opacity-0 group-hover:opacity-100 ${
                            isActive ? 'opacity-100 text-sky-500' : 'text-slate-300'
                          }`}
                        />
                      </div>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Quick System Status Card in Sidebar */}
        <div className="px-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">Estado del Sistema</span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Operativo
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed m-0">
              Sincronización en tiempo real habilitada con Firebase Firestore.
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
