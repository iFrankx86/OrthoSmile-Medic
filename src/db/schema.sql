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

-- 5. Create Clinical Records Table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patients_doc ON patients(document_number);
CREATE INDEX IF NOT EXISTS idx_appointments_prof ON appointments(professional_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_records_patient ON clinical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);

-- Row Level Security (RLS) & Protection
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow backend service access" ON users FOR ALL USING (true);
CREATE POLICY "Allow backend service access" ON professionals FOR ALL USING (true);
CREATE POLICY "Allow backend service access" ON patients FOR ALL USING (true);
CREATE POLICY "Allow backend service access" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow backend service access" ON clinical_records FOR ALL USING (true);
CREATE POLICY "Allow backend service access" ON payments FOR ALL USING (true);
CREATE POLICY "Allow backend service access" ON audit_logs FOR ALL USING (true);
