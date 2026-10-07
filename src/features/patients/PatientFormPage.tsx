import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'
import { api } from '../../services/api'
import { DocumentType } from '../../types'

export const PatientFormPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEditMode = Boolean(id)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState<'save' | 'schedule'>('save')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
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

  // Load existing patient if in edit mode
  useEffect(() => {
    if (id) {
      api.getPatient(Number(id)).then((p) => {
        if (p) {
          setFormData({
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            documentType: (p.documentType as DocumentType) || 'DNI',
            documentNumber: p.documentNumber || '',
            birthDate: p.birthDate || '',
            phone: p.phone || '',
            email: p.email || '',
            address: p.address || '',
          })
        }
      }).catch((e) => {
        console.warn('[Load Patient for Edit Error]:', e)
      })
    }
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      // Only permit numbers and max 8 digits for Peruvian DNI
      const numericOnly = value.replace(/\D/g, '').slice(0, 8)
      setFormData((prev) => ({
        ...prev,
        documentNumber: numericOnly,
      }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    // Strict Peruvian DNI Validation
    if (formData.documentType === 'DNI') {
      const cleanDni = formData.documentNumber.trim()
      if (cleanDni.length !== 8 || !/^\d{8}$/.test(cleanDni)) {
        setErrorMsg('El DNI debe tener exactamente 8 dígitos numéricos válidos (sin letras ni caracteres especiales).')
        return
      }
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMsg('Nombres y apellidos son campos requeridos.')
      return
    }

    setIsSubmitting(true)

    try {
      let created: any
      const payload = {
        ...formData,
        birthDate: formData.birthDate || '1995-01-01',
      }
      if (isEditMode && id) {
        created = await api.updatePatient(Number(id), payload)
      } else {
        created = await api.createPatient(payload)
      }

      // 2. Also notify backup endpoint non-blocking
      fetch('/api/v1/patients', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }).catch(() => {})

      // 3. Notify app components immediately
      window.dispatchEvent(new CustomEvent('orthosmile:patient-created', { detail: created }))

      if (submitAction === 'schedule' && created?.id) {
        navigate(`/citas?patientId=${created.id}&action=new`, { replace: true })
      } else {
        navigate('/pacientes', { replace: true })
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el paciente en Firebase Firestore.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Top back action */}
      <button
        type="button"
        onClick={() => navigate('/pacientes')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-2 rounded-xl shadow-xs transition-colors min-h-[40px]"
      >
        <ArrowLeft size={16} />
        <span>Volver a Pacientes</span>
      </button>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 m-0">
            Registrar Nuevo Paciente
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
            Complete la información para abrir el expediente clínico en la base de datos
          </p>
        </div>

        {errorMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {/* Section: Identidad */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Datos Personales
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombres <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                  placeholder="Ej: Juan"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apellidos <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                  placeholder="Ej: Castro Silva"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Documento
                </label>
                <select
                  name="documentType"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                  value={formData.documentType}
                  onChange={handleChange}
                >
                  <option value="DNI">DNI (Documento Nacional)</option>
                  <option value="PASSPORT">Pasaporte</option>
                  <option value="OTHER">Carné de Extranjería / Otro</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Número de Documento <span className="text-rose-500">*</span>
                  </label>
                  {formData.documentType === 'DNI' && (
                    <span className="text-[11px] font-mono">
                      {formData.documentNumber.length === 8 ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> 8/8 dígitos válidos
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          {formData.documentNumber.length}/8 dígitos
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  name="documentNumber"
                  required
                  inputMode={formData.documentType === 'DNI' ? 'numeric' : 'text'}
                  maxLength={formData.documentType === 'DNI' ? 8 : 20}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                  placeholder={formData.documentType === 'DNI' ? 'Ej: 72345678 (8 dígitos numéricos)' : 'Número de documento'}
                  value={formData.documentNumber}
                  onChange={handleChange}
                />
                {formData.documentType === 'DNI' && (
                  <p className="text-[11px] text-slate-500 mt-1 m-0">
                    {formData.documentNumber.length === 8 ? (
                      <span className="text-emerald-600 font-medium">✓ Formato de DNI peruano correcto.</span>
                    ) : (
                      <span>Ingrese exactamente 8 números (solo dígitos).</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                name="birthDate"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                value={formData.birthDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Section: Contacto */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Información de Contacto
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono / Celular WhatsApp
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                  placeholder="+51 987 654 321"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                  placeholder="paciente@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dirección Residencial
              </label>
              <textarea
                name="address"
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Av. Principal 123, Distrito..."
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Bottom Actions (Full-width touch target) */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/pacientes')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 min-h-[44px]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              onClick={() => setSubmitAction('schedule')}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 min-h-[46px] disabled:opacity-60"
              title="Guardar paciente y abrir la pantalla de citas inmediatamente"
            >
              <Calendar size={18} />
              <span>Guardar y Agendar Cita</span>
            </button>

            <button
              type="submit"
              onClick={() => setSubmitAction('save')}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 min-h-[46px] disabled:opacity-60"
            >
              {isSubmitting && submitAction === 'save' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando en Firebase...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Guardar Paciente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
