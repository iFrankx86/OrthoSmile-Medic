import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Patient } from '../../types'
import { api } from '../../services/api'
import {
  UserPlus,
  Search,
  Edit2,
  FileText,
  Phone,
  Mail,
  Calendar,
  Smile,
  X,
  User,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'

export const PatientListPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchPatients = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      // Direct Firebase Firestore retrieval
      const data = await api.getPatients(searchTerm)
      setPatients(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('[Firebase Patient Fetch Error]:', e)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()

    const handleFocus = () => fetchPatients(true)
    const handlePatientCreated = () => fetchPatients(true)

    window.addEventListener('focus', handleFocus)
    window.addEventListener('orthosmile:patient-created', handlePatientCreated)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('orthosmile:patient-created', handlePatientCreated)
    }
  }, [searchTerm])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-First Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Directorio de Pacientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 m-0">
            {patients.length} paciente(s) registrado(s) en la clínica
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchPatients()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-2xs transition-colors min-h-[44px]"
            title="Recargar lista de pacientes"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-sky-600' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <Link
            to="/pacientes/nuevo"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-sm font-semibold shadow-xs transition-all min-h-[44px]"
          >
            <UserPlus size={18} />
            <span>Nuevo Paciente</span>
          </Link>
        </div>
      </div>

      {/* Live Search Input (Thumb reach) */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-slate-200/90 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs transition-all min-h-[46px]"
          placeholder="Buscar por DNI, nombre, apellido o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] justify-center"
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Content: Mobile Cards + Desktop Table */}
      {loading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 m-0">Cargando directorio de pacientes...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <User size={24} />
          </div>
          <h3 className="text-base font-semibold text-slate-800 m-0">No se encontraron pacientes</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {searchTerm
              ? `No hay resultados para "${searchTerm}". Intenta con otro criterio.`
              : 'Empieza registrando el primer paciente para abrir su expediente clínico.'}
          </p>
          <Link
            to="/pacientes/nuevo"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 pt-2"
          >
            <UserPlus size={16} />
            <span>Crear primer paciente</span>
          </Link>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (< md): Ergonomic High-Density Touch Cards */}
          <div className="space-y-3 md:hidden">
            {patients.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all"
              >
                {/* Header Row: Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center font-bold text-sm shrink-0">
                      {p.firstName ? p.firstName[0].toUpperCase() : 'P'}
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900 text-sm leading-tight m-0">
                        {p.firstName} {p.lastName}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-mono">
                        <span className="text-[10px] font-bold px-1 rounded bg-slate-100 text-slate-600">
                          {p.documentType || 'DNI'}
                        </span>
                        <span className="tabular-nums">{p.documentNumber}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      p.active !== false
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {p.active !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Patient Metadata */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  {p.phone && (
                    <a
                      href={`tel:${p.phone}`}
                      className="flex items-center gap-1.5 text-slate-600 hover:text-sky-600 truncate py-1"
                    >
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate tabular-nums">{p.phone}</span>
                    </a>
                  )}
                  {p.birthDate && (
                    <div className="flex items-center gap-1.5 text-slate-500 py-1">
                      <Calendar size={13} className="text-slate-400 shrink-0" />
                      <span className="tabular-nums">{p.birthDate}</span>
                    </div>
                  )}
                  {p.email && (
                    <div className="col-span-2 flex items-center gap-1.5 text-slate-500 truncate py-0.5">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                </div>

                {/* Quick Clinical Touch Actions (Large Hitboxes) */}
                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100">
                  <Link
                    to={`/citas?patientId=${p.id}&action=new`}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 text-emerald-700 text-center min-h-[44px] hover:bg-emerald-100 active:scale-95 transition-all"
                    title="Agendar Cita Médica"
                  >
                    <Calendar size={16} />
                    <span className="text-[10px] font-semibold mt-0.5">Citar</span>
                  </Link>
                  <Link
                    to={`/odontograma?patientId=${p.id}`}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-sky-50 text-sky-700 text-center min-h-[44px] hover:bg-sky-100 active:scale-95 transition-all"
                  >
                    <Smile size={16} />
                    <span className="text-[10px] font-semibold mt-0.5">Odontogr.</span>
                  </Link>
                  <Link
                    to={`/historias?patientId=${p.id}`}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-indigo-50 text-indigo-700 text-center min-h-[44px] hover:bg-indigo-100 active:scale-95 transition-all"
                  >
                    <FileText size={16} />
                    <span className="text-[10px] font-semibold mt-0.5">Historia</span>
                  </Link>
                  <Link
                    to={`/pacientes/${p.id}/editar`}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 text-slate-700 text-center min-h-[44px] hover:bg-slate-200 active:scale-95 transition-all"
                  >
                    <Edit2 size={16} />
                    <span className="text-[10px] font-semibold mt-0.5">Editar</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW (md+): High-Density Data Grid */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Documento</th>
                    <th className="py-3 px-4">Paciente</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4">F. Nacimiento</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones Clínicas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs">
                        <span className="font-semibold text-slate-800">{p.documentType}: </span>
                        <span className="text-slate-600 tabular-nums">{p.documentNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {p.firstName} {p.lastName}
                        </div>
                        {p.address && <div className="text-xs text-slate-500 truncate max-w-xs">{p.address}</div>}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {p.phone && <div className="tabular-nums font-medium">{p.phone}</div>}
                        {p.email && <div className="text-slate-400 truncate max-w-[180px]">{p.email}</div>}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 font-mono tabular-nums">
                        {p.birthDate || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            p.active !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {p.active !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/citas?patientId=${p.id}&action=new`}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Agendar Cita Médica"
                          >
                            <Calendar size={18} />
                          </Link>
                          <Link
                            to={`/odontograma?patientId=${p.id}`}
                            className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
                            title="Ver Odontograma Dental"
                          >
                            <Smile size={18} />
                          </Link>
                          <Link
                            to={`/historias?patientId=${p.id}`}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Ver Historia Clínica"
                          >
                            <FileText size={18} />
                          </Link>
                          <Link
                            to={`/pacientes/${p.id}/editar`}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            title="Editar Datos"
                          >
                            <Edit2 size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
