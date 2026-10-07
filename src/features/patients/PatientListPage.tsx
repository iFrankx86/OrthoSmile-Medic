import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Patient, DocumentType } from '../../types'
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
  DollarSign,
  X,
  User,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Save,
  MapPin,
  Trash2,
} from 'lucide-react'

export const PatientListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentType: 'DNI' as DocumentType,
    documentNumber: '',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
  })

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
    window.addEventListener('orthosmile:patient-deleted', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('orthosmile:patient-created', handlePatientCreated)
      window.removeEventListener('orthosmile:patient-deleted', handleFocus)
    }
  }, [searchTerm])

  // Handle URL query parameters (e.g. ?action=new)
  useEffect(() => {
    if (searchParams.get('action') === 'new' && !showModal) {
      handleOpenCreate()
    }
  }, [searchParams])

  // ESC key listener to close modal safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        handleCloseModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showModal])

  const handleOpenCreate = () => {
    setEditingPatient(null)
    setModalError(null)
    setFormData({
      firstName: '',
      lastName: '',
      documentType: 'DNI',
      documentNumber: '',
      birthDate: '',
      phone: '',
      email: '',
      address: '',
    })
    setShowModal(true)
  }

  const handleOpenEdit = (patient: Patient) => {
    setEditingPatient(patient)
    setModalError(null)
    setFormData({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      documentType: (patient.documentType as DocumentType) || 'DNI',
      documentNumber: patient.documentNumber || '',
      birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPatient(null)
    setModalError(null)
    if (searchParams.has('action')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('action')
      setSearchParams(nextParams, { replace: true })
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'documentType') {
      let cleanedNum = formData.documentNumber
      if (value === 'DNI') {
        cleanedNum = cleanedNum.replace(/\D/g, '').slice(0, 8)
      }
      setFormData((prev) => ({
        ...prev,
        documentType: value as DocumentType,
        documentNumber: cleanedNum,
      }))
      return
    }

    if (name === 'documentNumber' && formData.documentType === 'DNI') {
      const numericOnly = value.replace(/\D/g, '').slice(0, 8)
      setFormData((prev) => ({ ...prev, documentNumber: numericOnly }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setModalError('Nombres y apellidos son campos obligatorios.')
      return
    }

    if (formData.documentType === 'DNI') {
      const cleanDni = formData.documentNumber.trim()
      if (cleanDni.length !== 8 || !/^\d{8}$/.test(cleanDni)) {
        setModalError('El DNI debe tener exactamente 8 dígitos numéricos válidos.')
        return
      }
    } else if (!formData.documentNumber.trim()) {
      setModalError('Ingrese el número de documento de identidad.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        birthDate: formData.birthDate || '1995-01-01',
      }
      if (editingPatient) {
        await api.updatePatient(editingPatient.id, payload)
      } else {
        await api.createPatient(payload)
      }

      handleCloseModal()
      await fetchPatients(true)
      window.dispatchEvent(new CustomEvent('orthosmile:patient-created'))
    } catch (err: any) {
      setModalError(err?.message || 'Error al guardar el paciente en la base de datos.')
    } finally {
      setSubmitting(false)
    }
  }

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

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-sm font-semibold shadow-xs transition-all min-h-[44px]"
          >
            <UserPlus size={18} />
            <span>Nuevo Paciente</span>
          </button>
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
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 pt-2"
          >
            <UserPlus size={16} />
            <span>Crear primer paciente</span>
          </button>
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

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        p.active !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {p.active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPatientToDelete(p)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar de Firebase"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
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
                <div className="grid grid-cols-5 gap-1 pt-2 border-t border-slate-100">
                  <Link
                    to={`/citas?patientId=${p.id}&action=new`}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-sky-50 text-sky-700 text-center min-h-[44px] hover:bg-sky-100 active:scale-95 transition-all"
                    title="Agendar Cita Médica"
                  >
                    <Calendar size={15} />
                    <span className="text-[9px] font-semibold mt-0.5">Citar</span>
                  </Link>
                  <Link
                    to={`/pagos?patientId=${p.id}&action=new`}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-center min-h-[44px] hover:bg-emerald-100 active:scale-95 transition-all"
                    title="Cobrar en Caja / Registrar Pago"
                  >
                    <DollarSign size={15} />
                    <span className="text-[9px] font-semibold mt-0.5">Cobrar</span>
                  </Link>
                  <Link
                    to={`/odontograma?patientId=${p.id}`}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-center min-h-[44px] hover:bg-indigo-100 active:scale-95 transition-all"
                  >
                    <Smile size={15} />
                    <span className="text-[9px] font-semibold mt-0.5">Odonto</span>
                  </Link>
                  <Link
                    to={`/historias?patientId=${p.id}`}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-purple-50 text-purple-700 text-center min-h-[44px] hover:bg-purple-100 active:scale-95 transition-all"
                  >
                    <FileText size={15} />
                    <span className="text-[9px] font-semibold mt-0.5">Historia</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-100 text-slate-700 text-center min-h-[44px] hover:bg-slate-200 active:scale-95 transition-all"
                    title="Editar Datos"
                  >
                    <Edit2 size={15} />
                    <span className="text-[9px] font-semibold mt-0.5">Editar</span>
                  </button>
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
                            to={`/pagos?patientId=${p.id}&action=new`}
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 bg-emerald-50/80 transition-colors"
                            title="Cobrar en Caja / Registrar Pago"
                          >
                            <DollarSign size={18} />
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
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            title="Editar Datos del Paciente"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPatientToDelete(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Eliminar Paciente de la Base de Datos"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* Modal Dialog for Registering and Editing Patients */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={handleCloseModal}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div
            className="relative bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0">
                    {editingPatient ? 'Editar Datos del Paciente' : 'Registrar Nuevo Paciente'}
                  </h2>
                  <p className="text-xs text-slate-500 m-0">
                    {editingPatient
                      ? 'Actualice la filiación y datos del expediente'
                      : 'Complete los datos para abrir el expediente clínico'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Cerrar ventana"
                title="Cerrar ventana (ESC)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Error banner */}
            {modalError && (
              <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombres <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="firstName"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="Ej: Juan Carlos"
                    value={formData.firstName}
                    onChange={handleFormChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apellidos <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="lastName"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="Ej: Pérez García"
                    value={formData.lastName}
                    onChange={handleFormChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Documento <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="documentType"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    value={formData.documentType}
                    onChange={handleFormChange}
                  >
                    <option value="DNI">DNI (Perú - 8 dígitos)</option>
                    <option value="PASSPORT">Pasaporte</option>
                    <option value="OTHER">Carné de Extranjería / Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    N° de Documento <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="documentNumber"
                    maxLength={formData.documentType === 'DNI' ? 8 : 20}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder={formData.documentType === 'DNI' ? '8 dígitos (Ej: 71234567)' : 'N° de identificación'}
                    value={formData.documentNumber}
                    onChange={handleFormChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    value={formData.birthDate}
                    onChange={handleFormChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / Celular (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="+51 987 654 321"
                    value={formData.phone}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="paciente@ejemplo.com"
                    value={formData.email}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dirección Residencial
                  </label>
                  <input
                    type="text"
                    name="address"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="Av. Javier Prado 1234, San Isidro"
                    value={formData.address}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 sticky bottom-0 bg-white">
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
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-98 disabled:opacity-60 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all min-h-[44px]"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{editingPatient ? 'Actualizar Paciente' : 'Guardar Paciente'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Delete Patient from Firebase */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 m-0">¿Eliminar paciente de Firebase?</h3>
              <p className="text-xs text-slate-500 m-0 leading-relaxed">
                Esta acción eliminará definitivamente a <strong className="text-slate-800">{patientToDelete.firstName} {patientToDelete.lastName}</strong> de la base de datos de Firebase Firestore.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPatientToDelete(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors min-h-[42px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    await api.deletePatient(patientToDelete.id)
                    setPatientToDelete(null)
                    await fetchPatients(true)
                  } catch (e: any) {
                    console.error('[Error deleting patient]:', e)
                  } finally {
                    setDeleting(false)
                  }
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-semibold shadow-xs transition-all min-h-[42px] flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Sí, eliminar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
