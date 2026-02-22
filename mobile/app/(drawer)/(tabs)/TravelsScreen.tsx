'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
  Image,
  Modal,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

// Local imports
import { BASE_URL } from '@/env';
import { lightTheme, darkTheme, ThemeType } from '@/styles/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { RideHistoryItem } from '@/components';
import { Header, Button } from '@/components/base';
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/contexts/SocketContext';

// Types
interface UserProfile {
  id: string;
  name: string;
  stars: number;
  matchedPosts: PostData[];
}

export type { PostData };
interface PostData {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    stars: number;
    avatar?: string;
    hasCustomPhoto?: boolean;
  };
  sourceAddress: string;
  destinationFaculty: string;
  datetimeStart: string;
  datetimeEnd: string;
  status: string;

  route: string;
  matchedUserId: string;
  matchedUser?: {
    id: string;
    name: string;
    stars: number;
    avatar?: string;
    hasCustomPhoto?: boolean;
  };
}

export default function TravelsScreen() {
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matchedPosts, setMatchedPosts] = useState<PostData[]>([]);
  const [myActivePosts, setMyActivePosts] = useState<PostData[]>([]);
  const [pendingPosts, setPendingPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);


  // Theme
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();

  // Navigation
  const router = useRouter();
  const { socket } = useSocket();

  // Socket listener for ride completion
  useEffect(() => {
    if (socket) {
      const handleRideCompleted = (data: { rideId: string }) => {
        const updateStatus = (posts: PostData[]) =>
          posts.map(p => p.id === data.rideId ? { ...p, status: 'COMPLETED' } : p);

        setMatchedPosts(prev => updateStatus(prev));
        setMyActivePosts(prev => updateStatus(prev));
        // Pending posts are likely not affected by ride completion unless they were accepted? 
        // But if they were pending, they stay pending or cancelled.
      };

      socket.on('ride_completed', handleRideCompleted);

      return () => {
        socket.off('ride_completed', handleRideCompleted);
      };
    }
  }, [socket]);

  // Fetch profile and matched posts
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }


      // Fetch Travel Data (Profile + Matched + MyActive + Pending)
      const travelResponse = await fetch(`${BASE_URL}/api/users/travel-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (travelResponse.status === 403) {
        await AsyncStorage.removeItem('token');
        router.push('/auth/login');
        return;
      }

      if (travelResponse.ok) {
        const data = await travelResponse.json();
        setProfile(data.profile);
        setMatchedPosts(data.matchedPosts || []);
        setMyActivePosts(data.myActivePosts || []);
        setPendingPosts(data.pendingPosts || []);
        console.log('[TravelScreen] Pending Posts Count:', (data.pendingPosts || []).length);
      } else {
        const errorData = await travelResponse.json();
        console.error('Error fetching travel data:', errorData);
        setError(errorData.message || 'Failed to load travel data');
      }

    } catch (error) {
      setError('Network error. Please check your connection.');
      console.error('Error fetching travel data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Extract district from full address
  const extractDistrict = (address: string | undefined) => {
    if (!address) return '';

    const parts = address.split(',');
    return parts.length > 1 ? parts[0].trim() : address;
  };

  // Navigate to post detail screen
  const navigateToPostDetail = (postId: string) => {
    router.push({
      pathname: '/(drawer)/PostDetailScreen',
      params: {
        postId,
        userLocation: null,
      }
    });
  };

  // Navigate to chat screen
  const navigateToChat = (postId: string, matchedUserId: string) => {
    if (!profile) return;

    router.push({
      pathname: '/(drawer)/ChatScreen',
      params: {
        roomId: postId,
        currentUserId: profile.id,
        recipientId: matchedUserId,
      }
    });
  };

  // Navigate to user profile
  const navigateToUserProfile = (userId: string) => {
    if (!profile) return;

    router.push({
      pathname: '/(drawer)/UserProfileScreen',
      params: { id: userId }
    });
  };

  // Format date for better readability
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if it's today or tomorrow
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    }
  };

  // Filter posts to show only upcoming travels
  const upcomingTravels = matchedPosts.filter(
    (post) => new Date(post.datetimeStart) > new Date()
  );

  // Utility: check if a ride is active
  const isRideActive = (start: string, end: string) => {
    const now = new Date();
    return new Date(start) <= now && now <= new Date(end);
  };



  return (
    <View style={styles(theme).container}>

      <ScrollView
        style={styles(theme).content}
        contentContainerStyle={styles(theme).scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {myActivePosts.length === 0 && matchedPosts.length === 0 && pendingPosts.length === 0 ? (
          <View style={styles(theme).emptyContainer}>
            <View style={styles(theme).emptyIconCircle}>
              <MaterialIcons name="directions-car" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles(theme).emptyTitle}>{t('no_travels_yet')}</Text>
            <Text style={styles(theme).emptySubtitle}>
              {t('travels_placeholder_extended') || t('travels_placeholder')}
            </Text>
            <Button
              title={t('find_ride')}
              onPress={() => router.push('/(drawer)/(tabs)/PassengerScreen')}
              variant="primary"
              style={styles(theme).emptyButton}
            />
          </View>
        ) : (
          <View style={styles(theme).listContainer}>
            {/* Active/My Posts Section */}
            {myActivePosts.length > 0 && (
              <View style={styles(theme).section}>
                <Text style={styles(theme).sectionTitle}>{t('my_shared_rides')}</Text>
                {myActivePosts.map((post) => (
                  <RideHistoryItem
                    key={post.id}
                    id={post.id}
                    date={new Date(post.datetimeStart)}
                    from={extractDistrict(post.sourceAddress)}
                    to={post.destinationFaculty}
                    status={post.status === 'COMPLETED' ? 'completed' : (isRideActive(post.datetimeStart, post.datetimeEnd) ? 'ongoing' : 'upcoming')}
                    driverName={profile?.name || t('you')}
                    onPress={() => (post.status !== 'COMPLETED' && isRideActive(post.datetimeStart, post.datetimeEnd))
                      ? router.push({ pathname: '/(drawer)/LiveTrackingScreen', params: { post: JSON.stringify(post) } })
                      : navigateToPostDetail(post.id)
                    }
                  />
                ))}
              </View>
            )}

            {/* Pending Interests Section */}
            {pendingPosts.length > 0 && (
              <View style={styles(theme).section}>
                <Text style={styles(theme).sectionTitle}>{t('pending_requests') || "Başvurularım (Sürücü Onayı Bekleniyor)"}</Text>
                {pendingPosts.map((post) => (
                  <RideHistoryItem
                    key={post.id}
                    id={post.id}
                    date={new Date(post.datetimeStart)}
                    from={extractDistrict(post.sourceAddress)}
                    to={post.destinationFaculty}
                    status={'pending'}
                    driverName={post.user.name}
                    onPress={() => navigateToPostDetail(post.id)}
                  />
                ))}
              </View>
            )}

            {/* Matched/Joined Travels Section */}
            {matchedPosts.length > 0 && (
              <View style={styles(theme).section}>
                <Text style={styles(theme).sectionTitle}>{t('joined_rides')}</Text>
                {matchedPosts.map((post) => (
                  <RideHistoryItem
                    key={post.id}
                    id={post.id}
                    date={new Date(post.datetimeStart)}
                    from={extractDistrict(post.sourceAddress)}
                    to={post.destinationFaculty}
                    status={post.status === 'COMPLETED' ? 'completed' : (isRideActive(post.datetimeStart, post.datetimeEnd) ? 'ongoing' : 'upcoming')}
                    driverName={post.user.name}
                    onPress={() => (post.status !== 'COMPLETED' && isRideActive(post.datetimeStart, post.datetimeEnd))
                      ? router.push({ pathname: '/(drawer)/LiveTrackingScreen', params: { post: JSON.stringify(post) } })
                      : navigateToPostDetail(post.id)
                    }
                  />
                ))}
              </View>
            )}
          </View>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    ...theme.textStyles.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  retryButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.base,
  },
  retryButtonText: {
    ...theme.textStyles.button,
    color: theme.colors.white,
  },
  listContainer: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['2xl'],
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: (theme.colors as any).primaryTransparent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing['2xl'],
    lineHeight: 22,
  },
  emptyButton: {
    width: '100%',
    borderRadius: theme.borderRadius.full,
  },
}); 