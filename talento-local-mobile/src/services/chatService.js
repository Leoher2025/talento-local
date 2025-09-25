// src/services/chatService.js
// Servicio para manejo de chat - Adaptado a la estructura del proyecto
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

class ChatService {
  constructor() {
    this.baseURL = API_URL || 'http://192.168.101.14:5000/api';
  }

  // Método genérico para hacer peticiones (igual que jobService y applicationService)
  async fetchAPI(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;

      // Agregar token si existe
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }

      // Headers por defecto
      options.headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      console.log('Fetching:', url);
      console.log('Options:', options);
      console.log('Body content:', options.body); // AGREGAR ESTA LÍNEA PARA DEBUG

      const response = await fetch(url, options);
      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok) {
        if (data.errors) {
          console.error('Errores de validación:', data.errors);
        }
        throw new Error(data.message || 'Error en la petición');
      }

      return data;
    } catch (error) {
      console.error('Error en fetchAPI:', error);
      throw error;
    }
  }

  // ============================
  // CONVERSACIONES
  // ============================

  // Crear o obtener conversación
  async getOrCreateConversation(jobId, clientId, workerId) {
    try {
      const body = {
        jobId: jobId || null,
        clientId: clientId,
        workerId: workerId
      };

      console.log('Enviando datos de conversación:', body);

      const response = await this.fetchAPI('/chat/conversations', {
        method: 'POST',
        body: JSON.stringify(body)  // IMPORTANTE: Asegúrate de que esto esté así
      });

      return response;
    } catch (error) {
      console.error('Error obteniendo/creando conversación:', error);
      throw error;
    }
  }

  // Obtener todas las conversaciones del usuario
  async getUserConversations(filters = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Agregar filtros si existen
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const queryString = queryParams.toString();
      const endpoint = `/chat/conversations${queryString ? `?${queryString}` : ''}`;

      const response = await this.fetchAPI(endpoint);

      return {
        conversations: response.data || [],
        pagination: response.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 1
        }
      };
    } catch (error) {
      console.error('Error obteniendo conversaciones:', error);
      return {
        conversations: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 1
        }
      };
    }
  }

  // Obtener detalles de una conversación
  async getConversationById(conversationId) {
    try {
      const response = await this.fetchAPI(`/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo conversación:', error);
      throw error;
    }
  }

  // Archivar conversación
  async archiveConversation(conversationId) {
    try {
      const response = await this.fetchAPI(`/chat/conversations/${conversationId}/archive`, {
        method: 'PATCH'
      });
      return response.data;
    } catch (error) {
      console.error('Error archivando conversación:', error);
      throw error;
    }
  }

  // Desarchivar conversación
  async unarchiveConversation(conversationId) {
    try {
      const response = await this.fetchAPI(`/chat/conversations/${conversationId}/unarchive`, {
        method: 'PATCH'
      });
      return response.data;
    } catch (error) {
      console.error('Error desarchivando conversación:', error);
      throw error;
    }
  }

  // Bloquear usuario en conversación
  async blockUser(conversationId) {
    try {
      const response = await this.fetchAPI(`/chat/conversations/${conversationId}/block`, {
        method: 'PATCH'
      });
      return response.data;
    } catch (error) {
      console.error('Error bloqueando usuario:', error);
      throw error;
    }
  }

  // Desbloquear usuario en conversación
  async unblockUser(conversationId) {
    try {
      const response = await this.fetchAPI(`/chat/conversations/${conversationId}/unblock`, {
        method: 'PATCH'
      });
      return response.data;
    } catch (error) {
      console.error('Error desbloqueando usuario:', error);
      throw error;
    }
  }

  // ============================
  // MENSAJES
  // ============================

  // Enviar mensaje
  async sendMessage({ conversationId, message, messageType = 'text', fileData = null }) {
    try {
      const body = {
        message,
        messageType
      };

      // Si hay archivo adjunto
      if (fileData) {
        body.file_url = fileData.url;
        body.file_type = fileData.type;
        body.file_size = fileData.size;
      }

      console.log('Enviando mensaje con body:', body); // Debug

      const response = await this.fetchAPI(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      // Limpiar borrador después de enviar
      await this.deleteDraft(conversationId);

      return response;
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }
  }

  // Obtener mensajes de una conversación
  async getMessages(conversationId, { page = 1, limit = 50 } = {}) {
    try {
      const endpoint = `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`;
      const response = await this.fetchAPI(endpoint);

      return {
        messages: response.data || [],
        pagination: response.pagination || {
          page: 1,
          limit: 50,
          total: 0,
          pages: 1
        }
      };
    } catch (error) {
      console.error('Error obteniendo mensajes:', error);
      return {
        messages: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 1
        }
      };
    }
  }

  // Marcar mensajes como leídos
  async markAsRead(conversationId) {
    try {
      const response = await this.fetchAPI(`/chat/conversations/${conversationId}/messages/read`, {
        method: 'PATCH'
      });
      return response.data;
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
      throw error;
    }
  }

  // Marcar todos los mensajes como leídos (alias)
  async markAllAsRead(conversationId) {
    return this.markAsRead(conversationId);
  }

  // Eliminar mensaje
  async deleteMessage(messageId) {
    try {
      const response = await this.fetchAPI(`/chat/messages/${messageId}`, {
        method: 'DELETE'
      });
      return response.data;
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      throw error;
    }
  }

  // ============================
  // REPORTES
  // ============================

  // Reportar mensaje
  async reportMessage(messageId, { reason, description }) {
    try {
      const response = await this.fetchAPI(`/chat/messages/${messageId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason, description })
      });
      return response.data;
    } catch (error) {
      console.error('Error reportando mensaje:', error);
      throw error;
    }
  }

  // ============================
  // ESTADÍSTICAS
  // ============================

  // Obtener contador de mensajes no leídos
  async getUnreadCount() {
    try {
      const response = await this.fetchAPI('/chat/unread-count');
      return response.data || { conversations: 0, messages: 0 };
    } catch (error) {
      console.error('Error obteniendo contador de no leídos:', error);
      return { conversations: 0, messages: 0 };
    }
  }

  // ============================
  // BORRADORES (LOCAL)
  // ============================

  // Guardar borrador localmente
  async saveDraft(conversationId, text) {
    try {
      if (!text || text.trim() === '') {
        await this.deleteDraft(conversationId);
        return;
      }

      // Guardar en AsyncStorage
      const drafts = await AsyncStorage.getItem('chatDrafts');
      const draftsObj = drafts ? JSON.parse(drafts) : {};
      draftsObj[conversationId] = text;
      await AsyncStorage.setItem('chatDrafts', JSON.stringify(draftsObj));
    } catch (error) {
      console.error('Error guardando borrador:', error);
    }
  }

  // Obtener borrador
  async getDraft(conversationId) {
    try {
      const drafts = await AsyncStorage.getItem('chatDrafts');
      if (drafts) {
        const draftsObj = JSON.parse(drafts);
        return draftsObj[conversationId] || '';
      }
      return '';
    } catch (error) {
      console.error('Error obteniendo borrador:', error);
      return '';
    }
  }

  // Eliminar borrador
  async deleteDraft(conversationId) {
    try {
      const drafts = await AsyncStorage.getItem('chatDrafts');
      if (drafts) {
        const draftsObj = JSON.parse(drafts);
        delete draftsObj[conversationId];
        await AsyncStorage.setItem('chatDrafts', JSON.stringify(draftsObj));
      }
    } catch (error) {
      console.error('Error eliminando borrador:', error);
    }
  }

  // ============================
  // WEBSOCKET (PARA TIEMPO REAL - OPCIONAL)
  // ============================

  // Conectar WebSocket para mensajes en tiempo real
  connectWebSocket(userId, onMessage) {
    try {
      // Esta es una implementación básica
      // Necesitarás configurar Socket.io en el backend primero
      const wsUrl = API_URL.replace('http', 'ws').replace('/api', '') + `/ws/chat?userId=${userId}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket conectado');
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (onMessage) {
          onMessage(data);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Error WebSocket:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket desconectado');
        // Intentar reconectar después de 5 segundos
        setTimeout(() => this.connectWebSocket(userId, onMessage), 5000);
      };
    } catch (error) {
      console.error('Error conectando WebSocket:', error);
    }
  }

  // Desconectar WebSocket
  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // ============================
  // UTILIDADES
  // ============================

  // Formatear fecha de mensaje
  formatMessageDate(date) {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Ahora';
    } else if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} h`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} d`;
    } else {
      return messageDate.toLocaleDateString('es-ES');
    }
  }

  // Agrupar mensajes por fecha
  groupMessagesByDate(messages) {
    const groups = {};

    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).map(([date, messages]) => ({
      date,
      title: this.formatDateTitle(date),
      messages
    }));
  }

  // Formatear título de fecha
  formatDateTitle(dateString) {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dateString === today) {
      return 'Hoy';
    } else if (dateString === yesterday) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
  }
}

export default new ChatService();