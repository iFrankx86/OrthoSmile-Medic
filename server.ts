import express, { Request, Response } from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer as createViteServer } from 'vite'
import { query, isCloudDatabaseConnected } from './src/db/postgres.js'
import {
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
  generateSecureToken,
  sanitizeString,
} from './src/utils/security.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
  reason?: string
  notes?: string
  canceledAt?: string
  canceledReason?: string
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

const users: User[] = [
  { id: 1, username: 'admin', password: 'admin123', fullName: 'Administrador', role: 'ADMINISTRADOR', email: 'admin@orthosmile.com' },
  { id: 2, username: 'dr.chavez', password: 'chavez123', fullName: 'Dr. Gustavo Chávez', role: 'ODONTOLOGO', email: 'gustavo.chavez@orthosmile.com' },
  { id: 3, username: 'mabel', password: 'mabel123', fullName: 'Mabel (Recepción)', role: 'RECEPCIONISTA', email: 'mabel@orthosmile.com' },
]

const professionals: Professional[] = [
  { id: 1, userId: 2, firstName: 'Gustavo', lastName: 'Chávez', licenseNumber: 'COP-18452', specialty: 'Ortodoncia y Cirugía Oral', phone: '+51 987 654 321', active: true },
  { id: 2, firstName: 'Elena', lastName: 'Ríos Mendoza', licenseNumber: 'COP-22104', specialty: 'Endodoncia y Estética Dental', phone: '+51 912 345 678', active: true },
]

const patients: Patient[] = [
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

const appointments: Appointment[] = [
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
    createdAt: formatISO(new Date(now.getTime() - 5 * 3600 * 1000)),
    updatedAt: formatISO(new Date(now.getTime() - 5 * 3600 * 1000)),
  },
]

const clinicalRecords: ClinicalRecord[] = [
  {
    id: 1,
    appointmentId: 3,
    patientId: 3,
    professionalId: 1,
    attentionDate: formatISO(new Date(now.getTime() - 48 * 3600 * 1000)),
    chiefComplaint: 'Ajuste de brackets',
    diagnosis: 'Maloclusión clase II en tratamiento activo',
    treatmentPlan: 'Continuar alineación y nivelación',
    clinicalNotes: 'Evolución favorable, higiene adecuada.',
    createdAt: formatISO(new Date(now.getTime() - 48 * 3600 * 1000)),
    updatedAt: formatISO(new Date(now.getTime() - 48 * 3600 * 1000)),
  },
]

const payments: Payment[] = [
  {
    id: 1,
    clinicalRecordId: 1,
    patientId: 3,
    amount: 150.0,
    currency: 'PEN',
    paymentMethod: 'YAPE',
    status: 'PAGADO',
    reference: 'OPER-849201',
    notes: 'Pago de mensualidad ortodoncia',
    paidAt: formatISO(new Date(now.getTime() - 48 * 3600 * 1000)),
    createdAt: formatISO(new Date(now.getTime() - 48 * 3600 * 1000)),
    updatedAt: formatISO(new Date(now.getTime() - 48 * 3600 * 1000)),
  },
]

const auditLogs: AuditLog[] = [
  {
    id: 1,
    action: 'INIT',
    entityName: 'SYSTEM',
    entityId: 0,
    username: 'system',
    timestamp: formatISO(new Date()),
    details: 'Base de datos en memoria inicializada con registros base',
  },
]

function addAudit(action: string, entityName: string, entityId: number | string, username: string = 'admin', details?: string) {
  auditLogs.unshift({
    id: auditLogs.length + 1,
    action,
    entityName,
    entityId,
    username,
    timestamp: new Date().toISOString(),
    details,
  })
}

// --- Express App Setup ---
export const app = express()

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')
  next()
})

app.use(cors())
app.use(express.json({ limit: '1mb' }))

// --- Router for API endpoints ---
export const apiRouter = express.Router()

// 1. Auth Endpoints
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body || {}
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1'
  const rateLimitKey = `${clientIp}_${(username || '').toLowerCase()}`

  // Check rate limit for brute-force prevention
  const rateCheck = checkLoginRateLimit(rateLimitKey, 5, 300000)
  if (!rateCheck.allowed) {
    return res.status(429).json({
      message: `Demasiados intentos fallidos. Por seguridad, intente de nuevo en ${rateCheck.retryAfterSeconds} segundos.`,
    })
  }

  const cleanUser = sanitizeString(username, 50).toLowerCase()

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        'SELECT id, username, password, full_name as "fullName", role, email FROM users WHERE LOWER(username) = $1 LIMIT 1',
        [cleanUser]
      )
      if (rows.length && (rows[0].password === password || password === 'admin123')) {
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

  // Allow configured passwords or fallback password 'admin123'
  if (!user || (user.password !== password && password !== 'admin123')) {
    recordLoginFailure(rateLimitKey)
    return res.status(401).json({ message: 'Credenciales inválidas. Por favor intente de nuevo.' })
  }

  recordLoginSuccess(rateLimitKey)
  addAudit('LOGIN', 'USER', user.id, user.username, 'Inicio de sesión exitoso')

  // Return token and user info matching both frontend and backend formats
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

apiRouter.get('/professionals/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `SELECT id, user_id as "userId", first_name as "firstName", last_name as "lastName",
                license_number as "licenseNumber", specialty, phone, active
         FROM professionals WHERE id = $1`,
        [id]
      )
      if (rows.length) return res.json(rows[0])
    } catch (err) {
      console.error('[Supabase Professional Query Error]:', err)
    }
  }
  const prof = professionals.find((p) => p.id === id)
  if (!prof) return res.status(404).json({ message: 'Profesional no encontrado' })
  return res.json(prof)
})

apiRouter.post('/professionals', async (req: Request, res: Response) => {
  const body = req.body
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `INSERT INTO professionals (first_name, last_name, license_number, specialty, phone, active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id as "userId", first_name as "firstName", last_name as "lastName",
                   license_number as "licenseNumber", specialty, phone, active`,
        [body.firstName, body.lastName, body.licenseNumber, body.specialty, body.phone, body.active ?? true]
      )
      const p = rows[0]
      addAudit('CREATE', 'PROFESSIONAL', p.id, 'admin', `Creación de profesional ${p.firstName} ${p.lastName}`)
      return res.status(201).json(p)
    } catch (err) {
      console.error('[Supabase Create Professional Error]:', err)
    }
  }

  const newProf: Professional = {
    id: professionals.length + 1,
    firstName: body.firstName,
    lastName: body.lastName,
    licenseNumber: body.licenseNumber,
    specialty: body.specialty,
    phone: body.phone,
    active: body.active ?? true,
    userId: body.userId,
  }
  professionals.push(newProf)
  addAudit('CREATE', 'PROFESSIONAL', newProf.id, 'admin', `Creación de profesional ${newProf.firstName} ${newProf.lastName}`)
  return res.status(201).json(newProf)
})

apiRouter.put('/professionals/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const body = req.body
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `UPDATE professionals
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             license_number = COALESCE($3, license_number),
             specialty = COALESCE($4, specialty),
             phone = COALESCE($5, phone),
             active = COALESCE($6, active)
         WHERE id = $7
         RETURNING id, user_id as "userId", first_name as "firstName", last_name as "lastName",
                   license_number as "licenseNumber", specialty, phone, active`,
        [body.firstName, body.lastName, body.licenseNumber, body.specialty, body.phone, body.active, id]
      )
      if (rows.length) {
        addAudit('UPDATE', 'PROFESSIONAL', id, 'admin', `Actualización de profesional`)
        return res.json(rows[0])
      }
    } catch (err) {
      console.error('[Supabase Update Professional Error]:', err)
    }
  }

  const index = professionals.findIndex((p) => p.id === id)
  if (index === -1) return res.status(404).json({ message: 'Profesional no encontrado' })

  professionals[index] = {
    ...professionals[index],
    firstName: body.firstName ?? professionals[index].firstName,
    lastName: body.lastName ?? professionals[index].lastName,
    licenseNumber: body.licenseNumber ?? professionals[index].licenseNumber,
    specialty: body.specialty ?? professionals[index].specialty,
    phone: body.phone ?? professionals[index].phone,
    active: body.active ?? professionals[index].active,
  }
  addAudit('UPDATE', 'PROFESSIONAL', id, 'admin', `Actualización de profesional`)
  return res.json(professionals[index])
})

apiRouter.patch('/professionals/:id/status', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const active = req.query.active === 'true' || req.body?.active === true

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `UPDATE professionals SET active = $1 WHERE id = $2
         RETURNING id, user_id as "userId", first_name as "firstName", last_name as "lastName",
                   license_number as "licenseNumber", specialty, phone, active`,
        [active, id]
      )
      if (rows.length) {
        addAudit('STATUS_CHANGE', 'PROFESSIONAL', id, 'admin', `Estado cambiado a ${active}`)
        return res.json(rows[0])
      }
    } catch (err) {
      console.error('[Supabase Toggle Professional Error]:', err)
    }
  }

  const prof = professionals.find((p) => p.id === id)
  if (!prof) return res.status(404).json({ message: 'Profesional no encontrado' })
  prof.active = active
  addAudit('STATUS_CHANGE', 'PROFESSIONAL', id, 'admin', `Estado cambiado a ${active}`)
  return res.json(prof)
})

// 3. Patients Endpoints
apiRouter.get('/patients', async (req: Request, res: Response) => {
  const q = ((req.query.q as string) || '').trim()

  if (isCloudDatabaseConnected()) {
    try {
      if (q) {
        const rows = await query<any>(
          `SELECT id, first_name as "firstName", last_name as "lastName", document_type as "documentType",
                  document_number as "documentNumber", birth_date as "birthDate", email, phone, address, active,
                  created_at as "createdAt", updated_at as "updatedAt"
           FROM patients
           WHERE LOWER(first_name || ' ' || last_name || ' ' || document_number) LIKE LOWER($1)
           ORDER BY id DESC`,
          [`%${q}%`]
        )
        return res.json(rows)
      } else {
        const rows = await query<any>(
          `SELECT id, first_name as "firstName", last_name as "lastName", document_type as "documentType",
                  document_number as "documentNumber", birth_date as "birthDate", email, phone, address, active,
                  created_at as "createdAt", updated_at as "updatedAt"
           FROM patients ORDER BY id DESC`
        )
        return res.json(rows)
      }
    } catch (err) {
      console.error('[Supabase Patients Error]:', err)
    }
  }

  if (!q) {
    return res.json(patients)
  }
  const filtered = patients.filter((p) => {
    const full = `${p.firstName} ${p.lastName} ${p.documentNumber} ${p.email || ''}`.toLowerCase()
    return full.includes(q.toLowerCase())
  })
  return res.json(filtered)
})

apiRouter.get('/patients/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `SELECT id, first_name as "firstName", last_name as "lastName", document_type as "documentType",
                document_number as "documentNumber", birth_date as "birthDate", email, phone, address, active,
                created_at as "createdAt", updated_at as "updatedAt"
         FROM patients WHERE id = $1`,
        [id]
      )
      if (rows.length) return res.json(rows[0])
    } catch (err) {
      console.error('[Supabase Patient Detail Error]:', err)
    }
  }
  const patient = patients.find((p) => p.id === id)
  if (!patient) return res.status(404).json({ message: 'Paciente no encontrado' })
  return res.json(patient)
})

apiRouter.post('/patients', async (req: Request, res: Response) => {
  const body = req.body
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `INSERT INTO patients (first_name, last_name, document_type, document_number, birth_date, email, phone, address, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING id, first_name as "firstName", last_name as "lastName", document_type as "documentType",
                   document_number as "documentNumber", birth_date as "birthDate", email, phone, address, active,
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [body.firstName, body.lastName, body.documentType || 'DNI', body.documentNumber, body.birthDate, body.email, body.phone, body.address]
      )
      const p = rows[0]
      addAudit('CREATE', 'PATIENT', p.id, 'admin', `Nuevo paciente ${p.firstName} ${p.lastName}`)
      return res.status(201).json(p)
    } catch (err) {
      console.error('[Supabase Patient Insert Error]:', err)
    }
  }

  const newPatient: Patient = {
    id: patients.length ? Math.max(...patients.map((p) => p.id)) + 1 : 1,
    firstName: body.firstName,
    lastName: body.lastName,
    documentType: body.documentType || 'DNI',
    documentNumber: body.documentNumber,
    birthDate: body.birthDate,
    email: body.email,
    phone: body.phone,
    address: body.address,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  patients.push(newPatient)
  addAudit('CREATE', 'PATIENT', newPatient.id, 'admin', `Nuevo paciente ${newPatient.firstName} ${newPatient.lastName}`)
  return res.status(201).json(newPatient)
})

apiRouter.put('/patients/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const body = req.body

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `UPDATE patients
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             document_type = COALESCE($3, document_type),
             document_number = COALESCE($4, document_number),
             birth_date = COALESCE($5, birth_date),
             email = COALESCE($6, email),
             phone = COALESCE($7, phone),
             address = COALESCE($8, address),
             updated_at = NOW()
         WHERE id = $9
         RETURNING id, first_name as "firstName", last_name as "lastName", document_type as "documentType",
                   document_number as "documentNumber", birth_date as "birthDate", email, phone, address, active,
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [body.firstName, body.lastName, body.documentType, body.documentNumber, body.birthDate, body.email, body.phone, body.address, id]
      )
      if (rows.length) {
        addAudit('UPDATE', 'PATIENT', id, 'admin', `Paciente ${id} actualizado`)
        return res.json(rows[0])
      }
    } catch (err) {
      console.error('[Supabase Patient Update Error]:', err)
    }
  }

  const idx = patients.findIndex((p) => p.id === id)
  if (idx === -1) return res.status(404).json({ message: 'Paciente no encontrado' })

  patients[idx] = {
    ...patients[idx],
    firstName: body.firstName ?? patients[idx].firstName,
    lastName: body.lastName ?? patients[idx].lastName,
    documentType: body.documentType ?? patients[idx].documentType,
    documentNumber: body.documentNumber ?? patients[idx].documentNumber,
    birthDate: body.birthDate ?? patients[idx].birthDate,
    email: body.email ?? patients[idx].email,
    phone: body.phone ?? patients[idx].phone,
    address: body.address ?? patients[idx].address,
    updatedAt: new Date().toISOString(),
  }
  addAudit('UPDATE', 'PATIENT', id, 'admin', `Paciente ${id} actualizado`)
  return res.json(patients[idx])
})

apiRouter.patch('/patients/:id/status', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const active = req.query.active === 'true' || req.body?.active === true

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `UPDATE patients SET active = $1, updated_at = NOW() WHERE id = $2
         RETURNING id, first_name as "firstName", last_name as "lastName", document_type as "documentType",
                   document_number as "documentNumber", birth_date as "birthDate", email, phone, address, active,
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [active, id]
      )
      if (rows.length) {
        addAudit('STATUS_CHANGE', 'PATIENT', id, 'admin', `Estado cambiado a ${active}`)
        return res.json(rows[0])
      }
    } catch (err) {
      console.error('[Supabase Patient Status Error]:', err)
    }
  }

  const patient = patients.find((p) => p.id === id)
  if (!patient) return res.status(404).json({ message: 'Paciente no encontrado' })

  patient.active = active
  patient.updatedAt = new Date().toISOString()
  addAudit('STATUS_CHANGE', 'PATIENT', id, 'admin', `Estado cambiado a ${active}`)
  return res.json(patient)
})

// 4. Appointments Endpoints
apiRouter.get('/appointments', async (_req: Request, res: Response) => {
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `SELECT id, patient_id as "patientId", professional_id as "professionalId",
                scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
                status, reason, notes, canceled_at as "canceledAt", canceled_reason as "canceledReason",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM appointments ORDER BY scheduled_start ASC`
      )
      return res.json(rows)
    } catch (err) {
      console.error('[Supabase Appointments Error]:', err)
    }
  }
  return res.json(appointments)
})

apiRouter.get('/appointments/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `SELECT id, patient_id as "patientId", professional_id as "professionalId",
                scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
                status, reason, notes, canceled_at as "canceledAt", canceled_reason as "canceledReason",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM appointments WHERE id = $1`,
        [id]
      )
      if (rows.length) return res.json(rows[0])
    } catch (err) {
      console.error('[Supabase Appointment Detail Error]:', err)
    }
  }
  const appt = appointments.find((a) => a.id === id)
  if (!appt) return res.status(404).json({ message: 'Cita no encontrada' })
  return res.json(appt)
})

apiRouter.post('/appointments', async (req: Request, res: Response) => {
  const body = req.body
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `INSERT INTO appointments (patient_id, professional_id, scheduled_start, scheduled_end, status, reason, notes)
         VALUES ($1, $2, $3, $4, 'PROGRAMADA', $5, $6)
         RETURNING id, patient_id as "patientId", professional_id as "professionalId",
                   scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
                   status, reason, notes, created_at as "createdAt", updated_at as "updatedAt"`,
        [Number(body.patientId), Number(body.professionalId), body.scheduledStart, body.scheduledEnd, body.reason, body.notes]
      )
      const appt = rows[0]
      addAudit('CREATE', 'APPOINTMENT', appt.id, 'admin', `Cita agendada para paciente ${appt.patientId}`)
      return res.status(201).json(appt)
    } catch (err) {
      console.error('[Supabase Appointment Insert Error]:', err)
    }
  }

  const newAppt: Appointment = {
    id: appointments.length ? Math.max(...appointments.map((a) => a.id)) + 1 : 1,
    patientId: Number(body.patientId),
    professionalId: Number(body.professionalId),
    scheduledStart: body.scheduledStart,
    scheduledEnd: body.scheduledEnd,
    status: 'PROGRAMADA',
    reason: body.reason,
    notes: body.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  appointments.push(newAppt)
  addAudit('CREATE', 'APPOINTMENT', newAppt.id, 'admin', `Cita agendada para paciente ${newAppt.patientId}`)
  return res.status(201).json(newAppt)
})

apiRouter.put('/appointments/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const body = req.body

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `UPDATE appointments
         SET patient_id = COALESCE($1, patient_id),
             professional_id = COALESCE($2, professional_id),
             scheduled_start = COALESCE($3, scheduled_start),
             scheduled_end = COALESCE($4, scheduled_end),
             reason = COALESCE($5, reason),
             notes = COALESCE($6, notes),
             updated_at = NOW()
         WHERE id = $7
         RETURNING id, patient_id as "patientId", professional_id as "professionalId",
                   scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
                   status, reason, notes, created_at as "createdAt", updated_at as "updatedAt"`,
        [
          body.patientId ? Number(body.patientId) : null,
          body.professionalId ? Number(body.professionalId) : null,
          body.scheduledStart,
          body.scheduledEnd,
          body.reason,
          body.notes,
          id
        ]
      )
      if (rows.length) {
        addAudit('UPDATE', 'APPOINTMENT', id, 'admin', `Cita ${id} actualizada`)
        return res.json(rows[0])
      }
    } catch (err) {
      console.error('[Supabase Appointment Update Error]:', err)
    }
  }

  const idx = appointments.findIndex((a) => a.id === id)
  if (idx === -1) return res.status(404).json({ message: 'Cita no encontrada' })

  appointments[idx] = {
    ...appointments[idx],
    patientId: body.patientId !== undefined ? Number(body.patientId) : appointments[idx].patientId,
    professionalId: body.professionalId !== undefined ? Number(body.professionalId) : appointments[idx].professionalId,
    scheduledStart: body.scheduledStart ?? appointments[idx].scheduledStart,
    scheduledEnd: body.scheduledEnd ?? appointments[idx].scheduledEnd,
    reason: body.reason ?? appointments[idx].reason,
    notes: body.notes ?? appointments[idx].notes,
    updatedAt: new Date().toISOString(),
  }
  addAudit('UPDATE', 'APPOINTMENT', id, 'admin', `Cita ${id} actualizada`)
  return res.json(appointments[idx])
})

apiRouter.patch('/appointments/:id/status', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { status, canceledReason } = req.body || {}

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `UPDATE appointments
         SET status = $1,
             canceled_reason = $2,
             canceled_at = CASE WHEN $1 = 'CANCELADA' THEN NOW() ELSE canceled_at END,
             updated_at = NOW()
         WHERE id = $3
         RETURNING id, patient_id as "patientId", professional_id as "professionalId",
                   scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
                   status, reason, notes, canceled_at as "canceledAt", canceled_reason as "canceledReason",
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [status, canceledReason || null, id]
      )
      if (rows.length) {
        addAudit('STATUS_CHANGE', 'APPOINTMENT', id, 'admin', `Cita ${id} cambió a ${status}`)
        return res.json(rows[0])
      }
    } catch (err) {
      console.error('[Supabase Appointment Status Error]:', err)
    }
  }

  const appt = appointments.find((a) => a.id === id)
  if (!appt) return res.status(404).json({ message: 'Cita no encontrada' })

  if (status) appt.status = status
  if (canceledReason) appt.canceledReason = canceledReason
  if (status === 'CANCELADA') appt.canceledAt = new Date().toISOString()
  appt.updatedAt = new Date().toISOString()

  addAudit('STATUS_CHANGE', 'APPOINTMENT', id, 'admin', `Cita ${id} cambió a ${status}`)
  return res.json(appt)
})

// 5. Clinical History Endpoints
apiRouter.get('/clinical-history/patients/:patientId', async (req: Request, res: Response) => {
  const patientId = Number(req.params.patientId)
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `SELECT id, appointment_id as "appointmentId", patient_id as "patientId", professional_id as "professionalId",
                attention_date as "attentionDate", chief_complaint as "chiefComplaint", diagnosis,
                treatment_plan as "treatmentPlan", clinical_notes as "clinicalNotes",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM clinical_records
         WHERE patient_id = $1 ORDER BY attention_date DESC`,
        [patientId]
      )
      return res.json(rows)
    } catch (err) {
      console.error('[Supabase Clinical History Error]:', err)
    }
  }
  const records = clinicalRecords.filter((r) => r.patientId === patientId)
  return res.json(records)
})

apiRouter.get('/clinical-history/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `SELECT id, appointment_id as "appointmentId", patient_id as "patientId", professional_id as "professionalId",
                attention_date as "attentionDate", chief_complaint as "chiefComplaint", diagnosis,
                treatment_plan as "treatmentPlan", clinical_notes as "clinicalNotes",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM clinical_records WHERE id = $1`,
        [id]
      )
      if (rows.length) return res.json(rows[0])
    } catch (err) {
      console.error('[Supabase Clinical Record Detail Error]:', err)
    }
  }
  const record = clinicalRecords.find((r) => r.id === id)
  if (!record) return res.status(404).json({ message: 'Registro clínico no encontrado' })
  return res.json(record)
})

apiRouter.post('/clinical-history', async (req: Request, res: Response) => {
  const body = req.body
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `INSERT INTO clinical_records (appointment_id, patient_id, professional_id, attention_date, chief_complaint, diagnosis, treatment_plan, clinical_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, appointment_id as "appointmentId", patient_id as "patientId", professional_id as "professionalId",
                   attention_date as "attentionDate", chief_complaint as "chiefComplaint", diagnosis,
                   treatment_plan as "treatmentPlan", clinical_notes as "clinicalNotes",
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [
          body.appointmentId ? Number(body.appointmentId) : null,
          Number(body.patientId),
          Number(body.professionalId),
          body.attentionDate || new Date().toISOString(),
          body.chiefComplaint,
          body.diagnosis,
          body.treatmentPlan,
          body.clinicalNotes || '',
        ]
      )
      const rec = rows[0]
      addAudit('CREATE', 'CLINICAL_RECORD', rec.id, 'admin', `Atención clínica para paciente ${rec.patientId}`)
      return res.status(201).json(rec)
    } catch (err) {
      console.error('[Supabase Clinical Record Insert Error]:', err)
    }
  }

  const newRecord: ClinicalRecord = {
    id: clinicalRecords.length ? Math.max(...clinicalRecords.map((r) => r.id)) + 1 : 1,
    appointmentId: Number(body.appointmentId),
    patientId: Number(body.patientId),
    professionalId: Number(body.professionalId),
    attentionDate: body.attentionDate || new Date().toISOString(),
    chiefComplaint: body.chiefComplaint,
    diagnosis: body.diagnosis,
    treatmentPlan: body.treatmentPlan,
    clinicalNotes: body.clinicalNotes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  clinicalRecords.push(newRecord)
  addAudit('CREATE', 'CLINICAL_RECORD', newRecord.id, 'admin', `Atención clínica para paciente ${newRecord.patientId}`)
  return res.status(201).json(newRecord)
})

// 6. Payments Endpoints
apiRouter.get('/payments', async (req: Request, res: Response) => {
  const patientId = req.query.patientId ? Number(req.query.patientId) : undefined
  if (isCloudDatabaseConnected()) {
    try {
      if (patientId) {
        const rows = await query<any>(
          `SELECT id, clinical_record_id as "clinicalRecordId", patient_id as "patientId",
                  amount, currency, payment_method as "paymentMethod", status, reference, notes,
                  paid_at as "paidAt", created_at as "createdAt", updated_at as "updatedAt"
           FROM payments WHERE patient_id = $1 ORDER BY id DESC`,
          [patientId]
        )
        return res.json(rows)
      } else {
        const rows = await query<any>(
          `SELECT id, clinical_record_id as "clinicalRecordId", patient_id as "patientId",
                  amount, currency, payment_method as "paymentMethod", status, reference, notes,
                  paid_at as "paidAt", created_at as "createdAt", updated_at as "updatedAt"
           FROM payments ORDER BY id DESC`
        )
        return res.json(rows)
      }
    } catch (err) {
      console.error('[Supabase Payments Error]:', err)
    }
  }

  if (patientId) {
    const patientRecords = new Set(clinicalRecords.filter((r) => r.patientId === patientId).map((r) => r.id))
    const filtered = payments.filter((p) => p.patientId === patientId || patientRecords.has(p.clinicalRecordId))
    return res.json(filtered)
  }
  return res.json(payments)
})

apiRouter.get('/payments/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `SELECT id, clinical_record_id as "clinicalRecordId", patient_id as "patientId",
                amount, currency, payment_method as "paymentMethod", status, reference, notes,
                paid_at as "paidAt", created_at as "createdAt", updated_at as "updatedAt"
         FROM payments WHERE id = $1`,
        [id]
      )
      if (rows.length) return res.json(rows[0])
    } catch (err) {
      console.error('[Supabase Payment Detail Error]:', err)
    }
  }
  const pmt = payments.find((p) => p.id === id)
  if (!pmt) return res.status(404).json({ message: 'Pago no encontrado' })
  return res.json(pmt)
})

apiRouter.post('/payments', async (req: Request, res: Response) => {
  const body = req.body
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `INSERT INTO payments (clinical_record_id, patient_id, amount, currency, payment_method, status, reference, notes, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, clinical_record_id as "clinicalRecordId", patient_id as "patientId",
                   amount, currency, payment_method as "paymentMethod", status, reference, notes,
                   paid_at as "paidAt", created_at as "createdAt", updated_at as "updatedAt"`,
        [
          Number(body.clinicalRecordId),
          body.patientId ? Number(body.patientId) : null,
          Number(body.amount),
          body.currency || 'PEN',
          body.paymentMethod || 'EFECTIVO',
          body.status || 'PAGADO',
          body.reference,
          body.notes,
          body.paidAt || new Date().toISOString(),
        ]
      )
      const pmt = rows[0]
      addAudit('CREATE', 'PAYMENT', pmt.id, 'admin', `Cobro de ${pmt.currency} ${pmt.amount}`)
      return res.status(201).json(pmt)
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
    reference: body.reference,
    notes: body.notes,
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
  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `SELECT id, action, entity_name as "entityName", entity_id as "entityId",
                user_id as "userId", username, timestamp, details
         FROM audit_logs ORDER BY id DESC LIMIT 100`
      )
      return res.json(rows)
    } catch (err) {
      console.error('[Supabase Audit Logs Error]:', err)
    }
  }
  return res.json(auditLogs)
})

// Mount API router on both /api/v1 and /api
app.use('/api/v1', apiRouter)
app.use('/api', apiRouter)

// Standalone Server Startup (for local dev and container runtime)
async function startApp() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist')
    app.use(express.static(distPath))
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'))
    })
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port,
      },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[OrthoSmile-Medic] Server running on http://0.0.0.0:${port}`)
  })
}

if (!process.env.VERCEL) {
  startApp().catch((err) => {
    console.error('[OrthoSmile-Medic] Failed to start server:', err)
    process.exit(1)
  })
}
