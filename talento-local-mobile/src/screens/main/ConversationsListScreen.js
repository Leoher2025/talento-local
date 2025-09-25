// src/screens/main/ConversationsListScreen.js
// Pantalla de lista de conversaciones/chats

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, USER_ROLES } from '../../utils/constants';
import chatService from '../../services/chatService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConversationsListScreen({ navigation }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      loadUnreadCount();
    }, [])
  );

  const loadConversations = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await chatService.getUserConversations({
        status: 'active',
        page: 1,
        limit: 50
      });
      
      setConversations(response.data);
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las conversaciones');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await chatService.getUnreadCount();
      setUnreadTotal(count);
    } catch (error) {
      console.error('Error obteniendo contador de no leídos:', error);
    }
  };

  const handleRefresh = () => {
    loadConversations(true);
    loadUnreadCount();
  };

  const handleConversationPress = (conversation) => {
    navigation.navigate('ChatScreen', {
      conversationId: conversation.id,
      otherUserName: user?.role === USER_ROLES.CLIENT 
        ? conversation.worker_name 
        : conversation.client_name,
      jobTitle: conversation.job_title
    });
  };

  const handleArchiveConversation = async (conversationId) => {
    Alert.alert(
      'Archivar conversación',
      '¿Estás seguro de que quieres archivar esta conversación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.archiveConversation(conversationId);
              Alert.alert('✅', 'Conversación archivada');
              handleRefresh();
            } catch (error) {
              Alert.alert('Error', 'No se pudo archivar la conversación');
            }
          }
        }
      ]
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Hoy - mostrar hora
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      // Esta semana - mostrar día
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return days[date.getDay()];
    } else {
      // Más de una semana - mostrar fecha
      return date.toLocaleDateString();
    }
  };

  const renderConversation = ({ item }) => {
    const isClient = user?.role === USER_ROLES.CLIENT;
    const otherUserName = isClient ? item.worker_name : item.client_name;
    const otherUserPicture = isClient ? item.worker_picture : item.client_picture;
    const unreadCount = isClient ? item.client_unread_count : item.worker_unread_count;
    
    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleConversationPress(item)}
        onLongPress={() => handleArchiveConversation(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {otherUserPicture ? (
            <Image source={{ uri: otherUserPicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {otherUserName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {otherUserName || 'Usuario'}
            </Text>
            <Text style={styles.timestamp}>
              {formatTime(item.last_message_time)}
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
              unreadCount > 0 && styles.lastMessageUnread
            ]} 
            numberOfLines={1}
          >
            {item.last_message_sender_id === user?.id && '✓ '}
            {item.last_message_text || 'Sin mensajes'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>No hay conversaciones</Text>
      <Text style={styles.emptyText}>
        Las conversaciones con {user?.role === USER_ROLES.CLIENT ? 'trabajadores' : 'clientes'} aparecerán aquí
      </Text>
    </View>
  );

  if (isLoading && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando conversaciones...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensajes</Text>
        {unreadTotal > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{unreadTotal}</Text>
          </View>
        )}
      </View>

      {/* Lista de conversaciones */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={[
          styles.listContent,
          conversations.length === 0 && styles.emptyListContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  
  headerBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.full,
    minWidth: 24,
    alignItems: 'center',
  },
  
  headerBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
  },
  
  listContent: {
    flexGrow: 1,
  },
  
  emptyListContent: {
    flex: 1,
  },
  
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  
  avatarContainer: {
    marginRight: SPACING.md,
    position: 'relative',
  },
  
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  avatarText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  
  unreadCount: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    paddingHorizontal: SPACING.xs / 2,
  },
  
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs / 2,
  },
  
  userName: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginRight: SPACING.sm,
  },
  
  timestamp: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  
  jobTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginBottom: SPACING.xs / 2,
  },
  
  lastMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  
  lastMessageUnread: {
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  separator: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginLeft: SPACING.lg + 56 + SPACING.md, // Alineado con el contenido
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  
  emptyIcon: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});