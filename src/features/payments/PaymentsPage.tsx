import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CreditCard,
  Plus,
  DollarSign,
  Receipt,
  Printer,
  X
} from 'lucide-react'
import { api } from '../../services/api'
import { Payment, Patient, PaymentMethod, PaymentStatus } from '../../types'
import { useToast } from '../../app/providers/AppProviders'

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')

  // Modal New Payment
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    patientId: '',
    clinicalRecordId: '1',
    amount: '',
    currency: 'PEN',
    paymentMethod: 'EFECTIVO' as PaymentMethod,
    status: 'PAGADO' as PaymentStatus,
    reference: '',
    notes: '',
  })

  // Receipt Modal
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [pmts, pats] = await Promise.all([
        api.getPayments(),
        api.getPatients(),
      ])
      setPayments(pmts)
      setPatients(pats)
    } catch {
      showToast('Error al cargar transacciones de caja', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      const patId = searchParams.get('patientId')
      const recId = searchParams.get('clinicalRecordId')
      setFormData({
        patientId: patId || (patients.length ? String(patients[0].id) : ''),
        clinicalRecordId: recId || '1',
        amount: '',
        currency: 'PEN',
        paymentMethod: 'EFECTIVO',
        status: 'PAGADO',
        reference: '',
        notes: '',
      })
      setShowModal(true)
    }
  }, [searchParams, patients])

  const handleOpenCreate = () => {
    setFormData({
      patientId: patients.length ? String(patients[0].id) : '',
      clinicalRecordId: '1',
      amount: '',
      currency: 'PEN',
      paymentMethod: 'EFECTIVO',
      status: 'PAGADO',
      reference: '',
      notes: '',
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    if (searchParams.get('action')) {
      searchParams.delete('action')
      setSearchParams(searchParams)
    }
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(formData.amount)
    if (isNaN(amt) || amt <= 0) {
      showToast('Ingrese un monto válido mayor a 0', 'warning')
      return
    }

    try {
      setSubmitting(true)
      await api.createPayment({
        patientId: formData.patientId ? Number(formData.patientId) : undefined,
        clinicalRecordId: Number(formData.clinicalRecordId) || 1,
        amount: amt,
        currency: formData.currency,
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        reference: formData.reference,
        notes: formData.notes,
        paidAt: new Date().toISOString(),
      })
      showToast('Cobro registrado exitosamente en caja', 'success')
      handleCloseModal()
      loadData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al registrar el cobro', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getPatientName = (patientId?: number) => {
    if (!patientId) return 'Paciente de turno'
    const p = patients.find((pat) => pat.id === patientId)
    return p ? `${p.firstName} ${p.lastName}` : `Paciente #${patientId}`
  }

  const renderBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAGADO':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Pagado
          </span>
        )
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Pendiente
          </span>
        )
      case 'PARCIAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            Parcial
          </span>
        )
      case 'ANULADO':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Anulado
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        )
    }
  }

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) return false
    return true
  })

  const totalCollected = filteredPayments
    .filter((p) => p.status === 'PAGADO')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Caja y Gestión de Pagos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Control de cobros por atención odontológica, emisión de recibos y arqueo.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors min-h-[44px]"
        >
          <Plus size={18} />
          <span>Registrar Cobro</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Cobrado (S/.)</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            S/. {totalCollected.toFixed(2)}
          </div>
          <span className="text-xs text-emerald-600 font-medium">
            {filteredPayments.filter((p) => p.status === 'PAGADO').length} recibos cobrados
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Medios Digitales (Yape / Plin / Tarjeta)</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {payments.filter((p) => ['YAPE', 'PLIN', 'TARJETA'].includes(p.paymentMethod)).length}
          </div>
          <span className="text-xs text-slate-400">Transacciones electrónicas</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Operaciones Totales</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {payments.length}
          </div>
          <span className="text-xs text-slate-400">Historial completo</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filtrar por Estado
          </label>
          <select
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="PAGADO">Pagado</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PARCIAL">Parcial</option>
            <option value="ANULADO">Anulado</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filtrar por Medio de Pago
          </label>
          <select
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">Todos los medios</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TARJETA">Tarjeta de Débito / Crédito</option>
            <option value="YAPE">Yape</option>
            <option value="PLIN">Plin</option>
            <option value="TRANSFERENCIA">Transferencia Bancaria</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
      </div>

      {/* Payments: Desktop Table & Mobile Stacked Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Cargando transacciones de caja...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No se encontraron transacciones con los filtros seleccionados.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Recibo / Ref</th>
                    <th className="px-5 py-3.5">Paciente</th>
                    <th className="px-5 py-3.5">Medio de Pago</th>
                    <th className="px-5 py-3.5">Fecha</th>
                    <th className="px-5 py-3.5">Monto</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          REC-{String(pmt.id).padStart(5, '0')}
                        </div>
                        <div className="text-xs text-slate-400">
                          {pmt.reference ? `Ref: ${pmt.reference}` : 'Sin referencia'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {getPatientName(pmt.patientId)}
                        </div>
                        <div className="text-xs text-slate-400">
                          Atención #{pmt.clinicalRecordId}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {pmt.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(pmt.paidAt || pmt.createdAt || Date.now()).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-900">
                        {pmt.currency} {Number(pmt.amount).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {renderBadge(pmt.status)}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedPaymentForReceipt(pmt)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-sky-50 text-sky-700 rounded-lg text-xs font-semibold border border-slate-200 hover:border-sky-200 transition-colors min-h-[36px]"
                        >
                          <Receipt size={14} />
                          <span>Ver Recibo</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards (QA Tested for Mobile Viewport) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredPayments.map((pmt) => (
                <div key={pmt.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        REC-{String(pmt.id).padStart(5, '0')}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {getPatientName(pmt.patientId)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-base text-sky-700">
                        {pmt.currency} {Number(pmt.amount).toFixed(2)}
                      </div>
                      {renderBadge(pmt.status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                    <span className="font-semibold text-slate-700">{pmt.paymentMethod}</span>
                    <span>
                      {new Date(pmt.paidAt || Date.now()).toLocaleDateString('es-PE')}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedPaymentForReceipt(pmt)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-200 min-h-[44px]"
                  >
                    <Receipt size={16} />
                    <span>Ver Comprobante de Caja</span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Registrar Cobro */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Registrar Cobro en Caja
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paciente *
                </label>
                <select
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                >
                  <option value="">Seleccione paciente...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} (DNI: {p.documentNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Moneda
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="PEN">PEN (Soles)</option>
                    <option value="USD">USD (Dólares)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Medio de Pago *
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="YAPE">Yape</option>
                  <option value="PLIN">Plin</option>
                  <option value="TARJETA">Tarjeta de Débito / Crédito</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  N° Operación / Referencia
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                  placeholder="Ej: OPER-928472"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado del Pago
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentStatus })}
                >
                  <option value="PAGADO">Pagado (Total)</option>
                  <option value="PARCIAL">Pago Parcial / Anticipo</option>
                  <option value="PENDIENTE">Pendiente por Cobrar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Concepto / Observaciones
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  placeholder="Ej: Mensualidad ortodoncia, profilaxis..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors min-h-[44px]"
                >
                  {submitting ? 'Procesando...' : 'Emitir Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Recibo Detallado */}
      {selectedPaymentForReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-sky-700">OrthoSmile Medic</h3>
                <p className="text-xs text-slate-500">Clínica Odontológica Especializada</p>
              </div>
              <button
                onClick={() => setSelectedPaymentForReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Comprobante de Caja
              </span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                REC-{String(selectedPaymentForReceipt.id).padStart(5, '0')}
              </div>
              <div className="mt-1">{renderBadge(selectedPaymentForReceipt.status)}</div>
            </div>

            <div className="space-y-2 text-xs border-y border-slate-100 py-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Paciente:</span>
                <span className="font-bold text-slate-900">
                  {getPatientName(selectedPaymentForReceipt.patientId)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha:</span>
                <span className="font-medium text-slate-800">
                  {new Date(selectedPaymentForReceipt.paidAt || Date.now()).toLocaleString('es-PE')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Medio:</span>
                <span className="font-semibold text-slate-800">
                  {selectedPaymentForReceipt.paymentMethod}
                </span>
              </div>
              {selectedPaymentForReceipt.reference && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Referencia:</span>
                  <span className="font-mono text-slate-700">
                    {selectedPaymentForReceipt.reference}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-base font-extrabold text-slate-900 pt-1">
              <span>Total Cobrado:</span>
              <span className="text-xl text-sky-700">
                {selectedPaymentForReceipt.currency} {Number(selectedPaymentForReceipt.amount).toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold min-h-[44px]"
              >
                <Printer size={15} />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => setSelectedPaymentForReceipt(null)}
                className="flex items-center justify-center py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold min-h-[44px]"
              >
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
