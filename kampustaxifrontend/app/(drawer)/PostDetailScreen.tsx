'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, useColorScheme, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BASE_URL } from '@/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Post from '@/components/Post';
import InterestedUser from '@/components/InterestedUser';
import { lightTheme, darkTheme, ThemeType } from '@/styles/theme';
import MapView, { Polyline, Circle, Marker } from 'react-native-maps';
import { mapStyle } from '@/styles/mapStyle';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { safeParse } from '@/src/utils/serialization';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Modal } from 'react-native';

// Define types for the post and profile data
interface PostData {
  id: string;
  userId: string;
  sourceAddress: string;
  destinationFaculty: string;
  datetimeStart: string;
  datetimeEnd: string;

  route: string;
  user: {
    id: string;
    name: string;
    details?: string;
    avatar?: string;
    stars: number;
    car?: {
      brand: string;
      model: string;
      color: string;
      plateNumber: string;
      year?: number;
    };
  };
  interestedUsers?: Array<{
    id: string;
    locationCoordinates: string;
    user: {
      id: string;
      name: string;
      university: string;
      bio: string;
      stars: number;
    };
  }>;
  matchedUserId?: string;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
}

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

const isValidCoordinate = (coord: any): coord is LocationCoordinates => {
  return (
    coord &&
    typeof coord.latitude === 'number' &&
    typeof coord.longitude === 'number'
  );
};

export default function PostDetailScreen() {
  const { t, i18n } = useTranslation();
  const [post, setPost] = useState<PostData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [avatars, setAvatars] = useState<{ [key: string]: string }>({});
  const [initialRegion, setInitialRegion] = useState<any>(null);
  const [latitudeDelta, setLatitudeDelta] = useState<number>(0);
  const [longitudeDelta, setLongitudeDelta] = useState<number>(0);
  const [isMatching, setIsMatching] = useState(false);
  const [showMatchSuccess, setShowMatchSuccess] = useState(false);

  // Navigation and params
  const router = useRouter();
  const { postId, userLocation: userLocationParam } = useLocalSearchParams<{
    postId: string;
    userLocation: string;
  }>();

  const userLocation = userLocationParam ? safeParse<LocationCoordinates>(userLocationParam) : null;

  // Get color scheme for theming
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  // Process route data when post changes
  useEffect(() => {
    if (post && post.route) {
      try {
        const decodedRoute = safeParse<any[]>(post.route);

        if (Array.isArray(decodedRoute) && decodedRoute.length > 0) {
          const latitudes = decodedRoute.map((point: any) => point.latitude);
          const longitudes = decodedRoute.map((point: any) => point.longitude);

          const minLatitude = Math.min(...latitudes);
          const maxLatitude = Math.max(...latitudes);
          const minLongitude = Math.min(...longitudes);
          const maxLongitude = Math.max(...longitudes);

          const latitudeDelta = maxLatitude - minLatitude + 0.01;
          const longitudeDelta = maxLongitude - minLongitude + 0.01;

          setLatitudeDelta(latitudeDelta);
          setLongitudeDelta(longitudeDelta);

          setInitialRegion({
            latitude: (minLatitude + maxLatitude) / 2,
            longitude: (minLongitude + maxLongitude) / 2,
            latitudeDelta,
            longitudeDelta,
          });
        }
      } catch (error) {
        console.error('Error processing route data:', error);
      }
    }
  }, [post]);

  // Extract district from address for display
  const extractDistrict = (address: string) => {
    if (!address) return '';
    const parts = address.split(',');
    return parts.length > 1 ? parts[1].trim() : address;
  };

  // Fetch post details and user profile
  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/posts/${postId}`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error(t('error_fetch_post'), errorData);
          return;
        }
        const data = await response.json();
        setPost(data);
      } catch (error) {
        console.error(t('error_fetch_post'), error);
      }
    };


    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/api/users/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        } else {
          console.error('Error fetching profile:', await response.json());
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchPostDetails();
    fetchProfile();
  }, [postId]);

  // Fetch avatars for interested users
  useEffect(() => {
    const fetchAvatars = async () => {
      if (post?.interestedUsers?.length) {
        const newAvatars: { [key: string]: string } = {};
        for (const interestedUser of post.interestedUsers) {
          newAvatars[interestedUser.user.id] = await getUserAvatar(interestedUser.user.id);
        }
        setAvatars(newAvatars);
      }
    };

    fetchAvatars();
  }, [post]);

  // Handle user expressing interest in post
  const handleInterested = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/posts/${postId}/interested`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ locationCoordinates: userLocation })
      });

      if (response.ok) {
        console.log('Marked as interested');
        // Refresh post data to reflect the change
        const updatedPostResponse = await fetch(`${BASE_URL}/api/posts/${postId}`);
        if (updatedPostResponse.ok) {
          const updatedPost = await updatedPostResponse.json();
          setPost(updatedPost);
        }
      } else {
        console.error('Error marking as interested:', await response.json());
      }
    } catch (error) {
      console.error('Error marking as interested:', error);
    }
  };

  // Fetch avatar for a user
  const getUserAvatar = async (userId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/profilePhoto/${userId}`);
      if (response.ok) {
        return `${BASE_URL}/api/users/profilePhoto/${userId}`;
      }
    } catch (error) {
      console.error('Error fetching user avatar:', error);
    }
    return 'https://img.icons8.com/ios/50/gender-neutral-user--v1.png';
  };

  const handleMatchUser = async (userId: string) => {
    Alert.alert(
      t('confirm_match'), // "Confirm Match"
      t('match_confirm_message'), // "Are you sure you want to match with this user?"
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('match'), // "Match" (or "Confirm")
          onPress: async () => {
            setIsMatching(true);
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`${BASE_URL}/api/posts/${postId}/match`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ matchedUserId: userId }),
              });

              if (response.ok) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setShowMatchSuccess(true);

                // Refresh post data
                const updatedPostResponse = await fetch(`${BASE_URL}/api/posts/${postId}`);
                if (updatedPostResponse.ok) {
                  const updatedPost = await updatedPostResponse.json();
                  setPost(updatedPost);
                }
              } else {
                const errorText = await response.text();
                Alert.alert(t('error'), t('match_request_failed'));
                console.error('Match failed:', errorText);
              }
            } catch (error) {
              console.error('Match error:', error);
              Alert.alert(t('error'), t('error_unexpected'));
            } finally {
              setIsMatching(false);
            }
          }
        }
      ]
    );
  };

  // Loading state
  if (!post || !profile) {
    return (
      <View style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const isOwner = post.userId === profile.id;
  const postDate = new Date(post.datetimeStart);
  const formattedDate = postDate.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'long', weekday: 'long' });

  // Render components
  const renderMap = () => (
    <View style={styles(theme).mapContainer}>
      <MapView
        style={[styles(theme).map, { backgroundColor: theme.colors.background }]}
        initialRegion={initialRegion}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        customMapStyle={mapStyle}
      >
        <Polyline
          key={0}
          coordinates={safeParse(post.route)}
          strokeWidth={6}
          strokeColor={theme.colors.primary}
          style={{ zIndex: 1 }}
        />
        {isValidCoordinate(userLocation) && (
          <Marker
            coordinate={userLocation}
            title={t('your_location')}
            description={t('this_is_your_location')}
          />
        )}
      </MapView>
    </View>
  );

  const renderInterestedUsersList = () => (
    <View style={styles(theme).sectionContainer}>
      <Text style={styles(theme).sectionTitle}>{t('interested_users')}</Text>
      {post.interestedUsers?.length ? (
        post.interestedUsers.map((interestedUser: any) => (
          <InterestedUser
            key={interestedUser.id}
            postId={post.id}
            userId={interestedUser.user.id}
            userName={interestedUser.user.name}
            route={safeParse(post.route)}
            userLocation={safeParse(interestedUser.locationCoordinates)}
            university={interestedUser.user.university}
            bio={interestedUser.user.bio}
            stars={interestedUser.user.stars}
            matchedUserId={post.matchedUserId}
            onMatchPress={handleMatchUser}
          />
        ))
      ) : (
        <View style={styles(theme).emptyState}>
          <Text style={styles(theme).noInterestedText}>{t('no_interested_users')}</Text>
        </View>
      )}
    </View>
  );

  const renderDriverProfile = () => (
    <View style={styles(theme).sectionContainer}>
      <Text style={styles(theme).sectionTitle}>{t('details.driver')}</Text>
      <View style={styles(theme).driverCard}>
        <Image
          source={{ uri: post.user.avatar || 'https://img.icons8.com/ios/50/gender-neutral-user--v1.png' }}
          style={styles(theme).avatar}
        />
        <View style={styles(theme).driverInfo}>
          <Text style={styles(theme).userName}>{post.user.name}</Text>
          <View style={styles(theme).ratingContainer}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles(theme).ratingText}>{post.user.stars || 5.0}</Text>
          </View>
          {post.user.details && <Text style={styles(theme).userDetails} numberOfLines={2}>{post.user.details}</Text>}
        </View>
      </View>

      {/* Driver Car Information */}
      {post.user.car && (
        <View style={styles(theme).carInfoContainer}>
          <Text style={styles(theme).carInfoTitle}>{t('details.car')}</Text>
          <View style={styles(theme).carDetailsRow}>
            <View style={styles(theme).carBadge}>
              <MaterialIcons name="directions-car" size={20} color={theme.colors.primary} />
              <Text style={styles(theme).carBadgeText}>
                {post.user.car.brand} {post.user.car.model}
              </Text>
            </View>
            <View style={styles(theme).carBadge}>
              <MaterialIcons name="palette" size={20} color={theme.colors.textLight} />
              <Text style={styles(theme).carBadgeText}>{post.user.car.color}</Text>
            </View>
          </View>
          <View style={styles(theme).plateContainer}>
            <Text style={styles(theme).plateText}>{post.user.car.plateNumber}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles(theme).container}>
      <StatusBar barStyle={colorScheme === 'dark' ? "light-content" : "dark-content"} backgroundColor="transparent" />

      <ScrollView contentContainerStyle={styles(theme).scrollContent} showsVerticalScrollIndicator={false}>
        {/* Map Header */}
        {renderMap()}

        {/* Post Details Card */}
        <View style={styles(theme).detailsCard}>
          <View style={styles(theme).routeHeader}>
            <View>
              <Text style={styles(theme).routeLabel}>{t('details.route')}</Text>
              <Text style={styles(theme).routeText}>
                {extractDistrict(post.sourceAddress)} ➔ {post.destinationFaculty}
              </Text>
            </View>
          </View>

          <View style={styles(theme).timeRow}>
            <View style={styles(theme).timeItem}>
              <MaterialIcons name="schedule" size={20} color={theme.colors.primary} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles(theme).timeLabel}>{t('details.departure_time')}</Text>
                <Text style={styles(theme).timeValue}>{new Date(post.datetimeStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>
            <View style={styles(theme).timeItem}>
              <MaterialIcons name="event" size={20} color={theme.colors.primary} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles(theme).timeLabel}>{t('date') || 'Date'}</Text>
                <Text style={styles(theme).timeValue}>{formattedDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main Content */}
        {isOwner ? renderInterestedUsersList() : renderDriverProfile()}

      </ScrollView>

      {/* Floating Header */}
      <View style={styles(theme).backButtonContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={styles(theme).backButtonTouch} // Touch area logic
        >
          <BlurView intensity={30} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles(theme).backButtonBlur}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.textDark} />
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showMatchSuccess}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMatchSuccess(false)}
      >
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).modalContent}>
            <View style={[styles(theme).modalIconContainer, { backgroundColor: theme.colors.success + '20' }]}>
              <MaterialIcons name="check-circle" size={48} color={theme.colors.success} />
            </View>
            <Text style={styles(theme).modalTitle}>{t('match_success')}</Text>
            <TouchableOpacity
              style={[styles(theme).primaryButton, { width: '100%' }]}
              onPress={() => setShowMatchSuccess(false)}
            >
              <Text style={styles(theme).primaryButtonText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Action Bar */}
      {!isOwner && (
        <View style={styles(theme).bottomBar}>
          {!post.matchedUserId ? (
            post.interestedUsers?.some((user: any) => user.user.id === profile.id) ? (
              <View style={[styles(theme).actionButton, { backgroundColor: theme.colors.success }]}>
                <MaterialIcons name="check-circle" size={24} color="white" style={{ marginRight: 8 }} />
                <Text style={styles(theme).actionButtonText}>{t('reservation_request_sent')}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles(theme).actionButton}
                onPress={handleInterested}
                activeOpacity={0.8}
              >
                <Text style={styles(theme).actionButtonText}>{t('send_reservation_request')}</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={[styles(theme).actionButton, { backgroundColor: theme.colors.textLight }]}>
              <Text style={styles(theme).actionButtonText}>{t('post_matched')}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: StatusBar.currentHeight,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  mapContainer: {
    height: 250,
    width: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  backButtonContainer: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
    left: 16,
    zIndex: 10,
    borderRadius: 20,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  backButtonTouch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Fallback / enhancement
  },
  detailsCard: {
    backgroundColor: theme.colors.card,
    margin: 16,
    marginTop: -30,
    borderRadius: 16,
    padding: 20,
    ...theme.shadows.md,
  },
  routeHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border, // Using border color from theme
    paddingBottom: 12,
  },
  routeLabel: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  routeText: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  timeValue: {
    ...theme.textStyles.body,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    marginBottom: 12,
    marginLeft: 4,
  },
  driverCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 16,
    ...theme.shadows.sm,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  driverInfo: {
    flex: 1,
  },
  userName: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: 'bold',
    color: theme.colors.textDark,
  },
  userDetails: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
  },
  carInfoContainer: {
    marginTop: 16,
    backgroundColor: theme.colors.surface, // Using surface for differentiation
    borderRadius: 16,
    padding: 16,
  },
  carInfoTitle: {
    ...theme.textStyles.body,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.colors.textDark,
  },
  carDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  carBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  carBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textDark,
  },
  plateContainer: {
    backgroundColor: theme.colors.textDark,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  plateText: {
    color: theme.colors.background, // Contrast
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    elevation: 20,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...theme.shadows.md,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  noInterestedText: {
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    ...theme.shadows.lg,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    marginBottom: 24,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...theme.textStyles.button,
    color: 'white',
  },
});
