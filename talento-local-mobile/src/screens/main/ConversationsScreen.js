// src/screens/main/ConversationsScreen.js
// Pantalla principal de conversaciones/chats

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Image
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import chatService from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';

const ConversationsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('active');
  const [unreadCount, setUnreadCount] = useState({ conversations: 0, messages: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Cargar conversaciones
  const loadConversations = async (refresh = false, loadMore = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true);
      } else if (refresh) {
        setIsRefreshing(true);
        setPage(1);
      } else {
        setIsLoading(true);
      }

      const filters = {
        status: activeFilter,
        page: loadMore ? page + 1 : 1,
        limit: 20
      };

      const response = await chatService.getUserConversations(filters);
      
      if (loadMore) {
        setConversations(prev => [...prev, ...response.conversations]);
        setPage(prev => prev + 1);
      } else {
        setConversations(response.conversations);
        setPage(1);
      }
      
      setHasMore(response.pagination?.page < response.pagination?.pages);
      
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las conversaciones');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  // Cargar contador de no leídos
  const loadUnreadCount = async () => {
    try {
      const count = await chatService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error cargando contador de no leídos:', error);
    }
  };

  // Efecto para cargar datos al montar
  useEffect(() => {
    loadConversations();
    loadUnreadCount();
  }, [activeFilter]);

  // Recargar cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
      return () => {};
    }, [])
  );

  // Conectar WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    if (user?.id) {
      chatService.connectWebSocket(user.id, handleWebSocketMessage);
      
      return () => {
        chatService.disconnectWebSocket();
      };
    }
  }, [user?.id]);

  // Manejar mensajes del WebSocket
  const handleWebSocketMessage = (data) => {
    if (data.type === 'new_message') {
      // Actualizar la conversación correspondiente
      setConversations(prev => {
        const updated = [...prev];
        const index = updated.findIndex(c => c.id === data.conversation_id);
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            last_message_text: data.message_text,
            last_message_time: data.created_at,
            unread_count: (updated[index].unread_count || 0) + 1
          };
          // Mover al principio
          const [conversation] = updated.splice(index, 1);
          updated.unshift(conversation);
        }
        return updated;
      });
      
      // Actualizar contador de no leídos
      setUnreadCount(prev => ({
        conversations: prev.conversations,
        messages: prev.messages + 1
      }));
    }
  };

  // Navegar al chat
  const handleConversationPress = (conversation) => {
    navigation.navigate('Chat', { 
      conversationId: conversation.id,
      otherUser: {
        id: conversation.client_id === user?.id ? conversation.worker_id : conversation.client_id,
        name: conversation.client_id === user?.id ? conversation.worker_name : conversation.client_name,
        picture: conversation.client_id === user?.id ? conversation.worker_picture : conversation.client_picture
      }
    });
  };

  // Archivar conversación
  const handleArchiveConversation = async (conversationId) => {
    Alert.alert(
      'Archivar conversación',
      '¿Estás seguro de que quieres archivar esta conversación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          onPress: async () => {
            try {
              await chatService.archiveConversation(conversationId);
              setConversations(prev => prev.filter(c => c.id !== conversationId));
            } catch (error) {
              Alert.alert('Error', 'No se pudo archivar la conversación');
            }
          }
        }
      ]
    );
  };

  // Bloquear usuario
  const handleBlockUser = async (conversationId) => {
    Alert.alert(
      'Bloquear usuario',
      '¿Estás seguro de que quieres bloquear a este usuario? No podrás recibir mensajes de esta persona.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.blockUser(conversationId);
              setConversations(prev => prev.filter(c => c.id !== conversationId));
              Alert.alert('Usuario bloqueado', 'El usuario ha sido bloqueado exitosamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo bloquear al usuario');
            }
          }
        }
      ]
    );
  };

  // Filtrar conversaciones por búsqueda
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const otherUserName = conv.client_id === user?.id 
      ? conv.worker_name 
      : conv.client_name;
    
    return otherUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Renderizar item de conversación
  const renderConversationItem = ({ item }) => {
    const isClient = item.client_id === user?.id;
    const otherUserName = isClient ? item.worker_name : item.client_name;
    const otherUserPicture = isClient ? item.worker_picture : item.client_picture;
    const unreadCount = isClient ? item.worker_unread_count : item.client_unread_count;
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        onLongPress={() => {
          Alert.alert(
            'Opciones',
            '¿Qué deseas hacer con esta conversación?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Archivar', onPress: () => handleArchiveConversation(item.id) },
              { text: 'Bloquear', onPress: () => handleBlockUser(item.id), style: 'destructive' }
            ]
          );
        }}
      >
        <View style={styles.conversationContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {otherUserPicture ? (
              <Image source={{ uri: otherUserPicture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {otherUserName?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
            )}
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          
          {/* Contenido */}
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={styles.userName} numberOfLines={1}>
                {otherUserName || 'Usuario'}
              </Text>
              <Text style={styles.timeText}>
                {item.last_message_time 
                  ? chatService.formatMessageDate(item.last_message_time)
                  : ''}
              </Text>
            </View>
            
            {item.job_title && (
              <Text style={styles.jobTitle} numberOfLines={1}>
                📋 {item.job_title}
              </Text>
            )}
            
            <Text 
              style={[
                styles.lastMessage,
                unreadCount > 0 && styles.unreadMessage
              ]} 
              numberOfLines={2}
            >
              {item.last_message_text || 'Sin mensajes'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar lista vacía
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="chat-bubble-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No hay conversaciones</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'archived' 
          ? 'No tienes conversaciones archivadas'
          : 'Cuando inicies una conversación aparecerá aquí'}
      </Text>
    </View>
  );

  // Renderizar footer de la lista
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  // Cargar más conversaciones al llegar al final
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadConversations(false, true);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando conversaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con búsqueda */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensajes</Text>
        {unreadCount.messages > 0 && (
          <View style={styles.totalUnreadBadge}>
            <Text style={styles.totalUnreadText}>
              {unreadCount.messages} no leídos
            </Text>
          </View>
        )}
      </View>
      
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar conversaciones..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'active' && styles.filterTabActive]}
          onPress={() => setActiveFilter('active')}
        >
          <Text style={[styles.filterText, activeFilter === 'active' && styles.filterTextActive]}>
            Activas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'archived' && styles.filterTabActive]}
          onPress={() => setActiveFilter('archived')}
        >
          <Text style={[styles.filterText, activeFilter === 'archived' && styles.filterTextActive]}>
            Archivadas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'blocked' && styles.filterTabActive]}
          onPress={() => setActiveFilter('blocked')}
        >
          <Text style={[styles.filterText, activeFilter === 'blocked' && styles.filterTextActive]}>
            Bloqueadas
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Lista de conversaciones */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadConversations(true)}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  totalUnreadBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  totalUnreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    flexGrow: 1,
  },
  conversationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  conversationContent: {
    flexDirection: 'row',
    padding: 15,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10,
  },
  jobTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  unreadMessage: {
    fontWeight: '500',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default ConversationsScreen;