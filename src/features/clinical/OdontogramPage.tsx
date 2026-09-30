import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Patient } from '../../types/models'
import {
  Smile,
  Save,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  User,
} from 'lucide-react'

// FDI Two-Digit Notation for Adult Dentition
const QUADRANT_1 = [18, 17, 16, 15, 14, 13, 12, 11] // Superior Derecho
const QUADRANT_2 = [21, 22, 23, 24, 25, 26, 27, 28] // Superior Izquierdo
const QUADRANT_4 = [48, 47, 46, 45, 44, 43, 42, 41] // Inferior Derecho
const QUADRANT_3 = [31, 32, 33, 34, 35, 36, 37, 38] // Inferior Izquierdo

type ToothCondition = 'SANO' | 'CARIES' | 'CURADO' | 'EXTRAIDO' | 'CORONA' | 'ENDODONCIA'

interface ConditionOption {
  key: ToothCondition
  label: string
  color: string
  border: string
  bg: string
  description: string
}

const CONDITIONS: ConditionOption[] = [
  {
    key: 'SANO',
    label: 'Sano',
    color: 'text-slate-700',
    border: 'border-slate-300',
    bg: 'bg-white',
    description: 'Estructura dental intacta',
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
    description: 'Diente extraído o ausente',
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
    description: 'Tratamiento de conducto',
  },
]

export const OdontogramPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialPatientId = searchParams.get('patientId') || ''

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId)
  const [teethData, setTeethData] = useState<Record<number, ToothCondition>>({})
  const [activeTool, setActiveTool] = useState<ToothCondition>('CARIES')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [archTab, setArchTab] = useState<'ALL' | 'UPPER' | 'LOWER'>('ALL')

  useEffect(() => {
    fetch('/api/v1/patients')
      .then((r) => r.json())
      .then((data) => {
        setPatients(Array.isArray(data) ? data : [])
        if (!selectedPatientId && data.length > 0) {
          setSelectedPatientId(String(data[0].id))
        }
      })
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
        if (snap.exists() && snap.data()?.odontogram) {
          if (isMounted) {
            setTeethData(snap.data().odontogram)
            localStorage.setItem(`ortho_odontogram_${selectedPatientId}`, JSON.stringify(snap.data().odontogram))
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

  const handleSave = async () => {
    if (selectedPatientId) {
      try {
        localStorage.setItem(`ortho_odontogram_${selectedPatientId}`, JSON.stringify(teethData))
        // Persist directly to Firebase Firestore
        await setDoc(
          doc(db, 'patients', String(selectedPatientId)),
          { odontogram: teethData, updatedAt: new Date().toISOString() },
          { merge: true }
        )
      } catch (e) {
        console.warn('[Firestore Odontogram Save Error]:', e)
      }
    }
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const handleReset = () => {
    if (window.confirm('¿Desea restablecer todos los dientes a estado Sano?')) {
      setTeethData({})
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

  const renderTooth = (num: number, isUpper: boolean) => {
    const condition = teethData[num] || 'SANO'
    const conf = CONDITIONS.find((c) => c.key === condition) || CONDITIONS[0]

    return (
      <button
        key={num}
        type="button"
        onClick={() => handleToothTap(num)}
        className="group relative flex flex-col items-center justify-center p-1 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-sky-400 active:scale-95 transition-all min-w-[36px] sm:min-w-[42px] touch-manipulation"
        title={`Pieza ${num} (${conf.label}) - Toca para cambiar a ${activeTool}`}
      >
        {/* FDI Tooth Number */}
        <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-700 tabular-nums">
          {num}
        </span>

        {/* Anatomical Tooth Visual Representation */}
        <div className="relative w-7 h-9 sm:w-8 sm:h-11 my-1 flex items-center justify-center">
          {/* Root representation */}
          <div
            className={`absolute ${
              isUpper ? 'top-0' : 'bottom-0'
            } w-2 h-3.5 rounded-full bg-slate-200/90`}
          />

          {/* Crown representation */}
          <div
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center transition-colors shadow-2xs ${
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
                : 'border-purple-600 bg-purple-500 text-white'
            }`}
          >
            {condition === 'EXTRAIDO' && <span className="font-bold text-xs">✕</span>}
            {condition === 'CORONA' && <span className="text-[9px] font-bold">C</span>}
            {condition === 'ENDODONCIA' && <span className="text-[9px] font-bold">E</span>}
          </div>
        </div>

        {/* Micro Condition Label */}
        <span
          className={`text-[8px] font-semibold uppercase tracking-tight truncate max-w-[34px] sm:max-w-[40px] ${
            condition === 'SANO' ? 'text-slate-400' : conf.color
          }`}
        >
          {condition === 'SANO' ? '—' : conf.label}
        </span>
      </button>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Smile className="text-sky-600" size={24} />
            <span>Odontograma Dental Interactivo</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 m-0">
            Nomenclatura FDI de 32 piezas dentales para diagnóstico clínico táctil
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
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-sm font-semibold shadow-xs transition-all min-h-[44px]"
          >
            {savedSuccess ? (
              <>
                <Check size={18} className="text-emerald-300" />
                <span>¡Guardado!</span>
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

      {/* Tactile Condition Tool Picker (Thumb zone friendly) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-400">
            Herramienta de Diagnóstico Activa
          </span>
          <span className="text-slate-500 font-medium">Toca un diente para aplicar</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
          Superior (Maxilar)
        </button>
        <button
          onClick={() => setArchTab('LOWER')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            archTab === 'LOWER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Inferior (Mandibular)
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
              <div className="w-0.5 h-14 bg-sky-200 mx-1 shrink-0" title="Línea media dental" />

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
              <span className="bg-white px-3">Oclusión Dental</span>
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
              <div className="w-0.5 h-14 bg-sky-200 mx-1 shrink-0" title="Línea media dental" />

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
          Resumen de Hallazgos Clínicos
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
    </div>
  )
}
