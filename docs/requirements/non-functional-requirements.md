# Requisitos no funcionales (MVP)

## RNF-001 — Arquitectura y mantenibilidad

- Backend como monolito modular (no microservicios en MVP).
- Separación por capas: `Controller` → `DTO` → `Service` → `Repository` → `Entity`.
- Aplicar principios SOLID y Clean Code.

## RNF-002 — Seguridad

- Autenticación y autorización por roles.
- Contraseñas con hash seguro.
- No exponer secretos en repositorio.
- Validación de entrada para reducir riesgos de inyección.

## RNF-003 — Calidad

- Pruebas unitarias y de integración en backend.
- Pruebas de componentes/flujos críticos en frontend.
- Cobertura objetivo inicial: **pendiente de definición**.

## RNF-004 — Base de datos

- MySQL como motor relacional.
- Migraciones versionadas con Flyway.
- Prohibido usar `ddl-auto=create` en producción.

## RNF-005 — Observabilidad

- Logging estructurado y trazable.
- Integración objetivo con Cloud Logging/Monitoring.

## RNF-006 — Rendimiento

- Respuestas API en tiempos aceptables para operación diaria.
- Objetivos de latencia/SLA: **pendiente de definición**.

## RNF-007 — Escalabilidad

- Despliegue en Cloud Run con posibilidad de escalar horizontalmente.
- Evolución futura a servicios independientes: **pendiente de definición**.

## RNF-008 — Disponibilidad y resiliencia

- Estrategia de backup/restore de base de datos en cloud.
- Política RPO/RTO: **pendiente de definición**.

## RNF-009 — UX y accesibilidad

- Interfaz responsive y consistente.
- Accesibilidad base (contraste, navegación clara, feedback de errores).

## RNF-010 — Cumplimiento y auditoría

- Registro de eventos críticos para trazabilidad.
- Políticas de retención de auditoría: **pendiente de definición**.