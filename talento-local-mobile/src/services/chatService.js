// src/services/chatService.js
// Servicio completo para comunicación con el backend del sistema de chat

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

class ChatService {
  constructor() {
    this.baseURL = API_URL || 'http://192.168.101.14:5000/api';
  }

  // Método genérico para hacer peticiones (igual que los otros servicios)
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
  
  // Obtener o crear conversación
  async getOrCreateConversation(jobId, clientId, workerId) {
    try {
      const response = await this.fetchAPI('/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({
          jobId: jobId || null,
          clientId,
          workerId
        })
      });
      
      return response;
    } catch (error) {
      console.error('Error obteniendo/creando conversación:', error);
      throw error;
    }
  }

  // Obtener conversaciones del usuario
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
      
      // Asegurar valores por defecto para evitar errores
      const dataWithDefaults = (response.data || []).map(conv => ({
        ...conv,
        last_message_text: conv.last_message_text || 'Sin mensajes',
        client_name: conv.client_name || 'Usuario',
        worker_name: conv.worker_name || 'Usuario',
        client_unread_count: conv.client_unread_count || 0,
        worker_unread_count: conv.worker_unread_count || 0,
        last_message_time: conv.last_message_time || conv.created_at
      }));
      
      return {
        data: dataWithDefaults,
        pagination: response.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error('Error obteniendo conversaciones:', error);
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      };
    }
  }

  // Obtener conversación por ID
  async getConversationById(conversationId) {
    try {
      const response = await this.fetchAPI(`/chat/conversations/${conversationId}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo conversación:', error);
      throw error;
    }
  }

  // Archivar/desarchivar conversación
  async archiveConversation(conversationId, archive = true) {
    try {
      const response = await this.fetchAPI(`/chat/conversations/${conversationId}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({ archive })
      });
      
      return response;
    } catch (error) {
      console.error('Error archivando conversación:', error);
      throw error;
    }
  }

  // Bloquear/desbloquear conversación
  async blockConversation(conversationId, block = true) {
    try {
      const response = await this.fetchAPI(`/chat/conversations/${conversationId}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ block })
      });
      
      return response;
    } catch (error) {
      console.error('Error bloqueando conversación:', error);
      throw error;
    }
  }

  // ============================
  // MENSAJES
  // ============================
  
  // Enviar mensaje
  async sendMessage(messageData) {
    try {
      const response = await this.fetchAPI('/chat/messages', {
        method: 'POST',
        body: JSON.stringify(messageData)
      });
      
      return response;
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }
  }

  // Obtener mensajes de una conversación
  async getMessages(conversationId, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Agregar filtros si existen
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = `/chat/conversations/${conversationId}/messages${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.fetchAPI(endpoint);
      
      // Asegurar valores por defecto
      const dataWithDefaults = (response.data || []).map(msg => ({
        ...msg,
        message_text: msg.message_text || '',
        sender_name: msg.sender_name || 'Usuario',
        status: msg.status || 'sent'
      }));
      
      return {
        data: dataWithDefaults,
        pagination: response.pagination || {
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error('Error obteniendo mensajes:', error);
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 1
        }
      };
    }
  }

  // Marcar mensaje como leído
  async markAsRead(messageId) {
    try {
      const response = await this.fetchAPI(`/chat/messages/${messageId}/read`, {
        method: 'PATCH'
      });
      
      return response;
    } catch (error) {
      console.error('Error marcando mensaje como leído:', error);
      throw error;
    }
  }

  // Marcar todos los mensajes como leídos
  async markAllAsRead(conversationId) {
    try {
      const response = await this.fetchAPI(`/chat/conversations/${conversationId}/read-all`, {
        method: 'PATCH'
      });
      
      return response;
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
      throw error;
    }
  }

  // Eliminar mensaje
  async deleteMessage(messageId) {
    try {
      const response = await this.fetchAPI(`/chat/messages/${messageId}`, {
        method: 'DELETE'
      });
      
      return response;
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      throw error;
    }
  }

  // Obtener conteo de no leídos
  async getUnreadCount() {
    try {
      const response = await this.fetchAPI('/chat/unread-count');
      return response.data?.unread_count || 0;
    } catch (error) {
      console.error('Error obteniendo conteo de no leídos:', error);
      return 0;
    }
  }

  // ============================
  // UTILIDADES LOCALES
  // ============================
  
  // Guardar borrador de mensaje localmente
  async saveDraft(conversationId, message) {
    try {
      const key = `chat_draft_${conversationId}`;
      await AsyncStorage.setItem(key, message);
      return true;
    } catch (error) {
      console.error('Error guardando borrador:', error);
      return false;
    }
  }

  // Obtener borrador guardado
  async getDraft(conversationId) {
    try {
      const key = `chat_draft_${conversationId}`;
      const draft = await AsyncStorage.getItem(key);
      return draft || '';
    } catch (error) {
      console.error('Error obteniendo borrador:', error);
      return '';
    }
  }

  // Eliminar borrador
  async deleteDraft(conversationId) {
    try {
      const key = `chat_draft_${conversationId}`;
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error eliminando borrador:', error);
      return false;
    }
  }

  // Obtener última conversación
  async getLastConversation() {
    try {
      const conversations = await this.getUserConversations({ limit: 1 });
      return conversations.data[0] || null;
    } catch (error) {
      console.error('Error obteniendo última conversación:', error);
      return null;
    }
  }

  // Limpiar todos los borradores
  async clearAllDrafts() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const draftKeys = keys.filter(key => key.startsWith('chat_draft_'));
      await AsyncStorage.multiRemove(draftKeys);
      return true;
    } catch (error) {
      console.error('Error limpiando borradores:', error);
      return false;
    }
  }
}

export default new ChatService();