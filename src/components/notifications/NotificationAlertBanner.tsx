import React, { useState } from 'react'
import { useNotifications } from '../../context/NotificationContext'
import { Bell, Calendar, DollarSign, X, ChevronRight, Sparkles } from 'lucide-react'

export const NotificationAlertBanner: React.FC = () => {
  const { notifications, unreadCount, setIsOpen } = useNotifications()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || notifications.length === 0 || unreadCount === 0) return null

  const upcomingAppts = notifications.filter(
    (n) => (n.type === 'UPCOMING_APPOINTMENT' || n.type === 'WAITING_ROOM') && !n.read
  )
  const pendingPayments = notifications.filter((n) => n.type === 'PENDING_PAYMENT' && !n.read)

  return (
    <div className="mb-4 sm:mb-6 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50/50 to-amber-50/60 border border-sky-200/80 p-3.5 sm:p-4 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-sky-600 border border-sky-100 flex items-center justify-center shrink-0 shadow-2xs font-bold relative">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1">
                <span>Alertas Clínicas en Tiempo Real</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                {unreadCount} pendiente(s)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-600">
              {upcomingAppts.length > 0 && (
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Calendar size={13} className="text-sky-600" />
                  <span>
                    <strong>{upcomingAppts.length}</strong> cita(s) próxima(s)
                  </span>
                </span>
              )}
              {upcomingAppts.length > 0 && pendingPayments.length > 0 && (
                <span className="text-slate-300 hidden sm:inline">·</span>
              )}
              {pendingPayments.length > 0 && (
                <span className="inline-flex items-center gap-1 font-medium text-amber-800">
                  <DollarSign size={13} className="text-amber-600" />
                  <span>
                    <strong>{pendingPayments.length}</strong> cobro(s) pendiente(s) de atención
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200/90 rounded-xl text-xs font-bold shadow-2xs transition-colors"
          >
            <span>Ver Panel de Alertas</span>
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
            title="Ocultar barra de alertas"
            aria-label="Ocultar barra"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
