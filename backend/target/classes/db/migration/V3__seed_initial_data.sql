-- Usuarios iniciales (clave: admin123 para todos -> $2a$10$eACCYoNOHEqgkVE8aIWT8eGDCDeCPwuX6.zU2J5X.q8/L0G/g8qVy o $2a$10$y6N65gZ7J9m5gZ7J9m5gZe60r/eA7Q5aK0/1f4p4c6)
-- Hash válido para 'admin123': $2a$10$XptfskLsT1l/bRTLRiiCgejHqOpgXFreUnNUa35gJdKE2v2GPC6y.
INSERT INTO users (id, username, email, password_hash, role, is_active) VALUES
(1, 'admin', 'admin@orthosmille.com', '$2a$10$XptfskLsT1l/bRTLRiiCgejHqOpgXFreUnNUa35gJdKE2v2GPC6y.', 'ADMINISTRADOR', true),
(2, 'recepcion', 'recepcion@orthosmille.com', '$2a$10$XptfskLsT1l/bRTLRiiCgejHqOpgXFreUnNUa35gJdKE2v2GPC6y.', 'RECEPCIONISTA', true),
(3, 'dr.perez', 'carlos.perez@orthosmille.com', '$2a$10$XptfskLsT1l/bRTLRiiCgejHqOpgXFreUnNUa35gJdKE2v2GPC6y.', 'ODONTOLOGO', true),
(4, 'dra.gomez', 'maria.gomez@orthosmille.com', '$2a$10$XptfskLsT1l/bRTLRiiCgejHqOpgXFreUnNUa35gJdKE2v2GPC6y.', 'ODONTOLOGO', true)
ON DUPLICATE KEY UPDATE username=username;

-- Profesionales
INSERT INTO professionals (id, user_id, first_name, last_name, license_number, specialty, phone, is_active) VALUES
(1, 3, 'Carlos', 'Pérez Salazar', 'COP-10492', 'Ortodoncia y Ortopedia Maxilar', '+51 987 654 321', true),
(2, 4, 'María', 'Gómez Ríos', 'COP-20581', 'Endodoncia y Estética Dental', '+51 912 345 678', true),
(3, NULL, 'Jorge', 'Mendoza Quispe', 'COP-30112', 'Cirugía Maxilofacial e Implantes', '+51 999 888 777', true)
ON DUPLICATE KEY UPDATE license_number=license_number;

-- Pacientes iniciales
INSERT INTO patients (id, first_name, last_name, document_type, document_number, birth_date, email, phone, address, is_active) VALUES
(1, 'Juan', 'Castro Silva', 'DNI', '72345678', '1995-04-12', 'juan.castro@gmail.com', '+51 945 112 233', 'Av. Javier Prado Este 2450, Lima', true),
(2, 'Lucía', 'Ramírez Vega', 'DNI', '45892147', '1990-11-23', 'lucia.ramirez@hotmail.com', '+51 988 223 344', 'Calle Los Pinos 142, Miraflores', true),
(3, 'Mateo', 'Fernández Soto', 'DNI', '78912345', '2002-07-08', 'mateo.fs@gmail.com', '+51 977 334 455', 'Jr. Las Palmeras 310, San Isidro', true),
(4, 'Valeria', 'Torres Benítez', 'PASSPORT', 'P8923412', '1988-02-15', 'v.torres@outlook.com', '+51 966 445 566', 'Av. Arequipa 1890, Lince', true)
ON DUPLICATE KEY UPDATE document_number=document_number;

-- Citas de ejemplo
INSERT INTO appointments (id, patient_id, professional_id, scheduled_start, scheduled_end, status, reason, notes) VALUES
(1, 1, 1, DATE_ADD(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 3 HOUR), 'CONFIRMADA', 'Evaluación para brackets metálicos', 'Paciente refiere molestia al masticar'),
(2, 2, 2, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 1 HOUR), 'PROGRAMADA', 'Limpieza y profilaxis profunda', 'Primera sesión anual'),
(3, 3, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 1 HOUR), 'ATENDIDA', 'Control mensual de ortodoncia', 'Se cambiaron arcos y ligas'),
(4, 4, 3, DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 3 DAY), INTERVAL 1 HOUR), 'PROGRAMADA', 'Extracción de tercera molar', 'Traer radiografía panorámica')
ON DUPLICATE KEY UPDATE id=id;

-- Historial Clínico de ejemplo
INSERT INTO clinical_records (id, appointment_id, patient_id, professional_id, attention_date, chief_complaint, diagnosis, treatment_plan, clinical_notes) VALUES
(1, 3, 3, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), 'Ajuste de brackets', 'Maloclusión clase II en tratamiento activo', 'Continuar alineación y nivelación', 'Evolución favorable, higiene adecuada.')
ON DUPLICATE KEY UPDATE id=id;

-- Pagos de ejemplo
INSERT INTO payments (id, clinical_record_id, amount, currency, payment_method, status, reference, notes, paid_at) VALUES
(1, 1, 150.00, 'PEN', 'YAPE', 'PAGADO', 'OPER-849201', 'Pago de mensualidad ortodoncia', DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE id=id;
