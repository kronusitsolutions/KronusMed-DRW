-- Script para optimizar la base de datos con índices críticos
-- Ejecutar en la base de datos para mejorar el rendimiento

-- Índices para consultas de facturas (más críticos)
CREATE INDEX IF NOT EXISTS idx_invoices_status_created 
ON invoices(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_patient_id 
ON invoices(patient_id);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id 
ON invoices(user_id);

-- Índices para consultas de pacientes
CREATE INDEX IF NOT EXISTS idx_patients_status 
ON patients(status);

CREATE INDEX IF NOT EXISTS idx_patients_name_search 
ON patients(name);

CREATE INDEX IF NOT EXISTS idx_patients_email_search 
ON patients(email);

-- Índices para consultas de citas
CREATE INDEX IF NOT EXISTS idx_appointments_date 
ON appointments(date);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id 
ON appointments(patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id 
ON appointments(doctor_id);

CREATE INDEX IF NOT EXISTS idx_appointments_status 
ON appointments(status);

-- Índices para consultas de servicios
CREATE INDEX IF NOT EXISTS idx_services_active_name 
ON services(is_active, name);

CREATE INDEX IF NOT EXISTS idx_services_category 
ON services(category);

-- Índices para consultas de items de factura
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id 
ON invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_items_service_id 
ON invoice_items(service_id);

-- Índices para consultas de notas médicas
CREATE INDEX IF NOT EXISTS idx_medical_notes_patient_id 
ON medical_notes(patient_id);

CREATE INDEX IF NOT EXISTS idx_medical_notes_doctor_id 
ON medical_notes(doctor_id);

CREATE INDEX IF NOT EXISTS idx_medical_notes_date 
ON medical_notes(date);

-- Índices para consultas de seguros
CREATE INDEX IF NOT EXISTS idx_insurance_coverage_insurance_id 
ON insurance_coverage(insurance_id);

CREATE INDEX IF NOT EXISTS idx_insurance_coverage_service_id 
ON insurance_coverage(service_id);

-- Índices para consultas de exoneraciones
CREATE INDEX IF NOT EXISTS idx_invoice_exonerations_invoice_id 
ON invoice_exonerations(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_exonerations_authorized_by 
ON invoice_exonerations(authorized_by);

-- Índices para consultas de logs de auditoría
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type 
ON audit_logs(entity_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON audit_logs(created_at);

-- Verificar que los índices se crearon correctamente
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN (
    'invoices', 'patients', 'appointments', 'services', 
    'invoice_items', 'medical_notes', 'insurance_coverage',
    'invoice_exonerations', 'audit_logs'
)
ORDER BY tablename, indexname;
