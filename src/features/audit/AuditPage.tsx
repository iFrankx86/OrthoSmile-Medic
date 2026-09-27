import React, { useState, useEffect } from 'react'
import { Clock, User, RefreshCw } from 'lucide-react'
import { api } from '../../services/api'
import { AuditLog } from '../../types'
import { useToast } from '../../app/providers/AppProviders'

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState<string>('all')
  const { showToast } = useToast()

  const loadLogs = async () => {
    try {
      setLoading(true)
      const data = await api.getAuditLogs()
      setLogs(data)
    } catch {
      showToast('Error al cargar la bitácora de auditoría', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false
    return true
  })

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'UPDATE':
        return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'STATUS_CHANGE':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'LOGIN':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Registro de Auditoría y Seguridad
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bitácora inmutable con trazabilidad de acciones, usuarios y marcas de tiempo.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[44px]"
        >
          <RefreshCw size={15} />
          <span>Refrescar</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <select
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">Todas las operaciones</option>
            <option value="CREATE">Creaciones (CREATE)</option>
            <option value="UPDATE">Modificaciones (UPDATE)</option>
            <option value="STATUS_CHANGE">Cambios de Estado (STATUS_CHANGE)</option>
            <option value="LOGIN">Inicios de Sesión (LOGIN)</option>
          </select>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Mostrando {filteredLogs.length} eventos registrados
        </span>
      </div>

      {/* Audit Log Content: Desktop Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Cargando bitácora de auditoría...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No se encontraron eventos registrados.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Fecha y Hora</th>
                    <th className="px-5 py-3.5">Acción</th>
                    <th className="px-5 py-3.5">Entidad</th>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Usuario</th>
                    <th className="px-5 py-3.5">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-700 font-sans">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" />
                          <span>
                            {new Date(log.timestamp).toLocaleString('es-PE', {
                              dateStyle: 'short',
                              timeStyle: 'medium',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-800 font-sans font-medium">
                        {log.entityName}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                        #{log.entityId}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-sans font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-400" />
                          <span>{log.username || 'sistema'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-sans text-slate-600">
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards (QA Tested for Mobile Viewport) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getActionBadgeColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={12} />
                      <span>{new Date(log.timestamp).toLocaleTimeString('es-PE')}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-900 font-semibold flex items-center justify-between">
                    <span>
                      {log.entityName} #{log.entityId}
                    </span>
                    <span className="text-slate-500 font-normal">por {log.username || 'sistema'}</span>
                  </div>

                  {log.details && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg font-sans">
                      {log.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
