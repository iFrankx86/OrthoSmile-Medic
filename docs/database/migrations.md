# Estrategia de migraciones (Flyway)

## Principios

1. Migraciones inmutables y versionadas.
2. Un cambio por archivo de migración cuando sea posible.
3. No usar `ddl-auto=create` ni `ddl-auto=update` en producción.
4. Cambios destructivos solo mediante estrategia segura y planificada.

## Convención de nombres

- Versionadas: `V<numero>__<descripcion>.sql`
  - Ejemplo: `V1__create_core_tables.sql`
- Repetibles (si aplica): `R__<descripcion>.sql`

## Flujo recomendado

1. Diseñar cambio en `docs/database/database-design.md`.
2. Crear migración Flyway en `backend/src/main/resources/db/migration/`.
3. Ejecutar migración en entorno local.
4. Validar integridad y compatibilidad con aplicación.
5. Promover a QA y producción sin editar migraciones ya ejecutadas.

## Estrategia segura de cambios

Para cambios de columnas/tablas en producción:

- Expandir: agregar columna/tabla compatible.
- Migrar datos en script controlado.
- Adaptar aplicación.
- Contraer (eliminar legado) en una versión posterior.

## Estructura inicial creada

- `backend/src/main/resources/db/migration/V1__create_core_tables.sql`
- `backend/src/main/resources/db/migration/V2__create_indexes.sql`

## Verificaciones mínimas

- `flyway validate` antes de desplegar.
- `flyway migrate` en CI/CD con credenciales seguras.
- Backups de BD previos a migraciones relevantes.

## Pendientes de definición

- Política formal de rollback por entorno.
- Política de ventanas de mantenimiento en producción.