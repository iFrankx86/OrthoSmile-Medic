CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(80) NOT NULL,
    email VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMINISTRADOR','RECEPCIONISTA','ODONTOLOGO','CAJA') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at DATETIME NULL,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE professionals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_professionals_license_number UNIQUE (license_number),
    CONSTRAINT uk_professionals_user_id UNIQUE (user_id),
    CONSTRAINT fk_professionals_user_id FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE patients (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    document_type ENUM('DNI','PASSPORT','OTHER') NOT NULL,
    document_number VARCHAR(30) NOT NULL,
    birth_date DATE NOT NULL,
    email VARCHAR(120) NULL,
    phone VARCHAR(30) NULL,
    address VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_patients_document UNIQUE (document_type, document_number)
) ENGINE=InnoDB;

CREATE TABLE appointments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    professional_id BIGINT NOT NULL,
    scheduled_start DATETIME NOT NULL,
    scheduled_end DATETIME NOT NULL,
    status ENUM('PROGRAMADA','CONFIRMADA','CANCELADA','ATENDIDA','NO_ASISTIO') NOT NULL DEFAULT 'PROGRAMADA',
    reason VARCHAR(255) NULL,
    notes TEXT NULL,
    canceled_at DATETIME NULL,
    canceled_reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_appointments_schedule CHECK (scheduled_end > scheduled_start),
    CONSTRAINT fk_appointments_patient_id FOREIGN KEY (patient_id) REFERENCES patients(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_professional_id FOREIGN KEY (professional_id) REFERENCES professionals(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE clinical_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    appointment_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    professional_id BIGINT NOT NULL,
    attention_date DATETIME NOT NULL,
    chief_complaint TEXT NOT NULL,
    diagnosis TEXT NULL,
    treatment_plan TEXT NULL,
    clinical_notes TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_clinical_records_appointment UNIQUE (appointment_id),
    CONSTRAINT fk_clinical_records_appointment_id FOREIGN KEY (appointment_id) REFERENCES appointments(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_clinical_records_patient_id FOREIGN KEY (patient_id) REFERENCES patients(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_clinical_records_professional_id FOREIGN KEY (professional_id) REFERENCES professionals(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    clinical_record_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'PEN',
    payment_method ENUM('EFECTIVO','TARJETA','TRANSFERENCIA','YAPE','PLIN','OTRO') NOT NULL,
    status ENUM('PENDIENTE','PARCIAL','PAGADO','ANULADO') NOT NULL DEFAULT 'PENDIENTE',
    reference VARCHAR(100) NULL,
    notes VARCHAR(255) NULL,
    paid_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_payments_amount CHECK (amount >= 0),
    CONSTRAINT fk_payments_clinical_record_id FOREIGN KEY (clinical_record_id) REFERENCES clinical_records(id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NULL,
    action VARCHAR(120) NOT NULL,
    entity_name VARCHAR(80) NOT NULL,
    entity_id VARCHAR(64) NULL,
    metadata JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB;