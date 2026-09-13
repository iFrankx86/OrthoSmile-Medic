# Orthosmille Medic

Plataforma web para la gestión de clínica odontológica.

## Estado actual

Fase 01 completada: análisis, alcance, arquitectura objetivo y documentación base.

No se implementaron funcionalidades nuevas en esta fase.

## Objetivo del proyecto

Construir un sistema modular para gestionar:

- Autenticación
- Pacientes
- Profesionales
- Citas
- Atenciones / Historial clínico
- Pagos
- Auditoría

## Arquitectura objetivo

React SPA → API Client → API Gateway → Spring Boot (monolito modular) → MySQL (Cloud SQL).

## Stack tecnológico objetivo

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- React Hook Form
- Bootstrap (o solución UI consistente)
- Vitest
- React Testing Library

### Backend

- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- Bean Validation
- Flyway
- MySQL
- JUnit
- Mockito
- Testcontainers

### Infraestructura

- Docker
- Google Cloud Run
- Cloud SQL
- API Gateway
- Secret Manager
- Cloud Logging / Monitoring

## Documentación

Punto de entrada de documentación: [docs/README.md](docs/README.md)

## Reglas de trabajo

- No inventar requisitos.
- No introducir dependencias innecesarias.
- No guardar secretos en el repositorio.
- No marcar funcionalidades como completadas si no funcionan.
- Mantener documentación y avance sincronizados.
