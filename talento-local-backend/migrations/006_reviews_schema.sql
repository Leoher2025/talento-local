-- migrations/006_reviews_schema.sql
-- Sistema de calificaciones y reviews

-- ============================
-- ENUMS
-- ============================

-- Tipo de review (para trabajador o cliente)
DO $$ BEGIN
    CREATE TYPE review_type AS ENUM ('worker_review', 'client_review');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================
-- TABLA DE REVIEWS
-- ============================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relaciones
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tipo de review
    review_type review_type NOT NULL,
    
    -- Calificación y comentario
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Aspectos específicos (1-5)
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    
    -- Recomendación
    would_recommend BOOLEAN DEFAULT true,
    
    -- Respuesta del reviewee (opcional)
    response TEXT,
    response_date TIMESTAMP,
    
    -- Estado
    is_verified BOOLEAN DEFAULT false, -- Si se verificó que el trabajo se completó
    is_edited BOOLEAN DEFAULT false,
    is_flagged BOOLEAN DEFAULT false, -- Si fue reportada
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT different_users CHECK (reviewer_id != reviewee_id),
    CONSTRAINT one_review_per_job_user UNIQUE (job_id, reviewer_id, reviewee_id)
);

-- ============================
-- TABLA DE REPORTES DE REVIEWS
-- ============================
CREATE TABLE IF NOT EXISTS review_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    reason VARCHAR(100) NOT NULL CHECK (reason IN (
        'spam',
        'inappropriate',
        'false_information',
        'harassment',
        'off_topic',
        'other'
    )),
    description TEXT,
    
    -- Estado del reporte
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'reviewing',
        'resolved',
        'dismissed'
    )),
    
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    resolution_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT one_report_per_user_review UNIQUE (review_id, reporter_id)
);

-- ============================
-- TABLA DE ÚTIL/NO ÚTIL (HELPFUL VOTES)
-- ============================
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    is_helpful BOOLEAN NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT one_vote_per_user_review UNIQUE (review_id, user_id)
);

-- ============================
-- ÍNDICES
-- ============================
CREATE INDEX idx_reviews_job ON reviews(job_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_type ON reviews(review_type);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX idx_review_reports_status ON review_reports(status);
CREATE INDEX idx_review_helpful_votes_review ON review_helpful_votes(review_id);

-- ============================
-- TRIGGERS
-- ============================

-- Trigger para actualizar updated_at
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar estadísticas del perfil cuando se crea/actualiza/elimina una review
CREATE OR REPLACE FUNCTION update_profile_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es INSERT o UPDATE, actualizar el perfil del reviewee
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE profiles
        SET 
            rating_average = (
                SELECT ROUND(AVG(rating)::numeric, 2)
                FROM reviews
                WHERE reviewee_id = NEW.reviewee_id
            ),
            total_ratings = (
                SELECT COUNT(*)
                FROM reviews
                WHERE reviewee_id = NEW.reviewee_id
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.reviewee_id;
    END IF;
    
    -- Si es DELETE, actualizar con el usuario antiguo
    IF TG_OP = 'DELETE' THEN
        UPDATE profiles
        SET 
            rating_average = (
                SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
                FROM reviews
                WHERE reviewee_id = OLD.reviewee_id
            ),
            total_ratings = (
                SELECT COUNT(*)
                FROM reviews
                WHERE reviewee_id = OLD.reviewee_id
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = OLD.reviewee_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_profile_rating_stats();

-- Trigger para actualizar jobs completados
CREATE OR REPLACE FUNCTION update_jobs_completed_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.review_type = 'worker_review' THEN
        -- Incrementar contador de trabajos completados
        UPDATE profiles
        SET 
            total_jobs_completed = total_jobs_completed + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.reviewee_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_jobs_completed
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_jobs_completed_count();

-- ============================
-- VISTAS ÚTILES
-- ============================

-- Vista de reviews con información completa
CREATE OR REPLACE VIEW reviews_detailed AS
SELECT 
    r.*,
    
    -- Información del reviewer
    reviewer.email as reviewer_email,
    reviewer_profile.first_name as reviewer_first_name,
    reviewer_profile.last_name as reviewer_last_name,
    reviewer_profile.profile_picture_url as reviewer_picture,
    CONCAT(reviewer_profile.first_name, ' ', reviewer_profile.last_name) as reviewer_name,
    
    -- Información del reviewee
    reviewee.email as reviewee_email,
    reviewee_profile.first_name as reviewee_first_name,
    reviewee_profile.last_name as reviewee_last_name,
    reviewee_profile.profile_picture_url as reviewee_picture,
    CONCAT(reviewee_profile.first_name, ' ', reviewee_profile.last_name) as reviewee_name,
    
    -- Información del trabajo
    j.title as job_title,
    j.status as job_status,
    
    -- Contadores de helpful votes
    (SELECT COUNT(*) FROM review_helpful_votes WHERE review_id = r.id AND is_helpful = true) as helpful_count,
    (SELECT COUNT(*) FROM review_helpful_votes WHERE review_id = r.id AND is_helpful = false) as not_helpful_count
    
FROM reviews r
LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
LEFT JOIN profiles reviewer_profile ON reviewer.id = reviewer_profile.user_id
LEFT JOIN users reviewee ON r.reviewee_id = reviewee.id
LEFT JOIN profiles reviewee_profile ON reviewee.id = reviewee_profile.user_id
LEFT JOIN jobs j ON r.job_id = j.id;

-- ============================
-- FUNCIONES ÚTILES
-- ============================

-- Función para obtener estadísticas de reviews de un usuario
CREATE OR REPLACE FUNCTION get_user_review_stats(p_user_id UUID)
RETURNS TABLE (
    total_reviews BIGINT,
    average_rating NUMERIC,
    rating_5_count BIGINT,
    rating_4_count BIGINT,
    rating_3_count BIGINT,
    rating_2_count BIGINT,
    rating_1_count BIGINT,
    would_recommend_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 2) as average_rating,
        COUNT(*) FILTER (WHERE rating = 5) as rating_5_count,
        COUNT(*) FILTER (WHERE rating = 4) as rating_4_count,
        COUNT(*) FILTER (WHERE rating = 3) as rating_3_count,
        COUNT(*) FILTER (WHERE rating = 2) as rating_2_count,
        COUNT(*) FILTER (WHERE rating = 1) as rating_1_count,
        ROUND((COUNT(*) FILTER (WHERE would_recommend = true)::numeric / NULLIF(COUNT(*), 0) * 100), 1) as would_recommend_percentage
    FROM reviews
    WHERE reviewee_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un usuario puede dejar review para un trabajo
CREATE OR REPLACE FUNCTION can_leave_review(
    p_job_id UUID,
    p_reviewer_id UUID,
    p_reviewee_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_job_status job_status;
    v_job_client_id UUID;
    v_job_worker_id UUID;
    v_review_exists BOOLEAN;
BEGIN
    -- Obtener información del trabajo
    SELECT status, client_id, assigned_worker_id
    INTO v_job_status, v_job_client_id, v_job_worker_id
    FROM jobs
    WHERE id = p_job_id;
    
    -- Verificar que el trabajo existe y está completado
    IF v_job_status IS NULL OR v_job_status != 'completed' THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar que el reviewer es parte del trabajo
    IF p_reviewer_id != v_job_client_id AND p_reviewer_id != v_job_worker_id THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar que el reviewee es la otra parte
    IF (p_reviewer_id = v_job_client_id AND p_reviewee_id != v_job_worker_id) OR
       (p_reviewer_id = v_job_worker_id AND p_reviewee_id != v_job_client_id) THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar que no existe ya una review
    SELECT EXISTS(
        SELECT 1 FROM reviews
        WHERE job_id = p_job_id
        AND reviewer_id = p_reviewer_id
        AND reviewee_id = p_reviewee_id
    ) INTO v_review_exists;
    
    RETURN NOT v_review_exists;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- COMENTARIOS
-- ============================
COMMENT ON TABLE reviews IS 'Calificaciones y reviews entre usuarios';
COMMENT ON TABLE review_reports IS 'Reportes de reviews inapropiadas';
COMMENT ON TABLE review_helpful_votes IS 'Votos de útil/no útil en reviews';
COMMENT ON COLUMN reviews.review_type IS 'Tipo de review: worker_review o client_review';
COMMENT ON COLUMN reviews.is_verified IS 'Si se verificó que el trabajo se completó';
COMMENT ON COLUMN reviews.would_recommend IS 'Si el reviewer recomendaría al reviewee';