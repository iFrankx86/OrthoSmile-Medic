# Requisitos funcionales (MVP)

## RF-001 — Autenticación de usuarios

- El sistema debe permitir iniciar sesión con credenciales válidas.
- El sistema debe permitir cierre de sesión.
- Debe existir control por roles: `ADMINISTRADOR`, `RECEPCIONISTA`, `ODONTOLOGO`, `CAJA`.
- **Pendiente de definición:** mecanismo final (`JWT` u `OIDC`).

## RF-002 — Gestión de pacientes

- Crear paciente.
- Editar datos de paciente.
- Consultar detalle de paciente.
- Listar y buscar pacientes por criterios básicos.
- Activar/desactivar paciente (baja lógica).

## RF-003 — Gestión de profesionales

- Registrar profesional.
- Editar datos de profesional.
- Listar y consultar profesionales.
- Activar/desactivar profesional.

## RF-004 — Gestión de citas

- Registrar cita asociando paciente y profesional.
- Reprogramar cita.
- Cambiar estado de cita (`PROGRAMADA`, `CONFIRMADA`, `CANCELADA`, `ATENDIDA`, `NO_ASISTIO`).
- Validar conflictos de horario por profesional.

## RF-005 — Atenciones / Historial clínico

- Registrar atención vinculada a una cita.
- Registrar observaciones clínicas y diagnóstico.
- Consultar historial clínico por paciente.

## RF-006 — Gestión de pagos

- Registrar pago de atención/cita.
- Consultar pagos por paciente y por rango de fechas.
- Registrar estado del pago (`PENDIENTE`, `PARCIAL`, `PAGADO`, `ANULADO`).

## RF-007 — Auditoría

- Registrar acciones críticas: autenticación, creación/edición de pacientes, citas, atenciones y pagos.
- Guardar quién, cuándo, qué acción y contexto mínimo.

## RF-008 — API versionada

- Exponer API REST bajo prefijo `/api/v1`.

## RF-009 — Validación de datos

- Validar formatos y campos obligatorios en entrada de datos.
- Retornar errores consistentes para validaciones fallidas.

## RF-010 — Manejo de errores

- Debe existir manejo global de excepciones para errores de negocio y técnicos.

## Criterios de alcance

- Solo funcionalidades necesarias para operación clínica básica en MVP.
- Funciones avanzadas clínicas o de mensajería quedan para fases futuras.