import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Calendar,
  Users,
  UserCheck,
  FileText,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Activity,
  Smile,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '../providers/AppProviders'
import { UserRole } from '../../types'

export function DesktopLayout() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/', label: 'Panel Principal', icon: LayoutDashboard },
    { to: '/patients', label: 'Pacientes', icon: Users },
    { to: '/appointments', label: 'Agenda de Citas', icon: Calendar },
    { to: '/clinical-history', label: 'Historial Clínico', icon: FileText },
    { to: '/payments', label: 'Caja y Pagos', icon: CreditCard },
    ...(!hasRole('RECEPCIONISTA')
      ? [{ to: '/professionals', label: 'Profesionales', icon: UserCheck }]
      : []),
    ...(hasRole('ADMINISTRADOR', 'ODONTOLOGO')
      ? [{ to: '/audit', label: 'Auditoría del Sistema', icon: ShieldCheck }]
      : []),
  ]

  // Primary bottom items on mobile (touch targets >= 48px)
  const mobileBottomItems = [
    { to: '/', label: 'Panel', icon: LayoutDashboard },
    { to: '/patients', label: 'Pacientes', icon: Users },
    { to: '/appointments', label: 'Citas', icon: Calendar },
    { to: '/clinical-history', label: 'Historial', icon: FileText },
    { to: '/payments', label: 'Caja', icon: CreditCard },
  ]

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'ODONTOLOGO':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'RECEPCIONISTA':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getRoleDisplayName = (role?: UserRole) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return 'Administrador'
      case 'ODONTOLOGO':
        return 'Doctor'
      case 'RECEPCIONISTA':
        return 'Recepcionista'
      default:
        return role || 'Usuario'
    }
  }

  const isCurrentRoute = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 antialiased overflow-x-hidden">
      {/* Mobile Slide-over Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Sidebar Drawer for Mobile & Persistent on Desktop */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-md">
              <Smile size={24} />
            </div>
            <div>
              <div className="font-bold text-base tracking-wide text-white">
                OrthoSmile
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Gestión Odontológica
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card inside Drawer */}
        <div className="p-4 mx-3 my-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Sesión Activa
          </div>
          <div className="font-bold text-sm text-white truncate">
            {user?.fullName || user?.username}
          </div>
          <div className="text-xs text-sky-400 font-medium">
            {getRoleDisplayName(user?.role)} {user?.role === 'RECEPCIONISTA' ? '' : '(Acceso Total)'}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Módulos del Sistema
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isCurrentRoute(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                  active
                    ? 'bg-sky-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Drawer Footer with Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 border border-rose-900/40 transition-colors min-h-[44px]"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        {/* Top Bar Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>OrthoSmile Clinic en línea</span>
            </div>
            <div className="font-semibold text-sm text-slate-800 sm:hidden truncate max-w-[170px]">
              OrthoSmile Medic
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action: Agendar Cita */}
            <button
              onClick={() => navigate('/appointments?action=new')}
              className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors min-h-[40px]"
            >
              <PlusCircle size={16} />
              <span className="hidden xs:inline">Nueva Cita</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className={`flex items-center gap-2 border px-3 py-1.5 rounded-full text-xs font-semibold transition-colors min-h-[40px] ${getRoleBadgeColor(
                  user?.role
                )}`}
              >
                <span className="truncate max-w-[100px] sm:max-w-[140px]">
                  {user?.fullName || user?.username}
                </span>
                <ChevronDown size={14} className="opacity-70" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 text-left">
                  <div className="pb-3 mb-2 border-b border-slate-100">
                    <div className="font-bold text-sm text-slate-900">
                      {user?.fullName || user?.username}
                    </div>
                    <div className="text-xs font-semibold text-sky-600 mt-0.5">
                      {getRoleDisplayName(user?.role)} {user?.role === 'RECEPCIONISTA' ? '' : '(Acceso Total)'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      usuario: {user?.username}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 py-2 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[40px]"
                  >
                    <LogOut size={14} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Mobile Fixed Bottom Navigation Bar (QA Approved - >= 48px touch targets, zero emojis) */}
        <nav
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex items-center justify-around px-2 py-1 shadow-lg md:hidden safe-area-bottom"
          aria-label="Navegación inferior móvil"
        >
          {mobileBottomItems.map((item) => {
            const Icon = item.icon
            const active = isCurrentRoute(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] rounded-xl transition-colors ${
                  active
                    ? 'text-sky-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <Icon size={20} className={active ? 'text-sky-600' : 'text-slate-400'} />
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
