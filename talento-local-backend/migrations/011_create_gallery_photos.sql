-- Verificar si existe, si no, crear
CREATE TABLE IF NOT EXISTS gallery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_worker_role CHECK (
    (SELECT role FROM users WHERE id = worker_id) = 'worker'
  )
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_gallery_worker ON gallery_photos(worker_id);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery_photos(category_id);
CREATE INDEX IF NOT EXISTS idx_gallery_featured ON gallery_photos(worker_id, is_featured);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gallery_updated_at_trigger
  BEFORE UPDATE ON gallery_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_updated_at();