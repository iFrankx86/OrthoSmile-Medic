import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  User,
  Plus,
  Clock,
  Stethoscope,
  DollarSign,
  X,
  ChevronRight
} from 'lucide-react'
import { api } from '../../services/api'
import { ClinicalRecord, Patient, Professional, Appointment } from '../../types'
import { useToast } from '../../app/providers/AppProviders'

export function ClinicalHistoryPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)
  const [records, setRecords] = useState<ClinicalRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  // New Record Modal
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    patientId: '',
    professionalId: '',
    appointmentId: '',
    attentionDate: new Date().toISOString(),
    chiefComplaint: '',
    diagnosis: '',
    treatmentPlan: '',
    clinicalNotes: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [pat, prof, appts] = await Promise.all([
          api.getPatients(),
          api.getProfessionals(),
          api.getAppointments(),
        ])
        setPatients(pat)
        setProfessionals(prof)
        setAppointments(appts)

        const paramPatientId = searchParams.get('patientId')
        if (paramPatientId) {
          setSelectedPatientId(Number(paramPatientId))
        } else if (pat.length > 0) {
          setSelectedPatientId(pat[0].id)
        }

        if (searchParams.get('action') === 'new') {
          handleOpenCreateFromParams(paramPatientId, searchParams.get('appointmentId'), searchParams.get('professionalId'))
        }
      } catch {
        showToast('Error al cargar datos clínicos', 'error')
      }
    }
    loadData()
  }, [])

  const handleOpenCreateFromParams = (patId?: string | null, apptId?: string | null, profId?: string | null) => {
    setFormData({
      patientId: patId || (patients.length ? String(patients[0].id) : ''),
      professionalId: profId || (professionals.length ? String(professionals[0].id) : ''),
      appointmentId: apptId || '',
      attentionDate: new Date().toISOString().substring(0, 16),
      chiefComplaint: '',
      diagnosis: '',
      treatmentPlan: '',
      clinicalNotes: '',
    })
    setShowModal(true)
  }

  useEffect(() => {
    if (!selectedPatientId) return
    async function loadRecords() {
      try {
        setLoadingRecords(true)
        const data = await api.getClinicalRecordsByPatient(selectedPatientId)
        setRecords(data)
      } catch {
        showToast('Error al cargar registros clínicos del paciente', 'error')
      } finally {
        setLoadingRecords(false)
      }
    }
    loadRecords()
  }, [selectedPatientId])

  const handleOpenCreate = () => {
    const defaultPatientId = selectedPatientId ? String(selectedPatientId) : patients.length ? String(patients[0].id) : ''
    const patientAppt = appointments.find(
      (a) => a.patientId === Number(defaultPatientId) && a.status !== 'CANCELADA' && a.status !== 'ATENDIDA'
    )

    setFormData({
      patientId: defaultPatientId,
      professionalId: patientAppt ? String(patientAppt.professionalId) : professionals.length ? String(professionals[0].id) : '',
      appointmentId: patientAppt ? String(patientAppt.id) : '',
      attentionDate: new Date().toISOString().substring(0, 16),
      chiefComplaint: patientAppt?.reason || '',
      diagnosis: '',
      treatmentPlan: '',
      clinicalNotes: '',
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    if (searchParams.get('action')) {
      searchParams.delete('action')
      setSearchParams(searchParams)
    }
  }

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.patientId || !formData.professionalId || !formData.chiefComplaint) {
      showToast('Por favor ingrese paciente, odontólogo y motivo principal', 'warning')
      return
    }

    try {
      setSubmitting(true)
      await api.createClinicalRecord({
        patientId: Number(formData.patientId),
        professionalId: Number(formData.professionalId),
        appointmentId: formData.appointmentId ? Number(formData.appointmentId) : 1,
        attentionDate: new Date(formData.attentionDate).toISOString(),
        chiefComplaint: formData.chiefComplaint,
        diagnosis: formData.diagnosis,
        treatmentPlan: formData.treatmentPlan,
        clinicalNotes: formData.clinicalNotes,
      })

      if (formData.appointmentId) {
        try {
          await api.updateAppointmentStatus(Number(formData.appointmentId), 'ATENDIDA')
        } catch {
          // ignore
        }
      }

      showToast('Atención clínica registrada exitosamente', 'success')
      handleCloseModal()
      if (selectedPatientId === Number(formData.patientId)) {
        const refreshed = await api.getClinicalRecordsByPatient(selectedPatientId)
        setRecords(refreshed)
      } else {
        setSelectedPatientId(Number(formData.patientId))
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al guardar atención médica', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)
  const getProfName = (id: number) => {
    const prof = professionals.find((p) => p.id === id)
    return prof ? `Dr. ${prof.firstName} ${prof.lastName}` : `Especialista #${id}`
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Historial Clínico Odontológico
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Filiación médica, diagnósticos, evolución del tratamiento y notas clínicas.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors min-h-[44px]"
        >
          <Plus size={18} />
          <span>Registrar Atención</span>
        </button>
      </div>

      {/* Main Grid: Patient Selector & Clinical Records */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient List (Dropdown on Mobile, Sidebar list on Desktop) */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100">
            <User size={16} className="text-sky-600" />
            <span>Seleccionar Paciente</span>
          </div>

          {/* Mobile Select (QA Approved for Mobile Viewports) */}
          <div className="lg:hidden">
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 min-h-[44px]"
              value={selectedPatientId || ''}
              onChange={(e) => setSelectedPatientId(Number(e.target.value))}
            >
              {patients.map((pat) => (
                <option key={pat.id} value={pat.id}>
                  {pat.firstName} {pat.lastName} ({pat.documentType}: {pat.documentNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Patient List */}
          <div className="hidden lg:block space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
            {patients.map((pat) => {
              const isSelected = pat.id === selectedPatientId
              return (
                <button
                  key={pat.id}
                  onClick={() => setSelectedPatientId(pat.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all min-h-[44px] flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-xs font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="text-sm font-bold truncate">
                      {pat.firstName} {pat.lastName}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                      {pat.documentNumber}
                    </div>
                  </div>
                  <ChevronRight size={16} className={isSelected ? 'text-white' : 'text-slate-300'} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Column: Patient Details & Records Timeline */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          {selectedPatient ? (
            <>
              {/* Selected Patient Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                    <span>
                      <strong className="text-slate-700">{selectedPatient.documentType}:</strong> {selectedPatient.documentNumber}
                    </span>
                    <span>
                      <strong className="text-slate-700">Nac:</strong> {selectedPatient.birthDate ? selectedPatient.birthDate.split('T')[0] : '-'}
                    </span>
                    <span>
                      <strong className="text-slate-700">Tel:</strong> {selectedPatient.phone || '-'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-sky-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors min-h-[44px]"
                >
                  <Plus size={16} />
                  <span>Nueva Atención</span>
                </button>
              </div>

              {/* Records Timeline */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Stethoscope size={16} className="text-sky-600" />
                  <span>Historial de Atenciones ({records.length})</span>
                </div>

                {loadingRecords ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Cargando historial del paciente...
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl p-6 text-slate-400 text-sm space-y-3">
                    <p>No hay atenciones clínicas registradas para este paciente.</p>
                    <button
                      onClick={handleOpenCreate}
                      className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold"
                    >
                      Registrar Primera Atención
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {records.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white space-y-3 shadow-2xs hover:border-slate-300 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                              Atención #{rec.id}
                            </span>
                            <span className="text-xs font-semibold text-slate-800">
                              {getProfName(rec.professionalId)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>
                              {new Date(rec.attentionDate).toLocaleString('es-PE', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-500 block mb-0.5">Motivo:</span>
                            <span className="text-slate-900 font-medium">{rec.chiefComplaint}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500 block mb-0.5">Diagnóstico:</span>
                            <span className="text-slate-900 font-semibold">{rec.diagnosis || 'No especificado'}</span>
                          </div>
                        </div>

                        {rec.treatmentPlan && (
                          <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-600 block mb-1">Plan de Tratamiento:</span>
                            <p className="text-slate-700">{rec.treatmentPlan}</p>
                          </div>
                        )}

                        {rec.clinicalNotes && (
                          <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-600 block mb-1">Evolución y Notas:</span>
                            <p className="text-slate-700">{rec.clinicalNotes}</p>
                          </div>
                        )}

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() =>
                              navigate(
                                `/payments?action=new&clinicalRecordId=${rec.id}&patientId=${selectedPatient.id}`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200 transition-colors min-h-[44px]"
                          >
                            <DollarSign size={14} />
                            <span>Cobrar Atención</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              Seleccione un paciente para ver su expediente e historial clínico.
            </div>
          )}
        </div>
      </div>

      {/* Modal Registrar Atención Clínica */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Registrar Atención Clínica
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Paciente *
                  </label>
                  <select
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  >
                    <option value="">Seleccione paciente...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} - DNI {p.documentNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Odontólogo a Cargo *
                  </label>
                  <select
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    value={formData.professionalId}
                    onChange={(e) => setFormData({ ...formData, professionalId: e.target.value })}
                  >
                    <option value="">Seleccione odontólogo...</option>
                    {professionals.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        Dr. {pr.firstName} {pr.lastName} - {pr.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha y Hora de Atención
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    value={formData.attentionDate}
                    onChange={(e) => setFormData({ ...formData, attentionDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cita Asociada (Opcional)
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    value={formData.appointmentId}
                    onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                  >
                    <option value="">Sin cita previa directa</option>
                    {appointments
                      .filter((a) => !formData.patientId || a.patientId === Number(formData.patientId))
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          Cita #{a.id} - {new Date(a.scheduledStart).toLocaleDateString()}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Motivo Principal de Consulta *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="Ej: Dolor pulsátil en molar, ajuste ortodóntico"
                    value={formData.chiefComplaint}
                    onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Diagnóstico Odontológico
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[44px]"
                    placeholder="Ej: Pulpitis reversible, apiñamiento dentario"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Plan de Tratamiento / Procedimiento
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                    placeholder="Procedimiento ejecutado y próximos pasos"
                    value={formData.treatmentPlan}
                    onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Evolución y Observaciones
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                    placeholder="Indicaciones post-atención, medicación prescrita"
                    value={formData.clinicalNotes}
                    onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
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
                  {submitting ? 'Guardando...' : 'Guardar Atención'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
