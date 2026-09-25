import express, { Request, Response } from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer as createViteServer } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- Types & Data Models ---
interface User {
  id: number
  username: string
  password: string // hashed or plain for in-memory
  role: 'ADMINISTRADOR' | 'RECEPCIONISTA' | 'ODONTOLOGO' | 'CAJA'
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

// --- In-Memory Database Initialization ---
const now = new Date()
const formatISO = (d: Date) => d.toISOString()

const users: User[] = [
  { id: 1, username: 'admin', password: 'admin123', role: 'ADMINISTRADOR', email: 'admin@orthosmille.com' },
  { id: 2, username: 'recepcion', password: 'admin123', role: 'RECEPCIONISTA', email: 'recepcion@orthosmille.com' },
  { id: 3, username: 'dr.perez', password: 'admin123', role: 'ODONTOLOGO', email: 'carlos.perez@orthosmille.com' },
  { id: 4, username: 'dra.gomez', password: 'admin123', role: 'ODONTOLOGO', email: 'maria.gomez@orthosmille.com' },
]

const professionals: Professional[] = [
  { id: 1, userId: 3, firstName: 'Carlos', lastName: 'Pérez Salazar', licenseNumber: 'COP-10492', specialty: 'Ortodoncia y Ortopedia Maxilar', phone: '+51 987 654 321', active: true },
  { id: 2, userId: 4, firstName: 'María', lastName: 'Gómez Ríos', licenseNumber: 'COP-20581', specialty: 'Endodoncia y Estética Dental', phone: '+51 912 345 678', active: true },
  { id: 3, firstName: 'Jorge', lastName: 'Mendoza Quispe', licenseNumber: 'COP-30112', specialty: 'Cirugía Maxilofacial e Implantes', phone: '+51 999 888 777', active: true },
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
    professionalId: 3,
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
async function startApp() {
  const app = express()
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

  app.use(cors())
  app.use(express.json())

  // --- Router for API endpoints ---
  const apiRouter = express.Router()

  // 1. Auth Endpoints
  apiRouter.post('/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body || {}
    const user = users.find((u) => u.username.toLowerCase() === (username || '').toLowerCase())

    // Allow default test passwords or password 'admin123'
    if (!user || (user.password !== password && password !== 'admin123')) {
      return res.status(401).json({ message: 'Credenciales inválidas. Por favor intente de nuevo.' })
    }

    addAudit('LOGIN', 'USER', user.id, user.username, 'Inicio de sesión exitoso')

    // Return token and user info matching both frontend and backend formats
    return res.json({
      id: user.id,
      userId: user.id,
      username: user.username,
      role: user.role,
      token: `orthosmille-session-${user.id}-${Date.now()}`,
    })
  })

  apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
    return res.json({ message: 'Logged out' })
  })

  // 2. Professionals Endpoints
  apiRouter.get('/professionals', (_req: Request, res: Response) => {
    return res.json(professionals)
  })

  apiRouter.get('/professionals/:id', (req: Request, res: Response) => {
    const prof = professionals.find((p) => p.id === Number(req.params.id))
    if (!prof) return res.status(404).json({ message: 'Profesional no encontrado' })
    return res.json(prof)
  })

  apiRouter.post('/professionals', (req: Request, res: Response) => {
    const newProf: Professional = {
      id: professionals.length + 1,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      licenseNumber: req.body.licenseNumber,
      specialty: req.body.specialty,
      phone: req.body.phone,
      active: req.body.active ?? true,
      userId: req.body.userId,
    }
    professionals.push(newProf)
    addAudit('CREATE', 'PROFESSIONAL', newProf.id, 'admin', `Creación de profesional ${newProf.firstName} ${newProf.lastName}`)
    return res.status(201).json(newProf)
  })

  apiRouter.put('/professionals/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const index = professionals.findIndex((p) => p.id === id)
    if (index === -1) return res.status(404).json({ message: 'Profesional no encontrado' })

    professionals[index] = {
      ...professionals[index],
      firstName: req.body.firstName ?? professionals[index].firstName,
      lastName: req.body.lastName ?? professionals[index].lastName,
      licenseNumber: req.body.licenseNumber ?? professionals[index].licenseNumber,
      specialty: req.body.specialty ?? professionals[index].specialty,
      phone: req.body.phone ?? professionals[index].phone,
      active: req.body.active ?? professionals[index].active,
    }
    addAudit('UPDATE', 'PROFESSIONAL', id, 'admin', `Actualización de profesional`)
    return res.json(professionals[index])
  })

  apiRouter.patch('/professionals/:id/status', (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const prof = professionals.find((p) => p.id === id)
    if (!prof) return res.status(404).json({ message: 'Profesional no encontrado' })

    const active = req.query.active === 'true' || req.body?.active === true
    prof.active = active
    addAudit('STATUS_CHANGE', 'PROFESSIONAL', id, 'admin', `Estado cambiado a ${active}`)
    return res.json(prof)
  })

  // 3. Patients Endpoints
  apiRouter.get('/patients', (req: Request, res: Response) => {
    const q = ((req.query.q as string) || '').trim().toLowerCase()
    if (!q) {
      return res.json(patients)
    }
    const filtered = patients.filter((p) => {
      const full = `${p.firstName} ${p.lastName} ${p.documentNumber} ${p.email || ''}`.toLowerCase()
      return full.includes(q)
    })
    return res.json(filtered)
  })

  apiRouter.get('/patients/:id', (req: Request, res: Response) => {
    const patient = patients.find((p) => p.id === Number(req.params.id))
    if (!patient) return res.status(404).json({ message: 'Paciente no encontrado' })
    return res.json(patient)
  })

  apiRouter.post('/patients', (req: Request, res: Response) => {
    const body = req.body
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

  apiRouter.put('/patients/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const idx = patients.findIndex((p) => p.id === id)
    if (idx === -1) return res.status(404).json({ message: 'Paciente no encontrado' })

    const body = req.body
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

  apiRouter.patch('/patients/:id/status', (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const patient = patients.find((p) => p.id === id)
    if (!patient) return res.status(404).json({ message: 'Paciente no encontrado' })

    const active = req.query.active === 'true' || req.body?.active === true
    patient.active = active
    patient.updatedAt = new Date().toISOString()
    addAudit('STATUS_CHANGE', 'PATIENT', id, 'admin', `Estado cambiado a ${active}`)
    return res.json(patient)
  })

  // 4. Appointments Endpoints
  apiRouter.get('/appointments', (_req: Request, res: Response) => {
    return res.json(appointments)
  })

  apiRouter.get('/appointments/:id', (req: Request, res: Response) => {
    const appt = appointments.find((a) => a.id === Number(req.params.id))
    if (!appt) return res.status(404).json({ message: 'Cita no encontrada' })
    return res.json(appt)
  })

  apiRouter.post('/appointments', (req: Request, res: Response) => {
    const body = req.body
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

  apiRouter.put('/appointments/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const idx = appointments.findIndex((a) => a.id === id)
    if (idx === -1) return res.status(404).json({ message: 'Cita no encontrada' })

    const body = req.body
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

  apiRouter.patch('/appointments/:id/status', (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const appt = appointments.find((a) => a.id === id)
    if (!appt) return res.status(404).json({ message: 'Cita no encontrada' })

    const { status, canceledReason } = req.body || {}
    if (status) appt.status = status
    if (canceledReason) appt.canceledReason = canceledReason
    if (status === 'CANCELADA') appt.canceledAt = new Date().toISOString()
    appt.updatedAt = new Date().toISOString()

    addAudit('STATUS_CHANGE', 'APPOINTMENT', id, 'admin', `Cita ${id} cambió a ${status}`)
    return res.json(appt)
  })

  // 5. Clinical History Endpoints
  apiRouter.get('/clinical-history/patients/:patientId', (req: Request, res: Response) => {
    const patientId = Number(req.params.patientId)
    const records = clinicalRecords.filter((r) => r.patientId === patientId)
    return res.json(records)
  })

  apiRouter.get('/clinical-history/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const record = clinicalRecords.find((r) => r.id === id)
    if (!record) return res.status(404).json({ message: 'Registro clínico no encontrado' })
    return res.json(record)
  })

  apiRouter.post('/clinical-history', (req: Request, res: Response) => {
    const body = req.body
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
  apiRouter.get('/payments', (req: Request, res: Response) => {
    const patientId = req.query.patientId ? Number(req.query.patientId) : undefined
    if (patientId) {
      // Find matching payments directly or via clinical record
      const patientRecords = new Set(clinicalRecords.filter((r) => r.patientId === patientId).map((r) => r.id))
      const filtered = payments.filter((p) => p.patientId === patientId || patientRecords.has(p.clinicalRecordId))
      return res.json(filtered)
    }
    return res.json(payments)
  })

  apiRouter.get('/payments/:id', (req: Request, res: Response) => {
    const pmt = payments.find((p) => p.id === Number(req.params.id))
    if (!pmt) return res.status(404).json({ message: 'Pago no encontrado' })
    return res.json(pmt)
  })

  apiRouter.post('/payments', (req: Request, res: Response) => {
    const body = req.body
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
  apiRouter.get('/audit-logs', (_req: Request, res: Response) => {
    return res.json(auditLogs)
  })

  // Mount API router on both /api/v1 and /api
  app.use('/api/v1', apiRouter)
  app.use('/api', apiRouter)

  // Frontend Serving / Vite Integration
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

startApp().catch((err) => {
  console.error('[OrthoSmile-Medic] Failed to start server:', err)
  process.exit(1)
})
