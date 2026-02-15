'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BASE_URL } from '@/env';
import Review from '@/components/Review';
import Post from '@/components/Post';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Types... (keeping same interfaces)
interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface UserProfile {
  id: string;
  name: string;
  surname?: string;
  email: string;
  university?: string;
  bio?: string;
  gender?: string;
  birthDate?: string;
  createdAt: string;
  stars: number;
  posts: PostData[];
  car?: {
    brand: string;
    model: string;
    color: string;
    plateNumber: string;
    year?: number;
  };
}

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
    stars: number;
  };
}

interface ReviewData {
  id: string;
  userId: string;
  comment: string;
  star: number;
  user: {
    id: string;
    name: string;
    surname?: string;
  };
}

export default function UserProfileScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string>('https://img.icons8.com/ios/50/gender-neutral-user--v1.png');
  const [reviews, setReviews] = useState<ReviewData[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${BASE_URL}/api/users/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          fetchProfilePhoto(data.id);
          fetchReviews(data.id);
        } else {
          setError(t('error_load_profile'));
        }
      } catch (err) {
        setError(t('error_unexpected'));
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  const fetchProfilePhoto = async (userId: string) => {
    const photoUrl = `${BASE_URL}/api/users/profilePhoto/${userId}`;
    setProfilePhoto(photoUrl);
  };

  const fetchReviews = async (userId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/review/${userId}`);
      if (response.ok) {
        setReviews(await response.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const extractDistrict = (address: string) => address?.split(',')[0]?.trim() || '';
  const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleDateString() : '';

  if (loading) {
    return (
      <View style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles(theme).errorContainer}>
        <MaterialIcons name="error-outline" size={60} color={theme.colors.error} />
        <Text style={styles(theme).errorText}>{error || t('error_profile_not_found')}</Text>
        <TouchableOpacity style={styles(theme).retryButton} onPress={() => router.back()}>
          <Text style={styles(theme).retryButtonText}>{t('go_back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles(theme).scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header / Profile Card */}
        <View style={styles(theme).profileHeader}>
          <TouchableOpacity style={styles(theme).backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.textDark} />
          </TouchableOpacity>

          <View style={styles(theme).avatarContainer}>
            <Image source={{ uri: profilePhoto }} style={styles(theme).avatar} />
            <View style={styles(theme).onlineBadge} />
          </View>

          <Text style={styles(theme).name}>{profile.name} {profile.surname}</Text>

          <View style={styles(theme).badgeRow}>
            {profile.university && (
              <View style={styles(theme).verificationBadge}>
                <MaterialIcons name="verified" size={16} color={theme.colors.info} />
                <Text style={styles(theme).verificationText}>{t('student')}</Text>
              </View>
            )}
            <View style={styles(theme).ratingBadge}>
              <MaterialIcons name="star" size={16} color={theme.colors.warning} />
              <Text style={styles(theme).ratingText}>{profile.stars.toFixed(1)}</Text>
            </View>
          </View>

          {profile.bio && <Text style={styles(theme).bio}>{profile.bio}</Text>}
        </View>

        {/* Info Grid */}
        <View style={styles(theme).gridContainer}>
          <View style={styles(theme).gridItem}>
            <Text style={styles(theme).gridLabel}>{t('university')}</Text>
            <Text style={styles(theme).gridValue} numberOfLines={1}>{profile.university || t('not_specified')}</Text>
          </View>
          <View style={styles(theme).gridItem}>
            <Text style={styles(theme).gridLabel}>{t('joined_at')}</Text>
            <Text style={styles(theme).gridValue}>{formatDate(profile.createdAt)}</Text>
          </View>
        </View>

        {/* Car Info */}
        {profile.car && (
          <View style={styles(theme).sectionCard}>
            <Text style={styles(theme).sectionTitle}>{t('car_info')}</Text>
            <View style={styles(theme).carRow}>
              <View style={styles(theme).carIconBox}>
                <MaterialIcons name="directions-car" size={24} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles(theme).carModel}>{profile.car.brand} {profile.car.model}</Text>
                <Text style={styles(theme).carPlate}>{profile.car.plateNumber} • {profile.car.color}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Reviews */}
        <View style={styles(theme).sectionContainer}>
          <View style={styles(theme).sectionHeader}>
            <Text style={styles(theme).sectionTitle}>{t('reviews')} ({reviews.length})</Text>
            {reviews.length > 0 && (
              <TouchableOpacity>
                <Text style={styles(theme).seeAllText}>{t('all')}</Text>
              </TouchableOpacity>
            )}
          </View>
          {reviews.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
              {reviews.map((review, index) => (
                <View key={index} style={{ width: 280, marginRight: 12 }}>
                  <Review
                    userId={review.userId}
                    name={review.user.name}
                    surname={review.user.surname || ''}
                    comment={review.comment}
                    star={review.star}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles(theme).emptyText}>{t('no_reviews')}</Text>
          )}
        </View>

        {/* Posts */}
        <View style={styles(theme).sectionContainer}>
          <Text style={styles(theme).sectionTitle}>{t('recent_trips')}</Text>
          {profile.posts.length > 0 ? (
            profile.posts.map((post, idx) => (
              <Post
                key={idx}
                id={post.id}
                userId={post.userId}
                from={extractDistrict(post.sourceAddress)}
                to={post.destinationFaculty}
                userName={profile.name}
                date={formatDate(post.datetimeStart)}
                startTime={new Date(post.datetimeStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                endTime={new Date(post.datetimeEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                route={post.route}
                userLocation={null}
                stars={profile.stars}
                onPress={() => router.push({ pathname: '/(drawer)/PostDetailScreen', params: { postId: post.id } })}
              />
            ))
          ) : (
            <Text style={styles(theme).emptyText}>{t('no_trips_yet')}</Text>
          )}
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
  scrollContent: {
    paddingBottom: theme.spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    ...theme.textStyles.body,
    color: theme.colors.error,
    marginVertical: theme.spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  retryButtonText: {
    ...theme.textStyles.button,
    color: 'white',
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing.xl,
    borderBottomLeftRadius: theme.borderRadius['2xl'],
    borderBottomRightRadius: theme.borderRadius['2xl'],
    ...theme.shadows.md,
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing['4xl'], // Safe area
    left: theme.spacing.lg,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  name: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  bio: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textLight,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.info + '20', // Transparent info
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verificationText: {
    ...theme.textStyles.caption,
    color: theme.colors.info,
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    ...theme.textStyles.caption,
    color: theme.colors.warning,
    fontWeight: '700',
  },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  gridItem: {
    flex: 1,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  gridLabel: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  gridValue: {
    ...theme.textStyles.body,
    fontWeight: '600',
    color: theme.colors.textDark,
  },

  // Section
  sectionContainer: {
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.sm,
  },
  seeAllText: {
    ...theme.textStyles.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },

  // Car
  sectionCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  carRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryTransparent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  carModel: {
    ...theme.textStyles.body,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  carPlate: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
  },
});