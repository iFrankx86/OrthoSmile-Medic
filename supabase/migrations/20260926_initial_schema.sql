-- ==============================================================================
-- OrthoSmile-Medic - PostgreSQL Schema & Migration for Supabase
-- ==============================================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMINISTRADOR', 'ODONTOLOGO', 'RECEPCIONISTA')),
    email VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Professionals (Dentists / Specialists) Table
CREATE TABLE IF NOT EXISTS professionals (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    document_type VARCHAR(20) NOT NULL DEFAULT 'DNI',
    document_number VARCHAR(30) UNIQUE NOT NULL,
    birth_date DATE NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    professional_id INT REFERENCES professionals(id) ON DELETE CASCADE NOT NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PROGRAMADA' 
        CHECK (status IN ('PROGRAMADA', 'CONFIRMADA', 'CANCELADA', 'ATENDIDA', 'NO_ASISTIO')),
    reason TEXT,
    notes TEXT,
    canceled_at TIMESTAMPTZ,
    canceled_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Clinical Records (Atenciones / Historial) Table
CREATE TABLE IF NOT EXISTS clinical_records (
    id SERIAL PRIMARY KEY,
    appointment_id INT REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    professional_id INT REFERENCES professionals(id) ON DELETE CASCADE NOT NULL,
    attention_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    chief_complaint TEXT NOT NULL,
    diagnosis TEXT,
    treatment_plan TEXT,
    clinical_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    clinical_record_id INT REFERENCES clinical_records(id) ON DELETE CASCADE NOT NULL,
    patient_id INT REFERENCES patients(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'PEN',
    payment_method VARCHAR(30) NOT NULL DEFAULT 'EFECTIVO' 
        CHECK (payment_method IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'YAPE', 'PLIN', 'OTRO')),
    status VARCHAR(30) NOT NULL DEFAULT 'PAGADO' 
        CHECK (status IN ('PENDIENTE', 'PARCIAL', 'PAGADO', 'ANULADO')),
    reference VARCHAR(100),
    notes TEXT,
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    user_id INT,
    username VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    details TEXT
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_patients_doc ON patients(document_number);
CREATE INDEX IF NOT EXISTS idx_appointments_prof ON appointments(professional_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_records_patient ON clinical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);

-- ==============================================================================
-- Row Level Security (RLS) & Protection
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated service_role and backend application full access
CREATE POLICY "Allow backend service access" ON users FOR ALL USING (true);
CREATE POLICY "Allow backend service access" ON professionals FOR ALL USING (true);
CREATE POLICY "Allow backend service access" ON patients FOR ALL USING (true);
CREATE POLICY "Allow backend service access" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow backend service access" ON clinical_records FOR ALL USING (true);
CREATE POLICY "Allow backend service access" ON payments FOR ALL USING (true);
CREATE POLICY "Allow backend service access" ON audit_logs FOR ALL USING (true);

-- ==============================================================================
-- Initial Seed Data
-- ==============================================================================

-- Seed Users (Admin, Dr. Gustavo Chávez, Mabel)
INSERT INTO users (id, username, password, full_name, role, email) VALUES
(1, 'admin', 'admin123', 'Administrador', 'ADMINISTRADOR', 'admin@orthosmile.com'),
(2, 'dr.chavez', 'chavez123', 'Dr. Manuel Gustavo Chavez Sevillano (Orthodontist, MSc, PhD)', 'ODONTOLOGO', 'gustavo.chavez@orthosmile.com'),
(3, 'mabel', 'mabel123', 'Mabel (Recepción)', 'RECEPCIONISTA', 'mabel@orthosmile.com')
ON CONFLICT (username) DO NOTHING;

-- Seed Professionals
INSERT INTO professionals (id, user_id, first_name, last_name, license_number, specialty, phone, active) VALUES
(1, 2, 'Manuel Gustavo', 'Chavez Sevillano', 'COP-18452', 'Orthodontist, MSc, PhD', '+51 987 654 321', true)
ON CONFLICT (license_number) DO NOTHING;

-- Seed Patients
INSERT INTO patients (id, first_name, last_name, document_type, document_number, birth_date, email, phone, address, active) VALUES
(1, 'Juan', 'Castro Silva', 'DNI', '72345678', '1995-04-12', 'juan.castro@gmail.com', '+51 945 112 233', 'Av. Javier Prado Este 2450, Lima', true),
(2, 'Lucía', 'Ramírez Vega', 'DNI', '45892147', '1990-11-23', 'lucia.ramirez@hotmail.com', '+51 988 223 344', 'Calle Los Pinos 142, Miraflores', true),
(3, 'Mateo', 'Fernández Soto', 'DNI', '78912345', '2002-07-08', 'mateo.fs@gmail.com', '+51 977 334 455', 'Jr. Las Palmeras 310, San Isidro', true),
(4, 'Valeria', 'Torres Benítez', 'PASSPORT', 'P8923412', '1988-02-15', 'v.torres@outlook.com', '+51 966 445 566', 'Av. Arequipa 1890, Lince', true)
ON CONFLICT (document_number) DO NOTHING;

-- Seed Appointments
INSERT INTO appointments (id, patient_id, professional_id, scheduled_start, scheduled_end, status, reason, notes) VALUES
(1, 1, 1, NOW() + INTERVAL '2 hour', NOW() + INTERVAL '3 hour', 'CONFIRMADA', 'Evaluación para brackets metálicos', 'Paciente refiere molestia al masticar'),
(2, 2, 2, NOW() + INTERVAL '24 hour', NOW() + INTERVAL '25 hour', 'PROGRAMADA', 'Limpieza y profilaxis profunda', 'Primera sesión anual'),
(3, 3, 1, NOW() - INTERVAL '48 hour', NOW() - INTERVAL '47 hour', 'ATENDIDA', 'Control mensual de ortodoncia', 'Se cambiaron arcos y ligas'),
(4, 4, 1, NOW() + INTERVAL '72 hour', NOW() + INTERVAL '73 hour', 'PROGRAMADA', 'Extracción de tercera molar', 'Traer radiografía panorámica')
ON CONFLICT (id) DO NOTHING;

-- Seed Clinical Record
INSERT INTO clinical_records (id, appointment_id, patient_id, professional_id, attention_date, chief_complaint, diagnosis, treatment_plan, clinical_notes) VALUES
(1, 3, 3, 1, NOW() - INTERVAL '48 hour', 'Ajuste de brackets', 'Maloclusión clase II en tratamiento activo', 'Continuar alineación y nivelación', 'Evolución favorable, higiene adecuada.')
ON CONFLICT (id) DO NOTHING;

-- Seed Payment
INSERT INTO payments (id, clinical_record_id, patient_id, amount, currency, payment_method, status, reference, notes, paid_at) VALUES
(1, 1, 3, 150.00, 'PEN', 'YAPE', 'PAGADO', 'OPER-849201', 'Pago de mensualidad ortodoncia', NOW() - INTERVAL '48 hour')
ON CONFLICT (id) DO NOTHING;

-- Seed Audit Log
INSERT INTO audit_logs (id, action, entity_name, entity_id, username, timestamp, details) VALUES
(1, 'INIT', 'SYSTEM', '0', 'system', NOW(), 'Base de datos PostgreSQL inicializada con registros base de clínica')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence counters to match seeded IDs
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('professionals_id_seq', (SELECT COALESCE(MAX(id), 1) FROM professionals));
SELECT setval('patients_id_seq', (SELECT COALESCE(MAX(id), 1) FROM patients));
SELECT setval('appointments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM appointments));
SELECT setval('clinical_records_id_seq', (SELECT COALESCE(MAX(id), 1) FROM clinical_records));
SELECT setval('payments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM payments));
SELECT setval('audit_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM audit_logs));
