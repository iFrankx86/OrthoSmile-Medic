# Diseño de datos (MVP)

## 1) Objetivo

Definir un modelo relacional consistente con los requisitos funcionales del MVP y la arquitectura de Orthosmille Medic.

## 2) Entidades principales

1. `users`
2. `professionals`
3. `patients`
4. `appointments`
5. `clinical_records`
6. `payments`
7. `audit_logs`

## 3) Modelo por entidad

## `users`

Propósito: autenticación y autorización.

- PK: `id` (BIGINT)
- Campos obligatorios:
  - `username` (UNIQUE)
  - `email` (UNIQUE)
  - `password_hash`
  - `role` ENUM(`ADMINISTRADOR`,`RECEPCIONISTA`,`ODONTOLOGO`,`CAJA`)
  - `is_active` (BOOLEAN)
  - `created_at`
  - `updated_at`
- Campos opcionales:
  - `last_login_at`
  - `deleted_at` (soft delete)

## `professionals`

Propósito: información profesional odontológica/operativa.

- PK: `id`
- FK:
  - `user_id` → `users.id` (UNIQUE, opcional en creación inicial)
- Campos obligatorios:
  - `first_name`, `last_name`
  - `license_number` (UNIQUE)
  - `specialty`
  - `is_active`
  - `created_at`, `updated_at`
- Campos opcionales:
  - `phone`
  - `deleted_at`

## `patients`

Propósito: historia administrativa de pacientes.

- PK: `id`
- Campos obligatorios:
  - `first_name`, `last_name`
  - `document_type` ENUM(`DNI`,`PASSPORT`,`OTHER`)
  - `document_number`
  - `birth_date`
  - `is_active`
  - `created_at`, `updated_at`
- Campos opcionales:
  - `email`, `phone`, `address`
  - `deleted_at`
- Restricción única:
  - (`document_type`, `document_number`)

## `appointments`

Propósito: agenda de citas.

- PK: `id`
- FK:
  - `patient_id` → `patients.id`
  - `professional_id` → `professionals.id`
- Campos obligatorios:
  - `scheduled_start`
  - `scheduled_end`
  - `status` ENUM(`PROGRAMADA`,`CONFIRMADA`,`CANCELADA`,`ATENDIDA`,`NO_ASISTIO`)
  - `created_at`, `updated_at`
- Campos opcionales:
  - `reason`
  - `notes`
  - `canceled_at`
  - `canceled_reason`
- Restricción:
  - `scheduled_end > scheduled_start`.

## `clinical_records`

Propósito: registro clínico de atención.

- PK: `id`
- FK:
  - `appointment_id` → `appointments.id` (UNIQUE)
  - `patient_id` → `patients.id`
  - `professional_id` → `professionals.id`
- Campos obligatorios:
  - `attention_date`
  - `chief_complaint`
  - `clinical_notes`
  - `created_at`, `updated_at`
- Campos opcionales:
  - `diagnosis`
  - `treatment_plan`

## `payments`

Propósito: cobro asociado a una atención clínica.

- PK: `id`
- FK:
  - `clinical_record_id` → `clinical_records.id`
- Campos obligatorios:
  - `amount` DECIMAL(12,2)
  - `currency` CHAR(3) (default `PEN`)
  - `payment_method` ENUM(`EFECTIVO`,`TARJETA`,`TRANSFERENCIA`,`YAPE`,`PLIN`,`OTRO`)
  - `status` ENUM(`PENDIENTE`,`PARCIAL`,`PAGADO`,`ANULADO`)
  - `paid_at`
  - `created_at`, `updated_at`
- Campos opcionales:
  - `reference`
  - `notes`

## `audit_logs`

Propósito: trazabilidad de acciones críticas.

- PK: `id`
- FK:
  - `user_id` → `users.id` (nullable para eventos de sistema)
- Campos obligatorios:
  - `action`
  - `entity_name`
  - `created_at`
- Campos opcionales:
  - `entity_id`
  - `metadata` (JSON)
  - `ip_address`
  - `user_agent`

## 4) Cardinalidades

- `users` 1 — 0..1 `professionals`
- `patients` 1 — N `appointments`
- `professionals` 1 — N `appointments`
- `appointments` 1 — 0..1 `clinical_records`
- `clinical_records` 1 — N `payments`
- `users` 1 — N `audit_logs`

## 5) Índices propuestos

- `users(username)` UNIQUE
- `users(email)` UNIQUE
- `professionals(license_number)` UNIQUE
- `patients(document_type, document_number)` UNIQUE
- `appointments(professional_id, scheduled_start)`
- `appointments(patient_id, scheduled_start)`
- `appointments(status, scheduled_start)`
- `clinical_records(patient_id, attention_date)`
- `payments(status, paid_at)`
- `audit_logs(created_at)`
- `audit_logs(entity_name, entity_id)`

## 6) Integridad referencial y borrado

- Se evita borrado físico en entidades de negocio (`users`, `professionals`, `patients`) usando `deleted_at`.
- Tablas transaccionales (`appointments`, `clinical_records`, `payments`, `audit_logs`) se mantienen para trazabilidad histórica.
- Regla general de FK: `ON DELETE RESTRICT`, excepto casos explícitos de nulabilidad controlada.

## 7) Reglas de consistencia relevantes

1. No permitir cita con rango horario inválido.
2. No permitir más de una atención por cita (`UNIQUE appointment_id` en `clinical_records`).
3. No permitir pagos sin atención asociada.
4. Conflictos de agenda por traslape horario:
   - Validación a nivel de servicio/transacción.
   - Índices de apoyo para búsquedas rápidas.
   - Restricción de no solapamiento exacta en MySQL queda fuera de una constraint simple.

## 8) Soft delete y auditoría

- Soft delete en maestros de identidad/negocio principal.
- Auditoría de acciones críticas en `audit_logs`.
- La política de retención de logs queda **pendiente de definición**.

## 9) Consistencia con requisitos y arquitectura

- RF de pacientes, citas, atenciones, pagos y auditoría cubiertos por entidades y relaciones.
- Arquitectura por capas y DTO compatible con este diseño.
- Contradicción identificada en Fase 01:
  - Relación de `payments` no estaba cerrada.
  - Corrección aplicada: `payments` referencia `clinical_records`.