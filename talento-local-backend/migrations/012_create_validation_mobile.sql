-- Conectarse a la base de datos
\c talento_local_db

-- Tabla para códigos de verificación SMS
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'sms', -- 'sms', 'email'
  attempts INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_active_code UNIQUE (user_id, type, is_verified)
);

-- Índices
CREATE INDEX idx_verification_codes_user ON verification_codes(user_id);
CREATE INDEX idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);

-- Agregar campos de verificación a la tabla users si no existen
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS profile_picture_verified BOOLEAN DEFAULT false;

-- Función para limpiar códigos expirados
CREATE OR REPLACE FUNCTION delete_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < NOW() AND is_verified = false;
END;
$$ LANGUAGE plpgsql;

-- Ver estructura
\d verification_codes
\d users