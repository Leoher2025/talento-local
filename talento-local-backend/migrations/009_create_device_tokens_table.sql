-- migrations/009_create_device_tokens_table.sql
-- Tabla para almacenar tokens de dispositivos para notificaciones push

CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
    device_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Un dispositivo solo puede tener un token activo
    UNIQUE(token)
);

-- Índices
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX idx_device_tokens_token ON device_tokens(token);
CREATE INDEX idx_device_tokens_active ON device_tokens(is_active) WHERE is_active = true;

-- Trigger para updated_at
CREATE TRIGGER update_device_tokens_updated_at
    BEFORE UPDATE ON device_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tabla para registro de notificaciones enviadas
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    type VARCHAR(50) NOT NULL, -- 'message', 'application', 'job_status', 'review', etc.
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Metadatos
    related_id UUID, -- ID del mensaje, trabajo, aplicación, etc.
    related_type VARCHAR(50), -- 'job', 'application', 'message', 'review'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para notificaciones
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

COMMENT ON TABLE device_tokens IS 'Tokens de dispositivos para notificaciones push';
COMMENT ON TABLE notifications IS 'Registro de notificaciones enviadas a usuarios';