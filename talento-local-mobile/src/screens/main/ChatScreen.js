// src/screens/main/ChatScreen.js
// Pantalla de chat individual completa

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';
import chatService from '../../services/chatService';

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { conversationId, otherUserName, jobTitle } = route.params;

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadConversation();
    loadMessages();
    markAllAsRead();

    // Cargar borrador si existe
    loadDraft();

    return () => {
      // Guardar borrador al salir
      if (inputMessage.trim()) {
        chatService.saveDraft(conversationId, inputMessage);
      }
    };
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      const response = await chatService.getConversationById(conversationId);
      setConversation(response.data);
    } catch (error) {
      console.error('Error cargando conversación:', error);
    }
  };

  const loadMessages = async (loadMore = false) => {
    try {
      if (!loadMore) setIsLoading(true);

      const response = await chatService.getMessages(conversationId, {
        page: loadMore ? page + 1 : 1,
        limit: 50
      });

      // Asegurarse de que response.messages sea un array
      const newMessages = Array.isArray(response.messages) ? response.messages : [];

      if (loadMore) {
        setMessages(prev => {
          const currentMessages = Array.isArray(prev) ? prev : [];
          return [...newMessages, ...currentMessages];
        });
        setPage(prev => prev + 1);
      } else {
        setMessages(newMessages);
      }

      setHasMore(response.pagination?.page < response.pagination?.pages);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      Alert.alert('Error', 'No se pudieron cargar los mensajes');
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await chatService.markAllAsRead(conversationId);
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  };

  const loadDraft = async () => {
    try {
      const draft = await chatService.getDraft(conversationId);
      if (draft) {
        setInputMessage(draft);
      }
    } catch (error) {
      console.error('Error cargando borrador:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      await chatService.deleteDraft(conversationId);

      const response = await chatService.sendMessage({
        conversationId: conversationId,
        message: messageText,
        messageType: 'text'
      });

      console.log('Respuesta del servidor:', response);

      if (response && response.data) {
        // AQUÍ ESTÁ LA CORRECCIÓN - Asegurarse de que siempre sea un array
        setMessages(prevMessages => {
          // Validar que prevMessages sea un array, si no, crear uno vacío
          const currentMessages = Array.isArray(prevMessages) ? prevMessages : [];
          return [...currentMessages, response.data];
        });

        // Scroll al final
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
      setInputMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    Alert.alert(
      'Eliminar mensaje',
      '¿Estás seguro de que quieres eliminar este mensaje?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.deleteMessage(messageId);
              setMessages(prev => prev.filter(m => m.id !== messageId));
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el mensaje');
            }
          }
        }
      ]
    );
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadMessages(true);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }

    return date.toLocaleDateString();
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const showDate = index === 0 ||
      (messages[index - 1] && formatDate(messages[index - 1]?.created_at) !== formatDate(item.created_at));

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
          ]}
          onLongPress={() => isOwnMessage && handleDeleteMessage(item.id)}
          activeOpacity={0.7}
        >
          {!isOwnMessage && (
            <View style={styles.avatarContainer}>
              {item.sender_picture ? (
                <Image source={{ uri: item.sender_picture }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {item.sender_name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
          ]}>
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.message_text || ''}
            </Text>

            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {formatTime(item.created_at)}
              {isOwnMessage && item.status && (
                <Text>
                  {item.status === 'read' ? ' ✓✓' : item.status === 'delivered' ? ' ✓' : ''}
                </Text>
              )}
            </Text>
          </View>
        </TouchableOpacity>
      </>
    );
  };

  const safeMessages = Array.isArray(messages) ? messages : [];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUserName || 'Usuario'}</Text>
          {jobTitle && (
            <Text style={styles.headerJob} numberOfLines={1}>📋 {jobTitle}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Mensajes */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={safeMessages}
          keyExtractor={(item) => item?.id ? String(item.id) : Math.random().toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          inverted={false}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyText}>
                Envía un mensaje para iniciar la conversación
              </Text>
            </View>
          }
        />

        {/* Input de mensaje */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={COLORS.text.secondary}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputMessage.trim() || isSending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  },

  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },

  backButton: {
    padding: SPACING.xs,
  },

  backIcon: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.text.primary,
  },

  headerInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  headerName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  headerJob: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },

  menuButton: {
    padding: SPACING.xs,
  },

  menuIcon: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text.primary,
  },

  messagesContainer: {
    flex: 1,
  },

  messagesList: {
    padding: SPACING.md,
  },

  dateSeparator: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },

  dateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },

  messageContainer: {
    marginBottom: SPACING.sm,
  },

  ownMessageContainer: {
    alignItems: 'flex-end',
  },

  otherMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  avatarContainer: {
    marginRight: SPACING.sm,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  messageBubble: {
    maxWidth: '75%',
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
  },

  ownMessageBubble: {
    backgroundColor: COLORS.primary,
  },

  otherMessageBubble: {
    backgroundColor: COLORS.white,
  },

  messageText: {
    fontSize: FONT_SIZES.base,
    lineHeight: 20,
  },

  ownMessageText: {
    color: COLORS.white,
  },

  otherMessageText: {
    color: COLORS.text.primary,
  },

  messageTime: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },

  ownMessageTime: {
    color: COLORS.white + 'CC',
  },

  otherMessageTime: {
    color: COLORS.text.secondary,
  },

  messageImage: {
    width: 200,
    height: 200,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },

  imageCaption: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },

  fileMessage: {
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
  },

  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },

  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },

  inputContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },

  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
  },

  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sendButtonDisabled: {
    backgroundColor: COLORS.gray[400],
  },

  sendIcon: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
});