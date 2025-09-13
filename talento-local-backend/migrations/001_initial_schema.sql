-- Crear extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para tipos de usuario
CREATE TYPE user_role AS ENUM ('client', 'worker', 'admin');

-- Enum para estado de verificación
CREATE TYPE verification_status AS ENUM ('unverified', 'email_verified', 'phone_verified', 'fully_verified');

-- Enum para países (expandible en el futuro)
CREATE TYPE country_code AS ENUM ('GT', 'SV', 'HN', 'NI', 'CR', 'PA');

-- Tabla de Usuarios (autenticación básica)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    verification_status verification_status DEFAULT 'unverified',
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Perfiles (información detallada)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150),
    profile_picture_url VARCHAR(500),
    bio TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    
    -- Ubicación
    country country_code DEFAULT 'GT',
    department VARCHAR(100),
    city VARCHAR(100),
    address_hidden BOOLEAN DEFAULT true,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    service_radius_km INTEGER DEFAULT 10,
    
    -- Verificación adicional
    id_document_type VARCHAR(50),
    id_document_number VARCHAR(50),
    id_document_verified BOOLEAN DEFAULT false,
    
    -- Estadísticas
    rating_average DECIMAL(3, 2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    total_jobs_completed INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Tokens de Verificación
CREATE TABLE verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'email', 'phone', 'password_reset'
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Refresh Tokens (para JWT)
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Intentos de Login (seguridad)
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_location ON profiles(latitude, longitude);
CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();