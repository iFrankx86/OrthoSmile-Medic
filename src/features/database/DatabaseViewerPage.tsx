import React, { useState, useEffect } from 'react'
import { Database, RefreshCw, CheckCircle2, Server, Table } from 'lucide-react'

export const DatabaseViewerPage: React.FC = () => {
  const [tables, setTables] = useState<Record<string, any>>({})
  const [selectedTable, setSelectedTable] = useState<string>('patients')
  const [loading, setLoading] = useState(true)

  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/database/tables')
      const data = await res.json()
      setTables(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseInfo()
  }, [])

  const currentTable = tables[selectedTable]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Inspector de Base de Datos PostgreSQL</h3>
          <p className="text-muted small mb-0">Visualizador en tiempo real conectado a Supabase Cloud</p>
        </div>
        <button onClick={fetchDatabaseInfo} className="btn btn-outline-primary d-flex align-items-center gap-2 shadow-sm">
          <RefreshCw size={16} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      <div className="alert alert-light border shadow-sm mb-4">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success">🟢 Supabase PostgreSQL En Línea</span>
          <span className="small text-dark">
            Conectado al proyecto: <strong className="font-monospace text-primary">tjswlduwnrrudlrnqvfs</strong> en tiempo real. 
            Cualquier cambio guardado en la app se refleja inmediatamente en tu Supabase Dashboard.
          </span>
          <span className="badge bg-light text-muted border ms-auto font-monospace extra-small">
            Port 5432 / PostgreSQL 17
          </span>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-3">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom">
              <h6 className="fw-bold mb-0 text-dark">Tablas del Sistema</h6>
            </div>
            <div className="list-group list-group-flush">
              {Object.keys(tables).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTable(t)}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    selectedTable === t ? 'active' : ''
                  }`}
                >
                  <span className="font-monospace small">{t}</span>
                  <span className={`badge ${selectedTable === t ? 'bg-white text-dark' : 'bg-light text-secondary border'}`}>
                    {tables[t].count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-9">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0 text-dark font-monospace">
                Tabla: {selectedTable}
              </h6>
              <span className="small text-muted">
                {currentTable?.count || 0} registro(s) encontrados
              </span>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5 text-muted">
                  <div className="spinner-border spinner-border-sm me-2"></div>
                  Consultando tabla desde PostgreSQL...
                </div>
              ) : !currentTable || currentTable.data.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  La tabla está vacía o no tiene registros aún.
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '500px' }}>
                  <table className="table table-sm table-hover align-middle mb-0 extra-small">
                    <thead className="table-light sticky-top">
                      <tr>
                        {Object.keys(currentTable.data[0]).map((col) => (
                          <th key={col} className="font-monospace px-3 py-2">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentTable.data.map((row: any, idx: number) => (
                        <tr key={idx}>
                          {Object.keys(row).map((col) => (
                            <td key={col} className="px-3 py-2 text-truncate" style={{ maxWidth: '200px' }}>
                              {row[col] === null ? (
                                <span className="text-muted fst-italic">null</span>
                              ) : typeof row[col] === 'object' ? (
                                JSON.stringify(row[col])
                              ) : (
                                String(row[col])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
