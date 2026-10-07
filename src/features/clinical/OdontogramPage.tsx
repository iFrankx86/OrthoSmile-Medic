import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { api } from '../../services/api'
import { Patient } from '../../types'
import {
  Smile,
  Save,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  User,
  Edit3,
  X,
  Layers,
  FileText,
  AlertTriangle,
} from 'lucide-react'

// FDI Two-Digit Notation for Adult Dentition
const QUADRANT_1 = [18, 17, 16, 15, 14, 13, 12, 11] // Superior Derecho
const QUADRANT_2 = [21, 22, 23, 24, 25, 26, 27, 28] // Superior Izquierdo
const QUADRANT_4 = [48, 47, 46, 45, 44, 43, 42, 41] // Inferior Derecho
const QUADRANT_3 = [31, 32, 33, 34, 35, 36, 37, 38] // Inferior Izquierdo

export type ToothCondition =
  | 'SANO'
  | 'CARIES'
  | 'CURADO'
  | 'EXTRAIDO'
  | 'CORONA'
  | 'ENDODONCIA'
  | 'IMPLANTE'
  | 'ORTODONCIA'

export interface ToothDetail {
  condition: ToothCondition
  surfaces?: string[]
  notes?: string
}

export interface ConditionOption {
  key: ToothCondition
  label: string
  color: string
  border: string
  bg: string
  description: string
}

export const CONDITIONS: ConditionOption[] = [
  {
    key: 'SANO',
    label: 'Sano',
    color: 'text-slate-700',
    border: 'border-slate-300',
    bg: 'bg-white',
    description: 'Estructura intacta',
  },
  {
    key: 'CARIES',
    label: 'Caries',
    color: 'text-rose-700',
    border: 'border-rose-300',
    bg: 'bg-rose-500',
    description: 'Lesión cariosa activa',
  },
  {
    key: 'CURADO',
    label: 'Obturado',
    color: 'text-sky-700',
    border: 'border-sky-300',
    bg: 'bg-sky-500',
    description: 'Restauración / Resina',
  },
  {
    key: 'EXTRAIDO',
    label: 'Ausente',
    color: 'text-slate-500',
    border: 'border-slate-400',
    bg: 'bg-slate-400',
    description: 'Diente extraído',
  },
  {
    key: 'CORONA',
    label: 'Corona',
    color: 'text-amber-700',
    border: 'border-amber-300',
    bg: 'bg-amber-400',
    description: 'Prótesis fija / Corona',
  },
  {
    key: 'ENDODONCIA',
    label: 'Endodoncia',
    color: 'text-purple-700',
    border: 'border-purple-300',
    bg: 'bg-purple-500',
    description: 'Tratamiento conducto',
  },
  {
    key: 'IMPLANTE',
    label: 'Implante',
    color: 'text-teal-700',
    border: 'border-teal-300',
    bg: 'bg-teal-500',
    description: 'Implante osteointegrado',
  },
  {
    key: 'ORTODONCIA',
    label: 'Ortodoncia',
    color: 'text-indigo-700',
    border: 'border-indigo-300',
    bg: 'bg-indigo-500',
    description: 'Bracket / Aparatología',
  },
]

const TOOTH_NAMES: Record<number, string> = {
  18: 'Tercer Molar Sup. Derecho',
  17: 'Segundo Molar Sup. Derecho',
  16: 'Primer Molar Sup. Derecho',
  15: 'Segundo Premolar Sup. Derecho',
  14: 'Primer Premolar Sup. Derecho',
  13: 'Canino Sup. Derecho',
  12: 'Incisivo Lateral Sup. Derecho',
  11: 'Incisivo Central Sup. Derecho',

  21: 'Incisivo Central Sup. Izquierdo',
  22: 'Incisivo Lateral Sup. Izquierdo',
  23: 'Canino Sup. Izquierdo',
  24: 'Primer Premolar Sup. Izquierdo',
  25: 'Segundo Premolar Sup. Izquierdo',
  26: 'Primer Molar Sup. Izquierdo',
  27: 'Segundo Molar Sup. Izquierdo',
  28: 'Tercer Molar Sup. Izquierdo',

  48: 'Tercer Molar Inf. Derecho',
  47: 'Segundo Molar Inf. Derecho',
  46: 'Primer Molar Inf. Derecho',
  45: 'Segundo Premolar Inf. Derecho',
  44: 'Primer Premolar Inf. Derecho',
  43: 'Canino Inf. Derecho',
  42: 'Incisivo Lateral Inf. Derecho',
  41: 'Incisivo Central Inf. Derecho',

  31: 'Incisivo Central Inf. Izquierdo',
  32: 'Incisivo Lateral Inf. Izquierdo',
  33: 'Canino Inf. Izquierdo',
  34: 'Primer Premolar Inf. Izquierdo',
  35: 'Segundo Premolar Inf. Izquierdo',
  36: 'Primer Molar Inf. Izquierdo',
  37: 'Segundo Molar Inf. Izquierdo',
  38: 'Tercer Molar Inf. Izquierdo',
}

const SURFACES = [
  { key: 'OCLUSAL', label: 'Oclusal / Incisal', short: 'O' },
  { key: 'VESTIBULAR', label: 'Vestibular', short: 'V' },
  { key: 'LINGUAL', label: 'Lingual / Palatina', short: 'L' },
  { key: 'MESIAL', label: 'Mesial', short: 'M' },
  { key: 'DISTAL', label: 'Distal', short: 'D' },
]

export const OdontogramPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialPatientId = searchParams.get('patientId') || ''

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId)
  const [teethData, setTeethData] = useState<Record<number, ToothCondition>>({})
  const [teethDetails, setTeethDetails] = useState<Record<number, ToothDetail>>({})
  const [activeTool, setActiveTool] = useState<ToothCondition>('CARIES')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [archTab, setArchTab] = useState<'ALL' | 'UPPER' | 'LOWER'>('ALL')

  // Edit Tooth Modal state
  const [editingToothNum, setEditingToothNum] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState<ToothDetail>({
    condition: 'SANO',
    surfaces: [],
    notes: '',
  })

  useEffect(() => {
    api.getPatients()
      .then((data) => {
        setPatients(Array.isArray(data) ? data : [])
        if (!selectedPatientId && data.length > 0) {
          setSelectedPatientId(String(data[0].id))
        }
      })
      .catch((e) => console.error('[Patients Fetch Error]:', e))
  }, [])

  // Load patient saved teeth from Firestore and localStorage
  useEffect(() => {
    if (!selectedPatientId) return
    let isMounted = true

    async function loadTeeth() {
      // 1. Try Firestore cloud document first
      try {
        const docRef = doc(db, 'patients', String(selectedPatientId))
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const docData = snap.data()
          if (docData?.odontogram && isMounted) {
            setTeethData(docData.odontogram)
            if (docData.odontogramDetails) {
              setTeethDetails(docData.odontogramDetails)
            }
            localStorage.setItem(`ortho_odontogram_${selectedPatientId}`, JSON.stringify(docData.odontogram))
            return
          }
        }
      } catch (err) {
        console.warn('[Firestore Odontogram Load Error]:', err)
      }

      // 2. Fallback to localStorage
      try {
        const stored = localStorage.getItem(`ortho_odontogram_${selectedPatientId}`)
        if (stored && isMounted) {
          setTeethData(JSON.parse(stored))
          return
        }
      } catch (e) {}

      // 3. Default state if brand new patient
      if (isMounted) {
        setTeethData({})
        setTeethDetails({})
      }
    }

    loadTeeth()
    return () => {
      isMounted = false
    }
  }, [selectedPatientId])

  const handleToothTap = (toothNum: number) => {
    setTeethData((prev) => {
      const current = prev[toothNum] || 'SANO'
      const next = current === activeTool ? 'SANO' : activeTool
      return { ...prev, [toothNum]: next }
    })
  }

  const openEditModal = (toothNum: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingToothNum(toothNum)
    const existing = teethDetails[toothNum]
    const currentCondition = teethData[toothNum] || 'SANO'
    setEditFormData({
      condition: existing?.condition || currentCondition,
      surfaces: existing?.surfaces || [],
      notes: existing?.notes || '',
    })
  }

  const handleSaveToothDetail = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingToothNum) return

    setTeethData((prev) => ({
      ...prev,
      [editingToothNum]: editFormData.condition,
    }))

    setTeethDetails((prev) => ({
      ...prev,
      [editingToothNum]: editFormData,
    }))

    setEditingToothNum(null)
  }

  const handleSave = async () => {
    if (!selectedPatientId) return
    setIsSaving(true)
    try {
      localStorage.setItem(`ortho_odontogram_${selectedPatientId}`, JSON.stringify(teethData))
      // Persist directly to Firebase Firestore
      await setDoc(
        doc(db, 'patients', String(selectedPatientId)),
        {
          odontogram: teethData,
          odontogramDetails: teethDetails,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3500)
    } catch (e) {
      console.warn('[Firestore Odontogram Save Error]:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (window.confirm('¿Desea restablecer todos los dientes a estado Sano?')) {
      setTeethData({})
      setTeethDetails({})
    }
  }

  const selectedPatient = patients.find((p) => String(p.id) === String(selectedPatientId))

  // Diagnostic tally
  const summaryCounts = Object.values(teethData).reduce((acc, curr) => {
    if (curr && curr !== 'SANO') {
      acc[curr] = (acc[curr] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const totalDiagnosed = Object.values(teethData).filter((c) => c && c !== 'SANO').length

  const renderTooth = (num: number, isUpper: boolean) => {
    const condition = teethData[num] || 'SANO'
    const conf = CONDITIONS.find((c) => c.key === condition) || CONDITIONS[0]
    const details = teethDetails[num]
    const hasNotes = Boolean(details?.notes || (details?.surfaces && details.surfaces.length > 0))

    return (
      <div
        key={num}
        className="group relative flex flex-col items-center justify-center p-1 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-sky-400 transition-all min-w-[38px] sm:min-w-[44px]"
      >
        {/* FDI Tooth Number */}
        <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-700 tabular-nums">
          {num}
        </span>

        {/* Anatomical Tooth Visual Button (Touch to toggle condition) */}
        <button
          type="button"
          onClick={() => handleToothTap(num)}
          className="relative w-8 h-10 sm:w-9 sm:h-12 my-1 flex items-center justify-center active:scale-95 transition-transform"
          title={`Pieza ${num} (${conf.label}) - Toca para aplicar ${activeTool}`}
        >
          {/* Root representation */}
          <div
            className={`absolute ${
              isUpper ? 'top-0' : 'bottom-0'
            } w-2.5 h-4 rounded-full bg-slate-200/90`}
          />

          {/* Crown representation */}
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 flex items-center justify-center transition-colors shadow-2xs ${
              condition === 'SANO'
                ? 'border-slate-300 bg-slate-50'
                : condition === 'CARIES'
                ? 'border-rose-600 bg-rose-500 text-white'
                : condition === 'CURADO'
                ? 'border-sky-600 bg-sky-500 text-white'
                : condition === 'EXTRAIDO'
                ? 'border-slate-500 bg-slate-400 text-white'
                : condition === 'CORONA'
                ? 'border-amber-500 bg-amber-400 text-slate-900'
                : condition === 'ENDODONCIA'
                ? 'border-purple-600 bg-purple-500 text-white'
                : condition === 'IMPLANTE'
                ? 'border-teal-600 bg-teal-500 text-white'
                : 'border-indigo-600 bg-indigo-500 text-white'
            }`}
          >
            {condition === 'EXTRAIDO' && <span className="font-bold text-xs">✕</span>}
            {condition === 'CORONA' && <span className="text-[9px] font-bold">C</span>}
            {condition === 'ENDODONCIA' && <span className="text-[9px] font-bold">E</span>}
            {condition === 'IMPLANTE' && <span className="text-[9px] font-bold">IMP</span>}
            {condition === 'ORTODONCIA' && <span className="text-[9px] font-bold">ORT</span>}
          </div>

          {/* Small Indicator if tooth has custom notes/surfaces */}
          {hasNotes && (
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-sky-500 border border-white" />
          )}
        </button>

        {/* Micro Condition Label */}
        <span
          className={`text-[8px] font-semibold uppercase tracking-tight truncate max-w-[36px] sm:max-w-[42px] ${
            condition === 'SANO' ? 'text-slate-400' : conf.color
          }`}
        >
          {condition === 'SANO' ? '—' : conf.label}
        </span>

        {/* Direct Edit Button */}
        <button
          type="button"
          onClick={(e) => openEditModal(num, e)}
          className="mt-1 w-full py-0.5 rounded text-[9px] font-bold text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition-colors flex items-center justify-center gap-0.5"
          title={`Editar pieza ${num} en detalle`}
        >
          <Edit3 size={9} />
          <span>Editar</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Smile className="text-sky-600" size={24} />
            <span>Odontograma Dental Interactivo</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 m-0">
            Mapeo dental FDI de 32 piezas para diagnóstico clínico y registro fotográfico
          </p>
        </div>

        {/* Save button (desktop) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Limpiar</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-sm font-bold shadow-xs transition-all min-h-[44px]"
          >
            {savedSuccess ? (
              <>
                <Check size={18} className="text-emerald-300" />
                <span>¡Guardado Exitoso!</span>
              </>
            ) : isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Guardar Odontograma</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Patient Selector Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm shrink-0">
            <User size={18} />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Expediente del Paciente
            </label>
            <div className="font-semibold text-sm text-slate-900">
              {selectedPatient
                ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                : 'Seleccionar Paciente'}
            </div>
            {selectedPatient && (
              <span className="text-xs text-slate-500 font-mono">
                DNI: {selectedPatient.documentNumber}
              </span>
            )}
          </div>
        </div>

        <select
          className="w-full sm:w-72 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 min-h-[44px]"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.firstName} {p.lastName} (DNI: {p.documentNumber})
            </option>
          ))}
        </select>
      </div>

      {/* Tactile Condition Tool Picker */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-400">
            Herramienta Rápida Activa
          </span>
          <span className="text-slate-500 font-medium">Toca un diente para aplicar o pulsa "Editar" para detalles</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {CONDITIONS.map((cond) => {
            const isSelected = activeTool === cond.key
            return (
              <button
                key={cond.key}
                type="button"
                onClick={() => setActiveTool(cond.key)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all min-h-[50px] touch-manipulation ${
                  isSelected
                    ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full ${cond.bg} border border-black/10`} />
                  <span className={`text-xs font-bold ${isSelected ? 'text-sky-900' : 'text-slate-700'}`}>
                    {cond.label}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-full">
                  {cond.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile Arch View Tabs */}
      <div className="flex sm:hidden items-center justify-center gap-1 p-1 bg-slate-200/60 rounded-xl">
        <button
          onClick={() => setArchTab('ALL')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            archTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Todo el Arco
        </button>
        <button
          onClick={() => setArchTab('UPPER')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            archTab === 'UPPER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Superior
        </button>
        <button
          onClick={() => setArchTab('LOWER')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            archTab === 'LOWER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Inferior
        </button>
      </div>

      {/* Interactive Dental Arch Canvas */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-6 overflow-x-auto">
        {/* UPPER ARCH (Maxilar Superior) */}
        {(archTab === 'ALL' || archTab === 'UPPER') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-100 pb-1.5">
              <span>Cuadrante 1 (Superior Derecho)</span>
              <span className="text-slate-700 font-bold">ARCO MAXILAR SUPERIOR</span>
              <span>Cuadrante 2 (Superior Izquierdo)</span>
            </div>

            <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto py-2">
              {/* Q1: 18 -> 11 */}
              <div className="flex gap-1 sm:gap-1.5">
                {QUADRANT_1.map((num) => renderTooth(num, true))}
              </div>

              {/* Central Midline */}
              <div className="w-0.5 h-16 bg-sky-200 mx-1 shrink-0" title="Línea media dental" />

              {/* Q2: 21 -> 28 */}
              <div className="flex gap-1 sm:gap-1.5">
                {QUADRANT_2.map((num) => renderTooth(num, true))}
              </div>
            </div>
          </div>
        )}

        {/* Horizontal Arch Separator */}
        {archTab === 'ALL' && (
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-dashed border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
              <span className="bg-white px-3">Oclusión Dental · Línea Media</span>
            </div>
          </div>
        )}

        {/* LOWER ARCH (Mandibular Inferior) */}
        {(archTab === 'ALL' || archTab === 'LOWER') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-100 pb-1.5">
              <span>Cuadrante 4 (Inferior Derecho)</span>
              <span className="text-slate-700 font-bold">ARCO MANDIBULAR INFERIOR</span>
              <span>Cuadrante 3 (Inferior Izquierdo)</span>
            </div>

            <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto py-2">
              {/* Q4: 48 -> 41 */}
              <div className="flex gap-1 sm:gap-1.5">
                {QUADRANT_4.map((num) => renderTooth(num, false))}
              </div>

              {/* Central Midline */}
              <div className="w-0.5 h-16 bg-sky-200 mx-1 shrink-0" title="Línea media dental" />

              {/* Q3: 31 -> 38 */}
              <div className="flex gap-1 sm:gap-1.5">
                {QUADRANT_3.map((num) => renderTooth(num, false))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Diagnostic Findings Summary Card */}
      <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Resumen de Hallazgos Clínicos ({totalDiagnosed} piezas con tratamiento)
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(summaryCounts).length === 0 ? (
            <span className="text-xs text-slate-500 italic">
              Dentición completa sin patologías registradas (Todos sanos).
            </span>
          ) : (
            Object.entries(summaryCounts).map(([key, count]) => {
              const cond = CONDITIONS.find((c) => c.key === key)
              return (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cond?.border} bg-white shadow-2xs`}
                >
                  <span className={`w-2 h-2 rounded-full ${cond?.bg}`} />
                  <span className={cond?.color}>
                    {cond?.label}: <strong className="tabular-nums">{count}</strong> pieza(s)
                  </span>
                </span>
              )
            })
          )}
        </div>
      </div>

      {/* STICKY FLOATING BOTTOM BAR (ALWAYS ACCESSIBLE TO SAVE ON MOBILE & DESKTOP) */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 z-30 shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 truncate">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
            <Smile size={16} />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-slate-900 truncate">
              {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Paciente'}
            </div>
            <div className="text-[10px] text-slate-500">
              {totalDiagnosed === 0 ? 'Sin patologías' : `${totalDiagnosed} piezas diagnosticadas`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Limpiar
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md transition-all min-h-[44px]"
          >
            {savedSuccess ? (
              <>
                <Check size={16} className="text-emerald-300" />
                <span>¡Guardado!</span>
              </>
            ) : isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Guardar Odontograma</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODAL: EDITAR PIEZA DENTAL EN DETALLE */}
      {editingToothNum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setEditingToothNum(null)}
          />

          <div className="relative bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 m-0">
                  Editar Pieza FDI #{editingToothNum}
                </h3>
                <p className="text-xs text-sky-700 font-semibold m-0">
                  {TOOTH_NAMES[editingToothNum] || `Pieza ${editingToothNum}`}
                </p>
              </div>
              <button
                onClick={() => setEditingToothNum(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveToothDetail} className="space-y-4">
              {/* Condition Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Condición / Diagnóstico Dental
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map((cond) => {
                    const isSelected = editFormData.condition === cond.key
                    return (
                      <button
                        key={cond.key}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, condition: cond.key })}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold ring-2 ring-sky-500/20'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${cond.bg} border border-black/10 shrink-0`} />
                        <span className="text-xs">{cond.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Surfaces Affected Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Caras / Superficies Afectadas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {SURFACES.map((surf) => {
                    const isChecked = editFormData.surfaces?.includes(surf.key)
                    return (
                      <button
                        key={surf.key}
                        type="button"
                        onClick={() => {
                          const current = editFormData.surfaces || []
                          const updated = isChecked
                            ? current.filter((s) => s !== surf.key)
                            : [...current, surf.key]
                          setEditFormData({ ...editFormData, surfaces: updated })
                        }}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                          isChecked
                            ? 'border-sky-600 bg-sky-50 text-sky-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{surf.label}</span>
                        <span className="font-mono text-[10px] font-bold text-slate-400">({surf.short})</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Clinical Notes / Treatment Plan for this specific piece */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas Clínicas / Plan para esta Pieza
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Resina clase II pendiente, fisura oclusal, control de bracket..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingToothNum(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Guardar en Pieza #{editingToothNum}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
