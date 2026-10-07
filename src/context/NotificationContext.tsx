import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { api } from '../services/api'
import { Appointment, Payment, Patient } from '../types'

export interface AppNotification {
  id: string
  type: 'UPCOMING_APPOINTMENT' | 'PENDING_PAYMENT' | 'WAITING_ROOM' | 'INFO'
  title: string
  message: string
  timestamp: string
  patientId?: number
  patientName?: string
  appointmentId?: number
  amount?: number
  link?: string
  actionLabel?: string
  read: boolean
}

interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  refreshNotifications: () => Promise<void>
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('ortho_read_notifications')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [isOpen, setIsOpen] = useState(false)

  const refreshNotifications = async () => {
    try {
      const [appts, pays, pats] = await Promise.all([
        api.getAppointments(),
        api.getPayments(),
        api.getPatients(),
      ])

      const patientMap = new Map<number, Patient>()
      pats.forEach((p) => patientMap.set(p.id, p))

      const generated: AppNotification[] = []
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const tomorrow = new Date(now)
      tomorrow.setDate(now.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      // 1. Citas Próximas (Hoy y Mañana)
      appts.forEach((appt) => {
        if (!appt.scheduledStart) return
        const apptDate = new Date(appt.scheduledStart)
        const apptDayStr = appt.scheduledStart.split('T')[0]
        const pat = patientMap.get(appt.patientId)
        const patName = pat ? `${pat.firstName} ${pat.lastName}` : `Paciente #${appt.patientId}`
        const timeFormatted = apptDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })

        // Citas de Hoy
        if (apptDayStr === todayStr && appt.status !== 'CANCELADA') {
          const isPast = apptDate.getTime() < now.getTime()
          const notifId = `appt-today-${appt.id}`

          if (appt.status === 'CONFIRMADA') {
            generated.push({
              id: `appt-waiting-${appt.id}`,
              type: 'WAITING_ROOM',
              title: `Paciente en Sala de Espera`,
              message: `${patName} está esperando para su consulta de las ${timeFormatted}.`,
              timestamp: appt.scheduledStart,
              patientId: appt.patientId,
              patientName: patName,
              appointmentId: appt.id,
              link: `/citas`,
              actionLabel: 'Ver en Agenda',
              read: readIds.has(`appt-waiting-${appt.id}`),
            })
          } else if (!isPast) {
            generated.push({
              id: notifId,
              type: 'UPCOMING_APPOINTMENT',
              title: `Cita Hoy · ${timeFormatted}`,
              message: `${patName} tiene turno agendado para: "${appt.reason || 'Consulta'}".`,
              timestamp: appt.scheduledStart,
              patientId: appt.patientId,
              patientName: patName,
              appointmentId: appt.id,
              link: `/citas`,
              actionLabel: 'Ver Agenda',
              read: readIds.has(notifId),
            })
          }
        } else if (apptDayStr === tomorrowStr && appt.status !== 'CANCELADA') {
          const notifId = `appt-tomorrow-${appt.id}`
          generated.push({
            id: notifId,
            type: 'UPCOMING_APPOINTMENT',
            title: `Cita Mañana · ${timeFormatted}`,
            message: `${patName} tiene cita programada: "${appt.reason || 'Consulta'}".`,
            timestamp: appt.scheduledStart,
            patientId: appt.patientId,
            patientName: patName,
            appointmentId: appt.id,
            link: `/citas`,
            actionLabel: 'Ver Agenda',
            read: readIds.has(notifId),
          })
        }
      })

      // 2. Pagos Pendientes (Citas Atendidas sin pago registrado)
      // Check which attended appointments lack a corresponding payment
      const attendedAppts = appts.filter((a) => a.status === 'ATENDIDA')
      attendedAppts.forEach((appt) => {
        const pat = patientMap.get(appt.patientId)
        const patName = pat ? `${pat.firstName} ${pat.lastName}` : `Paciente #${appt.patientId}`

        const hasPaid =
          Boolean(appt.isPaid) ||
          pays.some(
            (p) =>
              (p.status === 'PAGADO' || p.status === 'COMPLETADO') &&
              (p.appointmentId === appt.id ||
                String(p.appointmentId) === String(appt.id) ||
                (String(p.patientId) === String(appt.patientId) &&
                  (String(p.clinicalRecordId) === String(appt.id) ||
                    (p.notes && appt.reason && p.notes.toLowerCase().includes(appt.reason.trim().toLowerCase())) ||
                    pays.filter((x) => String(x.patientId) === String(appt.patientId) && (x.status === 'PAGADO' || x.status === 'COMPLETADO')).length >=
                      attendedAppts.filter((x) => String(x.patientId) === String(appt.patientId)).length)))
          )

        if (!hasPaid) {
          const notifId = `payment-pending-${appt.id}`
          generated.push({
            id: notifId,
            type: 'PENDING_PAYMENT',
            title: `Cobro Pendiente de Atención`,
            message: `La atención médica de ${patName} (${appt.reason || 'Consulta'}) aún no tiene boleta de pago emitida.`,
            timestamp: appt.updatedAt || appt.scheduledStart,
            patientId: appt.patientId,
            patientName: patName,
            appointmentId: appt.id,
            amount: 80,
            link: `/pagos?patientId=${appt.patientId}&appointmentId=${appt.id}&action=new`,
            actionLabel: 'Cobrar en Caja',
            read: readIds.has(notifId),
          })
        }
      })

      // Sort notifications by timestamp descending
      generated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setNotifications(generated)
    } catch (e) {
      console.warn('[Notification Service Error]:', e)
    }
  }

  useEffect(() => {
    refreshNotifications()
    // Poll every 25 seconds for real-time upcoming appointments and payments
    const interval = setInterval(refreshNotifications, 25000)

    const handleFocus = () => refreshNotifications()
    const handleUpdate = () => refreshNotifications()
    window.addEventListener('focus', handleFocus)
    window.addEventListener('orthosmile:patient-created', handleUpdate)
    window.addEventListener('orthosmile:payment-registered', handleUpdate)
    window.addEventListener('orthosmile:appointment-updated', handleUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('orthosmile:patient-created', handleUpdate)
      window.removeEventListener('orthosmile:payment-registered', handleUpdate)
      window.removeEventListener('orthosmile:appointment-updated', handleUpdate)
    }
  }, [readIds])

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      try {
        localStorage.setItem('ortho_read_notifications', JSON.stringify([...next]))
      } catch {}
      return next
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id))
    setReadIds(allIds)
    try {
      localStorage.setItem('ortho_read_notifications', JSON.stringify([...allIds]))
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
