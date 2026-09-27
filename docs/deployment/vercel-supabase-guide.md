# Guía de Despliegue en Cloud: Vercel + Supabase PostgreSQL

Esta guía describe los pasos para desplegar **OrthoSmile-Medic** en la nube utilizando **Vercel** para el frontend/backend serverless y **Supabase** como base de datos relacional PostgreSQL administrada.

---

## 1. Configuración de la Base de Datos en Supabase

### Paso 1.1: Crear el Proyecto en Supabase
1. Ingresa a [https://supabase.com](https://supabase.com) e inicia sesión.
2. Haz clic en **"New Project"**.
3. Asigna un nombre al proyecto (ej. `orthosmile-medic-db`), una contraseña segura para la base de datos y selecciona la región más cercana a tus usuarios (ej. `sa-east-1` o `us-east-1`).
4. Espera ~1-2 minutos a que el clúster PostgreSQL se aprovisione.

### Paso 1.2: Ejecutar el Esquema SQL y Datos Iniciales
1. En el panel izquierdo de Supabase, ve a **SQL Editor**.
2. Haz clic en **"New Query"**.
3. Copia el contenido completo del archivo:
   `supabase/migrations/20260926_initial_schema.sql` (o `src/db/schema.sql`).
4. Pega el script en el editor y haz clic en **"Run"**.
5. Esto creará:
   - Tablas: `users`, `professionals`, `patients`, `appointments`, `clinical_records`, `payments`, `audit_logs`.
   - Índices de rendimiento para búsquedas por DNI, fechas y relaciones.
   - Datos iniciales con las 3 cuentas: Admin (`admin`), Dr. Gustavo Chávez (`dr.chavez`) y Mabel (`mabel`), además de pacientes de ejemplo.

### Paso 1.3: Obtener la Cadena de Conexión (DATABASE_URL)
1. En Supabase, ve a **Project Settings** (icono de engranaje) -> **Database**.
2. En la sección **Connection String**, selecciona la pestaña **URI**.
3. Selecciona el modo **Transaction (Pooler, puerto 6543)** o **Session (puerto 5432)**.
4. Copia la URL generada. Tendrá un formato similar a:
   ```text
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   ```
   *(Reemplaza `[YOUR-PASSWORD]` con la contraseña que definiste al crear el proyecto)*.

---

## 2. Despliegue en Vercel

El proyecto incluye `vercel.json` y el adaptador serverless `api/index.ts` listos para funcionar sin configuración adicional.

### Paso 2.1: Importar Repositorio en Vercel
1. Ingresa a [https://vercel.com](https://vercel.com).
2. Haz clic en **"Add New..."** -> **"Project"**.
3. Selecciona tu repositorio de GitHub / GitLab que contiene el código de OrthoSmile.
4. Vercel detectará automáticamente el framework **Vite**.

### Paso 2.2: Configurar Variables de Entorno en Vercel
En la sección **Environment Variables** antes de presionar Deploy, agrega:

| Nombre de Variable | Valor | Descripción |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres...` | Cadena de conexión obtenida de Supabase en el Paso 1.3 |
| `POSTGRES_URL` | `postgresql://postgres...` | Mismo valor que `DATABASE_URL` |
| `NODE_ENV` | `production` | Entorno de producción |

### Paso 2.3: Desplegar
1. Haz clic en **"Deploy"**.
2. Vercel compilará el frontend con `vite build` y empaquetará la API REST en `api/index.ts`.
3. Al finalizar, obtendrás tu URL pública en la nube: `https://tu-proyecto.vercel.app`.

---

## 3. Arquitectura Híbrida y Resiliencia

El servidor (`server.ts` y `src/db/postgres.ts`) implementa un adaptador inteligente:
- **Con `DATABASE_URL` configurado (Producción en Vercel + Supabase):** Realiza las consultas directamente sobre PostgreSQL en Supabase.
- **Sin `DATABASE_URL` (Previsualización local o desarrollo):** Mantiene la base de datos en memoria para que la aplicación nunca se detenga ni genere pantallas de error durante el desarrollo.
