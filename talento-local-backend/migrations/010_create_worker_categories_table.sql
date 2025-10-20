-- migrations/010_create_worker_categories_table.sql
-- Tabla de relación entre trabajadores y categorías (many-to-many)

-- Tabla pivot para relacionar trabajadores con sus categorías/habilidades
CREATE TABLE IF NOT EXISTS worker_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    experience_years INTEGER DEFAULT 0, -- Años de experiencia en esta categoría
    is_primary BOOLEAN DEFAULT false,   -- Si es su categoría principal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Un trabajador no puede tener la misma categoría dos veces
    UNIQUE(worker_id, category_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_worker_categories_worker ON worker_categories(worker_id);
CREATE INDEX idx_worker_categories_category ON worker_categories(category_id);
CREATE INDEX idx_worker_categories_primary ON worker_categories(is_primary) WHERE is_primary = true;

COMMENT ON TABLE worker_categories IS 'Relación entre trabajadores y sus categorías/habilidades';
COMMENT ON COLUMN worker_categories.experience_years IS 'Años de experiencia en esta categoría';
COMMENT ON COLUMN worker_categories.is_primary IS 'Indica si es la categoría principal del trabajador';