import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Payment, Patient, Appointment, PaymentMethod } from '../../types'
import { api } from '../../services/api'
import {
  CreditCard,
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
  Wallet,
  Receipt,
  User,
  X,
  Search,
  Printer,
  Calendar,
  AlertCircle,
  Stethoscope,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export const PaymentListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [payments, setPayments] = useState<Payment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'PACIENTES' | 'LIBRO_CAJA'>('PACIENTES')
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [patientSearch, setPatientSearch] = useState('')
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null)

  const [newPayment, setNewPayment] = useState({
    patientId: '',
    appointmentId: '',
    clinicalRecordId: '',
    amount: '80',
    paymentMethod: 'EFECTIVO' as PaymentMethod,
    reference: '',
    notes: 'Consulta y atención odontológica',
  })

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [payData, patData, apptData] = await Promise.all([
        api.getPayments(),
        api.getPatients(),
        api.getAppointments(),
      ])
      setPayments(Array.isArray(payData) ? payData : [])
      setPatients(Array.isArray(patData) ? patData : [])
      setAppointments(Array.isArray(apptData) ? apptData : [])
    } catch (e) {
      console.error('[Payments Fetch Error]:', e)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-open modal or select patient when coming with query params
  useEffect(() => {
    const paramPatId = searchParams.get('patientId')
    const paramAction = searchParams.get('action')
    const paramApptId = searchParams.get('appointmentId')
    const paramRecId = searchParams.get('clinicalRecordId')
    const paramAmount = searchParams.get('amount')

    if (paramPatId) {
      setSelectedPatientId(paramPatId)
    }

    if (paramAction === 'new' || paramRecId || (paramApptId && paramAction)) {
      setShowModal(true)
      setNewPayment((prev) => ({
        ...prev,
        patientId: paramPatId ? String(paramPatId) : prev.patientId,
        appointmentId: paramApptId ? String(paramApptId) : prev.appointmentId,
        clinicalRecordId: paramRecId ? String(paramRecId) : prev.clinicalRecordId,
        amount: paramAmount ? String(paramAmount) : prev.amount || '80',
        reference: `B001-${Date.now().toString().slice(-6)}`,
        notes: paramApptId
          ? `Atención de cita #${paramApptId}`
          : paramRecId
          ? `Atención médica #${paramRecId}`
          : prev.notes,
      }))
    }
  }, [searchParams])

  const handleClosePaymentModal = () => {
    setShowModal(false)
    if (searchParams.has('action') || searchParams.has('appointmentId')) {
      const p = new URLSearchParams()
      if (selectedPatientId) p.set('patientId', selectedPatientId)
      setSearchParams(p, { replace: true })
    }
  }

  // If patients load and none selected, auto-select first
  useEffect(() => {
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(String(patients[0].id))
    }
  }, [patients, selectedPatientId])

  const getPatient = (id?: number) => {
    if (!id) return undefined
    return patients.find((pat) => String(pat.id) === String(id))
  }

  const getPatientName = (id?: number) => {
    const p = getPatient(id)
    return p ? `${p.firstName} ${p.lastName}` : `Paciente #${id || '—'}`
  }

  const formatPaymentMethod = (method?: string) => {
    switch (method) {
      case 'EFECTIVO':
        return {
          label: 'Efectivo',
          sub: 'Caja en Soles',
          icon: '💵',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        }
      case 'CARTERA_DIGITAL':
      case 'YAPE_PLIN':
      case 'YAPE':
      case 'PLIN':
        return {
          label: 'Cartera Digital',
          sub: 'Yape o Plin',
          icon: '📱',
          badge: 'bg-purple-50 text-purple-800 border-purple-200',
        }
      case 'DEPOSITO_BBVA':
      case 'TRANSFERENCIA':
        return {
          label: 'Depósito BBVA',
          sub: 'Transferencia BBVA',
          icon: '🏦',
          badge: 'bg-blue-50 text-blue-800 border-blue-200',
        }
      default:
        return {
          label: method || 'Otro',
          sub: 'Pago general',
          icon: '💳',
          badge: 'bg-slate-100 text-slate-800 border-slate-200',
        }
    }
  }

  // Filtered patients for selector
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients
    const q = patientSearch.toLowerCase().trim()
    return patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.documentNumber.includes(q)
    )
  }, [patients, patientSearch])

  // Currently focused patient
  const currentPatient = useMemo(() => {
    return patients.find((p) => String(p.id) === String(selectedPatientId))
  }, [patients, selectedPatientId])

  // Attended appointments for this patient
  const patientAttendedAppointments = useMemo(() => {
    if (!selectedPatientId) return []
    return appointments
      .filter((a) => String(a.patientId) === String(selectedPatientId) && a.status === 'ATENDIDA')
      .sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime())
  }, [appointments, selectedPatientId])

  // All payments for this patient
  const patientPayments = useMemo(() => {
    if (!selectedPatientId) return []
    return payments
      .filter((p) => String(p.patientId) === String(selectedPatientId))
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : a.id
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : b.id
        return timeB - timeA
      })
  }, [payments, selectedPatientId])

  // Calculations
  const totalCollected = useMemo(() => {
    return payments
      .filter((p) => p.status === 'PAGADO' || p.status === 'COMPLETADO')
      .reduce((acc, p) => acc + Number(p.amount || 0), 0)
  }, [payments])

  const totalPatientPaid = useMemo(() => {
    return patientPayments
      .filter((p) => p.status === 'PAGADO' || p.status === 'COMPLETADO')
      .reduce((acc, p) => acc + Number(p.amount || 0), 0)
  }, [patientPayments])

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const refCode = newPayment.reference || `B001-${Date.now().toString().slice(-6)}`
      const targetRecordId = newPayment.clinicalRecordId
        ? Number(newPayment.clinicalRecordId)
        : newPayment.appointmentId
        ? Number(newPayment.appointmentId)
        : 1

      await api.createPayment({
        patientId: Number(newPayment.patientId),
        clinicalRecordId: targetRecordId,
        appointmentId: newPayment.appointmentId ? Number(newPayment.appointmentId) : undefined,
        amount: Number(newPayment.amount),
        currency: 'PEN',
        paymentMethod: newPayment.paymentMethod,
        status: 'PAGADO',
        reference: refCode,
        notes: newPayment.notes || 'Consulta y atención odontológica',
        paidAt: new Date().toISOString(),
      })

      setShowModal(false)
      const p = new URLSearchParams()
      if (newPayment.patientId || selectedPatientId) {
        p.set('patientId', String(newPayment.patientId || selectedPatientId))
      }
      setSearchParams(p, { replace: true })

      setNewPayment({
        patientId: selectedPatientId,
        appointmentId: '',
        clinicalRecordId: '',
        amount: '80',
        paymentMethod: 'EFECTIVO',
        reference: '',
        notes: 'Consulta y atención odontológica',
      })
      await loadData(true)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openCobroForAppointment = (appt: Appointment) => {
    setNewPayment({
      patientId: String(appt.patientId),
      appointmentId: String(appt.id),
      clinicalRecordId: String(appt.id),
      amount: '80',
      paymentMethod: 'EFECTIVO',
      reference: `B001-${Date.now().toString().slice(-6)}`,
      notes: `Cobro por atención odontológica: ${appt.reason || 'Consulta'}`,
    })
    setShowModal(true)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="text-sky-600" size={24} />
            <span>Caja y Registro de Pagos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 m-0">
            Control de cobros en Efectivo, Yape/Plin y Depósito BBVA por paciente y cita
          </p>
        </div>

        <button
          onClick={() => {
            setNewPayment((prev) => ({
              ...prev,
              patientId: selectedPatientId || (patients[0]?.id ? String(patients[0].id) : ''),
              reference: `B001-${Date.now().toString().slice(-6)}`,
            }))
            setShowModal(true)
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold shadow-xs transition-all min-h-[44px]"
        >
          <Plus size={18} />
          <span>Registrar Nuevo Cobro</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Recaudado</span>
            <Wallet size={16} className="text-emerald-500" />
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            S/ {totalCollected.toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">✓ Sincronizado</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Comprobantes</span>
            <Receipt size={16} className="text-sky-500" />
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {payments.length}
          </div>
          <span className="text-[10px] text-slate-500">Boletas emitidas</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Medios de Pago</span>
            <DollarSign size={16} className="text-purple-500" />
          </div>
          <div className="text-xs font-bold text-slate-800 leading-tight">
            Efectivo · Yape/Plin · BBVA
          </div>
          <span className="text-[10px] text-purple-600 font-medium">Tarifas en Soles (PEN)</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Estado de Caja</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-sm font-bold text-slate-900">
            Caja Abierta
          </div>
          <span className="text-[10px] text-slate-500">Dr. Manuel Gustavo Chavez</span>
        </div>
      </div>

      {/* Main View Mode Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('PACIENTES')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'PACIENTES'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Expediente por Paciente y Citas
        </button>
        <button
          onClick={() => setActiveTab('LIBRO_CAJA')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'LIBRO_CAJA'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Libro Diario de Caja ({payments.length})
        </button>
      </div>

      {/* VIEW 1: EXPEDIENTE POR PACIENTE (TARJETAS DE CITAS ATENDIDAS E HISTORIAL DE PAGOS) */}
      {activeTab === 'PACIENTES' && (
        <div className="space-y-4">
          {/* Patient Quick Selector Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm shrink-0">
                <User size={20} />
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Paciente Seleccionado
                </span>
                <span className="text-base font-bold text-slate-900">
                  {currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : 'Seleccione paciente'}
                </span>
                {currentPatient && (
                  <span className="text-xs text-slate-500 font-mono ml-2">
                    DNI: {currentPatient.documentNumber} {currentPatient.phone && `· Tel: ${currentPatient.phone}`}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="w-full md:w-80 px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium min-h-[44px]"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} (DNI: {p.documentNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentPatient && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* SECTION 1: Tarjetas de Citas de Atención Atendidas */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                        <Calendar size={16} />
                      </div>
                      <h2 className="font-bold text-sm sm:text-base text-slate-900 m-0">
                        Citas de Atención Atendidas ({patientAttendedAppointments.length})
                      </h2>
                    </div>
                    <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                      Consultas clínicas
                    </span>
                  </div>

                  {patientAttendedAppointments.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <Clock size={28} className="mx-auto text-slate-300" />
                      <p className="text-xs font-medium m-0">No hay citas marcadas como "Atendida" para este paciente.</p>
                      <p className="text-[11px] text-slate-400">Cuando el doctor complete una cita médica aparecerá aquí para su cobro.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-3">
                      {patientAttendedAppointments.map((appt, idx) => {
                        const dateObj = new Date(appt.scheduledStart)
                        const dateFormatted = dateObj.toLocaleDateString('es-PE', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                        const timeFormatted = dateObj.toLocaleTimeString('es-PE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })

                        // Check if a payment references this appointment
                        const matchingPayment = payments.find(
                          (p, pIdx) =>
                            (p.status === 'PAGADO' || p.status === 'COMPLETADO') &&
                            (p.id === appt.paymentId ||
                              p.appointmentId === appt.id ||
                              String(p.appointmentId) === String(appt.id) ||
                              (String(p.patientId) === String(appt.patientId) &&
                                (String(p.clinicalRecordId) === String(appt.id) ||
                                  (p.notes && appt.reason && p.notes.toLowerCase().includes(appt.reason.trim().toLowerCase())) ||
                                  (patientPayments.length === 1 && patientAttendedAppointments.length === 1) ||
                                  (patientPayments.length >= patientAttendedAppointments.length && pIdx === idx))))
                        )
                        const isApptPaid = Boolean(appt.isPaid || matchingPayment)
                        const paidAmountVal = (matchingPayment ? Number(matchingPayment.amount) : appt.paidAmount || 80).toFixed(2)

                        return (
                          <div
                            key={appt.id}
                            className="bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/90 p-3.5 space-y-2.5 transition-all"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-mono text-xs">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold border border-sky-200 text-[11px]">
                                  Turno #{String(idx + 1).padStart(2, '0')}
                                </span>
                                <span className="font-semibold text-slate-800 capitalize">{dateFormatted}</span>
                                <span>·</span>
                                <span className="text-sky-700 font-bold">{timeFormatted}</span>
                              </div>

                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={11} />
                                Atendida
                              </span>
                            </div>

                            <div className="text-xs text-slate-700">
                              <span className="font-bold text-slate-900">Motivo: </span>
                              <span>{appt.reason || 'Consulta odontológica especializada'}</span>
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Stethoscope size={13} className="text-slate-400" />
                              <span>Dr. Manuel Gustavo Chavez Sevillano (Orthodontist, MSc, PhD)</span>
                            </div>

                            {/* Billing Status & Action */}
                            <div className="pt-2 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              {isApptPaid ? (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                                  <CheckCircle2 size={14} className="text-emerald-600" />
                                  <span>Pago Realizado: S/ {paidAmountVal}</span>
                                  <span className="font-mono text-[10px] text-emerald-800 font-normal">
                                    ({matchingPayment?.reference || appt.paymentReference || 'Comprobante Registrado'})
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                                  <AlertCircle size={14} className="text-amber-500" />
                                  <span>Pendiente de emitir comprobante</span>
                                </div>
                              )}

                              <div className="flex items-center gap-1.5">
                                {isApptPaid && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReceiptPayment(
                                        matchingPayment || ({
                                          id: appt.paymentId || appt.id,
                                          patientId: appt.patientId,
                                          clinicalRecordId: appt.id,
                                          amount: appt.paidAmount || 80,
                                          currency: 'PEN',
                                          paymentMethod: (appt.paymentMethod as any) || 'EFECTIVO',
                                          status: 'PAGADO',
                                          reference: appt.paymentReference || `B001-${appt.id}`,
                                          notes: `Atención odontológica: ${appt.reason || 'Consulta'}`,
                                          paidAt: appt.updatedAt || new Date().toISOString(),
                                        })
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition-all shadow-2xs"
                                    title="Ver comprobante emitido"
                                  >
                                    <Printer size={13} />
                                    <span>Ver Boleta</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => openCobroForAppointment(appt)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    isApptPaid
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                  }`}
                                >
                                  <DollarSign size={13} />
                                  <span>{isApptPaid ? 'Abono Adicional' : 'Cobrar Atención (S/ 80)'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Total Citas Atendidas: <strong>{patientAttendedAppointments.length}</strong></span>
                  <button
                    onClick={() => {
                      setNewPayment((prev) => ({
                        ...prev,
                        patientId: selectedPatientId,
                        reference: `B001-${Date.now().toString().slice(-6)}`,
                      }))
                      setShowModal(true)
                    }}
                    className="text-sky-600 font-bold hover:underline"
                  >
                    + Cobrar otra atención
                  </button>
                </div>
              </div>

              {/* SECTION 2: Tarjetas de Historial de Pagos del Paciente */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Receipt size={16} />
                      </div>
                      <h2 className="font-bold text-sm sm:text-base text-slate-900 m-0">
                        Historial de Pagos y Boletas ({patientPayments.length})
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Pagado</span>
                      <span className="text-sm font-extrabold text-emerald-700 font-mono">S/ {totalPatientPaid.toFixed(2)}</span>
                    </div>
                  </div>

                  {patientPayments.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <Receipt size={28} className="mx-auto text-slate-300" />
                      <p className="text-xs font-medium m-0">No hay pagos registrados aún para {currentPatient.firstName}.</p>
                      <button
                        onClick={() => {
                          setNewPayment((prev) => ({
                            ...prev,
                            patientId: selectedPatientId,
                            reference: `B001-${Date.now().toString().slice(-6)}`,
                          }))
                          setShowModal(true)
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 pt-1"
                      >
                        <Plus size={14} />
                        <span>Registrar primer pago ahora</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-3">
                      {patientPayments.map((p) => {
                        const mInfo = formatPaymentMethod(p.paymentMethod)
                        const pDate = p.paidAt || p.createdAt
                        const dateFormatted = pDate
                          ? new Date(pDate).toLocaleDateString('es-PE', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Hoy'

                        return (
                          <div
                            key={p.id}
                            className="bg-white rounded-2xl border border-slate-200/90 p-3.5 space-y-2 hover:border-emerald-300 transition-all shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                  ✓
                                </div>
                                <div>
                                  <div className="font-mono text-xs font-bold text-slate-900">
                                    {p.reference || `REC-${p.id}`}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">{dateFormatted}</div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-base font-extrabold text-slate-900 font-mono tabular-nums">
                                  S/ {Number(p.amount).toFixed(2)}
                                </div>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                                  {p.status || 'PAGADO'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold ${mInfo.badge}`}>
                                <span>{mInfo.icon}</span>
                                <span>{mInfo.label}</span>
                              </span>

                              <button
                                onClick={() => setReceiptPayment(p)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 p-1 rounded-lg hover:bg-sky-50 transition-colors"
                              >
                                <Printer size={13} />
                                <span>Ver Boleta</span>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setNewPayment((prev) => ({
                        ...prev,
                        patientId: selectedPatientId,
                        reference: `B001-${Date.now().toString().slice(-6)}`,
                      }))
                      setShowModal(true)
                    }}
                    className="w-full py-2.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus size={15} />
                    <span>Registrar Nuevo Cobro / Abono para este paciente</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: LIBRO DIARIO DE CAJA Y TRANSACCIONES GENERALES */}
      {activeTab === 'LIBRO_CAJA' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500 m-0">Cargando pagos desde Firebase...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <Receipt size={32} className="text-slate-300 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800 m-0">No hay pagos registrados</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Registra el primer cobro de atención para emitir el comprobante.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 pt-2"
              >
                <Plus size={16} />
                <span>Registrar primer cobro</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Registro Cronológico de Comprobantes ({payments.length})
                </span>
                <span className="text-xs font-bold text-slate-700 font-mono">
                  Total: S/ {totalCollected.toFixed(2)} PEN
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Comprobante</th>
                      <th className="py-3 px-4">Paciente</th>
                      <th className="py-3 px-4">Medio de Pago</th>
                      <th className="py-3 px-4">Concepto / Notas</th>
                      <th className="py-3 px-4 text-right">Monto (PEN)</th>
                      <th className="py-3 px-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => {
                      const mInfo = formatPaymentMethod(p.paymentMethod)
                      const pDate = p.paidAt || p.createdAt
                      const dateStr = pDate
                        ? new Date(pDate).toLocaleDateString('es-PE', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Hoy'

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs">
                            <div className="font-bold text-slate-900">{p.reference || `REC-${p.id}`}</div>
                            <div className="text-slate-400 text-[11px]">{dateStr}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {getPatientName(p.patientId)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${mInfo.badge}`}>
                              <span>{mInfo.icon}</span>
                              <span>{mInfo.label}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                            {p.notes || 'Atención odontológica'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                            S/ {Number(p.amount).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setReceiptPayment(p)}
                              className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
                              title="Ver e Imprimir Comprobante"
                            >
                              <Printer size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL / BOTTOM SHEET: REGISTRAR COBRO (CON LOS 3 MEDIOS DE PAGO) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={handleClosePaymentModal}
          />

          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="font-bold text-base text-slate-900 m-0">Registrar Cobro / Boleta</h2>
                <p className="text-xs text-slate-400 m-0">Emisión de comprobante en Soles (PEN)</p>
              </div>
              <button
                type="button"
                onClick={handleClosePaymentModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paciente <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white min-h-[44px]"
                  value={newPayment.patientId}
                  onChange={(e) => {
                    setNewPayment({ ...newPayment, patientId: e.target.value })
                    setSelectedPatientId(e.target.value)
                  }}
                >
                  <option value="">Seleccione el paciente...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} (DNI: {p.documentNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monto a Cobrar (PEN S/) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="80.00"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-mono font-extrabold min-h-[44px] text-slate-900"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Forma de Cobro <span className="text-rose-500">*</span>
                </label>

                {/* 3 Peruvian Payment Method Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  {[
                    { key: 'EFECTIVO' as PaymentMethod, label: 'Efectivo', sub: 'Caja en Soles', icon: '💵' },
                    { key: 'CARTERA_DIGITAL' as PaymentMethod, label: 'Yape o Plin', sub: 'Cartera Digital', icon: '📱' },
                    { key: 'DEPOSITO_BBVA' as PaymentMethod, label: 'Depósito BBVA', sub: 'Banco BBVA', icon: '🏦' },
                  ].map((m) => {
                    const isSelected = newPayment.paymentMethod === m.key
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setNewPayment({ ...newPayment, paymentMethod: m.key })}
                        className={`p-2.5 rounded-xl border text-left transition-all min-h-[50px] ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20 font-bold shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <div className="text-xs sm:text-sm flex items-center gap-1.5">
                          <span>{m.icon}</span>
                          <span>{m.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{m.sub}</span>
                      </button>
                    )
                  })}
                </div>

                {newPayment.paymentMethod === 'CARTERA_DIGITAL' && (
                  <div className="text-[11px] text-purple-800 bg-purple-50 p-2.5 rounded-xl border border-purple-200 mt-2 space-y-1">
                    <p className="font-bold m-0 flex items-center gap-1">
                      <span>📱</span> Cobro por Cartera Digital (Yape / Plin)
                    </p>
                    <p className="m-0 text-purple-700">
                      Indique al paciente transferir al número oficial del consultorio o escanear el QR en recepción.
                    </p>
                  </div>
                )}

                {newPayment.paymentMethod === 'DEPOSITO_BBVA' && (
                  <div className="text-[11px] text-blue-800 bg-blue-50 p-2.5 rounded-xl border border-blue-200 mt-2 space-y-1">
                    <p className="font-bold m-0 flex items-center gap-1">
                      <span>🏦</span> Depósito o Transferencia BBVA
                    </p>
                    <p className="m-0 text-blue-700">
                      Cuenta Corriente BBVA Perú: <strong>0011-0182-0100049281</strong> · CCI: 011-182-000100049281-22
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Operación / Boleta
                </label>
                <input
                  type="text"
                  placeholder="Ej: B001-002931 o OP-948123"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono min-h-[44px]"
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Concepto / Detalle de la Atención
                </label>
                <input
                  type="text"
                  placeholder="Consulta odontológica, ajuste de brackets, resina..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[44px]"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClosePaymentModal}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-bold shadow-xs min-h-[44px] transition-all"
                >
                  {isSubmitting ? 'Registrando...' : 'Emitir Comprobante (S/)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BOLETA OFICIAL IMPRIMIBLE */}
      {receiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setReceiptPayment(null)}
          />

          <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 border border-slate-200 font-mono text-slate-800 text-xs space-y-4">
            <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
              <h3 className="font-bold text-base text-slate-900 tracking-tight">ORTHOSMILE-MEDIC</h3>
              <p className="text-[11px] text-slate-500 m-0">Centro Especializado de Ortodoncia</p>
              <p className="text-[10px] text-slate-500 m-0">Dr. Manuel Gustavo Chavez Sevillano</p>
              <p className="text-[10px] text-slate-400 m-0">Orthodontist, MSc, PhD · COP-18452</p>
              <div className="pt-1 font-bold text-slate-800">
                BOLETA DE VENTA ELECTRÓNICA
              </div>
              <div className="text-[11px] font-bold text-sky-800">
                {receiptPayment.reference || `#REC-${receiptPayment.id}`}
              </div>
            </div>

            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha/Hora:</span>
                <span>{receiptPayment.paidAt ? new Date(receiptPayment.paidAt).toLocaleString('es-PE') : 'Hoy'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paciente:</span>
                <span className="font-bold">{getPatientName(receiptPayment.patientId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Medio:</span>
                <span className="font-bold">{formatPaymentMethod(receiptPayment.paymentMethod).label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado:</span>
                <span className="text-emerald-700 font-bold">{receiptPayment.status || 'PAGADO'}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-3">
              <div className="font-semibold text-slate-900">
                {receiptPayment.notes || 'Atención odontológica especializada'}
              </div>
              <div className="flex justify-between text-base font-extrabold pt-1">
                <span>TOTAL A PAGAR:</span>
                <span>S/ {Number(receiptPayment.amount).toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-1 space-y-2">
              <p className="m-0">¡Gracias por confiar en OrthoSmile-Medic!</p>
              <p className="m-0">Comprobante de uso clínico y fiscal</p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center justify-center gap-1.5 text-xs transition-colors"
              >
                <Printer size={14} />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => setReceiptPayment(null)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
