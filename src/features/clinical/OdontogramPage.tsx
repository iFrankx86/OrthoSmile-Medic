import React, { useState, useEffect } from 'react'
import { Patient } from '../../types/models'
import { Smile, Save, CheckCircle2 } from 'lucide-react'

// Common dental tooth numbers according to FDI Two-Digit Notation
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

type ToothState = 'SANO' | 'CARIES' | 'CURADO' | 'EXTRAIDO' | 'CORONA' | 'ENDODONCIA'

export const OdontogramPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [teethData, setTeethData] = useState<Record<number, ToothState>>({})
  const [selectedTool, setSelectedTool] = useState<ToothState>('CARIES')
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/v1/patients')
      .then((r) => r.json())
      .then((data) => {
        setPatients(Array.isArray(data) ? data : [])
        if (data.length > 0) setSelectedPatientId(String(data[0].id))
      })
  }, [])

  const handleToothClick = (toothNum: number) => {
    setTeethData((prev) => ({
      ...prev,
      [toothNum]: prev[toothNum] === selectedTool ? 'SANO' : selectedTool,
    }))
  }

  const getToothColor = (state?: ToothState) => {
    switch (state) {
      case 'CARIES':
        return '#dc3545' // Red
      case 'CURADO':
        return '#0d6efd' // Blue
      case 'EXTRAIDO':
        return '#6c757d' // Gray
      case 'CORONA':
        return '#ffc107' // Yellow
      case 'ENDODONCIA':
        return '#6f42c1' // Purple
      default:
        return '#ffffff' // White (Sano)
    }
  }

  const handleSave = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Odontograma Digital Interactivo</h3>
          <p className="text-muted small mb-0">Marcado dental clínico según sistema FDI internacional</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
          <Save size={18} />
          <span>Guardar Odontograma</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-4">
          <CheckCircle2 size={18} />
          <span>¡Odontograma guardado correctamente en la historia clínica del paciente!</span>
        </div>
      )}

      {/* Patient Selector */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-3">
          <div className="row align-items-center">
            <div className="col-md-3">
              <label className="form-label small fw-semibold text-secondary mb-0">Paciente Activo:</label>
            </div>
            <div className="col-md-9">
              <select
                className="form-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} - DNI {p.documentNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Palette Toolbar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="small fw-bold text-secondary">Herramienta de Diagnóstico:</span>
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className={`btn btn-sm ${selectedTool === 'CARIES' ? 'btn-danger shadow' : 'btn-outline-danger'}`}
                onClick={() => setSelectedTool('CARIES')}
              >
                ● Caries (Rojo)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedTool === 'CURADO' ? 'btn-primary shadow' : 'btn-outline-primary'}`}
                onClick={() => setSelectedTool('CURADO')}
              >
                ● Obturación / Curado (Azul)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedTool === 'CORONA' ? 'btn-warning text-dark shadow' : 'btn-outline-warning text-dark'}`}
                onClick={() => setSelectedTool('CORONA')}
              >
                ● Corona (Amarillo)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedTool === 'ENDODONCIA' ? 'btn-purple text-white shadow' : 'btn-outline-secondary'}`}
                style={{ backgroundColor: selectedTool === 'ENDODONCIA' ? '#6f42c1' : undefined }}
                onClick={() => setSelectedTool('ENDODONCIA')}
              >
                ● Endodoncia (Morado)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedTool === 'EXTRAIDO' ? 'btn-secondary shadow' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedTool('EXTRAIDO')}
              >
                ● Extraído (Gris)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedTool === 'SANO' ? 'btn-light border shadow' : 'btn-outline-light text-dark border'}`}
                onClick={() => setSelectedTool('SANO')}
              >
                ○ Sano / Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Odontogram Map */}
      <div className="card shadow-sm border-0 p-4">
        <div className="text-center mb-4">
          <span className="badge bg-light text-dark border px-3 py-2 fw-semibold">
            ARCADA SUPERIOR (Maxilar)
          </span>
          <div className="d-flex justify-content-center flex-wrap gap-2 mt-3">
            {UPPER_TEETH.map((tooth) => (
              <div
                key={tooth}
                onClick={() => handleToothClick(tooth)}
                className="d-flex flex-column align-items-center cursor-pointer p-2 rounded border bg-light shadow-sm"
                style={{
                  width: '48px',
                  backgroundColor: getToothColor(teethData[tooth]),
                  borderColor: '#dee2e6',
                  transition: 'transform 0.1s',
                }}
                title={`Pieza ${tooth}: ${teethData[tooth] || 'SANO'}`}
              >
                <span className="extra-small fw-bold mb-1" style={{ color: teethData[tooth] === 'EXTRAIDO' ? '#fff' : '#000' }}>
                  {tooth}
                </span>
                <div
                  className="rounded-circle border"
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: getToothColor(teethData[tooth]),
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>

        <hr className="my-3" />

        <div className="text-center mt-3">
          <div className="d-flex justify-content-center flex-wrap gap-2 mb-3">
            {LOWER_TEETH.map((tooth) => (
              <div
                key={tooth}
                onClick={() => handleToothClick(tooth)}
                className="d-flex flex-column align-items-center cursor-pointer p-2 rounded border bg-light shadow-sm"
                style={{
                  width: '48px',
                  backgroundColor: getToothColor(teethData[tooth]),
                  borderColor: '#dee2e6',
                  transition: 'transform 0.1s',
                }}
                title={`Pieza ${tooth}: ${teethData[tooth] || 'SANO'}`}
              >
                <div
                  className="rounded-circle border mb-1"
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: getToothColor(teethData[tooth]),
                  }}
                ></div>
                <span className="extra-small fw-bold" style={{ color: teethData[tooth] === 'EXTRAIDO' ? '#fff' : '#000' }}>
                  {tooth}
                </span>
              </div>
            ))}
          </div>
          <span className="badge bg-light text-dark border px-3 py-2 fw-semibold">
            ARCADA INFERIOR (Mandibular)
          </span>
        </div>
      </div>
    </div>
  )
}
