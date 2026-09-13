# API — Orthosmille Medic

Base URL versionada: `/api/v1`

Contrato formal OpenAPI: [docs/api/openapi.yaml](openapi.yaml)

## Revisión REST (Fase 04)

## Convenciones aplicadas

- Recursos en plural: `patients`, `professionals`, `appointments`, `payments`.
- Operaciones de estado con `PATCH`.
- `POST` para creación, `PUT` para actualización completa.
- Errores uniformes vía `ApiError`.

## Códigos HTTP utilizados

- `200 OK`: lecturas/actualizaciones exitosas.
- `201 Created`: creación exitosa.
- `400 Bad Request`: validación de entrada.
- `404 Not Found`: recurso no encontrado.
- `409 Conflict`: conflicto de negocio (duplicados/agenda).
- `500 Internal Server Error`: error inesperado.

## Recursos revisados

### `/api/v1/patients`

- `GET /patients` (listado, búsqueda por `q`).
- `GET /patients/{id}`.
- `POST /patients`.
- `PUT /patients/{id}`.
- `PATCH /patients/{id}/status?active=true|false`.

### `/api/v1/professionals`

- `GET /professionals`.
- `GET /professionals/{id}`.
- `POST /professionals`.
- `PUT /professionals/{id}`.
- `PATCH /professionals/{id}/status?active=true|false`.

### `/api/v1/appointments`

- `GET /appointments`.
- `GET /appointments/{id}`.
- `POST /appointments`.
- `PUT /appointments/{id}`.
- `PATCH /appointments/{id}/status`.

### `/api/v1/clinical-history`

- `GET /clinical-history/patients/{patientId}`.
- `GET /clinical-history/{id}`.
- `POST /clinical-history`.

### `/api/v1/payments`

- `GET /payments` (filtro opcional `patientId`).
- `GET /payments/{id}`.
- `POST /payments`.

## Paginación, filtros, ordenamiento y búsqueda

- Búsqueda implementada:
	- `GET /patients?q=`
- Filtros implementados:
	- `GET /payments?patientId=`
- Paginación general (`page`, `size`) y ordenamiento (`sort`): **pendiente de implementación**.

## Validaciones

- Bean Validation en DTOs de entrada.
- Reglas de negocio en services:
	- unicidad de documento/licencia;
	- conflicto de horario en citas;
	- una atención por cita;
	- pago asociado a atención existente.

## Errores

Formato común:

- `timestamp`
- `status`
- `error`
- `message`
- `path`
- `details[]`

## Observaciones de revisión

1. API ya está versionada correctamente con `/api/v1`.
2. Convenciones REST son consistentes para MVP.
3. Falta consolidar paginación/ordenamiento transversal.
4. Seguridad por roles en endpoints queda para fase de seguridad.