import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/hooks/useAuth'
import { apiClient } from '../../infrastructure/api/apiClient'

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeAppointments: 0,
    todayAppointments: 0,
    totalIncome: 0,
    totalProfessionals: 0,
  })
  const [recentAppointments, setRecentAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [patientsRes, apptsRes, paymentsRes, profsRes] = await Promise.all([
          apiClient.get('/patients'),
          apiClient.get('/appointments'),
          apiClient.get('/payments'),
          apiClient.get('/professionals'),
        ])

        const patients = patientsRes.data || []
        const appts = apptsRes.data || []
        const payments = paymentsRes.data || []
        const profs = profsRes.data || []

        const todayStr = new Date().toISOString().split('T')[0]
        const todayAppts = appts.filter((a: any) => a.scheduledStart.startsWith(todayStr))
        const activeAppts = appts.filter((a: any) => a.status === 'PROGRAMADA' || a.status === 'CONFIRMADA')
        const income = payments
          .filter((p: any) => p.status === 'PAGADO')
          .reduce((acc: number, p: any) => acc + Number(p.amount), 0)

        setStats({
          totalPatients: patients.length,
          activeAppointments: activeAppts.length,
          todayAppointments: todayAppts.length,
          totalIncome: income,
          totalProfessionals: profs.length,
        })

        // Sort appts by scheduledStart descending for recent
        const sorted = [...appts].sort(
          (a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime()
        )
        setRecentAppointments(sorted.slice(0, 5))
      } catch (err) {
        console.error('Error loading dashboard data', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  return (
    <div className="py-4">
      {/* Welcome Banner */}
      <div className="card shadow-sm border-0 bg-primary text-white rounded-4 mb-4 overflow-hidden position-relative">
        <div className="card-body p-4 p-md-5">
          <div className="row align-items-center">
            <div className="col-12 col-md-8">
              <span className="badge bg-white text-primary fw-semibold mb-2">Panel Principal</span>
              <h1 className="h2 fw-bold mb-2">¡Bienvenido(a), {user?.username || 'Especialista'}!</h1>
              <p className="mb-0 opacity-75">
                Orthosmille Medic está en línea. Visualiza el estado de las citas odontológicas, expedientes y recaudaciones en tiempo real.
              </p>
            </div>
            <div className="col-12 col-md-4 text-md-end mt-3 mt-md-0">
              <div className="d-inline-flex gap-2">
                <Link to="/appointments" className="btn btn-light fw-semibold">
                  <span>📅</span> Ver Agenda
                </Link>
                <Link to="/patients" className="btn btn-outline-light fw-semibold">
                  <span>👥</span> Pacientes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle"
                style={{ width: 52, height: 52, fontSize: 24 }}
              >
                👥
              </div>
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Pacientes</span>
                <h3 className="h4 fw-bold text-dark mb-0">
                  {loading ? '...' : stats.totalPatients}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center bg-warning-subtle text-warning rounded-circle"
                style={{ width: 52, height: 52, fontSize: 24 }}
              >
                📅
              </div>
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Citas Activas</span>
                <h3 className="h4 fw-bold text-dark mb-0">
                  {loading ? '...' : stats.activeAppointments}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center bg-success-subtle text-success rounded-circle"
                style={{ width: 52, height: 52, fontSize: 24 }}
              >
                💰
              </div>
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Total Recaudado</span>
                <h3 className="h4 fw-bold text-dark mb-0">
                  {loading ? '...' : `S/ ${stats.totalIncome.toFixed(2)}`}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center bg-info-subtle text-info rounded-circle"
                style={{ width: 52, height: 52, fontSize: 24 }}
              >
                🩺
              </div>
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Odontólogos</span>
                <h3 className="h4 fw-bold text-dark mb-0">
                  {loading ? '...' : stats.totalProfessionals}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Grid & Recent Appointments */}
      <div className="row g-4">
        {/* Recent Appointments */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h2 className="h5 fw-bold mb-0 text-dark">📋 Últimas Citas Agendadas</h2>
              <Link to="/appointments" className="btn btn-sm btn-outline-primary">
                Ver Todas
              </Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Paciente ID</th>
                      <th>Motivo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted">
                          Cargando resumen...
                        </td>
                      </tr>
                    ) : recentAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted">
                          No hay citas recientes.
                        </td>
                      </tr>
                    ) : (
                      recentAppointments.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <div className="fw-semibold text-dark">
                              {new Date(a.scheduledStart).toLocaleDateString('es-PE')}
                            </div>
                            <small className="text-muted">
                              {new Date(a.scheduledStart).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </small>
                          </td>
                          <td>
                            <Link to={`/patients/${a.patientId}`} className="fw-semibold text-primary text-decoration-none">
                              Paciente #{a.patientId}
                            </Link>
                          </td>
                          <td>
                            <span className="small text-secondary">{a.reason || 'Consulta general'}</span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                a.status === 'CONFIRMADA'
                                  ? 'bg-primary'
                                  : a.status === 'ATENDIDA'
                                  ? 'bg-success'
                                  : a.status === 'CANCELADA'
                                  ? 'bg-danger'
                                  : 'bg-warning text-dark'
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 border-bottom">
              <h2 className="h5 fw-bold mb-0 text-dark">⚡ Módulos Rápidos</h2>
            </div>
            <div className="card-body d-flex flex-column gap-3">
              <Link
                to="/patients"
                className="d-flex align-items-center justify-content-between p-3 rounded-3 border text-decoration-none text-dark bg-light-subtle hover-shadow transition"
              >
                <div className="d-flex align-items-center gap-3">
                  <span className="fs-4">👥</span>
                  <div>
                    <strong className="d-block">Directorio Pacientes</strong>
                    <small className="text-muted">Expedientes y nuevos registros</small>
                  </div>
                </div>
                <span>➔</span>
              </Link>

              <Link
                to="/appointments"
                className="d-flex align-items-center justify-content-between p-3 rounded-3 border text-decoration-none text-dark bg-light-subtle hover-shadow transition"
              >
                <div className="d-flex align-items-center gap-3">
                  <span className="fs-4">📅</span>
                  <div>
                    <strong className="d-block">Agenda de Citas</strong>
                    <small className="text-muted">Turnos y confirmaciones</small>
                  </div>
                </div>
                <span>➔</span>
              </Link>

              <Link
                to="/clinical-history"
                className="d-flex align-items-center justify-content-between p-3 rounded-3 border text-decoration-none text-dark bg-light-subtle hover-shadow transition"
              >
                <div className="d-flex align-items-center gap-3">
                  <span className="fs-4">🩺</span>
                  <div>
                    <strong className="d-block">Historial Clínico</strong>
                    <small className="text-muted">Atenciones y diagnósticos</small>
                  </div>
                </div>
                <span>➔</span>
              </Link>

              <Link
                to="/payments"
                className="d-flex align-items-center justify-content-between p-3 rounded-3 border text-decoration-none text-dark bg-light-subtle hover-shadow transition"
              >
                <div className="d-flex align-items-center gap-3">
                  <span className="fs-4">💳</span>
                  <div>
                    <strong className="d-block">Caja y Pagos</strong>
                    <small className="text-muted">Cobros y métodos electrónicos</small>
                  </div>
                </div>
                <span>➔</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
