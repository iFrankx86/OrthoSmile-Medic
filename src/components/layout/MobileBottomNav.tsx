import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Users,
  Calendar,
  Smile,
  FileText,
  Menu,
  CreditCard,
  UserCheck,
  Database,
  LogOut,
  X,
  ChevronRight,
  Shield,
  Stethoscope,
  FileDown,
} from 'lucide-react'

export const MobileBottomNav: React.FC = () => {
  const { user, logout, hasRole } = useAuth()
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const navigate = useNavigate()

  const primaryTabs = [
    { to: '/pacientes', icon: Users, label: 'Pacientes' },
    { to: '/citas', icon: Calendar, label: 'Citas' },
    { to: '/odontograma', icon: Smile, label: 'Odontograma' },
    { to: '/historias', icon: FileText, label: 'Historias' },
  ]

  const secondaryItems = [
    {
      to: '/pagos',
      icon: CreditCard,
      label: 'Caja y Pagos',
      desc: 'Cobros, recibos e ingresos',
      roles: ['ADMINISTRADOR', 'RECEPCIONISTA'],
    },
    {
      to: '/profesionales',
      icon: UserCheck,
      label: 'Profesionales',
      desc: 'Directorio odontológico y licencias',
      roles: ['ADMINISTRADOR'],
    },
    {
      to: '/database',
      icon: Database,
      label: 'Base de Datos Firebase',
      desc: 'Colecciones e inspección de datos',
      roles: ['ADMINISTRADOR'],
    },
  ]

  return (
    <>
      {/* Fixed Bottom Navigation Bar (Thumb Zone) */}
      <nav
        aria-label="Navegación Móvil Inferior"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 lg:hidden shadow-lg safe-area-pb"
      >
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center h-full min-h-[44px] py-1 transition-colors select-none ${
                    isActive
                      ? 'text-sky-600 font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon size={20} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
                      {isActive && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-600" />
                      )}
                    </div>
                    <span className="text-[10px] tracking-tight mt-1 truncate max-w-[58px]">
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            )
          })}

          {/* More / Menu Trigger */}
          <button
            type="button"
            onClick={() => setMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] py-1 transition-colors select-none ${
              moreMenuOpen ? 'text-sky-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Abrir más opciones"
          >
            <Menu size={20} className={moreMenuOpen ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[10px] tracking-tight mt-1 truncate">Más</span>
          </button>
        </div>
      </nav>

      {/* Bottom Sheet Drawer for "Más" */}
      {moreMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMoreMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl p-5 max-w-lg mx-auto w-full max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />

            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                  {user?.username ? user.username.slice(0, 2).toUpperCase() : 'OS'}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 m-0">
                    {user?.fullName || user?.username}
                  </h4>
                  <p className="text-xs text-slate-500 m-0 capitalize">
                    {user?.role?.toLowerCase() || 'Usuario'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Secondary navigation items */}
            <div className="space-y-2 mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Herramientas Clínicas
              </span>

              {secondaryItems.map((item) => {
                if (!hasRole(item.roles as any)) return null
                const Icon = item.icon
                return (
                  <button
                    key={item.to}
                    onClick={() => {
                      setMoreMenuOpen(false)
                      navigate(item.to)
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 active:bg-slate-200/70 border border-slate-200/60 text-left transition-colors min-h-[48px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-sky-600 shadow-xs">
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-800">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                )
              })}

              {/* Technical Report Action (Solo Administrador) */}
              {hasRole(['ADMINISTRADOR']) && (
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false)
                    navigate('/informe')
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-sky-50/80 hover:bg-sky-100 active:bg-sky-200 border border-sky-200 text-left transition-colors min-h-[48px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-sky-300 flex items-center justify-center text-sky-700 shadow-xs">
                      <FileDown size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-sky-900">Informe Técnico Oficial</div>
                      <div className="text-xs text-sky-600">Ver en pantalla y descargar Word (.docx)</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-200">
                    DOCX
                  </span>
                </button>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                setMoreMenuOpen(false)
                logout()
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-sm border border-rose-200/80 transition-colors min-h-[48px] active:scale-[0.99]"
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
