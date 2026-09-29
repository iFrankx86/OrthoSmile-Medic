import React, { useState, useEffect } from 'react'
import { Payment, Patient } from '../../types/models'
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
} from 'lucide-react'

export const PaymentListPage: React.FC = () => {
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
  })

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/v1/payments').then((r) => r.json()),
      fetch('/api/v1/patients').then((r) => r.json()),
    ])
      .then(([payData, patData]) => {
        setPayments(Array.isArray(payData) ? payData : [])
        setPatients(Array.isArray(patData) ? patData : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const getPatientName = (id: number) => {
    const p = patients.find((pat) => pat.id === id)
    return p ? `${p.firstName} ${p.lastName}` : `Paciente #${id}`
  }

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: Number(newPayment.patientId),
          appointmentId: 1,
          amount: Number(newPayment.amount),
          paymentMethod: newPayment.paymentMethod,
          status: 'COMPLETADO',
          reference: newPayment.reference || `REC-${Date.now().toString().slice(-6)}`,
        }),
      })
      if (res.ok) {
        setShowModal(false)
        setNewPayment({ patientId: '', amount: '', paymentMethod: 'EFECTIVO', reference: '' })
        loadData()
      }
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
                    <span>Método: <strong className="text-slate-800">{p.paymentMethod}</strong></span>
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
                  <th className="py-3 px-4">Método de Pago</th>
                  <th className="py-3 px-4">Referencia</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Monto (PEN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
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
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                        <CreditCard size={12} />
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
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
                ))}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medio de Pago <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white min-h-[44px]"
                  value={newPayment.paymentMethod}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="YAPE_PLIN">Yape / Plin / Billetera Digital</option>
                  <option value="TARJETA">Tarjeta Débito / Crédito (POS)</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria (BCP / BBVA)</option>
                </select>
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
