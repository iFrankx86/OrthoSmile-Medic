CREATE INDEX idx_appointments_professional_start
    ON appointments (professional_id, scheduled_start);

CREATE INDEX idx_appointments_patient_start
    ON appointments (patient_id, scheduled_start);

CREATE INDEX idx_appointments_status_start
    ON appointments (status, scheduled_start);

CREATE INDEX idx_clinical_records_patient_attention_date
    ON clinical_records (patient_id, attention_date);

CREATE INDEX idx_payments_status_paid_at
    ON payments (status, paid_at);

CREATE INDEX idx_audit_logs_created_at
    ON audit_logs (created_at);

CREATE INDEX idx_audit_logs_entity
    ON audit_logs (entity_name, entity_id);