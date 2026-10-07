import React, { useState } from 'react'
import {
  FileDown,
  Copy,
  Printer,
  Check,
  Shield,
  Server,
  Layers,
  Smartphone,
  Cpu,
  Database,
  Code2,
  Activity,
  Award,
} from 'lucide-react'

export const TechnicalReportPage: React.FC = () => {
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  // Direct client-side blob download (100% reliable inside iframes and sandboxes)
  const handleDownloadDocx = async () => {
    try {
      setDownloading(true)
      const res = await fetch('/api/v1/download-technical-report')
      if (!res.ok) {
        throw new Error('Error al obtener el archivo desde el servidor')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = 'Informe_Tecnico_OrthoSmile_Medic.docx'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 300)

      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 4000)
    } catch (e) {
      console.error('Error en descarga:', e)
      // Fallback direct link
      window.location.href = '/api/v1/download-technical-report'
    } finally {
      setDownloading(false)
    }
  }

  const handleCopyText = () => {
    const reportText = document.getElementById('report-content')?.innerText || ''
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar (Mobile Sticky-friendly) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sky-600 font-bold text-xs uppercase tracking-wider">
              <Activity size={16} />
              <span>Documento Técnico Oficial</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Exclusivo Rol Admin
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 m-0">
            Informe Técnico de Arquitectura
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
            OrthoSmile-Medic · Tecnologías, Estructura, Patrones y Criterios QA/QX
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadDocx}
            disabled={downloading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all min-h-[44px]"
            title="Descargar archivo Word .docx directo a tu computadora"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generando...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check size={16} className="text-emerald-300" />
                <span>¡Descargado!</span>
              </>
            ) : (
              <>
                <FileDown size={16} />
                <span>Descargar Word (.docx)</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyText}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors min-h-[44px]"
            title="Copiar todo el texto del informe al portapapeles"
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald-600" />
                <span className="text-emerald-700">Copiado</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span className="hidden sm:inline">Copiar</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors min-h-[44px]"
            title="Imprimir o guardar como PDF"
          >
            <Printer size={16} />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-600" />
            <span>
              <strong>¡Archivo descargado con éxito!</strong> Busca <code>Informe_Tecnico_OrthoSmile_Medic.docx</code> en tu carpeta de Descargas.
            </span>
          </div>
        </div>
      )}

      {/* Main Report Document Sheet (Printable & Scannable) */}
      <article
        id="report-content"
        className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-8 text-slate-800 leading-relaxed font-sans"
      >
        {/* Document Header & Title */}
        <header className="border-b border-slate-200 pb-6 text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            Documento de Especificación Técnica
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight pt-2">
            ORTHOSMILE-MEDIC
          </h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Sistema Integral de Gestión Clínica Odontológica y Ortodoncia
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span>Fecha: 29 de Septiembre de 2026</span>
            <span>·</span>
            <span className="text-emerald-600 font-medium">Auditoría QA/QX Aprobada</span>
          </div>
        </header>

        {/* Executive Metadata Matrix */}
        <section className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 sm:p-5 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 text-xs font-semibold uppercase block">Tipo de Aplicación</span>
              <strong className="text-slate-800 font-semibold">Full-Stack PWA / SPA con Arquitectura Mobile-First</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-semibold uppercase block">Base de Datos Principal</span>
              <strong className="text-slate-800 font-semibold">Google Cloud Firebase Firestore (NoSQL en tiempo real)</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-semibold uppercase block">Entorno de Ejecución</span>
              <strong className="text-slate-800 font-semibold">Node.js + Express 5 + Vite 6 + React 19</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-semibold uppercase block">Cumplimiento de Accesibilidad</span>
              <strong className="text-slate-800 font-semibold">Estándar WCAG AA (Contraste 4.5:1 y Hitbox superior a 44px)</strong>
            </div>
          </div>
        </section>

        {/* Section 1: Resumen Ejecutivo */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-sky-600 font-mono">01.</span>
            <span>Resumen Ejecutivo</span>
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong>OrthoSmile-Medic</strong> es una solución digital de salud concebida para la gestión médica, administrativa y financiera integral de clínicas odontológicas y centros de ortodoncia. El sistema unifica el ciclo completo de atención del paciente: desde el triaje y registro inicial, el agendamiento inteligente de citas, el seguimiento de historias clínicas con diagnósticos y planes de tratamiento, hasta el levantamiento de odontogramas digitales interactivos basados en el estándar internacional de dos dígitos de la FDI y el control de caja diaria.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            El sistema fue edificado priorizando la <strong>experiencia móvil (Mobile-First)</strong>, permitiendo al odontólogo y al asistente dental manipular registros clínicos al costado del sillón odontológico desde teléfonos o tabletas con una sola mano mediante controles táctiles ergonómicos situados en la zona natural de alcance del pulgar.
          </p>
        </section>

        {/* Section 2: Stack Tecnológico */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-sky-600 font-mono">02.</span>
            <span>Stack Tecnológico y Herramientas</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
                <Smartphone size={18} />
                <span>Frontend Client</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc">
                <li><strong>React 19:</strong> Concurrencia y componentes funcionales con hooks personalizados.</li>
                <li><strong>TypeScript 5.7+:</strong> Interfaces rígidas para datos médicos y financieros.</li>
                <li><strong>Tailwind CSS v4:</strong> Diseño táctil utilitario libre de dependencias Bootstrap.</li>
                <li><strong>Vite 6:</strong> Bundler optimizado con Rollup y Fast Refresh.</li>
                <li><strong>Lucide React:</strong> Iconografía médica con affordance claro.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                <Server size={18} />
                <span>Backend & API</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc">
                <li><strong>Node.js & Express:</strong> Servidor de aplicaciones montado en puerto 3000.</li>
                <li><strong>RESTful API (`/api/v1/*`):</strong> Endpoints modulares para citas, pacientes y pagos.</li>
                <li><strong>TSX:</strong> Ejecutor nativo TypeScript para entornos Node.js.</li>
                <li><strong>CORS & Security Headers:</strong> Protección XSS, nosniff y middleware de autenticación.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <Database size={18} />
                <span>Cloud & Database</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc">
                <li><strong>Google Cloud Firebase Firestore:</strong> Almacén de documentos NoSQL distribuido.</li>
                <li><strong>Firebase Auth SDK:</strong> Autenticación con listeners `onAuthStateChanged`.</li>
                <li><strong>Audit Logging:</strong> Colección `audit_logs` con trazabilidad inmutable de eventos.</li>
                <li><strong>Fallback Storage:</strong> Caché viva en memoria + `sessionStorage` para sandboxes.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Estructura del Proyecto */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-sky-600 font-mono">03.</span>
            <span>Estructura y Organización de Código (Feature-Driven)</span>
          </h3>
          <p className="text-sm text-slate-600">
            La arquitectura sigue el principio de separación de responsabilidades y modularidad guiada por dominio (Feature-Driven Architecture):
          </p>
          <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
{`src/
├── app/                  # Proveedores de contexto global y notificaciones (AppProviders)
├── components/
│   └── layout/          # MainLayout, Header, Sidebar y MobileBottomNav (Navegación táctil)
├── context/             # AuthContext (Sesión, RBAC, Firebase listeners y logs diagnósticos)
├── features/            # Módulos clínicos de negocio
│   ├── appointments/    # Agenda de citas con filtros y cambios de estado (AppointmentListPage)
│   ├── auth/            # Página de autenticación segura con roles (LoginPage)
│   ├── clinical/        # Odontograma FDI (OdontogramPage) e Historias (ClinicalHistoryPage)
│   ├── database/        # Inspector en tiempo real de Firebase Firestore (DatabaseViewerPage)
│   ├── patients/        # Directorio de pacientes y formulario clínico (PatientListPage/Form)
│   ├── payments/        # Caja, balance recaudado y emisión de comprobantes (PaymentListPage)
│   ├── professionals/   # Directorio médico acreditado por el COP (ProfessionalListPage)
│   └── report/          # Visor y generador de Informe Técnico (TechnicalReportPage)
├── lib/                 # Inicialización oficial de Firebase y Firestore (firebase.ts)
├── server/              # Servidor Express, generación DOCX (generateDocxReport.ts) y rutas REST
├── services/            # Repositorio centralizado de datos e interfaz con Firestore (api.ts)
└── types/               # Modelos e interfaces TypeScript (User, Patient, Appointment, etc.)`}
          </pre>
        </section>

        {/* Section 4: Técnicas de Programación */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-sky-600 font-mono">04.</span>
            <span>Técnicas y Patrones de Programación Clave</span>
          </h3>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                1. Ergonomía Mobile-First y Zona del Pulgar (Thumb Zone)
              </h4>
              <p className="text-xs leading-relaxed m-0">
                Los elementos de navegación y acción crítica están anclados en el 40% inferior de la pantalla. La barra inferior móvil (`MobileBottomNav`) y los botones táctiles respetan la dimensión mínima de 44x44px establecida por los lineamientos de Apple HIG y Google Material Design, reduciendo el riesgo de toques accidentales con guantes quirúrgicos.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                2. Vistas Duales Adaptativas (Adaptive Touch Cards vs Data Tables)
              </h4>
              <p className="text-xs leading-relaxed m-0">
                En pantallas de smartphones, las tablas con scroll horizontal son sustituidas automáticamente por tarjetas de datos táctiles de alta densidad con accesos directos de un solo toque (llamada telefónica, WhatsApp, historia y odontograma). En pantallas de escritorio, conmuta a tablas con columnas alineadas y cifras numéricas tabulares (`tabular-nums`).
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                3. Patrón Repositorio y Capa de Abstracción de Servicios (Service Layer Pattern)
              </h4>
              <p className="text-xs leading-relaxed m-0">
                La lógica de negocio y persistencia está desacoplada de los componentes React en `src/services/api.ts`. Si se migra o se combina Firestore con otra base de datos, los componentes de la interfaz no sufren cambios estructurales.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                4. Control de Acceso Basado en Roles (RBAC Granular)
              </h4>
              <p className="text-xs leading-relaxed m-0">
                Se contemplan perfiles estrictos (`ADMINISTRADOR`, `ODONTOLOGO`, `RECEPCIONISTA`). El `AuthContext` valida permisos antes de mostrar opciones sensibles como modificación de historiales médicos o acceso al visor de la base de datos Firestore.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                5. Resiliencia de Sesión Multi-Capa (In-Memory + Storage Resilience)
              </h4>
              <p className="text-xs leading-relaxed m-0">
                Para operar en entornos iframes o navegadores con bloqueo estricto de cookies de terceros, el sistema mantiene la sesión en memoria viva (`inMemoryUser`), respaldándola con capturas de excepción contra `sessionStorage` y `localStorage`.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                6. Nomenclatura Dental Internacional FDI (Two-Digit System)
              </h4>
              <p className="text-xs leading-relaxed m-0">
                El odontograma digital modela con exactitud los cuadrantes 1 al 4 (18-11, 21-28, 48-41, 31-38). Integra segmentación visual de arcos (Maxilar Superior e Inferior) para manipulación en teléfonos, permitiendo asignar estados de Caries, Obturado/Resina, Ausente, Corona y Endodoncia con cálculo automático de hallazgos patológicos.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Calidad y QA/QX */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-sky-600 font-mono">05.</span>
            <span>Criterios de Calidad, QA/QX y Accesibilidad</span>
          </h3>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2 pl-5 list-disc">
            <li><strong>Contraste WCAG AA:</strong> Colores de texto y fondos calculados para superar la relación de contraste 4.5:1.</li>
            <li><strong>Erradicación de `window.alert`:</strong> Toda la retroalimentación se transmite mediante banners no intrusivos o estados de formulario integrados.</li>
            <li><strong>Cifras Tabulares (`font-variant-numeric: tabular-nums`):</strong> Alineación decimal estricta en importes de caja (S/), fechas y DNI para evitar saltos visuales.</li>
            <li><strong>Zero Broken Images / Fallbacks:</strong> Contenedores de reemplazo estilizados con iconos SVG ante caídas de red.</li>
          </ul>
        </section>

        {/* Sign-off Footer */}
        <footer className="pt-8 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-bold text-slate-800">Equipo de Arquitectura de Software</div>
            <div>OrthoSmile-Medic Engineering Team</div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              <Award size={14} />
              <span>Aprobado para Producción</span>
            </span>
          </div>
        </footer>
      </article>
    </div>
  )
}
