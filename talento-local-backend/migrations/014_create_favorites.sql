-- Conectar a la base de datos
\c talento_local_db

-- Crear tabla de favoritos
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  favorite_type VARCHAR(20) NOT NULL CHECK (favorite_type IN ('worker', 'job')),
  favorite_id UUID NOT NULL, -- ID del trabajador o trabajo
  notes TEXT, -- Notas personales (opcional)
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Evitar duplicados
  CONSTRAINT unique_favorite UNIQUE (user_id, favorite_type, favorite_id)
);

-- Índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(user_id, favorite_type);
CREATE INDEX IF NOT EXISTS idx_favorites_worker ON favorites(user_id, favorite_id) WHERE favorite_type = 'worker';
CREATE INDEX IF NOT EXISTS idx_favorites_job ON favorites(user_id, favorite_id) WHERE favorite_type = 'job';

-- Ver estructura
\d favorites

-- Probar inserción
-- INSERT INTO favorites (user_id, favorite_type, favorite_id) 
-- VALUES ('tu_user_id_aqui', 'worker', 'worker_id_aqui');