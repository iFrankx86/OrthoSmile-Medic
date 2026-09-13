# Progress 03 — Backend

## Fecha

2026-09-12

## Archivos creados

- Configuración base Spring Boot (`backend/pom.xml`, `application.yml`, clase principal, `SecurityConfig`).
- Capa común (`AuditableEntity`, `ResourceNotFoundException`, `ConflictException`, `GlobalExceptionHandler`, `ApiError`).
- Entidades JPA:
  - `User`, `Professional`, `Patient`, `Appointment`, `ClinicalRecord`, `Payment`, `AuditLog`
  - Enums asociados de dominio.
- Repositories Spring Data JPA para cada módulo.
- DTOs de request/response por módulo.
- Services por módulo.
- Controllers REST por módulo.
- Tests iniciales backend (`contextLoads`, `PatientServiceTest`, `PatientControllerTest`).
- Documentación API: [docs/api/README.md](../api/README.md)

## Endpoints implementados

- Auth:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
- Patients:
  - `GET /api/v1/patients`
  - `GET /api/v1/patients/{id}`
  - `POST /api/v1/patients`
  - `PUT /api/v1/patients/{id}`
  - `PATCH /api/v1/patients/{id}/status`
- Professionals:
  - `GET /api/v1/professionals`
  - `GET /api/v1/professionals/{id}`
  - `POST /api/v1/professionals`
  - `PUT /api/v1/professionals/{id}`
  - `PATCH /api/v1/professionals/{id}/status`
- Appointments:
  - `GET /api/v1/appointments`
  - `GET /api/v1/appointments/{id}`
  - `POST /api/v1/appointments`
  - `PUT /api/v1/appointments/{id}`
  - `PATCH /api/v1/appointments/{id}/status`
- Clinical History:
  - `GET /api/v1/clinical-history/patients/{patientId}`
  - `GET /api/v1/clinical-history/{id}`
  - `POST /api/v1/clinical-history`
- Payments:
  - `GET /api/v1/payments`
  - `GET /api/v1/payments/{id}`
  - `POST /api/v1/payments`
- Audit:
  - `GET /api/v1/audit-logs`

## Revisión de API REST (Fase 04 integrada)

- Se revisaron convenciones REST para recursos:
  - `/api/v1/patients`
  - `/api/v1/professionals`
  - `/api/v1/appointments`
  - `/api/v1/clinical-history`
  - `/api/v1/payments`
- Se definieron códigos HTTP, DTOs de request/response, errores y validaciones.
- Se formalizó contrato inicial en [docs/api/openapi.yaml](../api/openapi.yaml).
- Estado:
  - versionado `/api/v1`: ✅
  - búsqueda/filtros básicos: ✅
  - paginación y ordenamiento transversales: pendiente

## Entidades implementadas

- `User`
- `Professional`
- `Patient`
- `Appointment`
- `ClinicalRecord`
- `Payment`
- `AuditLog`

## Reglas de negocio

1. Paciente y profesional no permiten duplicados por documento/licencia.
2. Citas validan rango horario (`end > start`).
3. Citas validan conflicto de horario por profesional.
4. Una sola atención por cita (`appointment_id` único).
5. Registro de pago exige atención clínica existente.
6. Soft delete lógico para pacientes y profesionales vía cambio de estado.
7. Registro de auditoría para operaciones críticas.

## Tests

- `OrthosmilleMedicApplicationTests`.
- `PatientServiceTest` (creación y conflicto).
- `PatientControllerTest` (listado básico).

## Compilación y ejecución de pruebas

- Compilación backend intentada con `mvn -DskipTests compile`.
- Resultado: no ejecutable en este entorno por ausencia de Maven (`mvn` no disponible en PATH).
- Ejecución de tests: pendiente por la misma causa.

## Errores encontrados

1. Falta de backend base en workspace (solo frontend existente).
2. Ajustes de test unitario por asignación de `id` en entidad sin setter.
3. Herramienta Maven no disponible en entorno para validar compilación/tests en runtime.

## Errores corregidos

1. Se creó estructura Spring Boot completa bajo `backend/`.
2. Se corrigió test eliminando reflexión innecesaria y ajustando verificación.
3. Se validó estáticamente el workspace backend sin errores de lenguaje reportados.

## Porcentaje aproximado del backend completado

65%

## Pendientes

1. Endurecer seguridad (JWT/OIDC, autorización por roles) en Fase 07.
2. Documentación OpenAPI formal en Fase 04.
3. Incrementar cobertura de tests (services/controllers/integración Testcontainers).
4. Afinar paginación/filtros/ordenamiento homogéneos en endpoints de listado.
5. Verificación completa de endpoints con datos reales en entorno local.
6. Ejecutar `mvn compile` y `mvn test` cuando Maven esté disponible.