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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, USER_ROLES } from '../../utils/constants';

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
        search: searchQuery
      };

      const response = await chatService.getUserConversations(filters);

      // getUserConversations devuelve { conversations: [], pagination: {} }
      const conversationsList = response.conversations || [];
      
      if (loadMore) {
        setConversations(prev => [...prev, ...conversationsList]);
        setPage(page + 1);
      } else {
        setConversations(conversationsList);
        setPage(1);
      }
      
      // Actualizar contador de no leídos
      const unreadData = conversationsList.reduce((acc, conv) => {
        const unread = user?.role === USER_ROLES.CLIENT 
          ? conv.client_unread_count 
          : conv.worker_unread_count;
        
        if (unread > 0) {
          acc.conversations += 1;
          acc.messages += unread;
        }
        return acc;
      }, { conversations: 0, messages: 0 });
      
      setUnreadCount(unreadData);
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

  // Efecto para cargar conversaciones cuando cambia el filtro o búsqueda
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadConversations();
    }, searchQuery ? 500 : 0);

    return () => clearTimeout(delayDebounce);
  }, [activeFilter, searchQuery]);

  // Recargar cuando la pantalla tiene foco
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  // Abrir conversación
  const handleConversationPress = (conversation) => {
    navigation.navigate('ChatScreen', {
      conversationId: conversation.id,
      otherUserId: user?.role === USER_ROLES.CLIENT 
        ? conversation.worker_id 
        : conversation.client_id,
      otherUserName: user?.role === USER_ROLES.CLIENT 
        ? conversation.worker_name 
        : conversation.client_name,
      jobId: conversation.job_id,
      jobTitle: conversation.job_title
    });
  };

  // Archivar conversación
  const handleArchiveConversation = async (conversationId) => {
    try {
      await chatService.archiveConversation(conversationId);
      loadConversations();
      Alert.alert('Éxito', 'Conversación archivada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo archivar la conversación');
    }
  };

  // Bloquear usuario
  const handleBlockUser = async (conversationId) => {
    Alert.alert(
      'Confirmar bloqueo',
      '¿Estás seguro de que deseas bloquear a este usuario? No podrán enviarte más mensajes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.blockUser(conversationId);
              loadConversations();
              Alert.alert('Usuario bloqueado', 'Este usuario ya no puede contactarte');
            } catch (error) {
              Alert.alert('Error', 'No se pudo bloquear al usuario');
            }
          }
        }
      ]
    );
  };

  // Función para formatear fecha
  const formatMessageDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('es', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  // Renderizar conversación
  const renderConversation = ({ item }) => {
    const isClient = user?.role === USER_ROLES.CLIENT;
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
                {formatMessageDate(item.last_message_time)}
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
      <Text style={styles.emptyIcon}>💬</Text>
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
        <ActivityIndicator size="small" color={COLORS.primary} />
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
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando conversaciones...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar conversaciones..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.text.secondary}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>❌</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'active' && styles.filterButtonActive
          ]}
          onPress={() => setActiveFilter('active')}
        >
          <Text style={[
            styles.filterText,
            activeFilter === 'active' && styles.filterTextActive
          ]}>
            Activas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'archived' && styles.filterButtonActive
          ]}
          onPress={() => setActiveFilter('archived')}
        >
          <Text style={[
            styles.filterText,
            activeFilter === 'archived' && styles.filterTextActive
          ]}>
            Archivadas
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Lista de conversaciones */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderConversation}
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadConversations(true)}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={conversations.length === 0 && styles.emptyListContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  
  headerTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  
  totalUnreadBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  
  totalUnreadText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  
  searchIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
  },
  
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    paddingVertical: SPACING.xs,
  },
  
  clearIcon: {
    fontSize: FONT_SIZES.base,
    marginLeft: SPACING.sm,
  },
  
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[100],
  },
  
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  
  filterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  filterTextActive: {
    color: COLORS.white,
  },
  
  conversationItem: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  
  conversationContent: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  avatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZES['xl'],
    fontWeight: 'bold',
  },
  
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  
  unreadBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
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
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
  },
  
  timeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
  },
  
  jobTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  
  lastMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  
  unreadMessage: {
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  
  emptyIcon: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  
  emptySubtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  
  emptyListContent: {
    flexGrow: 1,
  },
  
  footerLoader: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
});

export default ConversationsScreen;