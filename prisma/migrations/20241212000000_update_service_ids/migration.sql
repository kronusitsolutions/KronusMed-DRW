-- AlterTable
ALTER TABLE "services" ALTER COLUMN "id" DROP DEFAULT;

-- Update existing services with new sequential IDs
-- This will be handled by the migration script
