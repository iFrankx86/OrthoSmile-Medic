import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Calendar,
  FileCheck2,
  DollarSign,
  Clock,
  ArrowRight,
  Plus,
  Stethoscope,
  ChevronRight
} from 'lucide-react'
import { api } from '../../services/api'
import { Patient, Appointment, Professional, Payment } from '../../types'
import { useAuth } from '../../app/providers/AppProviders'

export function DashboardPage() {
  const { user } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [pat, appts, prof, pay] = await Promise.all([
          api.getPatients(),
          api.getAppointments(),
          api.getProfessionals(),
          api.getPayments(),
        ])
        setPatients(pat)
        setAppointments(appts)
        setProfessionals(prof)
        setPayments(pay)
      } catch (err) {
        console.error('Error loading dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const activePatientsCount = patients.filter((p) => p.active).length
  const totalRevenue = payments
    .filter((p) => p.status === 'PAGADO')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMADA':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Confirmada
          </span>
        )
      case 'ATENDIDA':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Atendida
          </span>
        )
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelada
          </span>
        )
      case 'NO_ASISTIO':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            No Asistió
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            Programada
          </span>
        )
    }
  }

  const getPatientName = (id: number) => {
    const p = patients.find((pat) => pat.id === id)
    return p ? `${p.firstName} ${p.lastName}` : `Paciente #${id}`
  }

  const getProfessionalName = (id: number) => {
    const pr = professionals.find((prof) => prof.id === id)
    return pr ? `Dr. ${pr.firstName} ${pr.lastName}` : `Profesional #${id}`
  }

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Bienvenido, {user?.fullName || user?.username}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Resumen operativo y clínico de la plataforma OrthoSmile Medic.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/appointments"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[44px]"
          >
            <Calendar size={16} />
            <span>Calendario</span>
          </Link>
          <Link
            to="/patients?action=new"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors min-h-[44px]"
          >
            <Plus size={16} />
            <span>Nuevo Paciente</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Patients */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Pacientes Activos</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '...' : activePatientsCount}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-1">
              Total registrados: {patients.length}
            </div>
          </div>
        </div>

        {/* Card 2: Appointments */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Citas Registradas</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '...' : appointments.length}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-1">
              {appointments.filter((a) => a.status === 'PROGRAMADA' || a.status === 'CONFIRMADA').length} por atender
            </div>
          </div>
        </div>

        {/* Card 3: Completed Attentions */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Atenciones Médicas</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '...' : appointments.filter((a) => a.status === 'ATENDIDA').length}
            </div>
            <div className="text-[11px] sm:text-xs text-emerald-600 font-medium mt-1">
              Historial clínico al día
            </div>
          </div>
        </div>

        {/* Card 4: Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Recaudación (S/.)</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
              {loading ? '...' : `S/. ${totalRevenue.toFixed(2)}`}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-1">
              {payments.filter((p) => p.status === 'PAGADO').length} recibos procesados
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Appointments Schedule & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments Table / Mobile Cards */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Próximas Citas Odontológicas</h2>
              <p className="text-xs text-slate-500 mt-0.5">Control de turnos y estado de pacientes</p>
            </div>
            <Link
              to="/appointments"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 min-h-[44px] px-2"
            >
              <span>Ver todas</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Fecha y Hora</th>
                  <th className="px-5 py-3">Paciente</th>
                  <th className="px-5 py-3">Especialista</th>
                  <th className="px-5 py-3">Motivo</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No hay citas programadas en este momento.
                    </td>
                  </tr>
                ) : (
                  appointments.slice(0, 5).map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-800 font-medium">
                          <Clock size={14} className="text-slate-400" />
                          <span>{formatDateTime(appt.scheduledStart)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {getPatientName(appt.patientId)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        {getProfessionalName(appt.professionalId)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs truncate max-w-[150px]">
                        {appt.reason || 'Consulta general'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {renderStatusBadge(appt.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (QA Tested for Mobile Usability) */}
          <div className="md:hidden divide-y divide-slate-100">
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No hay citas programadas en este momento.
              </div>
            ) : (
              appointments.slice(0, 5).map((appt) => (
                <div key={appt.id} className="p-4 space-y-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {getPatientName(appt.patientId)}
                    </span>
                    {renderStatusBadge(appt.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      <span>{formatDateTime(appt.scheduledStart)}</span>
                    </div>
                    <span>{getProfessionalName(appt.professionalId)}</span>
                  </div>
                  {appt.reason && (
                    <p className="text-xs text-slate-600 line-clamp-1 bg-slate-50 p-2 rounded-lg">
                      {appt.reason}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Medical Staff */}
        <div className="space-y-6">
          {/* Quick Access Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Accesos Directos</h3>
            <div className="space-y-2">
              <Link
                to="/appointments?action=new"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/50 transition-all text-slate-700 min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold">Programar Cita</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>

              <Link
                to="/patients?action=new"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-slate-700 min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold">Registrar Paciente</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>

              <Link
                to="/clinical-history"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-slate-700 min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <FileCheck2 size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold">Registrar Evolución</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>

              <Link
                to="/payments"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all text-slate-700 min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold">Cobro en Caja</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Specialists Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Especialistas</h3>
              <span className="text-xs text-slate-400 font-medium">{professionals.length} médicos</span>
            </div>
            <div className="space-y-2.5">
              {professionals.map((prof) => (
                <div
                  key={prof.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {prof.firstName.charAt(0)}{prof.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        Dr. {prof.firstName} {prof.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {prof.specialty}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      prof.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {prof.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
