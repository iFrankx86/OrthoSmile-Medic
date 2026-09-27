import React, { useState, useEffect } from 'react'
import {
  UserCheck,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Award,
  Phone,
  Shield,
  X
} from 'lucide-react'
import { api } from '../../services/api'
import { Professional } from '../../types'
import { useToast } from '../../app/providers/AppProviders'

export function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProf, setEditingProf] = useState<Professional | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    licenseNumber: '',
    specialty: '',
    phone: '',
    active: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const loadProfessionals = async () => {
    try {
      setLoading(true)
      const data = await api.getProfessionals()
      setProfessionals(data)
    } catch {
      showToast('Error al cargar la lista de profesionales', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfessionals()
  }, [])

  const handleOpenCreate = () => {
    setEditingProf(null)
    setFormData({
      firstName: '',
      lastName: '',
      licenseNumber: '',
      specialty: 'Ortodoncia y Ortopedia Maxilar',
      phone: '',
      active: true,
    })
    setShowModal(true)
  }

  const handleOpenEdit = (prof: Professional) => {
    setEditingProf(prof)
    setFormData({
      firstName: prof.firstName,
      lastName: prof.lastName,
      licenseNumber: prof.licenseNumber,
      specialty: prof.specialty,
      phone: prof.phone || '',
      active: prof.active,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProf(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.licenseNumber || !formData.specialty) {
      showToast('Por favor ingrese todos los campos obligatorios (*)', 'warning')
      return
    }

    try {
      setSubmitting(true)
      if (editingProf) {
        await api.updateProfessional(editingProf.id, formData)
        showToast('Profesional actualizado con éxito', 'success')
      } else {
        await api.createProfessional(formData)
        showToast('Profesional odontólogo registrado con éxito', 'success')
      }
      handleCloseModal()
      loadProfessionals()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al guardar los datos del profesional', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (prof: Professional) => {
    const nextStatus = !prof.active
    const confirmMsg = nextStatus
      ? `¿Desea activar al Dr. ${prof.firstName} ${prof.lastName}?`
      : `¿Desea dar de baja o pausar al Dr. ${prof.firstName} ${prof.lastName}?`

    if (window.confirm(confirmMsg)) {
      try {
        await api.toggleProfessionalStatus(prof.id, nextStatus)
        showToast(`Estado del profesional actualizado a ${nextStatus ? 'activo' : 'inactivo'}`, 'info')
        loadProfessionals()
      } catch {
        showToast('Error al modificar estado', 'error')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Cuerpo Médico y Especialistas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registro de odontólogos, colegiaturas (COP) y especialidades clínicas.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors min-h-[44px]"
        >
          <Plus size={18} />
          <span>Registrar Profesional</span>
        </button>
      </div>

      {/* Grid of Specialists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-sm">
            Cargando especialistas...
          </div>
        ) : professionals.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-sm">
            No hay profesionales registrados en el sistema.
          </div>
        ) : (
          professionals.map((prof) => (
            <div
              key={prof.id}
              className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all ${
                !prof.active ? 'opacity-60 bg-slate-50/50' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      {prof.firstName.charAt(0)}{prof.lastName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Dr. {prof.firstName} {prof.lastName}
                      </h2>
                      <span className="text-xs font-semibold text-sky-600 block mt-0.5">
                        {prof.specialty}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Award size={14} className="text-slate-400 shrink-0" />
                    <span><strong>Colegiatura:</strong> {prof.licenseNumber}</span>
                  </div>
                  {prof.phone && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span><strong>Tel:</strong> {prof.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-700">
                    <Shield size={14} className="text-slate-400 shrink-0" />
                    <span>
                      <strong>Estado:</strong>{' '}
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          prof.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {prof.active ? 'Activo en agenda' : 'Suspendido'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons >= 44px */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(prof)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors min-h-[44px]"
                >
                  <Edit2 size={14} />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleToggleStatus(prof)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
                    prof.active
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {prof.active ? (
                    <>
                      <XCircle size={14} />
                      <span>Desactivar</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>Activar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear / Editar Profesional */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingProf ? 'Editar Profesional' : 'Registrar Profesional'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                      placeholder="Ej: Carlos"
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
                      placeholder="Ej: Pérez"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Colegiatura Odontológica (COP) *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="Ej: COP-10492"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Especialidad *
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  >
                    <option value="Ortodoncia y Ortopedia Maxilar">Ortodoncia y Ortopedia Maxilar</option>
                    <option value="Endodoncia y Estética Dental">Endodoncia y Estética Dental</option>
                    <option value="Cirugía Maxilofacial e Implantes">Cirugía Maxilofacial e Implantes</option>
                    <option value="Odontopediatría">Odontopediatría</option>
                    <option value="Periodoncia e Implantología">Periodoncia e Implantología</option>
                    <option value="Rehabilitación Oral">Rehabilitación Oral</option>
                    <option value="Odontología General y Prevención">Odontología General y Prevención</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="+51 987 654 321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
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
                  {submitting ? 'Guardando...' : editingProf ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
