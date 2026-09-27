import React, { useState, useEffect } from 'react'
import { Payment, Patient } from '../../types/models'
import { CreditCard, DollarSign, Plus, CheckCircle, Clock } from 'lucide-react'

export const PaymentListPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/payments').then((r) => r.json()),
      fetch('/api/v1/patients').then((r) => r.json()),
    ])
      .then(([payData, patData]) => {
        setPayments(Array.isArray(payData) ? payData : [])
        setPatients(Array.isArray(patData) ? patData : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const getPatientName = (id: number) => {
    const p = patients.find((pat) => pat.id === id)
    return p ? `${p.firstName} ${p.lastName}` : `Paciente #${id}`
  }

  const totalCollected = payments
    .filter((p) => p.status === 'COMPLETADO')
    .reduce((acc, p) => acc + Number(p.amount), 0)

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Caja y Registro de Pagos</h3>
          <p className="text-muted small mb-0">Control financiero y facturación de consultas</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="bg-white border rounded-3 px-3 py-2 shadow-sm text-end">
            <div className="extra-small text-muted">Total Recaudado:</div>
            <div className="fw-bold text-success fs-5">S/ {totalCollected.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Código / Fecha</th>
                  <th>Paciente</th>
                  <th>Monto</th>
                  <th>Método de Pago</th>
                  <th>Estado</th>
                  <th>Referencia</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm me-2"></div>
                      Cargando pagos desde Supabase...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No hay pagos registrados.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id}>
                      <td className="ps-4 font-monospace">
                        <div className="fw-bold text-dark">#PAY-{p.id}</div>
                        <div className="extra-small text-muted">{new Date(p.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="fw-semibold text-dark">{getPatientName(p.patientId)}</td>
                      <td className="fw-bold text-success">
                        {p.currency} {Number(p.amount).toFixed(2)}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.status === 'COMPLETADO' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="small text-muted">{p.reference || p.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
