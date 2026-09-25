# Orthosmille Medic — Progress

## Estado general

| Área | Estado |
|---|---|
| Arquitectura | 🟢 |
| Base de datos | 🟢 |
| Backend | 🟡 |
| Frontend | 🔴 |
| Seguridad | 🔴 |
| Testing | 🔴 |
| Cloud | 🔴 |
| Documentación | 🟢 |

## Última actualización

2026-09-12

## Fase actual

04 — API REST

## Último avance

- [x] Alcance MVP definido
- [x] Módulos MVP identificados
- [x] Entidades y relaciones de alto nivel identificadas
- [x] Requisitos funcionales documentados
- [x] Requisitos no funcionales documentados
- [x] Arquitectura objetivo documentada
- [x] ADR-001 documentado
- [x] Modelo de datos detallado
- [x] Diagrama ER documentado
- [x] Estrategia Flyway documentada
- [x] Backend base implementado
- [x] Endpoints MVP base implementados
- [x] Manejo global de excepciones
- [x] Validaciones Bean Validation
- [x] Revisión API REST y OpenAPI inicial
- [ ] Seguridad por roles completa
- [ ] Frontend implementado

## Problemas actuales

1. Falta cerrar decisión de autenticación (`JWT` vs `OIDC`).
2. Falta completar endurecimiento de seguridad y pruebas de integración.
3. Maven no está disponible en el entorno actual para validar compilación/tests en runtime.

## Próximo objetivo

Construcción del frontend React por módulos iniciando con patients (Fase 05).

## Decisiones recientes

- Se utiliza monolito modular.
- Se utiliza DTO en capa de API.
- Se utiliza Flyway para migraciones.
- Se utiliza Cloud SQL como BD objetivo.

## Reglas de trabajo

- No inventar requisitos.
- No introducir dependencias innecesarias.
- No guardar secretos en el repositorio.
- No marcar funcionalidades como completadas si no funcionan.
- Mantener documentación y avance sincronizados.