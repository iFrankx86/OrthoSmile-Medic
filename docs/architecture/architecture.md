# Arquitectura objetivo — Orthosmille Medic

## 1) Alcance analizado

MVP orientado a operación clínica odontológica diaria:

- Autenticación y autorización por roles.
- Gestión de pacientes y profesionales.
- Agenda de citas.
- Registro de atenciones e historial clínico.
- Gestión de pagos.
- Auditoría de acciones críticas.

Fuera de alcance MVP:

- Odontograma
- Tratamientos
- Recetas
- Notificaciones

## 2) Módulos identificados

### MVP

- `auth`
- `patients`
- `professionals`
- `appointments`
- `clinical-history`
- `payments`
- `audit`

### Futuros

- `odontogram`
- `treatments`
- `prescriptions`
- `notifications`

## 3) Entidades identificadas (MVP)

- `User`
- `Professional`
- `Patient`
- `Appointment`
- `ClinicalRecord` (Atención)
- `Payment`
- `AuditLog`

## 4) Relaciones principales

- `User` 1—0..1 `Professional`
- `Patient` 1—N `Appointment`
- `Professional` 1—N `Appointment`
- `Appointment` 1—0..1 `ClinicalRecord`
- `Patient` 1—N `ClinicalRecord`
- `ClinicalRecord` 1—N `Payment`
- `User` 1—N `AuditLog`

Decisión adoptada en Fase 02: `Payment` referencia `ClinicalRecord`; la cita se vincula de forma indirecta por `ClinicalRecord -> Appointment`.

## 5) Requisitos funcionales propuestos

Ver detalle en [docs/requirements/functional-requirements.md](../requirements/functional-requirements.md).

## 6) Requisitos no funcionales propuestos

Ver detalle en [docs/requirements/non-functional-requirements.md](../requirements/non-functional-requirements.md).

## 7) Arquitectura propuesta

Arquitectura lógica objetivo:

React SPA
↓
API Client
↓
API Gateway
↓
Spring Boot (Monolito Modular)
↓
Controllers → DTOs → Services → Repositories → Entities
↓
Cloud SQL MySQL

### Criterios de diseño

- Monolito modular por costo y simplicidad operativa.
- API versionada (`/api/v1`).
- DTOs para desacoplar contrato externo del modelo persistente.
- Manejo global de excepciones.
- Validaciones en borde de entrada.
- Auditoría transversal de eventos críticos.

## 8) Estructura de carpetas propuesta

## Frontend (objetivo)

```text
frontend/
  src/
    app/
      router/
      layouts/
      providers/
    features/
      auth/
      patients/
      professionals/
      appointments/
      clinical-history/
      payments/
      audit/
    shared/
      components/
      hooks/
      utils/
      types/
    infrastructure/
      api/
```

## Backend (objetivo)

```text
backend/
  src/main/java/com/orthosmille/medic/
    config/
    common/
      exception/
      dto/
      mapper/
    modules/
      auth/
      patients/
      professionals/
      appointments/
      clinicalhistory/
      payments/
      audit/
  src/main/resources/
    db/migration/
```

## 9) API REST propuesta (alto nivel)

Base path: `/api/v1`

- `POST /auth/login`
- `POST /auth/logout`
- `GET /patients`
- `GET /patients/{id}`
- `POST /patients`
- `PUT /patients/{id}`
- `PATCH /patients/{id}/status`
- `GET /professionals`
- `POST /professionals`
- `GET /appointments`
- `POST /appointments`
- `PUT /appointments/{id}`
- `PATCH /appointments/{id}/status`
- `GET /clinical-history/patients/{patientId}`
- `POST /clinical-history`
- `GET /payments`
- `POST /payments`
- `GET /audit-logs` (restricción por rol)

## 10) Modelo de base de datos propuesto (alto nivel)

Tablas iniciales:

- `users`
- `professionals`
- `patients`
- `appointments`
- `clinical_records`
- `payments`
- `audit_logs`

Campos transversales sugeridos:

- `id` (PK)
- `created_at`
- `updated_at`
- `deleted_at` (para baja lógica donde aplique)
- `status` (cuando corresponda por dominio)

Enums candidatos:

- `user_role`
- `appointment_status`
- `payment_status`

## 11) Riesgos técnicos identificados

1. **Conflictos de agenda** por concurrencia en creación de citas.
2. **Diseño incompleto de seguridad** si no se cierra temprano JWT/OIDC.
3. **Crecimiento de monolito** sin límites modulares claros.
4. **N+1 queries** en listados con relaciones.
5. **Inconsistencias de estados** de citas, atenciones y pagos.
6. **Falta de trazabilidad** si auditoría no se implementa desde inicio.
7. **Desalineación frontend-backend** por contratos API no versionados.

## 12) Decisiones arquitectónicas importantes

1. Monolito modular para MVP.
2. API REST versionada en `/api/v1`.
3. Persistencia MySQL con migraciones Flyway.
4. DTO obligatorio en capa de exposición.
5. Service Layer para reglas de negocio.
6. Repository Pattern con Spring Data JPA.
7. Observabilidad objetivo con Cloud Logging/Monitoring.

Decisiones abiertas:

- **Pendiente de definición:** JWT vs OIDC para autenticación.
- **Pendiente de definición:** estrategia exacta de autorización fina (RBAC básico vs RBAC + permisos).
