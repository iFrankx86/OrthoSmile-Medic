import React, { useState, useEffect } from 'react'
import { Professional } from '../../types/models'
import { api } from '../../services/api'
import { UserCheck, Award, Phone, Shield, Stethoscope, CheckCircle2 } from 'lucide-react'

export const ProfessionalListPage: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProfessionals()
      .then((data) => setProfessionals(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Cuerpo Médico Odontológico
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 m-0">
          Especialistas titulares y colegiados acreditados por el Colegio Odontológico del Perú (COP)
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 m-0">Cargando especialistas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {professionals.map((prof) => (
            <div
              key={prof.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center font-bold text-lg shrink-0">
                    <Stethoscope size={24} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 m-0 leading-snug">
                      Dr. {prof.firstName} {prof.lastName}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded-full mt-1">
                      {prof.specialty}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Colegiatura Oficial:</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {prof.licenseNumber}
                    </span>
                  </div>

                  {prof.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Teléfono Directo:</span>
                      <a
                        href={`tel:${prof.phone}`}
                        className="font-mono font-medium text-sky-600 hover:underline tabular-nums"
                      >
                        {prof.phone}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Estado de Acreditación:</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle2 size={12} />
                      <span>Habilitado COP</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <a
                  href={`tel:${prof.phone || ''}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors min-h-[42px]"
                >
                  <Phone size={14} className="text-emerald-600" />
                  <span>Contactar Especialista</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
