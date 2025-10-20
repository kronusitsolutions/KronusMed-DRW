-- Migration: Add priceType to Service model
-- Created: 2024-12-19

-- Create PriceType enum
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'DYNAMIC');

-- Add priceType column to services table with default value FIXED
ALTER TABLE "services" 
ADD COLUMN "priceType" "PriceType" NOT NULL DEFAULT 'FIXED';

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'services' AND column_name = 'priceType';

-- Show count of services with each price type
SELECT "priceType", COUNT(*) as count
FROM "services"
GROUP BY "priceType";
