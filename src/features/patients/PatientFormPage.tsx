import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'

export const PatientFormPage: React.FC = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentType: 'DNI',
    documentNumber: '',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/v1/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        navigate('/pacientes')
      } else {
        const err = await res.json().catch(() => ({}))
        setErrorMsg(err.message || 'Error al guardar el paciente. Verifique los datos ingresados.')
      }
    } catch (e: any) {
      setErrorMsg('Error de conexión con el servidor. Intente nuevamente.')
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Documento <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="documentNumber"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                  placeholder="Ej: 72345678"
                  value={formData.documentNumber}
                  onChange={handleChange}
                />
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
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 min-h-[46px] disabled:opacity-60"
            >
              {isSubmitting ? (
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
