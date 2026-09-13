# Base de Datos — Orthosmille Medic

## Documentos

- Diseño de datos: [docs/database/database-design.md](database-design.md)
- Diagrama ER (PlantUML): [docs/database/er-diagram.puml](er-diagram.puml)
- Estrategia de migraciones: [docs/database/migrations.md](migrations.md)

## Alcance

Modelo relacional del MVP para:

- `Usuario`
- `Profesional`
- `Paciente`
- `Cita`
- `Atencion`
- `Pago`
- `AuditLog`

## Decisiones clave

- BD objetivo: MySQL 8.x (Cloud SQL en entorno cloud).
- Migraciones versionadas con Flyway.
- Sin `hibernate.ddl-auto=create` en producción.
- Integridad referencial estricta mediante PK/FK.