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
  };
  sourceAddress: string;
  destinationFaculty: string;
  datetimeStart: string;
  datetimeEnd: string;

  route: string;
  matchedUserId: string;
  matchedUser?: {
    id: string;
    name: string;
    stars: number;
    avatar?: string;
  };
}

export default function TravelsScreen() {
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matchedPosts, setMatchedPosts] = useState<PostData[]>([]);
  const [myActivePosts, setMyActivePosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);


  // Theme
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  // Navigation
  const router = useRouter();

  // Fetch profile and matched posts
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      const response = await fetch(`${BASE_URL}/api/users/travel-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.status === 403) {
        await AsyncStorage.removeItem('token');
        router.push('/auth/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setMatchedPosts(data.matchedPosts || []);
        setMyActivePosts(data.myActivePosts || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load travel data');
        console.error('Error fetching travel data:', errorData);
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



  // Loading state
  if (isLoading) {
    return (
      <View style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles(theme).errorContainer}>
        <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
        <Text style={styles(theme).errorText}>{error}</Text>
        <TouchableOpacity
          style={styles(theme).retryButton}
          onPress={fetchData}
          activeOpacity={0.7}
        >
          <Text style={styles(theme).retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles(theme).container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View style={styles(theme).header}>
        <Text style={styles(theme).headerText}>Seyahatlarim</Text>
      </View>

      {myActivePosts.length === 0 && matchedPosts.length === 0 ? (
        <View style={styles(theme).emptyContainer}>
          <MaterialIcons name="directions-car" size={64} color={theme.colors.textLight} />
          <Text style={styles(theme).emptyText}>
            Henüz bir seyahatiniz yok.
          </Text>
        </View>
      ) : (
        <>
          {myActivePosts.map((post) => {
            const isDriver = profile && post.userId === profile.id;
            const hasMatchedUser = !!post.matchedUser;
            return (
              <View key={post.id} style={styles(theme).postContainer}>
                <TouchableOpacity
                  style={styles(theme).postCard}
                  onPress={() => isRideActive(post.datetimeStart, post.datetimeEnd) ? router.push({ pathname: '/(drawer)/LiveTrackingScreen', params: { post: JSON.stringify(post) } }) : navigateToPostDetail(post.id)}
                  activeOpacity={0.7}
                >
                  {/* Trip details */}
                  <View style={styles(theme).tripHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {isRideActive(post.datetimeStart, post.datetimeEnd) && (
                        <View style={styles(theme).activeDotContainer}>
                          <View style={styles(theme).activeDot} />
                        </View>
                      )}
                      <View style={styles(theme).tripInfo}>
                        <Text style={styles(theme).tripDate}>
                          {formatDate(post.datetimeStart)}
                        </Text>
                        <Text style={styles(theme).tripTime}>
                          {new Date(post.datetimeStart).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>

                  </View>

                  {/* Route information */}
                  <View style={styles(theme).routeContainer}>
                    <View style={styles(theme).locationDots}>
                      <View style={styles(theme).startDot} />
                      <View style={styles(theme).routeLine} />
                      <View style={styles(theme).endDot} />
                    </View>
                    <View style={styles(theme).locationInfo}>
                      <Text style={styles(theme).locationText}>
                        {extractDistrict(post.sourceAddress)}
                      </Text>
                      <Text style={styles(theme).locationText}>
                        {post.destinationFaculty}
                      </Text>
                    </View>
                  </View>

                  {/* Travel companion info */}
                  {post.matchedUser && (
                    <View style={styles(theme).companionContainer}>
                      <Text style={styles(theme).travelingWithLabel}>
                        Seyahat arkadasiniz:
                      </Text>
                      <TouchableOpacity
                        style={styles(theme).companionInfo}
                        onPress={() => navigateToUserProfile(post.matchedUserId)}
                        activeOpacity={0.6}
                      >
                        <View style={styles(theme).avatarContainer}>
                          {post.matchedUser.id ? (
                            <View style={styles(theme).avatarContainer}>
                              <MaterialIcons name="person" size={24} color={'#ccc'} />
                            </View>
                          ) : (
                            <View style={styles(theme).defaultAvatar}>
                              <Text style={styles(theme).avatarText}>
                                {post.matchedUser.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles(theme).companionDetails}>
                          <Text style={styles(theme).companionName}>
                            {post.matchedUser.name}
                          </Text>
                          <View style={styles(theme).starsContainer}>
                            <FontAwesome name="star" size={12} color={theme.colors.warning} />
                            <Text style={styles(theme).starsText}>
                              {post.matchedUser.stars.toFixed(1)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles(theme).viewProfileContainer}>
                          <Text style={styles(theme).viewProfileText}>Profili Gör</Text>
                          <MaterialIcons name="chevron-right" size={16} color={theme.colors.primary} />
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Chat button */}
                <TouchableOpacity
                  style={styles(theme).chatButton}
                  onPress={() => navigateToChat(post.id, post.matchedUserId)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="chat" size={18} color={theme.colors.white} />
                  <Text style={styles(theme).chatButtonText}>
                    {(post.matchedUser && post.matchedUser.id != profile?.id) ? post.matchedUser.name : (post.matchedUser && post.matchedUser.id == profile?.id) ? post.user.name : 'Seyahat Arkadaşiniz'} ile sohbet et
                  </Text>
                </TouchableOpacity>


              </View>
            );
          })}
          {matchedPosts.map((post) => {
            const isPassenger = profile && post.matchedUserId === profile.id;
            return (
              <View key={post.id} style={styles(theme).postContainer}>
                <TouchableOpacity
                  style={styles(theme).postCard}
                  onPress={() => navigateToPostDetail(post.id)}
                  activeOpacity={0.7}
                >
                  {/* Trip details */}
                  <View style={styles(theme).tripHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {isRideActive(post.datetimeStart, post.datetimeEnd) && (
                        <View style={styles(theme).activeDotContainer}>
                          <View style={styles(theme).activeDot} />
                        </View>
                      )}
                      <View style={styles(theme).tripInfo}>
                        <Text style={styles(theme).tripDate}>
                          {formatDate(post.datetimeStart)}
                        </Text>
                        <Text style={styles(theme).tripTime}>
                          {new Date(post.datetimeStart).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>

                  </View>

                  {/* Route information */}
                  <View style={styles(theme).routeContainer}>
                    <View style={styles(theme).locationDots}>
                      <View style={styles(theme).startDot} />
                      <View style={styles(theme).routeLine} />
                      <View style={styles(theme).endDot} />
                    </View>
                    <View style={styles(theme).locationInfo}>
                      <Text style={styles(theme).locationText}>
                        {extractDistrict(post.sourceAddress)}
                      </Text>
                      <Text style={styles(theme).locationText}>
                        {post.destinationFaculty}
                      </Text>
                    </View>
                  </View>

                  {/* Travel companion info */}
                  {post.matchedUser && (
                    <View style={styles(theme).companionContainer}>
                      <Text style={styles(theme).travelingWithLabel}>
                        Seyahat arkadasiniz:
                      </Text>
                      <TouchableOpacity
                        style={styles(theme).companionInfo}
                        onPress={() => navigateToUserProfile(post.matchedUserId)}
                        activeOpacity={0.6}
                      >
                        <View style={styles(theme).avatarContainer}>
                          {post.matchedUser.id ? (
                            <View style={styles(theme).avatarContainer}>
                              <MaterialIcons name="person" size={24} color={'#ccc'} />
                            </View>
                          ) : (
                            <View style={styles(theme).defaultAvatar}>
                              <Text style={styles(theme).avatarText}>
                                {post.matchedUser.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles(theme).companionDetails}>
                          <Text style={styles(theme).companionName}>
                            {post.matchedUser.name}
                          </Text>
                          <View style={styles(theme).starsContainer}>
                            <FontAwesome name="star" size={12} color={theme.colors.warning} />
                            <Text style={styles(theme).starsText}>
                              {post.matchedUser.stars.toFixed(1)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles(theme).viewProfileContainer}>
                          <Text style={styles(theme).viewProfileText}>Profili Gör</Text>
                          <MaterialIcons name="chevron-right" size={16} color={theme.colors.primary} />
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>


              </View>
            );
          })}
        </>
      )}

    </ScrollView>
  );
}

/**
 * Component styles using dynamic theme system
 */
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
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.base,
  },
  retryButtonText: {
    ...theme.textStyles.button,
    color: theme.colors.white,
  },
  header: {
    paddingTop: theme.spacing['3xl'],
    paddingBottom: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  headerText: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  emptyText: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  postContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  postCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tripInfo: {
    flexDirection: 'column',
  },
  tripDate: {
    ...theme.textStyles.header3,
    color: theme.colors.primary,
  },
  tripTime: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
  },
  priceTag: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  priceText: {
    ...theme.textStyles.header3,
    color: theme.colors.success,
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  locationDots: {
    width: 20,
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  startDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: theme.colors.divider,
    marginVertical: 4,
  },
  endDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.secondary,
  },
  locationInfo: {
    flex: 1,
    justifyContent: 'space-between',
    height: 60,
  },
  locationText: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  companionContainer: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: theme.spacing.md,
  },
  travelingWithLabel: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  companionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    backgroundColor: '#f1f1f1',
    borderRadius: 80,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    padding: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...theme.textStyles.header3,
    color: theme.colors.primary,
  },
  companionDetails: {
    flex: 1,
  },
  companionName: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsText: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.xs,
  },
  chatButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    ...theme.shadows.sm,
  },
  chatButtonText: {
    ...theme.textStyles.button,
    color: theme.colors.white,
    marginLeft: theme.spacing.xs,
  },
  viewProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  viewProfileText: {
    ...theme.textStyles.caption,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  activeDotContainer: {
    marginRight: 8,
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'limegreen',
    opacity: 0.7,
    // Blinking animation will be added inline
  },
}); 