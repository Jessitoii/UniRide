'use client';

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { useTranslation } from 'react-i18next';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationPress = (notificationId: string, type: string, relatedId?: string) => {
    markAsRead(notificationId);
    switch (type) {
      case 'ride':
        if (relatedId) {
          router.push({ pathname: '/(drawer)/PostDetailScreen', params: { postId: relatedId } });
        }
        break;
      case 'match':
        router.push('/(drawer)/(tabs)/TravelsScreen');
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ride': return 'directions-car';
      case 'match': return 'people';
      case 'system': return 'notifications';
      default: return 'notifications';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) {
      const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      return days[date.getDay()];
    }
    return date.toLocaleDateString();
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles(theme).header}>
        <TouchableOpacity onPress={() => router.back()} style={styles(theme).backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textDark} />
        </TouchableOpacity>
        <Text style={styles(theme).headerTitle}>{t('notifications')}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles(theme).markAllButton}>
            <Text style={styles(theme).markAllText}>{t('mark_all_read')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles(theme).scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles(theme).emptyContainer}>
            <View style={styles(theme).emptyIconBg}>
              <MaterialIcons name="notifications-none" size={48} color={theme.colors.textLight} />
            </View>
            <Text style={styles(theme).emptyTitle}>{t('no_notifications')}</Text>
            <Text style={styles(theme).emptyText}>{t('no_notifications_desc')}</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles(theme).notificationItem,
                !notification.isRead && styles(theme).unreadItem
              ]}
              onPress={() => handleNotificationPress(notification.id, notification.type, notification.relatedId)}
              activeOpacity={0.7}
            >
              <View style={[
                styles(theme).iconContainer,
                !notification.isRead && styles(theme).unreadIconContainer
              ]}>
                <MaterialIcons
                  name={getNotificationIcon(notification.type) as any}
                  size={24}
                  color={!notification.isRead ? theme.colors.primary : theme.colors.textLight}
                />
              </View>

              <View style={styles(theme).contentContainer}>
                <View style={styles(theme).rowBetween}>
                  <Text style={[
                    styles(theme).title,
                    !notification.isRead && styles(theme).unreadTitle
                  ]} numberOfLines={1}>
                    {notification.title}
                  </Text>
                  <Text style={styles(theme).time}>{formatTime(notification.timestamp)}</Text>
                </View>

                <Text style={styles(theme).message} numberOfLines={2}>
                  {notification.message}
                </Text>
              </View>

              {!notification.isRead && <View style={styles(theme).unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing['4xl'], // Safe area
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
    zIndex: 10,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    flex: 1,
    textAlign: 'center',
  },
  markAllButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.primaryTransparent,
    borderRadius: theme.borderRadius.full,
  },
  markAllText: {
    ...theme.textStyles.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing['4xl'],
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  unreadItem: {
    backgroundColor: theme.colors.surface, // Slight highlight for unread
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  unreadIconContainer: {
    backgroundColor: theme.colors.primaryTransparent,
  },
  contentContainer: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    ...theme.textStyles.body,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  unreadTitle: {
    color: theme.colors.textDark,
    fontWeight: '700',
  },
  time: {
    ...theme.textStyles.caption,
    fontSize: 11,
    color: theme.colors.textLight,
  },
  message: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
});