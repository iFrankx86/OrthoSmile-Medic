import React, { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Database,
  RefreshCw,
  Layers,
  FileCode,
  Table as TableIcon,
  Search,
  CheckCircle2,
  HardDrive,
  ChevronRight,
  X,
} from 'lucide-react'
import firebaseConfig from '../../../firebase-applet-config.json'

interface CollectionInfo {
  name: string
  label: string
  count: number
  data: any[]
}

const KNOWN_COLLECTIONS = [
  { key: 'patients', label: 'Pacientes' },
  { key: 'appointments', label: 'Agenda de Citas' },
  { key: 'clinical_records', label: 'Historiales Clínicos' },
  { key: 'payments', label: 'Caja y Pagos' },
  { key: 'professionals', label: 'Profesionales' },
  { key: 'users', label: 'Usuarios y Roles' },
  { key: 'audit_logs', label: 'Auditoría del Sistema' },
]

export const DatabaseViewerPage: React.FC = () => {
  const [collectionsData, setCollectionsData] = useState<Record<string, CollectionInfo>>({})
  const [selectedCollection, setSelectedCollection] = useState<string>('patients')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table')
  const [filterQuery, setFilterQuery] = useState('')

  const fetchFirestoreData = async () => {
    try {
      setLoading(true)
      const results: Record<string, CollectionInfo> = {}

      for (const col of KNOWN_COLLECTIONS) {
        try {
          const colRef = collection(db, col.key)
          const snapshot = await getDocs(colRef)
          const docsList: any[] = []
          snapshot.forEach((docSnap) => {
            docsList.push({
              _id: docSnap.id,
              ...docSnap.data(),
            })
          })
          results[col.key] = {
            name: col.key,
            label: col.label,
            count: docsList.length,
            data: docsList,
          }
        } catch (colErr) {
          results[col.key] = {
            name: col.key,
            label: col.label,
            count: 0,
            data: [],
          }
        }
      }

      setCollectionsData(results)
    } catch (e) {
      console.error('[Firestore Inspector] Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFirestoreData()
  }, [])

  const currentCollection = collectionsData[selectedCollection]
  const currentDocs = currentCollection?.data || []

  const filteredDocs = currentDocs.filter((doc) => {
    if (!filterQuery.trim()) return true
    const q = filterQuery.toLowerCase()
    return JSON.stringify(doc).toLowerCase().includes(q)
  })

  // Extract all columns
  const allColumns: string[] = []
  if (currentDocs.length > 0) {
    const colSet = new Set<string>()
    colSet.add('_id')
    currentDocs.forEach((d) => {
      Object.keys(d).forEach((k) => colSet.add(k))
    })
    allColumns.push(...Array.from(colSet))
  }

  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)'
  const projectId = firebaseConfig.projectId || 'gen-lang-client-0465390353'

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="text-amber-500" size={24} />
            <span>Inspector Firebase Firestore</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 m-0">
            Explorador de colecciones y documentos NoSQL en tiempo real
          </p>
        </div>

        <button
          onClick={fetchFirestoreData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition-all min-h-[44px]"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Consultando...' : 'Actualizar Datos'}</span>
        </button>
      </div>

      {/* Cloud Status Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Firestore En Línea</span>
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Proyecto: <strong className="font-mono text-slate-800">{projectId}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <HardDrive size={14} className="text-amber-500" />
          <span>DB: <strong className="text-slate-800">{databaseId}</strong></span>
          <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
            NoSQL
          </span>
        </div>
      </div>

      {/* Main Grid: Collections Selector + Document Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Collections Carousel on mobile / list on desktop */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Colecciones Firestore
          </span>

          {/* Mobile horizontal buttons */}
          <div className="flex lg:hidden gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {KNOWN_COLLECTIONS.map((c) => {
              const count = collectionsData[c.key]?.count ?? 0
              const isSelected = selectedCollection === c.key
              return (
                <button
                  key={c.key}
                  onClick={() => {
                    setSelectedCollection(c.key)
                    setFilterQuery('')
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[40px] ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  <span>{c.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                      isSelected ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Desktop list */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            {KNOWN_COLLECTIONS.map((c) => {
              const count = collectionsData[c.key]?.count ?? 0
              const isSelected = selectedCollection === c.key
              return (
                <button
                  key={c.key}
                  onClick={() => {
                    setSelectedCollection(c.key)
                    setFilterQuery('')
                  }}
                  className={`w-full flex items-center justify-between p-3.5 text-left transition-colors min-h-[48px] ${
                    isSelected
                      ? 'bg-sky-50 text-sky-900 font-bold border-l-4 border-sky-600'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold">{c.label}</div>
                    <div className="text-[11px] font-mono text-slate-400">/{c.key}</div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono tabular-nums ${
                      isSelected
                        ? 'bg-sky-200/70 text-sky-900 font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count} {count === 1 ? 'doc' : 'docs'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Document Viewer */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          {/* Header Bar */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 font-mono">
                /{selectedCollection}
              </span>
              <span className="text-xs text-slate-500">
                ({filteredDocs.length} de {currentDocs.length} docs)
              </span>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                <TableIcon size={14} className="inline mr-1" />
                Tabla
              </button>
              <button
                type="button"
                onClick={() => setViewMode('json')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'json' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                <FileCode size={14} className="inline mr-1" />
                JSON
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute inset-y-0 left-3 my-auto text-slate-400" />
              <input
                type="text"
                className="w-full pl-8 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder={`Filtrar en /${selectedCollection}...`}
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute inset-y-0 right-2 my-auto text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto max-h-[500px]">
            {loading ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs m-0">Consultando colección en tiempo real...</p>
              </div>
            ) : currentDocs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-1">
                <Database size={32} className="mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-700 m-0">Colección vacía</p>
                <p className="text-xs text-slate-500 m-0">No hay documentos registrados en /{selectedCollection}.</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No se encontraron documentos con "{filterQuery}".
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500">
                    <tr>
                      {allColumns.map((col) => (
                        <th key={col} className="py-2 px-3 whitespace-nowrap">
                          {col === '_id' ? 'ID (Documento)' : col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocs.map((row, idx) => (
                      <tr key={row._id || idx} className="hover:bg-slate-50/80">
                        {allColumns.map((col) => {
                          const val = row[col]
                          return (
                            <td key={col} className="py-2 px-3 whitespace-nowrap max-w-[200px] truncate">
                              {col === '_id' ? (
                                <span className="font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                                  {val}
                                </span>
                              ) : val === null || val === undefined ? (
                                <span className="text-slate-300 italic">null</span>
                              ) : typeof val === 'boolean' ? (
                                <span className={val ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                                  {val ? 'true' : 'false'}
                                </span>
                              ) : typeof val === 'object' ? (
                                <span className="text-slate-500">{JSON.stringify(val)}</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre className="p-4 bg-slate-900 text-emerald-400 text-xs font-mono overflow-auto m-0">
                {JSON.stringify(filteredDocs, null, 2)}
              </pre>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 size={13} />
              <span>TLS Encriptado</span>
            </span>
            <span>Total: {currentDocs.length} documentos</span>
          </div>
        </div>
      </div>
    </div>
  )
}
