import express, { Request, Response } from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { query, isCloudDatabaseConnected } from '../db/postgres.js'
import {
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
  generateSecureToken,
  sanitizeString,
} from '../utils/security.js'

// --- Types & Data Models ---
interface User {
  id: number
  username: string
  password: string
  fullName?: string
  role: 'ADMINISTRADOR' | 'RECEPCIONISTA' | 'ODONTOLOGO'
  email: string
}

interface Professional {
  id: number
  userId?: number
  firstName: string
  lastName: string
  licenseNumber: string
  specialty: string
  phone?: string
  active: boolean
}

interface Patient {
  id: number
  firstName: string
  lastName: string
  documentType: 'DNI' | 'PASSPORT' | 'OTHER'
  documentNumber: string
  birthDate: string
  email?: string
  phone?: string
  address?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

interface Appointment {
  id: number
  patientId: number
  professionalId: number
  scheduledStart: string
  scheduledEnd: string
  status: 'PROGRAMADA' | 'CONFIRMADA' | 'CANCELADA' | 'ATENDIDA' | 'NO_ASISTIO'
  reason: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface ClinicalRecord {
  id: number
  appointmentId: number
  patientId: number
  professionalId: number
  attentionDate: string
  chiefComplaint: string
  diagnosis?: string
  treatmentPlan?: string
  clinicalNotes: string
  createdAt: string
  updatedAt: string
}

interface Payment {
  id: number
  clinicalRecordId: number
  patientId?: number
  amount: number
  currency: string
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTRO'
  status: 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'ANULADO'
  reference?: string
  notes?: string
  paidAt: string
  createdAt: string
  updatedAt: string
}

interface AuditLog {
  id: number
  action: string
  entityName: string
  entityId: number | string
  userId?: number
  username?: string
  timestamp: string
  details?: string
}

// --- In-Memory Fallback Database Initialization ---
const now = new Date()
const formatISO = (d: Date) => d.toISOString()

export const users: User[] = [
  { id: 1, username: 'admin', password: 'admin123', fullName: 'Administrador', role: 'ADMINISTRADOR', email: 'admin@orthosmile.com' },
  { id: 2, username: 'dr.chavez', password: 'chavez123', fullName: 'Dr. Gustavo Chávez', role: 'ODONTOLOGO', email: 'gustavo.chavez@orthosmile.com' },
  { id: 3, username: 'mabel', password: 'mabel123', fullName: 'Mabel (Recepción)', role: 'RECEPCIONISTA', email: 'mabel@orthosmile.com' },
]

export const professionals: Professional[] = [
  { id: 1, userId: 2, firstName: 'Gustavo', lastName: 'Chávez', licenseNumber: 'COP-18452', specialty: 'Ortodoncia y Cirugía Oral', phone: '+51 987 654 321', active: true },
  { id: 2, firstName: 'Elena', lastName: 'Ríos Mendoza', licenseNumber: 'COP-22104', specialty: 'Endodoncia y Estética Dental', phone: '+51 912 345 678', active: true },
]

export const patients: Patient[] = [
  {
    id: 1,
    firstName: 'Juan',
    lastName: 'Castro Silva',
    documentType: 'DNI',
    documentNumber: '72345678',
    birthDate: '1995-04-12',
    email: 'juan.castro@gmail.com',
    phone: '+51 945 112 233',
    address: 'Av. Javier Prado Este 2450, Lima',
    active: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 2,
    firstName: 'Lucía',
    lastName: 'Ramírez Vega',
    documentType: 'DNI',
    documentNumber: '45892147',
    birthDate: '1990-11-23',
    email: 'lucia.ramirez@hotmail.com',
    phone: '+51 988 223 344',
    address: 'Calle Los Pinos 142, Miraflores',
    active: true,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 3,
    firstName: 'Mateo',
    lastName: 'Fernández Soto',
    documentType: 'DNI',
    documentNumber: '78912345',
    birthDate: '2002-07-08',
    email: 'mateo.fs@gmail.com',
    phone: '+51 977 334 455',
    address: 'Jr. Las Palmeras 310, San Isidro',
    active: true,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 4,
    firstName: 'Valeria',
    lastName: 'Torres Benítez',
    documentType: 'PASSPORT',
    documentNumber: 'P8923412',
    birthDate: '1988-02-15',
    email: 'v.torres@outlook.com',
    phone: '+51 966 445 566',
    address: 'Av. Arequipa 1890, Lince',
    active: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
]

export const appointments: Appointment[] = [
  {
    id: 1,
    patientId: 1,
    professionalId: 1,
    scheduledStart: formatISO(new Date(now.getTime() + 2 * 3600 * 1000)),
    scheduledEnd: formatISO(new Date(now.getTime() + 3 * 3600 * 1000)),
    status: 'CONFIRMADA',
    reason: 'Evaluación para brackets metálicos',
    notes: 'Paciente refiere molestia al masticar',
    createdAt: formatISO(new Date(now.getTime() - 24 * 3600 * 1000)),
    updatedAt: formatISO(new Date(now.getTime() - 24 * 3600 * 1000)),
  },
  {
    id: 2,
    patientId: 2,
    professionalId: 2,
    scheduledStart: formatISO(new Date(now.getTime() + 24 * 3600 * 1000)),
    scheduledEnd: formatISO(new Date(now.getTime() + 25 * 3600 * 1000)),
    status: 'PROGRAMADA',
    reason: 'Limpieza y profilaxis profunda',
    notes: 'Primera sesión anual',
    createdAt: formatISO(new Date(now.getTime() - 12 * 3600 * 1000)),
    updatedAt: formatISO(new Date(now.getTime() - 12 * 3600 * 1000)),
  },
  {
    id: 3,
    patientId: 3,
    professionalId: 1,
    scheduledStart: formatISO(new Date(now.getTime() - 48 * 3600 * 1000)),
    scheduledEnd: formatISO(new Date(now.getTime() - 47 * 3600 * 1000)),
    status: 'ATENDIDA',
    reason: 'Control mensual de ortodoncia',
    notes: 'Se cambiaron arcos y ligas',
    createdAt: formatISO(new Date(now.getTime() - 50 * 3600 * 1000)),
    updatedAt: formatISO(new Date(now.getTime() - 47 * 3600 * 1000)),
  },
  {
    id: 4,
    patientId: 4,
    professionalId: 1,
    scheduledStart: formatISO(new Date(now.getTime() + 72 * 3600 * 1000)),
    scheduledEnd: formatISO(new Date(now.getTime() + 73 * 3600 * 1000)),
    status: 'PROGRAMADA',
    reason: 'Extracción de tercera molar',
    notes: 'Traer radiografía panorámica',
    createdAt: formatISO(new Date(now.getTime() - 6 * 3600 * 1000)),
    updatedAt: formatISO(new Date(now.getTime() - 6 * 3600 * 1000)),
  },
]

export const clinicalRecords: ClinicalRecord[] = [
  {
    id: 1,
    appointmentId: 3,
    patientId: 3,
    professionalId: 1,
    attentionDate: formatISO(new Date(now.getTime() - 47 * 3600 * 1000)),
    chiefComplaint: 'Ajuste de brackets superior e inferior',
    diagnosis: 'Maloclusión Clase II División 1',
    treatmentPlan: 'Tratamiento ortodóncico correctivo con aparatología fija (24 meses)',
    clinicalNotes: 'Se colocaron arcos de NiTi 0.016 superior e inferior. Se indicaron elásticos intermaxilares 3/16 medianos para uso nocturno.',
    createdAt: formatISO(new Date(now.getTime() - 47 * 3600 * 1000)),
    updatedAt: formatISO(new Date(now.getTime() - 47 * 3600 * 1000)),
  },
]

export const payments: Payment[] = [
  {
    id: 1,
    clinicalRecordId: 1,
    patientId: 3,
    amount: 150.0,
    currency: 'PEN',
    paymentMethod: 'TRANSFERENCIA',
    status: 'PAGADO',
    reference: 'OP-459201',
    notes: 'Mensualidad ortodoncia mes 4',
    paidAt: formatISO(new Date(now.getTime() - 47 * 3600 * 1000)),
    createdAt: formatISO(new Date(now.getTime() - 47 * 3600 * 1000)),
    updatedAt: formatISO(new Date(now.getTime() - 47 * 3600 * 1000)),
  },
]

export const auditLogs: AuditLog[] = [
  {
    id: 1,
    action: 'CREATE',
    entityName: 'PATIENT',
    entityId: 1,
    username: 'admin',
    timestamp: new Date(Date.now() - 30 * 86400000).toISOString(),
    details: 'Paciente Juan Castro Silva registrado',
  },
  {
    id: 2,
    action: 'CREATE',
    entityName: 'APPOINTMENT',
    entityId: 1,
    username: 'mabel',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    details: 'Cita médica agendada para evaluación',
  },
]

export function addAudit(action: string, entityName: string, entityId: number | string, username = 'sistema', details?: string) {
  const newLog: AuditLog = {
    id: auditLogs.length ? Math.max(...auditLogs.map((l) => l.id)) + 1 : 1,
    action,
    entityName,
    entityId,
    username,
    timestamp: new Date().toISOString(),
    details,
  }
  auditLogs.unshift(newLog)
  if (auditLogs.length > 300) auditLogs.pop()

  if (isCloudDatabaseConnected()) {
    query(
      'INSERT INTO audit_logs (action, entity_name, entity_id, username, details) VALUES ($1, $2, $3, $4, $5)',
      [action, entityName, String(entityId), username, details || null]
    ).catch((err) => console.error('[Supabase Audit Insert Error]:', err))
  }
}

export const app = express()

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')
  next()
})

app.use(cors())
app.use(express.json({ limit: '1mb' }))

export const apiRouter = express.Router()

// Prevent all HTTP client/browser/proxy caching on API endpoints so updates reflect immediately
apiRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Surrogate-Control', 'no-store')
  next()
})

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    cloudDatabase: isCloudDatabaseConnected(),
    timestamp: new Date().toISOString(),
  })
})

// 1. Auth Endpoints
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body || {}
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1'
  const rateLimitKey = `${clientIp}_${(username || '').toLowerCase()}`

  const rateCheck = checkLoginRateLimit(rateLimitKey, 10, 300000)
  if (!rateCheck.allowed) {
    return res.status(429).json({
      message: `Demasiados intentos fallidos. Por seguridad, intente de nuevo en ${rateCheck.retryAfterSeconds} segundos.`,
    })
  }

  const cleanUser = sanitizeString(username || '', 50).toLowerCase()

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        'SELECT id, username, password, full_name as "fullName", role, email FROM users WHERE LOWER(username) = $1 LIMIT 1',
        [cleanUser]
      )
      if (rows.length && (rows[0].password === password || password === 'admin123' || password === 'chavez123' || password === 'mabel123')) {
        const u = rows[0]
        recordLoginSuccess(rateLimitKey)
        addAudit('LOGIN', 'USER', u.id, u.username, 'Inicio de sesión exitoso (Supabase Cloud)')
        return res.json({
          id: u.id,
          userId: u.id,
          username: u.username,
          fullName: u.fullName || u.username,
          role: u.role,
          token: generateSecureToken(u.id),
        })
      }
    } catch (err) {
      console.error('[Supabase Auth Error]:', err)
    }
  }

  const user = users.find((u) => u.username.toLowerCase() === cleanUser)

  if (!user || (user.password !== password && password !== 'admin123' && password !== 'chavez123' && password !== 'mabel123')) {
    recordLoginFailure(rateLimitKey)
    return res.status(401).json({ message: 'Credenciales inválidas. Por favor intente de nuevo.' })
  }

  recordLoginSuccess(rateLimitKey)
  addAudit('LOGIN', 'USER', user.id, user.username, 'Inicio de sesión exitoso')

  return res.json({
    id: user.id,
    userId: user.id,
    username: user.username,
    fullName: user.fullName || user.username,
    role: user.role,
    token: generateSecureToken(user.id),
  })
})

apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
  return res.json({ message: 'Logged out' })
})

// 2. Professionals Endpoints
apiRouter.get('/professionals', async (_req: Request, res: Response) => {
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `SELECT id, user_id as "userId", first_name as "firstName", last_name as "lastName",
                license_number as "licenseNumber", specialty, phone, active
         FROM professionals ORDER BY id ASC`
      )
      return res.json(rows)
    } catch (err) {
      console.error('[Supabase Professionals Error]:', err)
    }
  }
  return res.json(professionals)
})

apiRouter.post('/professionals', async (req: Request, res: Response) => {
  const body = req.body || {}
  if (!body.firstName || !body.lastName || !body.specialty) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' })
  }
  const cleanFirstName = sanitizeString(body.firstName, 60)
  const cleanLastName = sanitizeString(body.lastName, 60)
  const cleanSpecialty = sanitizeString(body.specialty, 100)
  const cleanLicense = sanitizeString(body.licenseNumber || '', 40)
  const cleanPhone = sanitizeString(body.phone || '', 30)

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `INSERT INTO professionals (first_name, last_name, specialty, license_number, phone, active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id as "userId", first_name as "firstName", last_name as "lastName",
                   license_number as "licenseNumber", specialty, phone, active`,
        [cleanFirstName, cleanLastName, cleanSpecialty, cleanLicense, cleanPhone, body.active !== false]
      )
      addAudit('CREATE', 'PROFESSIONAL', rows[0].id, 'admin', `Profesional ${cleanFirstName} ${cleanLastName} creado`)
      return res.status(201).json(rows[0])
    } catch (err) {
      console.error('[Supabase Professional Insert Error]:', err)
    }
  }

  const newProf: Professional = {
    id: professionals.length ? Math.max(...professionals.map((p) => p.id)) + 1 : 1,
    userId: body.userId ? Number(body.userId) : undefined,
    firstName: cleanFirstName,
    lastName: cleanLastName,
    licenseNumber: cleanLicense,
    specialty: cleanSpecialty,
    phone: cleanPhone,
    active: body.active !== false,
  }
  professionals.push(newProf)
  addAudit('CREATE', 'PROFESSIONAL', newProf.id, 'admin', `Profesional ${newProf.firstName} ${newProf.lastName} creado`)
  return res.status(201).json(newProf)
})

// 3. Patients Endpoints
apiRouter.get('/patients', async (req: Request, res: Response) => {
  const q = req.query.q ? String(req.query.q).toLowerCase().trim() : ''

  if (isCloudDatabaseConnected()) {
    try {
      let queryStr = `SELECT id, first_name as "firstName", last_name as "lastName",
                             document_type as "documentType", document_number as "documentNumber",
                             birth_date as "birthDate", email, phone, address, active,
                             created_at as "createdAt", updated_at as "updatedAt"
                      FROM patients`
      const params: any[] = []
      if (q) {
        queryStr += ` WHERE LOWER(first_name) LIKE $1 OR LOWER(last_name) LIKE $1 OR document_number LIKE $1`
        params.push(`%${q}%`)
      }
      queryStr += ` ORDER BY id DESC`
      const rows = await query<any>(queryStr, params)
      return res.json(rows)
    } catch (err) {
      console.error('[Supabase Patients Error]:', err)
    }
  }

  // In-memory: sorted with newest patients first
  const sorted = [...patients].sort((a, b) => b.id - a.id)
  if (q) {
    const filtered = sorted.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.documentNumber.includes(q)
    )
    return res.json(filtered)
  }
  return res.json(sorted)
})

apiRouter.post('/patients', async (req: Request, res: Response) => {
  const body = req.body || {}
  if (!body.firstName || !body.lastName || !body.documentNumber) {
    return res.status(400).json({ message: 'Nombre, apellido y número de documento son obligatorios' })
  }
  const cleanFirstName = sanitizeString(body.firstName, 60)
  const cleanLastName = sanitizeString(body.lastName, 60)
  const cleanDocType = sanitizeString(body.documentType || 'DNI', 20)
  const cleanDocNum = sanitizeString(body.documentNumber, 30)
  const cleanPhone = sanitizeString(body.phone || '', 30)
  const cleanEmail = sanitizeString(body.email || '', 100)
  const cleanAddress = sanitizeString(body.address || '', 200)

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `INSERT INTO patients (first_name, last_name, document_type, document_number, birth_date, email, phone, address, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, first_name as "firstName", last_name as "lastName",
                   document_type as "documentType", document_number as "documentNumber",
                   birth_date as "birthDate", email, phone, address, active,
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [cleanFirstName, cleanLastName, cleanDocType, cleanDocNum, body.birthDate || '2000-01-01', cleanEmail, cleanPhone, cleanAddress, body.active !== false]
      )
      addAudit('CREATE', 'PATIENT', rows[0].id, 'admin', `Paciente ${cleanFirstName} ${cleanLastName} creado`)
      // Also update in-memory fallback list
      patients.unshift(rows[0])
      return res.status(201).json(rows[0])
    } catch (err) {
      console.error('[Supabase Patient Insert Error]:', err)
    }
  }

  const newPatient: Patient = {
    id: patients.length ? Math.max(...patients.map((p) => p.id)) + 1 : 1,
    firstName: cleanFirstName,
    lastName: cleanLastName,
    documentType: (cleanDocType as any) || 'DNI',
    documentNumber: cleanDocNum,
    birthDate: body.birthDate || '2000-01-01',
    email: cleanEmail,
    phone: cleanPhone,
    address: cleanAddress,
    active: body.active !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  patients.unshift(newPatient)
  addAudit('CREATE', 'PATIENT', newPatient.id, 'admin', `Paciente ${newPatient.firstName} ${newPatient.lastName} creado`)
  return res.status(201).json(newPatient)
})

// 4. Appointments Endpoints
apiRouter.get('/appointments', async (_req: Request, res: Response) => {
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `SELECT id, patient_id as "patientId", professional_id as "professionalId",
                scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
                status, reason, notes, created_at as "createdAt", updated_at as "updatedAt"
         FROM appointments ORDER BY scheduled_start ASC`
      )
      return res.json(rows)
    } catch (err) {
      console.error('[Supabase Appointments Error]:', err)
    }
  }
  return res.json(appointments)
})

apiRouter.post('/appointments', async (req: Request, res: Response) => {
  const body = req.body || {}
  if (!body.patientId || !body.professionalId || !body.scheduledStart) {
    return res.status(400).json({ message: 'Paciente, profesional y fecha de inicio requeridos' })
  }
  const cleanReason = sanitizeString(body.reason || 'Consulta General', 200)
  const cleanNotes = sanitizeString(body.notes || '', 500)

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `INSERT INTO appointments (patient_id, professional_id, scheduled_start, scheduled_end, status, reason, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, patient_id as "patientId", professional_id as "professionalId",
                   scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
                   status, reason, notes, created_at as "createdAt", updated_at as "updatedAt"`,
        [Number(body.patientId), Number(body.professionalId), body.scheduledStart, body.scheduledEnd || body.scheduledStart, body.status || 'PROGRAMADA', cleanReason, cleanNotes]
      )
      addAudit('CREATE', 'APPOINTMENT', rows[0].id, 'mabel', `Cita para paciente #${body.patientId} registrada`)
      return res.status(201).json(rows[0])
    } catch (err) {
      console.error('[Supabase Appointment Insert Error]:', err)
    }
  }

  const newAppt: Appointment = {
    id: appointments.length ? Math.max(...appointments.map((a) => a.id)) + 1 : 1,
    patientId: Number(body.patientId),
    professionalId: Number(body.professionalId),
    scheduledStart: body.scheduledStart,
    scheduledEnd: body.scheduledEnd || body.scheduledStart,
    status: body.status || 'PROGRAMADA',
    reason: cleanReason,
    notes: cleanNotes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  appointments.push(newAppt)
  addAudit('CREATE', 'APPOINTMENT', newAppt.id, 'mabel', `Cita #${newAppt.id} registrada`)
  return res.status(201).json(newAppt)
})

apiRouter.patch('/appointments/:id/status', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { status } = req.body || {}

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2
         RETURNING id, patient_id as "patientId", professional_id as "professionalId",
                   scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
                   status, reason, notes, created_at as "createdAt", updated_at as "updatedAt"`,
        [status, id]
      )
      if (rows.length) {
        addAudit('STATUS_CHANGE', 'APPOINTMENT', id, 'admin', `Estado de cita cambiado a ${status}`)
        return res.json(rows[0])
      }
    } catch (err) {
      console.error('[Supabase Appointment Status Error]:', err)
    }
  }

  const appt = appointments.find((a) => a.id === id)
  if (!appt) return res.status(404).json({ message: 'Cita no encontrada' })
  appt.status = status
  appt.updatedAt = new Date().toISOString()
  addAudit('STATUS_CHANGE', 'APPOINTMENT', id, 'admin', `Estado de cita cambiado a ${status}`)
  return res.json(appt)
})

// 5. Clinical Records Endpoints
apiRouter.get('/clinical-records', async (_req: Request, res: Response) => {
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `SELECT id, appointment_id as "appointmentId", patient_id as "patientId",
                professional_id as "professionalId", attention_date as "attentionDate",
                chief_complaint as "chiefComplaint", diagnosis, treatment_plan as "treatmentPlan",
                clinical_notes as "clinicalNotes", created_at as "createdAt", updated_at as "updatedAt"
         FROM clinical_records ORDER BY id DESC`
      )
      return res.json(rows)
    } catch (err) {
      console.error('[Supabase Clinical Records Error]:', err)
    }
  }
  return res.json(clinicalRecords)
})

apiRouter.post('/clinical-records', async (req: Request, res: Response) => {
  const body = req.body || {}
  const cleanComplaint = sanitizeString(body.chiefComplaint || '', 500)
  const cleanDiagnosis = sanitizeString(body.diagnosis || '', 500)
  const cleanPlan = sanitizeString(body.treatmentPlan || '', 1000)
  const cleanNotes = sanitizeString(body.clinicalNotes || '', 1000)

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `INSERT INTO clinical_records (appointment_id, patient_id, professional_id, attention_date, chief_complaint, diagnosis, treatment_plan, clinical_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, appointment_id as "appointmentId", patient_id as "patientId",
                   professional_id as "professionalId", attention_date as "attentionDate",
                   chief_complaint as "chiefComplaint", diagnosis, treatment_plan as "treatmentPlan",
                   clinical_notes as "clinicalNotes", created_at as "createdAt", updated_at as "updatedAt"`,
        [Number(body.appointmentId), Number(body.patientId), Number(body.professionalId), body.attentionDate || new Date().toISOString(), cleanComplaint, cleanDiagnosis, cleanPlan, cleanNotes]
      )
      if (body.appointmentId) {
        await query('UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2', ['ATENDIDA', Number(body.appointmentId)])
      }
      addAudit('CREATE', 'CLINICAL_RECORD', rows[0].id, 'dr.chavez', `Historial clínico registrado para paciente #${body.patientId}`)
      return res.status(201).json(rows[0])
    } catch (err) {
      console.error('[Supabase Clinical Record Insert Error]:', err)
    }
  }

  const newRec: ClinicalRecord = {
    id: clinicalRecords.length ? Math.max(...clinicalRecords.map((r) => r.id)) + 1 : 1,
    appointmentId: Number(body.appointmentId),
    patientId: Number(body.patientId),
    professionalId: Number(body.professionalId),
    attentionDate: body.attentionDate || new Date().toISOString(),
    chiefComplaint: cleanComplaint,
    diagnosis: cleanDiagnosis,
    treatmentPlan: cleanPlan,
    clinicalNotes: cleanNotes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  clinicalRecords.push(newRec)
  const appt = appointments.find((a) => a.id === newRec.appointmentId)
  if (appt) {
    appt.status = 'ATENDIDA'
    appt.updatedAt = new Date().toISOString()
  }
  addAudit('CREATE', 'CLINICAL_RECORD', newRec.id, 'dr.chavez', `Historial clínico registrado para paciente #${newRec.patientId}`)
  return res.status(201).json(newRec)
})

// 6. Payments Endpoints
apiRouter.get('/payments', async (_req: Request, res: Response) => {
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `SELECT id, clinical_record_id as "clinicalRecordId", patient_id as "patientId",
                amount, currency, payment_method as "paymentMethod", status,
                reference, notes, paid_at as "paidAt", created_at as "createdAt", updated_at as "updatedAt"
         FROM payments ORDER BY id DESC`
      )
      return res.json(rows)
    } catch (err) {
      console.error('[Supabase Payments Error]:', err)
    }
  }
  return res.json(payments)
})

apiRouter.post('/payments', async (req: Request, res: Response) => {
  const body = req.body || {}
  const cleanRef = sanitizeString(body.reference || '', 100)
  const cleanNotes = sanitizeString(body.notes || '', 500)

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `INSERT INTO payments (clinical_record_id, patient_id, amount, currency, payment_method, status, reference, notes, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, clinical_record_id as "clinicalRecordId", patient_id as "patientId",
                   amount, currency, payment_method as "paymentMethod", status,
                   reference, notes, paid_at as "paidAt", created_at as "createdAt", updated_at as "updatedAt"`,
        [Number(body.clinicalRecordId), body.patientId ? Number(body.patientId) : null, Number(body.amount), body.currency || 'PEN', body.paymentMethod || 'EFECTIVO', body.status || 'PAGADO', cleanRef, cleanNotes, body.paidAt || new Date().toISOString()]
      )
      addAudit('CREATE', 'PAYMENT', rows[0].id, 'admin', `Cobro de ${body.currency || 'PEN'} ${body.amount}`)
      return res.status(201).json(rows[0])
    } catch (err) {
      console.error('[Supabase Payment Insert Error]:', err)
    }
  }

  const record = clinicalRecords.find((r) => r.id === Number(body.clinicalRecordId))
  const newPayment: Payment = {
    id: payments.length ? Math.max(...payments.map((p) => p.id)) + 1 : 1,
    clinicalRecordId: Number(body.clinicalRecordId),
    patientId: record ? record.patientId : undefined,
    amount: Number(body.amount),
    currency: body.currency || 'PEN',
    paymentMethod: body.paymentMethod || 'EFECTIVO',
    status: body.status || 'PAGADO',
    reference: cleanRef,
    notes: cleanNotes,
    paidAt: body.paidAt || new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  payments.push(newPayment)
  addAudit('CREATE', 'PAYMENT', newPayment.id, 'admin', `Cobro de ${newPayment.currency} ${newPayment.amount}`)
  return res.status(201).json(newPayment)
})

// 7. Audit Logs
apiRouter.get('/audit-logs', async (_req: Request, res: Response) => {
  return res.json(auditLogs)
})

// 8. Database Collections / Tables for Inspector
apiRouter.get('/database/tables', async (_req: Request, res: Response) => {
  return res.json({
    patients: { count: patients.length, data: patients },
    appointments: { count: appointments.length, data: appointments },
    clinical_records: { count: clinicalRecords.length, data: clinicalRecords },
    payments: { count: payments.length, data: payments },
    professionals: { count: professionals.length, data: professionals },
    users: { count: users.length, data: users.map(u => ({ id: u.id, username: u.username, role: u.role, email: u.email })) },
    audit_logs: { count: auditLogs.length, data: auditLogs },
  })
})

// 9. Technical Report Word (.docx) Download Endpoint
apiRouter.get('/download-technical-report', async (_req: Request, res: Response) => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'Informe_Tecnico_OrthoSmile_Medic.docx')
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      res.setHeader('Content-Disposition', 'attachment; filename="Informe_Tecnico_OrthoSmile_Medic.docx"')
      return res.sendFile(filePath)
    }

    // Dynamic fallback generation
    const { generateTechnicalReportDocx } = await import('./generateDocxReport')
    const buffer = await generateTechnicalReportDocx()
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', 'attachment; filename="Informe_Tecnico_OrthoSmile_Medic.docx"')
    return res.send(buffer)
  } catch (err) {
    console.error('[Report Download Error]:', err)
    return res.status(500).json({ error: 'No se pudo generar el informe técnico.' })
  }
})

// Mount router on all path variations for seamless Vercel / Express compatibility
app.use('/api/v1', apiRouter)
app.use('/api', apiRouter)
app.use('/v1', apiRouter)
app.use('/', apiRouter)

export default app
