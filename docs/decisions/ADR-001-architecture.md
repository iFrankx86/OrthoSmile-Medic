# ADR-001: Monolito Modular para MVP

## Estado

Accepted

## Contexto

Orthosmille Medic debe cubrir un alcance clínico amplio (pacientes, citas, atenciones, pagos, auditoría) con un equipo y cronograma de MVP.

Se requiere mantener separación de dominios sin introducir complejidad operacional temprana.

## Decisión

Se adopta una arquitectura **Spring Boot monolito modular**, desplegable en **Google Cloud Run**, con módulos internos por dominio.

## Razones

- Menor complejidad operativa en fase inicial.
- Menor costo de despliegue y mantenimiento.
- Menor fricción para testing e integración extremo a extremo.
- Permite separación de responsabilidades por módulos sin fragmentar despliegues.

## Alternativas consideradas

1. Microservicios por módulo de negocio.
2. Arquitectura serverless por funciones.

## Consecuencias

- Desarrollo inicial más rápido y consistente.
- Necesidad de disciplina interna para evitar acoplamiento entre módulos.
- Posibilidad de extraer servicios en el futuro si el crecimiento lo exige.

## Pendientes relacionados

- Definir criterios de posible extracción a microservicios en fases futuras.
- Definir umbrales de carga/latencia que disparen reevaluación arquitectónica.