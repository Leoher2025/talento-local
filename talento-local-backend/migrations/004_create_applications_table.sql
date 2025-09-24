-- migrations/004_create_applications_table.sql
-- Tabla de aplicaciones a trabajos

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    proposed_budget DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_application_job 
        FOREIGN KEY (job_id) 
        REFERENCES jobs(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_application_worker 
        FOREIGN KEY (worker_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT unique_application 
        UNIQUE(job_id, worker_id) -- Un trabajador solo puede aplicar una vez por trabajo
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_worker_id ON applications(worker_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_applications_updated_at();

-- Vista para aplicaciones con información completa
CREATE OR REPLACE VIEW application_details AS
SELECT 
    a.*,
    j.title AS job_title,
    j.description AS job_description,
    j.budget AS job_budget,
    j.location AS job_location,
    j.category_id,
    j.status AS job_status,
    j.client_id,
    
    -- Información del trabajador
    w.name AS worker_name,
    w.email AS worker_email,
    w.phone AS worker_phone,
    w.profile_image AS worker_image,
    w.rating AS worker_rating,
    w.verified AS worker_verified,
    
    -- Información del cliente
    c.name AS client_name,
    c.email AS client_email,
    c.profile_image AS client_image,
    c.verified AS client_verified,
    
    -- Categoría
    cat.name AS category_name
FROM 
    applications a
    INNER JOIN jobs j ON a.job_id = j.id
    INNER JOIN users w ON a.worker_id = w.id
    INNER JOIN users c ON j.client_id = c.id
    LEFT JOIN categories cat ON j.category_id = cat.id;

-- Función para obtener estadísticas de aplicaciones
CREATE OR REPLACE FUNCTION get_application_stats(user_id INTEGER, user_role VARCHAR)
RETURNS TABLE (
    total_applications INTEGER,
    pending_applications INTEGER,
    accepted_applications INTEGER,
    rejected_applications INTEGER,
    cancelled_applications INTEGER,
    success_rate DECIMAL(5,2)
) AS $$
BEGIN
    IF user_role = 'worker' THEN
        RETURN QUERY
        SELECT 
            COUNT(*)::INTEGER AS total_applications,
            COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending_applications,
            COUNT(*) FILTER (WHERE status = 'accepted')::INTEGER AS accepted_applications,
            COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER AS rejected_applications,
            COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER AS cancelled_applications,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    (COUNT(*) FILTER (WHERE status = 'accepted')::DECIMAL / COUNT(*)::DECIMAL * 100)
                ELSE 0
            END AS success_rate
        FROM applications
        WHERE worker_id = user_id;
    ELSE
        RETURN QUERY
        SELECT 
            COUNT(*)::INTEGER AS total_applications,
            COUNT(*) FILTER (WHERE a.status = 'pending')::INTEGER AS pending_applications,
            COUNT(*) FILTER (WHERE a.status = 'accepted')::INTEGER AS accepted_applications,
            COUNT(*) FILTER (WHERE a.status = 'rejected')::INTEGER AS rejected_applications,
            COUNT(*) FILTER (WHERE a.status = 'cancelled')::INTEGER AS cancelled_applications,
            0::DECIMAL AS success_rate
        FROM applications a
        INNER JOIN jobs j ON a.job_id = j.id
        WHERE j.client_id = user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Comentarios de documentación
COMMENT ON TABLE applications IS 'Almacena las aplicaciones de trabajadores a ofertas de trabajo';
COMMENT ON COLUMN applications.status IS 'Estados: pending (pendiente), accepted (aceptado), rejected (rechazado), cancelled (cancelado)';
COMMENT ON COLUMN applications.proposed_budget IS 'Presupuesto propuesto por el trabajador (opcional)';