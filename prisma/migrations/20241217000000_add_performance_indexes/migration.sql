-- Add performance indexes for better query performance
-- This migration adds indexes to frequently queried columns

-- Patient indexes
CREATE INDEX IF NOT EXISTS "patients_status_idx" ON "patients"("status");
CREATE INDEX IF NOT EXISTS "patients_created_at_idx" ON "patients"("created_at");
CREATE INDEX IF NOT EXISTS "patients_last_visit_idx" ON "patients"("last_visit");
CREATE INDEX IF NOT EXISTS "patients_name_idx" ON "patients"("name");

-- Service indexes
CREATE INDEX IF NOT EXISTS "services_is_active_idx" ON "services"("is_active");
CREATE INDEX IF NOT EXISTS "services_category_idx" ON "services"("category");
CREATE INDEX IF NOT EXISTS "services_name_idx" ON "services"("name");
CREATE INDEX IF NOT EXISTS "services_created_at_idx" ON "services"("created_at");

-- Invoice indexes
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");
CREATE INDEX IF NOT EXISTS "invoices_patient_id_idx" ON "invoices"("patient_id");
CREATE INDEX IF NOT EXISTS "invoices_user_id_idx" ON "invoices"("user_id");
CREATE INDEX IF NOT EXISTS "invoices_created_at_idx" ON "invoices"("created_at");
CREATE INDEX IF NOT EXISTS "invoices_due_date_idx" ON "invoices"("due_date");
CREATE INDEX IF NOT EXISTS "invoices_paid_at_idx" ON "invoices"("paid_at");

-- Appointment indexes
CREATE INDEX IF NOT EXISTS "appointments_date_idx" ON "appointments"("date");
CREATE INDEX IF NOT EXISTS "appointments_patient_id_idx" ON "appointments"("patient_id");
CREATE INDEX IF NOT EXISTS "appointments_doctor_id_idx" ON "appointments"("doctor_id");
CREATE INDEX IF NOT EXISTS "appointments_status_idx" ON "appointments"("status");
CREATE INDEX IF NOT EXISTS "appointments_created_at_idx" ON "appointments"("created_at");

-- Medical notes indexes
CREATE INDEX IF NOT EXISTS "medical_notes_patient_id_idx" ON "medical_notes"("patient_id");
CREATE INDEX IF NOT EXISTS "medical_notes_doctor_id_idx" ON "medical_notes"("doctor_id");
CREATE INDEX IF NOT EXISTS "medical_notes_date_idx" ON "medical_notes"("date");
CREATE INDEX IF NOT EXISTS "medical_notes_created_at_idx" ON "medical_notes"("created_at");

-- Invoice items indexes
CREATE INDEX IF NOT EXISTS "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");
CREATE INDEX IF NOT EXISTS "invoice_items_service_id_idx" ON "invoice_items"("service_id");

-- Insurance coverage indexes
CREATE INDEX IF NOT EXISTS "insurance_coverage_insurance_id_idx" ON "insurance_coverage"("insurance_id");
CREATE INDEX IF NOT EXISTS "insurance_coverage_service_id_idx" ON "insurance_coverage"("service_id");

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_type_idx" ON "audit_logs"("entity_type");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- Invoice exonerations indexes
CREATE INDEX IF NOT EXISTS "invoice_exonerations_invoice_id_idx" ON "invoice_exonerations"("invoice_id");
CREATE INDEX IF NOT EXISTS "invoice_exonerations_authorized_by_idx" ON "invoice_exonerations"("authorized_by");
CREATE INDEX IF NOT EXISTS "invoice_exonerations_created_at_idx" ON "invoice_exonerations"("created_at");
