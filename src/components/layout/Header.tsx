import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { LogOut, Menu, Activity, Shield, Stethoscope, UserCheck, FileText, Bell } from 'lucide-react'

interface HeaderProps {
  onToggleMobileSidebar?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth()
  const { unreadCount, setIsOpen } = useNotifications()

  const getRolePresentation = (role?: string) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return {
          title: 'Administrador General',
          tag: 'Dirección Médica',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: Shield,
        }
      case 'ODONTOLOGO':
        return {
          title: 'Dr. Manuel Gustavo Chavez Sevillano',
          tag: 'Orthodontist, MSc, PhD',
          color: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: Stethoscope,
        }
      case 'RECEPCIONISTA':
        return {
          title: 'Recepción & Triaje',
          tag: 'Atención al Paciente',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: UserCheck,
        }
      default:
        return {
          title: user?.username || 'Usuario',
          tag: role || 'Personal',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Shield,
        }
    }
  }

  const roleInfo = getRolePresentation(user?.role)
  const RoleIcon = roleInfo.icon

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Abrir menú de navegación"
          >
            <Menu size={20} />
          </button>

          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Activity size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900 font-sans">
                  OrthoSmile Medic
                </span>
              </div>
              <p className="text-[11px] text-slate-600 hidden sm:block leading-none">
                Sistema Integral de Gestión Odontológica
              </p>
            </div>
          </a>
        </div>

        {/* Center: Clinic Location / Context */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 border border-slate-200/80 rounded-full px-3 py-1 bg-slate-50/80">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-800">Sede Principal San Isidro</span>
          <span className="text-slate-300">·</span>
          <span>Lima, Perú</span>
        </div>

        {/* Right: Active Profile, Technical Report (Solo Admin) & Signout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user?.role === 'ADMINISTRADOR' && (
            <Link
              to="/informe"
              className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 px-2.5 py-1.5 rounded-lg transition-all shadow-2xs"
              title="Ver y descargar Informe Técnico Oficial (Solo Administrador)"
            >
              <FileText size={15} className="text-sky-600" />
              <span className="hidden sm:inline">Informe Técnico</span>
            </Link>
          )}

          {/* Alert & Notification Bell Icon Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500"
            title="Panel de Alertas: Citas próximas y cobros pendientes"
            aria-label="Ver notificaciones y alertas clínicas"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-white text-[9px] font-extrabold items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </button>

          <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'OS'}
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {roleInfo.title}
              </div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded border ${roleInfo.color}`}>
                  <RoleIcon size={10} />
                  {roleInfo.tag}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/60 px-2.5 py-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
            title="Cerrar Sesión Segura"
            aria-label="Cerrar sesión"
          >
            <LogOut size={15} />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  )
}
