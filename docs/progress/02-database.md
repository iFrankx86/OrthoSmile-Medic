# Progress 02 — Database Design

## Fecha

2026-09-12

## Modelo diseñado

Se definió el modelo relacional MVP de Orthosmille Medic en MySQL para los módulos:

- auth
- patients
- professionals
- appointments
- clinical-history
- payments
- audit

## Entidades creadas

- `users`
- `professionals`
- `patients`
- `appointments`
- `clinical_records`
- `payments`
- `audit_logs`

## Relaciones

- `users` 1 — 0..1 `professionals`
- `patients` 1 — N `appointments`
- `professionals` 1 — N `appointments`
- `appointments` 1 — 0..1 `clinical_records`
- `clinical_records` 1 — N `payments`
- `users` 1 — N `audit_logs`

## Decisiones

1. Se mantiene monolito modular y modelo relacional normalizado.
2. `payments` se vincula a `clinical_records` para mantener coherencia clínica y financiera.
3. Soft delete en maestros (`users`, `professionals`, `patients`) mediante `deleted_at`.
4. Historial transaccional conservado sin borrado físico en `appointments`, `clinical_records`, `payments`, `audit_logs`.
5. Estrategia Flyway versionada y sin uso de `ddl-auto=create` en producción.

## Índices

- Índices únicos para identidad (`username`, `email`, `license_number`, documento paciente).
- Índices compuestos para agenda (`professional_id + scheduled_start`, `patient_id + scheduled_start`).
- Índices para filtros frecuentes (`status + fecha` en citas/pagos).
- Índices para auditoría (`created_at`, `entity_name + entity_id`).

## Restricciones

- PK/FK en todas las relaciones.
- `UNIQUE (appointment_id)` en `clinical_records`.
- `CHECK (scheduled_end > scheduled_start)` en citas.
- `CHECK (amount >= 0)` en pagos.

## Migraciones

Se creó estructura inicial de Flyway en:

- `backend/src/main/resources/db/migration/V1__create_core_tables.sql`
- `backend/src/main/resources/db/migration/V2__create_indexes.sql`

## Pruebas realizadas

- Revisión de consistencia documental entre:
  - [docs/requirements/functional-requirements.md](../requirements/functional-requirements.md)
  - [docs/architecture/architecture.md](../architecture/architecture.md)
  - [docs/database/database-design.md](../database/database-design.md)
- Validación lógica de cardinalidades y restricciones.

## Problemas encontrados

1. En Fase 01 existía ambigüedad en la relación de `payments` con `appointments`/`clinical_records`.

## Corrección aplicada

- Se resolvió y documentó: `payments` referencia `clinical_records`.
- Se actualizó arquitectura para eliminar contradicción.

## Pendientes

1. Definir política formal de rollback de migraciones por entorno.
2. Definir política de retención de `audit_logs`.
3. Validar migraciones en runtime durante Fase 03 al crear backend Spring Boot.