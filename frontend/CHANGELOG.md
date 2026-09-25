# Changelog

## [0.4.0] - 2026-09-12

### Added

- Revisión profesional de API REST sobre endpoints implementados.
- Especificación inicial OpenAPI en `docs/api/openapi.yaml`.
- Documentación de códigos HTTP, validaciones y errores.

### Documentation

- `docs/api/README.md` actualizado.
- `docs/progress/03-backend.md` actualizado con revisión API.

## [0.3.0] - 2026-09-12

### Added

- Backend Spring Boot inicial bajo `backend/`.
- Entidades, repositorios, servicios y controladores para módulos MVP.
- Manejo global de excepciones y validaciones Bean Validation.
- Endpoints REST base en `/api/v1`.
- Tests iniciales de contexto, servicio y controlador.

### API

- Auth, Patients, Professionals, Appointments, Clinical History, Payments, Audit.

### Documentation

- `docs/api/README.md` actualizado.
- `docs/progress/03-backend.md` creado.

## [0.2.0] - 2026-09-12

### Added

- Diseño de base de datos MVP documentado.
- Diagrama ER en PlantUML.
- Estrategia de migraciones Flyway documentada.
- Estructura inicial de migraciones versionadas creada.

### Database

- Tablas núcleo: users, professionals, patients, appointments, clinical_records, payments, audit_logs.
- PK/FK, índices y restricciones principales definidas.

### Documentation

- Registro de progreso de fase 02.

## [0.1.0] - 2026-09-12

### Added

- Inicialización de documentación de Orthosmille Medic.
- Análisis de alcance del MVP.
- Requisitos funcionales y no funcionales.
- Arquitectura objetivo documentada.
- ADR-001 (Monolito Modular).
- Bitácora de progreso inicial.

### Architecture

- React SPA.
- API Gateway.
- Spring Boot (monolito modular).
- MySQL (Cloud SQL objetivo).

### Documentation

- Estructura `docs/` creada.
- Registro de progreso en `docs/progress`.