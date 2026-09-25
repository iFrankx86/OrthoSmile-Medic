# OrthoSmile-Medic

Sistema Integral de Gestión Clínica Odontológica y Ortodoncia.

## Características

- **Autenticación y Roles:** Administrador, Odontólogo, Recepcionista y Caja.
- **Agenda de Citas:** Gestión de turnos con estados en tiempo real (Programada, Confirmada, Atendida, Cancelada).
- **Directorio de Pacientes:** Registro, búsqueda en tiempo real, expedientes e historial clínico odontológico.
- **Historial Clínico:** Registro de motivos de consulta, diagnósticos, planes de tratamiento y evolución.
- **Caja y Pagos:** Registro de ingresos, métodos de pago (Yape, Plin, Efectivo, Tarjeta) y balance general.
- **Auditoría:** Registro de eventos clave del sistema.

## Credenciales de Acceso

- **Administrador:** `admin` / `admin123`
- **Odontólogo:** `dr.perez` / `admin123`
- **Recepcionista:** `recepcion` / `admin123`

## Ejecución

```bash
npm install
npm run dev
```
El servidor arrancará en el puerto 3000 (`http://0.0.0.0:3000`).
