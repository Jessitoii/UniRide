'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/env';
import { MaterialIcons } from '@expo/vector-icons';
import { InterestedUser } from '@/components';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { useTranslation } from 'react-i18next';
import { safeParse } from '@/utils/serialization';

// Helper for coordinate validation
const isValidCoordinate = (coord: any) => {
  return coord && typeof coord.latitude === 'number' && typeof coord.longitude === 'number';
};

export default function DriverScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const [profile, setProfile] = useState<any>({});
  const [profilePhoto, setProfilePhoto] = useState<string>(`${BASE_URL}/api/users/profilePhoto/default`);
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Constants for state visualization
  const isDriverActive = !!car;

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const profileResponse = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setProfile(data);
        if (data.id) {
          setProfilePhoto(`${BASE_URL}/api/users/profilePhoto/${data.id}`);
        }
      }

      const carResponse = await fetch(`${BASE_URL}/api/cars`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (carResponse.ok) {
        const carData = await carResponse.json();
        setCar(carData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const navigateToScreen = (screen: string, params?: any) => {
    if (screen === 'NotificationsScreen') router.push('/(drawer)/NotificationsScreen');
    else if (screen === 'UserProfileScreen') router.push({ pathname: '/(drawer)/UserProfileScreen', params });
    else if (screen === 'CarDetail') router.push('/(drawer)/CarDetail'); // Assuming this route exists or is handled
    else if (screen === 'TravelsScreen') router.push('/(drawer)/(tabs)/TravelsScreen');
    else router.push(`/(drawer)/${screen}` as any);
  };

  if (loading) {
    return (
      <View style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Dynamic Header based on State */}
      <View style={[styles(theme).header, isDriverActive ? styles(theme).headerActive : styles(theme).headerIdle]}>
        <View style={styles(theme).headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles(theme).iconButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.textDark} />
          </TouchableOpacity>
          <Text style={styles(theme).headerTitle}>{t('driver_panel')}</Text>
          <TouchableOpacity onPress={() => navigateToScreen('NotificationsScreen')} style={styles(theme).iconButton}>
            <MaterialIcons name="notifications" size={24} color={theme.colors.textDark} />
            {unreadCount > 0 && (
              <View style={styles(theme).badge}>
                <Text style={styles(theme).badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Summary in Header */}
        <View style={styles(theme).profileSummary}>
          <TouchableOpacity onPress={() => navigateToScreen('UserProfileScreen', { id: profile.id })}>
            <Image source={{ uri: profilePhoto }} style={styles(theme).avatar} />
          </TouchableOpacity>
          <View style={styles(theme).profileTexts}>
            <Text style={styles(theme).welcomeText}>{t('hello')} {profile?.name}</Text>
            <View style={styles(theme).ratingRow}>
              <MaterialIcons name="star" size={16} color={theme.colors.warning} />
              <Text style={styles(theme).ratingText}>{profile?.stars || '0'}</Text>
              <Text style={styles(theme).dotSeparator}>•</Text>
              <Text style={styles(theme).ratingText}>{profile?.ridesCompleted || '0'} {t('trip')}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles(theme).content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Active/Idle Status Card */}
        <View style={styles(theme).card}>
          <View style={styles(theme).cardHeader}>
            <MaterialIcons name={isDriverActive ? "check-circle" : "pause-circle-filled"} size={24} color={isDriverActive ? theme.colors.success : theme.colors.textLight} />
            <Text style={styles(theme).cardTitle}>{t('car_status')}</Text>
          </View>

          {car ? (
            <View style={styles(theme).carContent}>
              <View>
                <Text style={styles(theme).carTitle}>{car.brand} {car.model}</Text>
                <Text style={styles(theme).carSubtitle}>{car.plate} • {car.color}</Text>
              </View>
              <TouchableOpacity style={styles(theme).secondaryButton} onPress={() => navigateToScreen('CarDetail')}>
                <Text style={styles(theme).secondaryButtonText}>{t('edit')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles(theme).emptyState}>
              <Text style={styles(theme).emptyText}>{t('add_car_to_be_driver')}</Text>
              <TouchableOpacity style={styles(theme).primaryButton} onPress={() => navigateToScreen('CarDetail')}>
                <Text style={styles(theme).primaryButtonText}>{t('add_car')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>



        {/* Interested Passengers */}
        <View style={styles(theme).card}>
          <View style={styles(theme).cardHeader}>
            <MaterialIcons name="group" size={24} color={theme.colors.primary} />
            <Text style={styles(theme).cardTitle}>{t('passenger_requests')}</Text>
          </View>

          {(profile?.posts && Array.isArray(profile.posts) && profile.posts.some((p: any) => p.interestedUsers?.length > 0)) ? (
            profile.posts
              .filter((p: any) => p.interestedUsers && p.interestedUsers.length > 0 && new Date(p.datetimeStart) > new Date())
              .flatMap((post: any) =>
                post.interestedUsers.map((interestedIn: any) => {
                  const parsedRoute = safeParse(post.route);
                  const parsedLocation = safeParse(interestedIn.locationCoordinates);
                  const safeLocation = isValidCoordinate(parsedLocation) ? parsedLocation : null;

                  return (
                    <InterestedUser
                      key={`${post.id}-${interestedIn.user.id}`}
                      postId={post.id}
                      userId={interestedIn.user.id}
                      userName={interestedIn.user.name}
                      university={interestedIn.user.university}
                      bio={interestedIn.user.bio}
                      hasCustomPhoto={interestedIn.user.hasCustomPhoto}
                      route={parsedRoute}
                      userLocation={safeLocation}
                      stars={interestedIn.user.stars}
                      matchedUserId={post.matchedUserId}
                      onMatchPress={() => router.push({ pathname: '/(drawer)/PostDetailScreen', params: { postId: post.id } })}
                      onChatPress={(userId) => router.push({
                        pathname: '/(drawer)/ChatScreen',
                        params: {
                          roomId: `${post.id}_${userId}`,
                          currentUserId: profile.id,
                          recipientId: userId,
                          recipientName: interestedIn.user.name
                        }
                      })}
                    />
                  );
                })
              )
          ) : (
            <View style={styles(theme).emptyState}>
              <MaterialIcons name="person-search" size={48} color={theme.colors.textLight} />
              <Text style={styles(theme).emptyText}>{t('no_pending_requests')}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles(theme).actionGrid}>
          <TouchableOpacity
            style={styles(theme).actionCard}
            onPress={() => router.push('/(drawer)/(tabs)/PostScreen')}
            activeOpacity={0.8}
          >
            <View style={[styles(theme).actionIcon, { backgroundColor: theme.colors.primary }]}>
              <MaterialIcons name="add" size={32} color="white" />
            </View>
            <Text style={styles(theme).actionText}>{t('new_post')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles(theme).actionCard}
            onPress={() => navigateToScreen('TravelsScreen')}
            activeOpacity={0.8}
          >
            <View style={[styles(theme).actionIcon, { backgroundColor: theme.colors.secondary }]}>
              <MaterialIcons name="history" size={32} color="white" />
            </View>
            <Text style={styles(theme).actionText}>{t('history')}</Text>
          </TouchableOpacity>
        </View>

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
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: theme.borderRadius['2xl'],
    borderBottomRightRadius: theme.borderRadius['2xl'],
    ...theme.shadows.md,
    zIndex: 10,
  },
  headerActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  headerIdle: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.textLight,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.card,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    marginRight: theme.spacing.md,
  },
  profileTexts: {
    justifyContent: 'center',
  },
  welcomeText: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    ...theme.textStyles.caption,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: theme.colors.textLight,
  },

  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cardTitle: {
    ...theme.textStyles.body,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  carContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carTitle: {
    ...theme.textStyles.body,
    fontWeight: '600',
    color: theme.colors.textDark,
    marginBottom: 2,
  },
  carSubtitle: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
  },
  secondaryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  secondaryButtonText: {
    ...theme.textStyles.caption,
    color: theme.colors.textDark,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  emptyText: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
  },
  primaryButtonText: {
    ...theme.textStyles.button,
    color: 'white',
  },

  actionGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing['4xl'],
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.md,
  },
  actionText: {
    ...theme.textStyles.body,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
});
