-- Conectar a la base de datos
\c talento_local_db

-- Agregar columnas de geolocalización a profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP;

-- Agregar columnas de geolocalización a job_
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP;

-- Crear índices para mejorar búsquedas por ubicación
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_postings_location ON jobs(latitude, longitude) WHERE latitude IS NOT NULL;

-- Ver estructura actualizada
\d profiles
\d job_postings

-- Función para calcular distancia en kilómetros entre dos puntos GPS
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371; -- Radio de la Tierra en kilómetros
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Convertir grados a radianes
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  -- Fórmula de Haversine
  a := sin(dLat/2) * sin(dLat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dLon/2) * sin(dLon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Probar la función (distancia entre Guatemala City y Antigua)
SELECT calculate_distance(14.6349, -90.5069, 14.5586, -90.7339) as distance_km;
-- Debería retornar aproximadamente 27 km