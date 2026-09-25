import { useState } from 'react'
import { usePagos } from '../hooks/usePagos'
import { PaymentMethod, PaymentStatus, PaymentRequest } from '../types/pagos.types'

export function PagosPage() {
  const { payments, loading, error, createPayment } = usePagos()

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    clinicalRecordId: 1,
    amount: 100.0,
    currency: 'PEN',
    paymentMethod: 'YAPE' as PaymentMethod,
    status: 'PAGADO' as PaymentStatus,
    reference: '',
    notes: '',
    paidAt: new Date().toISOString().slice(0, 16),
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const totalRecaudado = payments
    .filter((p) => p.status === 'PAGADO')
    .reduce((acc, p) => acc + Number(p.amount), 0)

  const totalPendiente = payments
    .filter((p) => p.status === 'PENDIENTE')
    .reduce((acc, p) => acc + Number(p.amount), 0)

  const openCreateModal = () => {
    setFormData({
      clinicalRecordId: 1,
      amount: 120.0,
      currency: 'PEN',
      paymentMethod: 'YAPE',
      status: 'PAGADO',
      reference: '',
      notes: '',
      paidAt: new Date().toISOString().slice(0, 16),
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSaving(true)

    try {
      const payload: PaymentRequest = {
        clinicalRecordId: Number(formData.clinicalRecordId),
        amount: Number(formData.amount),
        currency: formData.currency,
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
        paidAt: `${formData.paidAt}:00`,
      }
      await createPayment(payload)
      setShowModal(false)
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar pago')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Caja y Facturación</h1>
          <p className="text-muted mb-0">Gestión de cobros, métodos de pago electrónicos y comprobantes.</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary d-flex align-items-center gap-2">
          <span>💳</span> Registrar Nuevo Pago
        </button>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 border-start border-4 border-success">
            <div className="card-body">
              <span className="text-muted small fw-semibold text-uppercase">Total Recaudado</span>
              <h2 className="h3 fw-bold text-dark mt-1 mb-0">
                S/ {totalRecaudado.toFixed(2)} <small className="text-muted fs-6">PEN</small>
              </h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 border-start border-4 border-warning">
            <div className="card-body">
              <span className="text-muted small fw-semibold text-uppercase">Cobros Pendientes</span>
              <h2 className="h3 fw-bold text-dark mt-1 mb-0">
                S/ {totalPendiente.toFixed(2)} <small className="text-muted fs-6">PEN</small>
              </h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 border-start border-4 border-primary">
            <div className="card-body">
              <span className="text-muted small fw-semibold text-uppercase">Transacciones Realizadas</span>
              <h2 className="h3 fw-bold text-dark mt-1 mb-0">{payments.length}</h2>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Payments Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Fecha de Pago</th>
                <th>Historial Clínico</th>
                <th>Método</th>
                <th>Referencia / Nota</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="text-muted mt-2 mb-0">Cargando pagos...</p>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    No se han registrado pagos en el sistema.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="fw-semibold text-secondary">#{p.id}</span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">
                        {new Date(p.paidAt).toLocaleDateString('es-PE')}
                      </div>
                      <small className="text-muted">
                        {new Date(p.paidAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        Atención #{p.clinicalRecordId}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-info-subtle text-info border border-info-subtle">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <div className="small">{p.reference || '—'}</div>
                      {p.notes && <small className="text-muted d-block">{p.notes}</small>}
                    </td>
                    <td>
                      <span className="fw-bold text-dark">
                        {p.currency} {Number(p.amount).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          p.status === 'PAGADO'
                            ? 'bg-success'
                            : p.status === 'PARCIAL'
                            ? 'bg-warning text-dark'
                            : p.status === 'ANULADO'
                            ? 'bg-danger'
                            : 'bg-secondary'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Pago */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Registrar Cobro / Pago</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger small py-2">{formError}</div>}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">ID Atención Médica *</label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        min="1"
                        value={formData.clinicalRecordId}
                        onChange={(e) =>
                          setFormData({ ...formData, clinicalRecordId: Number(e.target.value) })
                        }
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Monto (Soles) *</label>
                      <div className="input-group">
                        <span className="input-group-text">S/</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          required
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Método de Pago *</label>
                      <select
                        className="form-select"
                        value={formData.paymentMethod}
                        onChange={(e) =>
                          setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })
                        }
                      >
                        <option value="YAPE">Yape</option>
                        <option value="PLIN">Plin</option>
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TARJETA">Tarjeta (POS)</option>
                        <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Estado *</label>
                      <select
                        className="form-select"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value as PaymentStatus })
                        }
                      >
                        <option value="PAGADO">Pagado</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="PARCIAL">Parcial</option>
                        <option value="ANULADO">Anulado</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Fecha y Hora de Cobro *</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        required
                        value={formData.paidAt}
                        onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">N° Operación / Referencia</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. OPER-984712 o voucher..."
                        value={formData.reference}
                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Observaciones</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Detalle o concepto del pago..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} className="btn btn-primary">
                    {isSaving ? 'Guardando...' : 'Confirmar Cobro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
