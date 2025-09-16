-- migrations/002_jobs_schema.sql - Esquema para el módulo de trabajos

-- ============================
-- ENUMS
-- ============================

-- Tipo de presupuesto
CREATE TYPE budget_type AS ENUM ('fixed', 'hourly', 'negotiable');

-- Estado del trabajo
CREATE TYPE job_status AS ENUM ('draft', 'active', 'in_progress', 'completed', 'cancelled');

-- Urgencia del trabajo
CREATE TYPE job_urgency AS ENUM ('low', 'medium', 'high', 'urgent');

-- Estado de aplicación
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- ============================
-- TABLA DE CATEGORÍAS
-- ============================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar categorías iniciales
INSERT INTO categories (slug, name, description, icon, display_order) VALUES
('plomeria', 'Plomería', 'Reparación de tuberías, fugas, instalaciones sanitarias', '🔧', 1),
('electricidad', 'Electricidad', 'Instalaciones eléctricas, reparaciones, cableado', '⚡', 2),
('albanileria', 'Albañilería', 'Construcción, reparación de paredes, pisos', '🧱', 3),
('carpinteria', 'Carpintería', 'Muebles, puertas, trabajos en madera', '🔨', 4),
('pintura', 'Pintura', 'Pintura de interiores y exteriores', '🎨', 5),
('jardineria', 'Jardinería', 'Mantenimiento de jardines, podas, diseño', '🌿', 6),
('limpieza', 'Limpieza', 'Limpieza profunda, mantenimiento', '🧹', 7),
('cerrajeria', 'Cerrajería', 'Llaves, cerraduras, seguridad', '🔐', 8),
('mecanica', 'Mecánica', 'Reparación de vehículos, mantenimiento', '🔩', 9),
('mudanza', 'Mudanza', 'Transporte y mudanzas', '📦', 10),
('electrodomesticos', 'Electrodomésticos', 'Reparación de aparatos del hogar', '🔌', 11),
('otros', 'Otros', 'Otros servicios no categorizados', '📋', 99);

-- ============================
-- TABLA DE TRABAJOS
-- ============================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información básica
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    
    -- Presupuesto
    budget_amount DECIMAL(10, 2),
    budget_type budget_type DEFAULT 'negotiable',
    currency VARCHAR(3) DEFAULT 'GTQ',
    
    -- Ubicación
    address TEXT NOT NULL,
    address_details TEXT, -- Apartamento, referencias, etc.
    city VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Estado y urgencia
    status job_status DEFAULT 'active',
    urgency job_urgency DEFAULT 'medium',
    
    -- Fechas
    needed_date DATE, -- Cuándo necesita el trabajo
    expires_at TIMESTAMP, -- Cuándo expira la publicación
    
    -- Relaciones
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Estadísticas
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    assigned_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_budget_amount CHECK (budget_amount >= 0),
    CONSTRAINT check_worker_role CHECK (
        assigned_worker_id IS NULL OR 
        EXISTS (SELECT 1 FROM users WHERE id = assigned_worker_id AND role = 'worker')
    )
);

-- ============================
-- TABLA DE IMÁGENES DE TRABAJOS
-- ============================
CREATE TABLE IF NOT EXISTS job_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- TABLA DE APLICACIONES
-- ============================
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relaciones
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Propuesta
    proposed_amount DECIMAL(10, 2),
    cover_letter TEXT NOT NULL,
    estimated_duration VARCHAR(100), -- "2 horas", "1 día", etc.
    
    -- Estado
    status application_status DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_application UNIQUE (job_id, worker_id),
    CONSTRAINT check_proposed_amount CHECK (proposed_amount >= 0),
    CONSTRAINT check_worker_role CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = worker_id AND role = 'worker')
    )
);

-- ============================
-- TABLA DE HABILIDADES DE TRABAJADORES
-- ============================
CREATE TABLE IF NOT EXISTS worker_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    years_experience INTEGER DEFAULT 0,
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_worker_skill UNIQUE (worker_id, category_id),
    CONSTRAINT check_experience CHECK (years_experience >= 0)
);

-- ============================
-- TABLA DE FAVORITOS
-- ============================
CREATE TABLE IF NOT EXISTS favorite_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_favorite UNIQUE (client_id, worker_id),
    CONSTRAINT different_users CHECK (client_id != worker_id)
);

-- ============================
-- ÍNDICES PARA MEJOR PERFORMANCE
-- ============================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category_id);
CREATE INDEX idx_jobs_client ON jobs(client_id);
CREATE INDEX idx_jobs_worker ON jobs(assigned_worker_id);
CREATE INDEX idx_jobs_location ON jobs(latitude, longitude);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_jobs_urgency ON jobs(urgency);
CREATE INDEX idx_jobs_status_active ON jobs(status) WHERE status = 'active';

-- Índices para aplicaciones
CREATE INDEX idx_applications_job ON job_applications(job_id);
CREATE INDEX idx_applications_worker ON job_applications(worker_id);
CREATE INDEX idx_applications_status ON job_applications(status);

-- Índices para imágenes
CREATE INDEX idx_job_images_job ON job_images(job_id);

-- Índices para habilidades
CREATE INDEX idx_worker_skills_worker ON worker_skills(worker_id);
CREATE INDEX idx_worker_skills_category ON worker_skills(category_id);

-- Índices para favoritos
CREATE INDEX idx_favorites_client ON favorite_workers(client_id);
CREATE INDEX idx_favorites_worker ON favorite_workers(worker_id);

-- ============================
-- TRIGGERS
-- ============================

-- Trigger para actualizar updated_at
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar contador de aplicaciones
CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE jobs 
        SET applications_count = applications_count + 1
        WHERE id = NEW.job_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE jobs 
        SET applications_count = applications_count - 1
        WHERE id = OLD.job_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_count
AFTER INSERT OR DELETE ON job_applications
FOR EACH ROW EXECUTE FUNCTION update_job_applications_count();

-- ============================
-- VISTAS ÚTILES
-- ============================

-- Vista de trabajos con información completa
CREATE OR REPLACE VIEW jobs_detailed AS
SELECT 
    j.*,
    c.name as category_name,
    c.icon as category_icon,
    u.email as client_email,
    p.first_name as client_first_name,
    p.last_name as client_last_name,
    p.profile_picture_url as client_picture,
    p.rating_average as client_rating,
    w.email as worker_email,
    wp.first_name as worker_first_name,
    wp.last_name as worker_last_name,
    wp.profile_picture_url as worker_picture,
    wp.rating_average as worker_rating
FROM jobs j
LEFT JOIN categories c ON j.category_id = c.id
LEFT JOIN users u ON j.client_id = u.id
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN users w ON j.assigned_worker_id = w.id
LEFT JOIN profiles wp ON w.id = wp.user_id;