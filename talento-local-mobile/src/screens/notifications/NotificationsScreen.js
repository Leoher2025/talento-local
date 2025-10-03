// src/screens/notifications/NotificationsScreen.js
// Pantalla para ver el historial de notificaciones

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { updateUnreadCount } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
      updateUnreadCount();
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar las notificaciones',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadNotifications(true);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifications(true);
      Toast.show({
        type: 'success',
        text1: 'Listo',
        text2: 'Todas las notificaciones marcadas como leídas',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron marcar como leídas',
      });
    }
  };

  const handleNotificationPress = async (notification) => {
    try {
      // Marcar como leída
      if (!notification.is_read) {
        await notificationService.markAsRead(notification.id);
        updateUnreadCount();
      }

      // Navegar según el tipo
      const data = notification.data || {};
      
      switch (data.screen) {
        case 'ChatScreen':
          navigation.navigate('ChatScreen', {
            conversationId: data.conversationId
          });
          break;
        case 'JobDetail':
          navigation.navigate('JobDetail', {
            jobId: data.jobId
          });
          break;
        case 'ManageApplications':
          navigation.navigate('ManageApplications', {
            jobId: data.jobId
          });
          break;
        case 'Profile':
          navigation.navigate('Profile');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error manejando notificación:', error);
    }
  };

  const renderNotification = ({ item }) => {
    const isUnread = !item.is_read;
    const timeAgo = getTimeAgo(item.created_at);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          isUnread && styles.notificationCardUnread
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationIcon}>
          <Text style={styles.notificationIconText}>
            {getNotificationIcon(item.type)}
          </Text>
        </View>

        <View style={styles.notificationContent}>
          <Text style={[
            styles.notificationTitle,
            isUnread && styles.notificationTitleUnread
          ]}>
            {item.title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.notificationTime}>{timeAgo}</Text>
        </View>

        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>Sin notificaciones</Text>
      <Text style={styles.emptyText}>
        Aquí aparecerán tus notificaciones
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando notificaciones...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {notifications.some(n => !n.is_read) && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

// Funciones auxiliares
function getNotificationIcon(type) {
  const icons = {
    'application_accepted': '✅',
    'application_rejected': '❌',
    'new_message': '💬',
    'job_status_change': '📋',
    'new_review': '⭐',
    'new_application': '📝',
    'test': '🔔'
  };
  return icons[type] || '🔔';
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  
  return date.toLocaleDateString('es-GT', {
    day: 'numeric',
    month: 'short'
  });
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
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

  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },

  markAllButton: {
    padding: SPACING.xs,
  },

  markAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },

  listContent: {
    flexGrow: 1,
    padding: SPACING.md,
  },

  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  notificationCardUnread: {
    backgroundColor: COLORS.primary + '05',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },

  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },

  notificationIconText: {
    fontSize: FONT_SIZES.xl,
  },

  notificationContent: {
    flex: 1,
  },

  notificationTitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    marginBottom: 4,
  },

  notificationTitleUnread: {
    fontWeight: '600',
  },

  notificationBody: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: 4,
  },

  notificationTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
  },

  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },

  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },

  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});