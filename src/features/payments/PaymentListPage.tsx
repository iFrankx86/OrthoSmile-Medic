import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Payment, Patient } from '../../types/models'
import { api } from '../../services/api'
import {
  CreditCard,
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
  Wallet,
  Receipt,
  ArrowUpRight,
  User,
  X,
  RefreshCw,
} from 'lucide-react'

export const PaymentListPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [payments, setPayments] = useState<Payment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newPayment, setNewPayment] = useState({
    patientId: '',
    amount: '',
    paymentMethod: 'EFECTIVO',
    reference: '',
    notes: '',
  })

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [payData, patData] = await Promise.all([
        api.getPayments(),
        api.getPatients(),
      ])
      setPayments(Array.isArray(payData) ? payData : [])
      setPatients(Array.isArray(patData) ? patData : [])
    } catch (e) {
      console.error('[Payments Fetch Error]:', e)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const paramPatId = searchParams.get('patientId')
    const paramAction = searchParams.get('action')
    const paramAmount = searchParams.get('amount')
    if (paramPatId || paramAction === 'new') {
      setShowModal(true)
      setNewPayment((prev) => ({
        ...prev,
        patientId: paramPatId ? String(paramPatId) : prev.patientId,
        amount: paramAmount ? String(paramAmount) : prev.amount || '80',
        reference: `BOLETA-${Date.now().toString().slice(-6)}`,
      }))
    }
  }, [searchParams])

  const getPatientName = (id: number) => {
    const p = patients.find((pat) => String(pat.id) === String(id))
    return p ? `${p.firstName} ${p.lastName}` : `Paciente #${id}`
  }

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'EFECTIVO':
        return { label: 'Efectivo', icon: '💵', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
      case 'CARTERA_DIGITAL':
      case 'YAPE_PLIN':
        return { label: 'Yape / Plin', icon: '📱', color: 'bg-purple-50 text-purple-800 border-purple-200' }
      case 'DEPOSITO_BBVA':
      case 'TRANSFERENCIA':
        return { label: 'Depósito BBVA', icon: '🏦', color: 'bg-blue-50 text-blue-800 border-blue-200' }
      default:
        return { label: method, icon: '💳', color: 'bg-slate-100 text-slate-800 border-slate-200' }
    }
  }

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const refCode = newPayment.reference || `REC-${Date.now().toString().slice(-6)}`
      await api.createPayment({
        patientId: Number(newPayment.patientId),
        clinicalRecordId: 1,
        amount: Number(newPayment.amount),
        currency: 'PEN',
        paymentMethod: newPayment.paymentMethod as any,
        status: 'PAGADO',
        reference: refCode,
        notes: newPayment.notes || 'Consulta y atención odontológica',
        paidAt: new Date().toISOString(),
      })

      setShowModal(false)
      setNewPayment({ patientId: '', amount: '', paymentMethod: 'EFECTIVO', reference: '', notes: '' })
      await loadData(true)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalCollected = payments
    .filter((p) => p.status === 'COMPLETADO')
    .reduce((acc, p) => acc + Number(p.amount), 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Caja y Registro de Pagos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 m-0">
            Control financiero, boletas y recaudación en tiempo real
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-sm font-semibold shadow-xs transition-all min-h-[44px]"
        >
          <Plus size={18} />
          <span>Registrar Cobro</span>
        </button>
      </div>

      {/* Summary Stat Cards (Thumb Zone) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Recaudado</span>
            <Wallet size={16} className="text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            S/ {totalCollected.toFixed(2)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">✓ Sincronizado</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Transacciones</span>
            <Receipt size={16} className="text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {payments.length}
          </div>
          <span className="text-[11px] text-slate-500">Recibos emitidos</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Estado de Caja</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-base font-bold text-slate-900">
            Caja Diaria Abierta
          </div>
          <span className="text-[11px] text-slate-500">Turno Odontológico Activo</span>
        </div>
      </div>

      {/* Payment List: Mobile Cards + Desktop Table */}
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
            Registra el primer pago o abono de tratamiento para emitir el comprobante.
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
        <>
          {/* Mobile View: Cards */}
          <div className="space-y-3 md:hidden">
            {payments.map((p) => {
              const dateStr = p.createdAt
                ? new Date(p.createdAt).toLocaleDateString('es-PE', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Hoy'

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900 leading-tight">
                          {getPatientName(p.patientId)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{dateStr}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
                        S/ {Number(p.amount).toFixed(2)}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span>{formatPaymentMethod(p.paymentMethod).icon}</span>
                      <strong className="text-slate-800">{formatPaymentMethod(p.paymentMethod).label}</strong>
                    </span>
                    <span>Ref: <strong className="text-slate-800">{p.reference || `#${p.id}`}</strong></span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Comprobante / Fecha</th>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Medio de Pago</th>
                  <th className="py-3 px-4">Referencia</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Monto (PEN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const mInfo = formatPaymentMethod(p.paymentMethod)
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        <div className="font-semibold text-slate-900">#REC-{p.id}</div>
                        <div className="text-slate-400">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-PE') : 'Hoy'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {getPatientName(p.patientId)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${mInfo.color}`}>
                          <span>{mInfo.icon}</span>
                          <span>{mInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600">
                        {p.reference || `OP-${p.id}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={11} />
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        S/ {Number(p.amount).toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal / Bottom Sheet: New Payment */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setShowModal(false)}
          />

          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="font-bold text-base text-slate-900 m-0">Registrar Cobro / Abono</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paciente <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white min-h-[44px]"
                  value={newPayment.patientId}
                  onChange={(e) => setNewPayment({ ...newPayment, patientId: e.target.value })}
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
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold min-h-[44px]"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Medio de Pago <span className="text-rose-500">*</span>
                </label>
                
                {/* Quick Touch Selection Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  {[
                    { key: 'EFECTIVO', label: 'Efectivo', sub: 'Caja en Soles', icon: '💵' },
                    { key: 'CARTERA_DIGITAL', label: 'Cartera Digital', sub: 'Yape o Plin', icon: '📱' },
                    { key: 'DEPOSITO_BBVA', label: 'Depósito BBVA', sub: 'Transferencia BBVA', icon: '🏦' },
                  ].map((m) => {
                    const isSelected = newPayment.paymentMethod === m.key
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setNewPayment({ ...newPayment, paymentMethod: m.key })}
                        className={`p-2.5 rounded-xl border text-left transition-all min-h-[50px] ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <div className="text-sm flex items-center gap-1.5">
                          <span>{m.icon}</span>
                          <span>{m.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{m.sub}</span>
                      </button>
                    )
                  })}
                </div>

                <select
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white min-h-[44px]"
                  value={newPayment.paymentMethod}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                >
                  <option value="EFECTIVO">💵 Efectivo (Caja en Soles)</option>
                  <option value="CARTERA_DIGITAL">📱 Cartera Digital (Yape o Plin)</option>
                  <option value="DEPOSITO_BBVA">🏦 Depósito / Transferencia BBVA</option>
                </select>
                
                {newPayment.paymentMethod === 'CARTERA_DIGITAL' && (
                  <p className="text-[11px] text-purple-700 bg-purple-50 p-2 rounded-lg mt-1.5 m-0">
                    💡 Cobro mediante código QR o número de teléfono registrado en Yape o Plin.
                  </p>
                )}
                {newPayment.paymentMethod === 'DEPOSITO_BBVA' && (
                  <p className="text-[11px] text-blue-700 bg-blue-50 p-2 rounded-lg mt-1.5 m-0">
                    💡 Verifique el comprobante o constancia de transferencia a la cuenta BBVA.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Operación / Recibo
                </label>
                <input
                  type="text"
                  placeholder="Ej: OP-948123 o Boleta B001-042"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono min-h-[44px]"
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-xs min-h-[44px]"
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
