# Progress 00 — Project Init

## Fecha

2026-09-12

## Objetivo

Realizar análisis inicial de Orthosmille Medic, delimitar alcance del MVP y crear la documentación base del proyecto sin implementar funcionalidades.

## Análisis realizado

- Alcance funcional del MVP identificado.
- Módulos principales y futuros definidos.
- Entidades núcleo del dominio identificadas.
- Relaciones principales entre entidades propuestas.
- Requisitos funcionales y no funcionales documentados.
- Arquitectura objetivo definida (React SPA + API Gateway + Spring Boot + MySQL).
- Estructura de carpetas objetivo para frontend y backend propuesta.
- API REST inicial (alto nivel) propuesta con versionado `/api/v1`.
- Modelo de datos inicial (alto nivel) propuesto.
- Riesgos técnicos y decisiones abiertas documentadas.

## Decisiones

- Se adopta monolito modular para MVP.
- Se define uso de DTO, Service Layer y Repository Pattern.
- Se define Flyway para migraciones.
- Se define API versionada en `/api/v1`.
- Se registra ADR-001 para arquitectura.

## Archivos creados

- [README.md](../../README.md)
- [docs/README.md](../README.md)
- [docs/requirements/README.md](../requirements/README.md)
- [docs/requirements/functional-requirements.md](../requirements/functional-requirements.md)
- [docs/requirements/non-functional-requirements.md](../requirements/non-functional-requirements.md)
- [docs/architecture/README.md](../architecture/README.md)
- [docs/architecture/architecture.md](../architecture/architecture.md)
- [docs/decisions/ADR-001-architecture.md](../decisions/ADR-001-architecture.md)
- [docs/progress/00-project-init.md](00-project-init.md)

## Funcionalidades todavía pendientes

- Diseño de base de datos detallado y migraciones versionadas (Fase 02).
- Implementación backend Spring Boot por módulos (Fase 03).
- Definición detallada de API OpenAPI (Fase 04).
- Implementación frontend funcional (Fase 05+).
- Seguridad, testing, Docker y despliegue cloud (fases posteriores).

## Riesgos detectados

1. Definición tardía de estrategia de autenticación.
2. Riesgo de acoplamiento entre módulos del monolito.
3. Reglas de agenda complejas y conflictos de concurrencia.
4. Posible desalineación entre contratos frontend/backend si no se formaliza OpenAPI temprano.

## Siguiente fase

Fase 02 — Diseño de modelo de datos relacional (PK/FK, cardinalidades, restricciones, índices, estrategia Flyway).