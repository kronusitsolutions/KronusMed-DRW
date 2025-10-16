-- Script para crear la tabla invoice_designs manualmente
-- Ejecutar este script en la base de datos PostgreSQL si la migración automática falla

CREATE TABLE IF NOT EXISTS invoice_designs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Configuración por defecto',
    logo_url TEXT,
    logo_position TEXT NOT NULL DEFAULT 'LEFT',
    business_name TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    tax_id TEXT NOT NULL DEFAULT '',
    custom_message TEXT NOT NULL DEFAULT '',
    format TEXT NOT NULL DEFAULT '80MM',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_invoice_designs_is_active ON invoice_designs(is_active);
CREATE INDEX IF NOT EXISTS idx_invoice_designs_created_at ON invoice_designs(created_at);

-- Insertar configuración por defecto
INSERT INTO invoice_designs (
    id, 
    name, 
    logo_position, 
    business_name, 
    address, 
    phone, 
    tax_id, 
    custom_message, 
    format, 
    is_active
) VALUES (
    'default-config',
    'Configuración por defecto',
    'LEFT',
    'KronusMed',
    'Dirección de la clínica',
    'Teléfono de contacto',
    'RNC de la empresa',
    'Gracias por su preferencia',
    '80MM',
    true
) ON CONFLICT (id) DO NOTHING;

-- Comentarios sobre la estructura
COMMENT ON TABLE invoice_designs IS 'Configuraciones de diseño para facturas';
COMMENT ON COLUMN invoice_designs.logo_position IS 'Posición del logo: LEFT, CENTER, RIGHT';
COMMENT ON COLUMN invoice_designs.format IS 'Formato de impresión: 80MM, LETTER';
COMMENT ON COLUMN invoice_designs.is_active IS 'Solo una configuración puede estar activa a la vez';
