'use client';

import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigation } from '@react-navigation/native';

export default function NotificationsScreen() {
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead,
    markAllAsRead 
  } = useNotifications();
  
  const [loading, setLoading] = React.useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    };
    
    loadNotifications();
    // Set up refresh interval
    const interval = setInterval(loadNotifications, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  const handleNotificationPress = (notificationId: string, type: string, relatedId?: string) => {
    markAsRead(notificationId);
    
    // Navigate based on notification type
    switch (type) {
      case 'ride':
        if (relatedId) {
          // @ts-ignore - Navigation typing will be fixed in a future update
          navigation.navigate('PostDetailScreen', { postId: relatedId });
        }
        break;
      case 'match':
        // @ts-ignore - Navigation typing will be fixed in a future update
        navigation.navigate('Home', {screen: 'TravelsScreen'});
        break;
      case 'payment':
        // @ts-ignore - Navigation typing will be fixed in a future update
        navigation.navigate('Wallet');
        break;
      default:
        // Just mark as read but don't navigate
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ride':
        return <MaterialIcons name="directions-car" size={24} color="#4b39ef" />;
      case 'match':
        return <MaterialIcons name="people" size={24} color="#4b39ef" />;
      case 'system':
        return <MaterialIcons name="notifications" size={24} color="#4b39ef" />;
      case 'payment':
        return <MaterialIcons name="payment" size={24} color="#4b39ef" />;
      default:
        return <MaterialIcons name="notifications" size={24} color="#4b39ef" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Less than a week
    else if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      return days[date.getDay()];
    }
    // Otherwise
    else {
      return date.toLocaleDateString();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllReadText}>Tümünü Okundu İşaretle</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4b39ef" />
          <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="notifications-off" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Hiç bildiriminiz yok</Text>
        </View>
      ) : (
        <ScrollView style={styles.notificationsList}>
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.isRead && styles.unreadNotification
              ]}
              onPress={() => handleNotificationPress(notification.id, notification.type, notification.relatedId)}
            >
              <View style={styles.notificationIconContainer}>
                {getNotificationIcon(notification.type)}
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{formatTime(notification.timestamp)}</Text>
              </View>
              {!notification.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f4',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginLeft: 20,
  },
  markAllReadText: {
    fontSize: 14,
    color: '#4b39ef',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f4',
    backgroundColor: '#fff',
  },
  unreadNotification: {
    backgroundColor: '#f8f8ff',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0efff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4b39ef',
    marginLeft: 8,
    alignSelf: 'center',
  },
}); 