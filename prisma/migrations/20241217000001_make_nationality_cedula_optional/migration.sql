-- Hacer campos nationality y cedula opcionales
ALTER TABLE patients ALTER COLUMN nationality DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN cedula DROP NOT NULL;

-- Agregar valores por defecto para registros existentes
UPDATE patients SET nationality = 'No especificada' WHERE nationality IS NULL;
UPDATE patients SET cedula = 'PENDIENTE' WHERE cedula IS NULL;
