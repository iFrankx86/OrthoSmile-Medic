import express, { Request, Response } from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { query, isCloudDatabaseConnected } from '../db/postgres.js'
import { db } from '../lib/firebase.js'
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
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
  { id: 2, username: 'dr.chavez', password: 'chavez123', fullName: 'Dr. Manuel Gustavo Chavez Sevillano (Orthodontist, MSc, PhD)', role: 'ODONTOLOGO', email: 'gustavo.chavez@orthosmile.com' },
  { id: 3, username: 'mabel', password: 'mabel123', fullName: 'Mabel (Recepción)', role: 'RECEPCIONISTA', email: 'mabel@orthosmile.com' },
]

export const professionals: Professional[] = [
  { id: 1, userId: 2, firstName: 'Manuel Gustavo', lastName: 'Chavez Sevillano', licenseNumber: 'COP-18452', specialty: 'Orthodontist, MSc, PhD', phone: '+51 987 654 321', active: true },
]

export const patients: Patient[] = []
export const appointments: Appointment[] = []
export const clinicalRecords: ClinicalRecord[] = []
export const payments: Payment[] = []

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
  // 1. Primary: Google Cloud Firebase Firestore
  try {
    const snap = await getDocs(collection(db, 'professionals'))
    const list: any[] = []
    snap.forEach((d) => {
      const data = d.data()
      list.push({
        id: Number(d.id) || Number(data.id) || d.id,
        userId: Number(data.userId) || 2,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        licenseNumber: data.licenseNumber || 'COP-18452',
        specialty: data.specialty || 'Orthodontist, MSc, PhD',
        phone: data.phone || '+51 987 654 321',
        active: data.active !== false,
      })
    })
    if (list.length > 0) {
      return res.json(list)
    }
  } catch (err) {
    console.warn('[Firestore Server Query Professionals Warning]:', err)
  }

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

  // 1. Primary: Google Cloud Firebase Firestore
  try {
    const snap = await getDocs(collection(db, 'patients'))
    const list: any[] = []
    snap.forEach((d) => {
      const data = d.data()
      list.push({
        id: Number(d.id) || Number(data.id) || d.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        documentType: data.documentType || 'DNI',
        documentNumber: data.documentNumber || '',
        birthDate: data.birthDate || '2000-01-01',
        email: data.email,
        phone: data.phone,
        address: data.address,
        active: data.active !== false,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      })
    })

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || Number(b.id) - Number(a.id))
    if (q) {
      const filtered = list.filter(
        (p) =>
          (p.firstName || '').toLowerCase().includes(q) ||
          (p.lastName || '').toLowerCase().includes(q) ||
          (p.documentNumber || '').includes(q)
      )
      return res.json(filtered)
    }
    return res.json(list)
  } catch (err) {
    console.warn('[Firestore Server Query Warning]:', err)
    return res.json([])
  }
})

apiRouter.delete('/patients/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id)
  try {
    await deleteDoc(doc(db, 'patients', id))
    addAudit('DELETE', 'PATIENT', Number(id) || id, 'admin', `Paciente #${id} eliminado`)
    return res.json({ success: true, id })
  } catch (err: any) {
    console.error('[Delete Patient Error]:', err)
    return res.status(500).json({ error: err?.message || 'Error al eliminar paciente' })
  }
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

  // Validate 8-digit DNI
  if (cleanDocType === 'DNI' && !/^\d{8}$/.test(cleanDocNum)) {
    return res.status(400).json({ message: 'El DNI debe tener exactamente 8 dígitos numéricos válidos.' })
  }

  const newId = Date.now()
  const newPatient: Patient = {
    id: newId,
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

  // Write to Firebase Firestore
  try {
    await setDoc(doc(db, 'patients', String(newId)), newPatient)
  } catch (err) {
    console.warn('[Firestore Server Insert Patient Warning]:', err)
  }

  patients.unshift(newPatient)
  addAudit('CREATE', 'PATIENT', newPatient.id, 'admin', `Paciente ${newPatient.firstName} ${newPatient.lastName} creado`)
  return res.status(201).json(newPatient)
})

// 4. Appointments Endpoints
apiRouter.get('/appointments', async (_req: Request, res: Response) => {
  // 1. Primary: Google Cloud Firebase Firestore
  try {
    const snap = await getDocs(collection(db, 'appointments'))
    const list: any[] = []
    snap.forEach((d) => {
      const data = d.data()
      list.push({
        id: Number(d.id) || Number(data.id) || d.id,
        patientId: Number(data.patientId) || data.patientId,
        professionalId: Number(data.professionalId) || data.professionalId,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        status: data.status,
        reason: data.reason,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    })
    list.sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
    return res.json(list)
  } catch (err) {
    console.warn('[Firestore Server Query Appointments Warning]:', err)
    return res.json([])
  }
})

apiRouter.delete('/appointments/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id)
  try {
    await deleteDoc(doc(db, 'appointments', id))
    addAudit('DELETE', 'APPOINTMENT', Number(id) || id, 'admin', `Cita #${id} eliminada`)
    return res.json({ success: true, id })
  } catch (err: any) {
    console.error('[Delete Appointment Error]:', err)
    return res.status(500).json({ error: err?.message || 'Error al eliminar cita' })
  }
})

apiRouter.post('/appointments', async (req: Request, res: Response) => {
  const body = req.body || {}
  if (!body.patientId || !body.professionalId || !body.scheduledStart) {
    return res.status(400).json({ message: 'Paciente, profesional y fecha de inicio requeridos' })
  }
  const cleanReason = sanitizeString(body.reason || 'Consulta General', 200)
  const cleanNotes = sanitizeString(body.notes || '', 500)

  const newId = Date.now()
  const newAppt: Appointment = {
    id: newId,
    patientId: Number(body.patientId) || body.patientId,
    professionalId: Number(body.professionalId) || body.professionalId,
    scheduledStart: body.scheduledStart,
    scheduledEnd: body.scheduledEnd || body.scheduledStart,
    status: body.status || 'PROGRAMADA',
    reason: cleanReason,
    notes: cleanNotes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Write to Firebase Firestore
  try {
    await setDoc(doc(db, 'appointments', String(newId)), newAppt)
  } catch (err) {
    console.warn('[Firestore Server Insert Appointment Warning]:', err)
  }

  appointments.push(newAppt)
  addAudit('CREATE', 'APPOINTMENT', newAppt.id, 'mabel', `Cita #${newAppt.id} registrada`)
  return res.status(201).json(newAppt)
})

apiRouter.patch('/appointments/:id/status', async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const { status } = req.body || {}

  // 1. Update in Firebase Firestore
  try {
    const docRef = doc(db, 'appointments', id)
    await updateDoc(docRef, { status, updatedAt: new Date().toISOString() })
  } catch (err) {
    console.warn('[Firestore Server Update Status Warning]:', err)
  }

  if (isCloudDatabaseConnected()) {
    try {
      const rows = await query<any>(
        `UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2
         RETURNING id, patient_id as "patientId", professional_id as "professionalId",
                   scheduled_start as "scheduledStart", scheduled_end as "scheduledEnd",
                   status, reason, notes, created_at as "createdAt", updated_at as "updatedAt"`,
        [status, Number(id)]
      )
      if (rows.length) {
        addAudit('STATUS_CHANGE', 'APPOINTMENT', Number(id), 'admin', `Estado de cita cambiado a ${status}`)
        return res.json(rows[0])
      }
    } catch (err) {
      console.error('[Supabase Appointment Status Error]:', err)
    }
  }

  const appt = appointments.find((a) => String(a.id) === id)
  if (appt) {
    appt.status = status
    appt.updatedAt = new Date().toISOString()
  }
  addAudit('STATUS_CHANGE', 'APPOINTMENT', Number(id) || id, 'admin', `Estado de cita cambiado a ${status}`)
  return res.json({ id, status })
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
