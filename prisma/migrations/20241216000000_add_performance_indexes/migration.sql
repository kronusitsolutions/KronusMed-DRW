-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_invoices_status_created" ON "invoices"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_invoices_patient_id" ON "invoices"("patient_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_invoices_user_id" ON "invoices"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_patients_status" ON "patients"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_patients_name_search" ON "patients"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_patients_email_search" ON "patients"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_appointments_date" ON "appointments"("date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_appointments_patient_id" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_appointments_doctor_id" ON "appointments"("doctor_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_appointments_status" ON "appointments"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_services_active_name" ON "services"("is_active", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_services_category" ON "services"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_invoice_items_invoice_id" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_invoice_items_service_id" ON "invoice_items"("service_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_medical_notes_patient_id" ON "medical_notes"("patient_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_medical_notes_doctor_id" ON "medical_notes"("doctor_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_medical_notes_date" ON "medical_notes"("date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_insurance_coverage_insurance_id" ON "insurance_coverage"("insurance_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_insurance_coverage_service_id" ON "insurance_coverage"("service_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_invoice_exonerations_invoice_id" ON "invoice_exonerations"("invoice_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_invoice_exonerations_authorized_by" ON "invoice_exonerations"("authorized_by");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity_type" ON "audit_logs"("entity_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs"("created_at");
