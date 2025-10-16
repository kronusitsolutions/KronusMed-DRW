-- Make startTime and endTime columns optional in appointments table
-- This preserves existing data while making fields optional for new appointments
ALTER TABLE "appointments" ALTER COLUMN "startTime" DROP NOT NULL;
ALTER TABLE "appointments" ALTER COLUMN "endTime" DROP NOT NULL;
