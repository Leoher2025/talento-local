-- migrations/003_chat_schema.sql
-- Sistema completo de chat/mensajería para Talento Local

-- ============================
-- CREAR ENUMS SI NO EXISTEN
-- ============================

-- Estado del mensaje
DO $$ BEGIN
    CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipo de mensaje
DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'audio', 'file', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Estado de la conversación
DO $$ BEGIN
    CREATE TYPE conversation_status AS ENUM ('active', 'archived', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================
-- TABLA DE CONVERSACIONES
-- ============================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relación con el trabajo (opcional, para contexto)
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    
    -- Participantes (cliente y trabajador)
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Estado y configuración
    status conversation_status DEFAULT 'active',
    client_archived BOOLEAN DEFAULT false,
    worker_archived BOOLEAN DEFAULT false,
    client_blocked BOOLEAN DEFAULT false,
    worker_blocked BOOLEAN DEFAULT false,
    
    -- Último mensaje (para ordenamiento y preview)
    last_message_text TEXT,
    last_message_time TIMESTAMP,
    last_message_sender_id UUID REFERENCES users(id),
    
    -- Contadores de mensajes no leídos
    client_unread_count INTEGER DEFAULT 0,
    worker_unread_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_conversation UNIQUE (job_id, client_id, worker_id),
    CONSTRAINT different_participants CHECK (client_id != worker_id)
);

-- ============================
-- TABLA DE MENSAJES
-- ============================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relación con conversación
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Emisor y receptor
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contenido del mensaje
    message_type message_type DEFAULT 'text',
    message_text TEXT,
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    
    -- Estado del mensaje
    status message_status DEFAULT 'sent',
    
    -- Metadata
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_message_content CHECK (
        (message_type = 'text' AND message_text IS NOT NULL) OR
        (message_type != 'text' AND file_url IS NOT NULL) OR
        (message_type = 'system')
    )
);

-- ============================
-- TABLA DE NOTIFICACIONES DE CHAT
-- ============================
CREATE TABLE IF NOT EXISTS chat_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Usuario que recibe la notificación
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    
    -- Estado
    is_read BOOLEAN DEFAULT false,
    is_pushed BOOLEAN DEFAULT false, -- Si se envió push notification
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_notification UNIQUE (user_id, message_id)
);

-- ============================
-- TABLA DE MENSAJES REPORTADOS
-- ============================
CREATE TABLE IF NOT EXISTS reported_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Estado de revisión
    is_reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    action_taken VARCHAR(100), -- 'dismissed', 'warning_sent', 'user_banned', etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_report UNIQUE (message_id, reported_by)
);

-- ============================
-- ÍNDICES PARA MEJOR PERFORMANCE
-- ============================

-- Índices para conversaciones
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_worker ON conversations(worker_id);
CREATE INDEX IF NOT EXISTS idx_conversations_job ON conversations(job_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_time DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_not_deleted ON messages(is_deleted) WHERE is_deleted = false;

-- Índices para notificaciones
CREATE INDEX IF NOT EXISTS idx_chat_notifications_user ON chat_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_notifications_unread ON chat_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_chat_notifications_conversation ON chat_notifications(conversation_id);

-- ============================
-- TRIGGERS
-- ============================

-- Trigger para actualizar updated_at en conversaciones
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_update_conversations_updated_at 
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_conversations_updated_at();

-- Trigger para actualizar última información del mensaje en conversación
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si el mensaje no está eliminado
    IF NEW.is_deleted = false THEN
        -- Actualizar información del último mensaje
        UPDATE conversations
        SET 
            last_message_text = 
                CASE 
                    WHEN NEW.message_type = 'text' THEN 
                        CASE 
                            WHEN LENGTH(NEW.message_text) > 50 
                            THEN SUBSTRING(NEW.message_text FROM 1 FOR 50) || '...'
                            ELSE NEW.message_text
                        END
                    WHEN NEW.message_type = 'image' THEN '📷 Imagen'
                    WHEN NEW.message_type = 'audio' THEN '🎵 Audio'
                    WHEN NEW.message_type = 'file' THEN '📎 Archivo'
                    ELSE 'Mensaje'
                END,
            last_message_time = NEW.created_at,
            last_message_sender_id = NEW.sender_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.conversation_id;
        
        -- Incrementar contador de no leídos para el receptor
        UPDATE conversations
        SET 
            client_unread_count = 
                CASE 
                    WHEN NEW.receiver_id = client_id 
                    THEN client_unread_count + 1
                    ELSE client_unread_count
                END,
            worker_unread_count = 
                CASE 
                    WHEN NEW.receiver_id = worker_id 
                    THEN worker_unread_count + 1
                    ELSE worker_unread_count
                END
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Trigger para resetear contador de no leídos cuando se marcan como leídos
CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS TRIGGER AS $$
DECLARE
    v_conversation conversations%ROWTYPE;
BEGIN
    -- Si el mensaje fue marcado como leído
    IF NEW.status = 'read' AND OLD.status != 'read' THEN
        -- Obtener la conversación
        SELECT * INTO v_conversation FROM conversations WHERE id = NEW.conversation_id;
        
        -- Resetear el contador del receptor
        IF NEW.receiver_id = v_conversation.client_id THEN
            UPDATE conversations
            SET client_unread_count = GREATEST(0, client_unread_count - 1)
            WHERE id = NEW.conversation_id;
        ELSIF NEW.receiver_id = v_conversation.worker_id THEN
            UPDATE conversations
            SET worker_unread_count = GREATEST(0, worker_unread_count - 1)
            WHERE id = NEW.conversation_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reset_unread_count ON messages;
CREATE TRIGGER trigger_reset_unread_count
AFTER UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION reset_unread_count();

-- ============================
-- VISTAS ÚTILES
-- ============================

-- Vista de conversaciones con información completa
DROP VIEW IF EXISTS conversation_details;
CREATE VIEW conversation_details AS
SELECT 
    c.*,
    j.title as job_title,
    j.status as job_status,
    
    -- Información del cliente
    cu.email as client_email,
    cp.first_name as client_first_name,
    cp.last_name as client_last_name,
    cp.profile_picture_url as client_picture,
    CONCAT(cp.first_name, ' ', cp.last_name) as client_name,
    
    -- Información del trabajador
    wu.email as worker_email,
    wp.first_name as worker_first_name,
    wp.last_name as worker_last_name,
    wp.profile_picture_url as worker_picture,
    CONCAT(wp.first_name, ' ', wp.last_name) as worker_name,
    
    -- Información adicional
    (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND is_deleted = false) as total_messages
FROM conversations c
LEFT JOIN jobs j ON c.job_id = j.id
LEFT JOIN users cu ON c.client_id = cu.id
LEFT JOIN profiles cp ON cu.id = cp.user_id
LEFT JOIN users wu ON c.worker_id = wu.id
LEFT JOIN profiles wp ON wu.id = wp.user_id;

-- ============================
-- FUNCIONES ÚTILES
-- ============================

-- Función para obtener o crear conversación
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_job_id UUID,
    p_client_id UUID,
    p_worker_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Buscar conversación existente
    IF p_job_id IS NOT NULL THEN
        SELECT id INTO v_conversation_id
        FROM conversations
        WHERE job_id = p_job_id 
        AND client_id = p_client_id 
        AND worker_id = p_worker_id;
    ELSE
        -- Si no hay job_id, buscar cualquier conversación entre los participantes
        SELECT id INTO v_conversation_id
        FROM conversations
        WHERE client_id = p_client_id 
        AND worker_id = p_worker_id
        AND job_id IS NULL
        LIMIT 1;
    END IF;
    
    -- Si no existe, crear nueva
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (job_id, client_id, worker_id)
        VALUES (p_job_id, p_client_id, p_worker_id)
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar todos los mensajes como leídos
CREATE OR REPLACE FUNCTION mark_all_messages_as_read(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE messages 
    SET 
        status = 'read'::message_status,
        read_at = CURRENT_TIMESTAMP
    WHERE 
        conversation_id = p_conversation_id 
        AND receiver_id = p_user_id 
        AND status != 'read'::message_status;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    -- Resetear contador de no leídos
    UPDATE conversations
    SET 
        client_unread_count = CASE WHEN client_id = p_user_id THEN 0 ELSE client_unread_count END,
        worker_unread_count = CASE WHEN worker_id = p_user_id THEN 0 ELSE worker_unread_count END
    WHERE id = p_conversation_id;
    
    -- Actualizar notificaciones
    UPDATE chat_notifications cn
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    FROM messages m
    WHERE cn.message_id = m.id
    AND m.conversation_id = p_conversation_id
    AND cn.user_id = p_user_id
    AND cn.is_read = false;
    
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================

-- Puedes descomentar esto si quieres crear una conversación de prueba
-- INSERT INTO conversations (client_id, worker_id, job_id)
-- SELECT 
--     (SELECT id FROM users WHERE role = 'client' LIMIT 1),
--     (SELECT id FROM users WHERE role = 'worker' LIMIT 1),
--     (SELECT id FROM jobs LIMIT 1)
-- WHERE EXISTS (SELECT 1 FROM users WHERE role = 'client')
-- AND EXISTS (SELECT 1 FROM users WHERE role = 'worker');

-- Verificar que todo se creó correctamente
DO $$
BEGIN
    RAISE NOTICE 'Sistema de chat creado exitosamente';
    RAISE NOTICE 'Tablas creadas: conversations, messages, chat_notifications, reported_messages';
    RAISE NOTICE 'Vistas creadas: conversation_details';
    RAISE NOTICE 'Funciones creadas: get_or_create_conversation, mark_all_messages_as_read';
END $$;