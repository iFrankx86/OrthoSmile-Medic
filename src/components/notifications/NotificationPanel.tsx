import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications, AppNotification } from '../../context/NotificationContext'
import {
  Bell,
  X,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
  Check,
  Sparkles,
} from 'lucide-react'

export const NotificationPanel: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isOpen, setIsOpen } = useNotifications()
  const [filter, setFilter] = useState<'ALL' | 'APPOINTMENTS' | 'PAYMENTS'>('ALL')
  const navigate = useNavigate()

  if (!isOpen) return null

  const filtered = notifications.filter((n) => {
    if (filter === 'APPOINTMENTS') return n.type === 'UPCOMING_APPOINTMENT' || n.type === 'WAITING_ROOM'
    if (filter === 'PAYMENTS') return n.type === 'PENDING_PAYMENT'
    return true
  })

  const handleAction = (notif: AppNotification) => {
    markAsRead(notif.id)
    setIsOpen(false)
    if (notif.link) {
      navigate(notif.link)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200/80">
        {/* Panel Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold relative">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 m-0">Alertas y Notificaciones</h2>
              <p className="text-xs text-slate-500 m-0">
                {unreadCount === 0 ? 'Sin alertas pendientes' : `${unreadCount} alerta(s) sin atender`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 px-2 py-1 rounded-lg hover:bg-sky-50 transition-colors"
                title="Marcar todas como leídas"
              >
                Marcar leídas
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Cerrar panel"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { key: 'ALL', label: `Todas (${notifications.length})` },
            {
              key: 'APPOINTMENTS',
              label: `Citas (${notifications.filter((n) => n.type === 'UPCOMING_APPOINTMENT' || n.type === 'WAITING_ROOM').length})`,
            },
            {
              key: 'PAYMENTS',
              label: `Pagos (${notifications.filter((n) => n.type === 'PENDING_PAYMENT').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all shrink-0 ${
                filter === tab.key
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 m-0">¡Todo al día!</h3>
              <p className="text-xs text-slate-500 max-w-xs m-0">
                No hay citas próximas desatendidas ni pagos pendientes registrados en este momento.
              </p>
            </div>
          ) : (
            filtered.map((notif) => {
              const isPayment = notif.type === 'PENDING_PAYMENT'
              const isWaiting = notif.type === 'WAITING_ROOM'

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    !notif.read
                      ? isPayment
                        ? 'bg-amber-50/60 border-amber-200/90 shadow-2xs'
                        : isWaiting
                        ? 'bg-sky-50/70 border-sky-200 shadow-2xs'
                        : 'bg-white border-slate-300 shadow-2xs'
                      : 'bg-white border-slate-200/80 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isPayment
                          ? 'bg-amber-100 text-amber-800'
                          : isWaiting
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {isPayment ? <DollarSign size={16} /> : isWaiting ? <Clock size={16} /> : <Calendar size={16} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-slate-900 truncate">{notif.title}</span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="No leída" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 m-0 leading-relaxed">{notif.message}</p>

                      {/* Action buttons */}
                      <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        {notif.amount && (
                          <span className="font-mono font-extrabold text-xs text-amber-800">
                            Monto: S/ {notif.amount.toFixed(2)}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 ml-auto">
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="text-[11px] text-slate-400 hover:text-slate-600 p-1"
                              title="Marcar como leída"
                            >
                              <Check size={14} />
                            </button>
                          )}

                          {notif.link && (
                            <button
                              onClick={() => handleAction(notif)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                                isPayment
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-sky-600 hover:bg-sky-700 text-white'
                              }`}
                            >
                              <span>{notif.actionLabel || 'Ver'}</span>
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
