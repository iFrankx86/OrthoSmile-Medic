import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
} from 'docx'
import fs from 'fs'
import path from 'path'

export async function generateTechnicalReportDocx(): Promise<Buffer> {
  const primaryBlue = '0284C7'
  const darkSlate = '0F172A'
  const subtleGray = 'F1F5F9'
  const borderGray = 'CBD5E1'

  const doc = new Document({
    title: 'Informe Técnico - OrthoSmile-Medic',
    description: 'Documento técnico integral de arquitectura, tecnologías y patrones de desarrollo.',
    creator: 'Equipo de Arquitectura de Software OrthoSmile-Medic',
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 22, // 11pt
            color: '334155',
          },
          paragraph: {
            spacing: {
              line: 300,
              after: 160,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          // Portada / Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: 'ORTHOSMILE-MEDIC',
                bold: true,
                size: 44, // 22pt
                color: primaryBlue,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: 'Sistema Integral de Gestión Clínica Odontológica y Ortodoncia',
                italics: true,
                size: 24,
                color: '64748B',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 480 },
            children: [
              new TextRun({
                text: 'INFORME TÉCNICO DE ARQUITECTURA, TECNOLOGÍAS Y TÉCNICAS DE SOFTWARE',
                bold: true,
                size: 28,
                color: darkSlate,
              }),
            ],
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: subtleGray, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Proyecto:', bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: 'OrthoSmile-Medic v1.0' })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: subtleGray, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Tipo de Aplicación:', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Full-Stack Progressive Web Application (PWA / SPA) con enfoque Mobile-First' })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: subtleGray, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Base de Datos:', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Google Cloud Firebase Firestore (NoSQL Document Store en la Nube)' })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: subtleGray, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Fecha de Emisión:', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }) })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: subtleGray, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Auditoría / QA-QX:', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Aprobado para estándares ergonómicos médicos táctiles y WCAG AA' })],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 360, after: 120 } }),

          // 1. Resumen Ejecutivo
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '1. Resumen Ejecutivo',
                bold: true,
                size: 32,
                color: primaryBlue,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'OrthoSmile-Medic es una plataforma integral de gestión clínica diseñada específicamente para consultorios y centros odontológicos especializados en ortodoncia, rehabilitación oral y odontología general. Su propósito es centralizar la gestión de pacientes, la programación de citas clínicas, la elaboración de historias clínicas con evolución de tratamiento, el odontograma digital interactivo con nomenclatura internacional FDI y el control financiero de caja y pagos en tiempo real.'
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'El sistema ha sido concebido bajo una arquitectura Mobile-First táctil, permitiendo a los profesionales de la salud interactuar de forma ágil desde tablets en el sillón dental o teléfonos móviles durante el triaje, sin perder la robustez necesaria para estaciones de recepción o administración en escritorio.'
              ),
            ],
          }),

          // 2. Stack Tecnológico
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: '2. Stack Tecnológico y Herramientas',
                bold: true,
                size: 32,
                color: primaryBlue,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'A. Frontend (Capa de Presentación e Interacción):', bold: true, color: darkSlate }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'React 19: ', bold: true }),
              new TextRun('Biblioteca principal de componentes declarativos, aprovechando las últimas mejoras en concurrencia y renderizado eficiente.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'TypeScript 5.7+: ', bold: true }),
              new TextRun('Tipado estático riguroso que garantiza interfaces de datos seguras para pacientes, citas, piezas dentales, diagnósticos y cobros.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Vite 6: ', bold: true }),
              new TextRun('Herramienta de compilación ultrarrápida (HMR y bundler optimizado con Rollup) para desarrollo y producción.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Tailwind CSS v4: ', bold: true }),
              new TextRun('Motor de estilos de última generación para un diseño moderno, libre de sobrecargas de Bootstrap, altamente responsivo y adaptable.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Lucide React: ', bold: true }),
              new TextRun('Iconografía médica y funcional vectorial con affordances táctiles claras.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'React Router 7: ', bold: true }),
              new TextRun('Enrutamiento del lado del cliente con soporte para layouts anidados y parámetros de búsqueda en URL.'),
            ],
          }),

          new Paragraph({
            spacing: { before: 180 },
            children: [
              new TextRun({ text: 'B. Backend y Servidor:', bold: true, color: darkSlate }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Node.js & Express: ', bold: true }),
              new TextRun('Servidor intermedio que orquesta los endpoints RESTful (`/api/v1/*`), proxies de seguridad y despacho de la aplicación en puerto 3000.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'TSX: ', bold: true }),
              new TextRun('Ejecutor TypeScript nativo para el entorno de desarrollo y servidor unificado.'),
            ],
          }),

          new Paragraph({
            spacing: { before: 180 },
            children: [
              new TextRun({ text: 'C. Base de Datos y Servicios Cloud:', bold: true, color: darkSlate }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Google Cloud Firebase Firestore: ', bold: true }),
              new TextRun('Base de datos NoSQL documental de baja latencia con sincronización en tiempo real y reglas de seguridad declarativas.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Firebase Auth & SDK Oficial: ', bold: true }),
              new TextRun('Integración cliente y servidor con listeners de cambio de estado (`onAuthStateChanged`) y auditoría de accesos.'),
            ],
          }),

          // 3. Estructura del Código
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: '3. Estructura y Organización del Proyecto',
                bold: true,
                size: 32,
                color: primaryBlue,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'El proyecto implementa una arquitectura modular guiada por características (Feature-Driven Architecture), separando el dominio médico por áreas funcionales independientes:'
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `src/
├── app/                  # Proveedores globales de estado y notificaciones (AppProviders)
├── components/
│   └── layout/          # Layout principal (MainLayout), Encabezado (Header),
│                        # Menú lateral (Sidebar) y Barra táctil móvil (MobileBottomNav)
├── context/             # Contexto de autenticación y sesión (AuthContext)
├── features/            # Módulos de negocio clínicos
│   ├── appointments/    # Agenda de citas y cambios de estado
│   ├── auth/            # Pantalla de inicio de sesión con roles clínicos
│   ├── clinical/        # Historias clínicas y Odontograma digital interactivo
│   ├── database/        # Inspector en tiempo real de Firebase Firestore
│   ├── patients/        # Directorio y formulario de registro de pacientes
│   ├── payments/        # Caja, cobros, estados financieros y emisión de recibos
│   └── professionals/   # Directorio de odontólogos y acreditación COP
├── lib/                 # Inicialización de Firebase SDK y clientes de base de datos
├── server/              # Núcleo de Express, endpoints REST y mock data inicial
├── services/            # Capa de abstracción de datos (api.ts) y auditoría
└── types/               # Definición de interfaces TypeScript y tipos de datos`,
                font: 'Courier New',
                size: 18,
              }),
            ],
          }),

          // 4. Técnicas y Patrones de Programación
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: '4. Técnicas y Patrones de Programación Implementados',
                bold: true,
                size: 32,
                color: primaryBlue,
              }),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: '1. Ergonomía Mobile-First & Thumb-Zone Navigation:', bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Siguiendo las mejores prácticas de experiencia de usuario en salud, los controles principales están concentrados en el 40% inferior de la pantalla (zona natural de alcance del pulgar). Se implementó un Bottom Navigation Bar fijo y un Bottom Sheet con soporte para safe-area-insets en dispositivos móviles, asegurando un tamaño de impacto táctil (hitbox) mínimo de 44x44 píxeles para evitar pulsaciones erróneas en procedimientos clínicos.'
              ),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: '2. Doble Representación de Datos (Adaptive Dual Views):', bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'En lugar de forzar tablas con scroll horizontal en teléfonos, la interfaz detecta la densidad de pantalla y despliega tarjetas táctiles enriquecidas en móviles (con accesos directos para llamada telefónica, WhatsApp, odontograma e historia), mientras que en pantallas medianas o grandes conmuta automáticamente a data grids tabulares de alta densidad con cifras tabulares (tabular-nums).'
              ),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: '3. Patrón Repositorio y Capa de Abstracción de Datos (Service Repository):', bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Los componentes visuales nunca invocan directamente consultas complejas a la base de datos. Toda la lógica de obtención, transformación, filtrado y registro de auditoría se encapsula en `src/services/api.ts`, desacoplando la UI del motor de persistencia.'
              ),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: '4. Control de Acceso Basado en Roles (RBAC):', bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'El sistema define roles clínicos estrictos: ADMINISTRADOR, ODONTOLOGO y RECEPCIONISTA. El `AuthContext` valida permisos granulares antes de exponer accesos en la barra lateral, en la barra móvil y al ejecutar acciones como modificar odontogramas o acceder al inspector de base de datos.'
              ),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: '5. Persistencia Resiliente Multi-Capa (In-Memory + Storage Fallback):', bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Para garantizar funcionamiento ininterrumpido en entornos restringidos (como sandboxes, iframes de Google AI Studio o ventanas de navegación privada que bloquean `localStorage`), el sistema implementa una caché en memoria viva como primera capa, respaldada por `sessionStorage` y `localStorage` con captura de excepciones.'
              ),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: '6. Nomenclatura Dental Internacional FDI (Two-Digit System):', bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'El odontograma digital modela de forma precisa los cuatro cuadrantes dentales (Q1: 18-11, Q2: 21-28, Q3: 31-38, Q4: 48-41). Cuenta con segmentación de arcos (Maxilar vs Mandibular) para permitir la selección rápida de piezas en pantallas pequeñas, admitiendo estados clínicos de Caries, Obturado/Resina, Ausente/Extraído, Corona y Endodoncia con resumen diagnóstico en tiempo real.'
              ),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: '7. Trazabilidad y Registro de Auditoría (Audit Logging):', bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Cada evento sensible (inicios de sesión, creación de pacientes, actualización de atenciones médicas y registro de pagos) genera una entrada inmutable de auditoría con marca temporal, usuario responsable y detalles de la operación en la colección `audit_logs`.'
              ),
            ],
          }),

          // 5. Módulos del Sistema
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: '5. Módulos y Capacidades del Sistema',
                bold: true,
                size: 32,
                color: primaryBlue,
              }),
            ],
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Módulo de Pacientes: ', bold: true }),
              new TextRun('Padrón con búsqueda en vivo por DNI, nombres, apellidos o teléfono; apertura y edición de expedientes clínicos completos.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Módulo de Citas y Turnos: ', bold: true }),
              new TextRun('Agendamiento con selección de profesional, fecha/hora, motivo y filtros segmentados por estado (Programadas, Confirmadas, Atendidas, Canceladas).'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Odontograma Dental 2D: ', bold: true }),
              new TextRun('Lienzo visual con 32 piezas permanentes, cuadrantes anatómicos, herramientas diagnósticas y persistencia por paciente.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Historias Clínicas: ', bold: true }),
              new TextRun('Registro cronológico de atenciones, motivo de consulta, diagnóstico presuntivo/definitivo, plan de tratamiento y notas clínicas.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Caja y Pagos: ', bold: true }),
              new TextRun('Balance de recaudación en moneda local (PEN S/), registro de abonos en efectivo, Yape/Plin, tarjetas y transferencias con código de referencia.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Cuerpo Médico: ', bold: true }),
              new TextRun('Directorio de especialistas odontológicos con número de colegiatura profesional (COP) y especialidades.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Inspector Firebase Firestore: ', bold: true }),
              new TextRun('Herramienta interna de visualización y consulta de colecciones en tiempo real para administradores, con vistas en tabla y JSON.'),
            ],
          }),

          // 6. Calidad y QA/QX
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: '6. Criterios de Calidad, QA/QX y Accesibilidad',
                bold: true,
                size: 32,
                color: primaryBlue,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Contraste y Legibilidad WCAG AA: ', bold: true }),
              new TextRun('Uso de paletas de alto contraste sobre lienzo neutro (#F8FAFC) y tipografía moderna Plus Jakarta Sans.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Cifras Tabulares (tabular-nums): ', bold: true }),
              new TextRun('Alineación decimal vertical estricta para números de DNI, fechas, teléfonos y balances económicos.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Erradicación de Alertas Nativas: ', bold: true }),
              new TextRun('Eliminación total de ventanas emergentes invasivas (`alert`), reemplazándolas por banners de validación contextuales.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Cero Dependencias Obsoletas: ', bold: true }),
              new TextRun('Eliminación de bibliotecas conflictivas de estilos, consolidando todo el sistema de diseño sobre Tailwind CSS nativo.'),
            ],
          }),

          // 7. Conclusiones
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: '7. Conclusión y Dictamen Técnico',
                bold: true,
                size: 32,
                color: primaryBlue,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'El proyecto OrthoSmile-Medic satisface ampliamente los estándares de ingeniería de software moderno para aplicaciones médicas. Su diseño Mobile-First garantiza que el personal clínico pueda operar de forma táctil y ergonómica, mientras que su arquitectura modular basada en React 19, TypeScript y Firebase Firestore ofrece alta disponibilidad, sincronización instantánea y trazabilidad de datos para auditorías médicas.'
              ),
            ],
          }),

          // Firma
          new Paragraph({
            spacing: { before: 480 },
            children: [
              new TextRun({
                text: '________________________________________',
                color: '94A3B8',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Equipo de Arquitectura e Ingeniería de Software\nOrthoSmile-Medic Platform',
                bold: true,
                color: darkSlate,
              }),
            ],
          }),
        ],
      },
    ],
  })

  return await Packer.toBuffer(doc)
}
