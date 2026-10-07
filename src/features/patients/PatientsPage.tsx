import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Users,
  Search,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X
} from 'lucide-react'
import { api } from '../../services/api'
import { Patient, DocumentType } from '../../types'
import { useToast } from '../../app/providers/AppProviders'

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentType: 'DNI' as DocumentType,
    documentNumber: '',
    birthDate: '',
    email: '',
    phone: '',
    address: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const loadPatients = async () => {
    try {
      setLoading(true)
      const data = await api.getPatients(search)
      setPatients(data)
    } catch {
      showToast('Error al cargar la lista de pacientes', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [search])

  useEffect(() => {
    if (searchParams.get('action') === 'new' && !showModal) {
      handleOpenCreate()
    }
  }, [searchParams])

  const handleOpenCreate = () => {
    setEditingPatient(null)
    setFormData({
      firstName: '',
      lastName: '',
      documentType: 'DNI',
      documentNumber: '',
      birthDate: '',
      email: '',
      phone: '',
      address: '',
    })
    setShowModal(true)
  }

  const handleOpenEdit = (patient: Patient) => {
    setEditingPatient(patient)
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      documentType: patient.documentType || 'DNI',
      documentNumber: patient.documentNumber,
      birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : '',
      email: patient.email || '',
      phone: patient.phone || '',
      address: patient.address || '',
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPatient(null)
    if (searchParams.has('action')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('action')
      setSearchParams(nextParams, { replace: true })
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.documentNumber.trim()) {
      showToast('Complete los nombres, apellidos y número de documento', 'warning')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        ...formData,
        birthDate: formData.birthDate || '1995-01-01',
      }
      if (editingPatient) {
        await api.updatePatient(editingPatient.id, payload)
        showToast('Paciente actualizado con éxito', 'success')
      } else {
        await api.createPatient(payload)
        showToast('Paciente registrado correctamente', 'success')
      }
      handleCloseModal()
      loadPatients()
      window.dispatchEvent(new CustomEvent('orthosmile:patient-created'))
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar los datos del paciente', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (patient: Patient) => {
    const nextStatus = !patient.active
    const confirmMsg = nextStatus
      ? `¿Desea reactivar a ${patient.firstName} ${patient.lastName}?`
      : `¿Desea dar de baja (desactivar) a ${patient.firstName} ${patient.lastName}?`

    if (window.confirm(confirmMsg)) {
      try {
        await api.togglePatientStatus(patient.id, nextStatus)
        showToast(`Paciente ${nextStatus ? 'reactivado' : 'desactivado'} con éxito`, 'info')
        loadPatients()
      } catch {
        showToast('Error al modificar el estado del paciente', 'error')
      }
    }
  }

  const filteredPatients = patients.filter((p) => {
    if (statusFilter === 'active') return p.active
    if (statusFilter === 'inactive') return !p.active
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Padrón de Pacientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Filiación, historiales y administración de expedientes clínicos.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors min-h-[44px]"
        >
          <Plus size={18} />
          <span>Nuevo Paciente</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Search input with 44px min height for mobile */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all min-h-[44px]"
            placeholder="Buscar por DNI, nombres, apellidos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[38px] ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({patients.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[38px] ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Activos ({patients.filter((p) => p.active).length})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[38px] ${
              statusFilter === 'inactive'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inactivos ({patients.filter((p) => !p.active).length})
          </button>
        </div>
      </div>

      {/* Main Content: Desktop Table & Mobile Stacked Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Cargando listado de pacientes...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No se encontraron pacientes con los criterios de búsqueda.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Paciente</th>
                    <th className="px-5 py-3.5">Identificación</th>
                    <th className="px-5 py-3.5">Contacto</th>
                    <th className="px-5 py-3.5">Dirección</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !patient.active ? 'opacity-60 bg-slate-50/40' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar size={12} />
                              <span>Nac: {patient.birthDate ? patient.birthDate.split('T')[0] : '-'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {patient.documentType}: {patient.documentNumber}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="space-y-0.5">
                          {patient.phone && (
                            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                              <Phone size={12} className="text-slate-400" />
                              <span>{patient.phone}</span>
                            </div>
                          )}
                          {patient.email && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Mail size={12} className="text-slate-400" />
                              <span className="truncate max-w-[160px]">{patient.email}</span>
                            </div>
                          )}
                          {!patient.phone && !patient.email && <span className="text-slate-400">-</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 max-w-[180px] truncate">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{patient.address || 'No registrada'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            patient.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {patient.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/clinical-history?patientId=${patient.id}`)}
                            className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Ver Historial Clínico"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(patient)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Editar Paciente"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(patient)}
                            className={`p-2 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                              patient.active
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={patient.active ? 'Desactivar paciente' : 'Activar paciente'}
                          >
                            {patient.active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards View (QA Mobile Approved) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`p-4 space-y-3 ${!patient.active ? 'opacity-60 bg-slate-50/50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {patient.documentType}: {patient.documentNumber}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        patient.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {patient.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{patient.phone || 'Sin teléfono'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">Nac: {patient.birthDate?.split('T')[0] || '-'}</span>
                    </div>
                  </div>

                  {/* Big Touch Target Actions for Mobile */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => navigate(`/clinical-history?patientId=${patient.id}`)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 bg-sky-50 text-sky-700 rounded-xl text-xs font-semibold hover:bg-sky-100 min-h-[44px]"
                    >
                      <FileText size={15} />
                      <span>Historial</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(patient)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 min-h-[44px]"
                    >
                      <Edit2 size={15} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleToggleStatus(patient)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold min-h-[44px] ${
                        patient.active
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {patient.active ? <XCircle size={15} /> : <CheckCircle size={15} />}
                      <span>{patient.active ? 'Baja' : 'Activar'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Create/Edit Patient (Mobile-friendly Sheet / Center dialog) */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={handleCloseModal}
            aria-hidden="true"
          />
          <div className="relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] z-10">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingPatient ? 'Editar Paciente' : 'Registrar Nuevo Paciente'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="Ej: Juan Carlos"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="Ej: Castro Silva"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
                  >
                    <option value="DNI">DNI (Perú)</option>
                    <option value="PASSPORT">Pasaporte</option>
                    <option value="OTHER">Otro Documento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    N° de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="8 dígitos para DNI"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="+51 987 654 321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="paciente@correo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dirección Residencial
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="Av. Principal 123, Distrito"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
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
                  {submitting ? 'Guardando...' : editingPatient ? 'Actualizar' : 'Guardar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
