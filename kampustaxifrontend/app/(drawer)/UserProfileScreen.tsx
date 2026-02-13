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
  useColorScheme
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BASE_URL } from '@/env';
import Review from '@/components/Review';
import Post from '@/components/Post';
import { lightTheme, darkTheme, ThemeType } from '@/styles/theme';
import { MaterialIcons } from '@expo/vector-icons';

// Define interface for location coordinates
interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

// Define interface for user profile data
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

// Define interface for post data
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

// Define interface for review data
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
  // State variables
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string>('https://img.icons8.com/ios/50/gender-neutral-user--v1.png');
  const [reviews, setReviews] = useState<ReviewData[]>([]);

  // Navigation and params
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Get color scheme for theming
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${BASE_URL}/api/users/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          fetchProfilePhoto(data.id);
          fetchReviews(data.id);
        } else {
          const errorData = await response.json();
          console.error('Profile fetch error:', errorData);
          setError('Failed to load user profile. Please try again later.');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('An unexpected error occurred. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  // Fetch user profile photo
  const fetchProfilePhoto = async (userId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/profilePhoto/${userId}`);
      if (response.ok) {
        setProfilePhoto(`${BASE_URL}/api/users/profilePhoto/${userId}`);
      } else {
        console.error('Error fetching profile photo');
        setProfilePhoto('https://img.icons8.com/ios/50/gender-neutral-user--v1.png');
      }
    } catch (error) {
      console.error('Error fetching profile photo:', error);
      setProfilePhoto('https://img.icons8.com/ios/50/gender-neutral-user--v1.png');
    }
  };

  // Fetch user reviews
  const fetchReviews = async (userId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/review/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      } else {
        console.error('Error fetching reviews:', await response.json());
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // Extract district from address for display
  const extractDistrict = (address: string) => {
    if (!address) return '';
    const parts = address.split(',');
    return parts[0].trim();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  // Render the user's basic information
  const renderProfileHeader = () => (
    <View style={styles(theme).profileHeader}>
      <TouchableOpacity
        style={styles(theme).backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
      </TouchableOpacity>

      <Text style={styles(theme).headerTitle}>Kullanıcı Profili</Text>

      <View style={styles(theme).profileInfo}>
        <Image source={{ uri: profilePhoto }} style={styles(theme).avatar} />
        <View style={styles(theme).nameContainer}>
          <Text style={styles(theme).name}>
            {profile?.name} {profile?.surname}
          </Text>
          {profile?.university && (
            <Text style={styles(theme).university}>{profile.university} Üniversitesi</Text>
          )}
          {profile?.bio && (
            <Text style={styles(theme).bio}>{profile.bio}</Text>
          )}
          <View style={styles(theme).stars}>
            <Text style={styles(theme).starsText}>
              {Array.from({ length: profile?.stars || 0 }).map((_, index) => (
                <MaterialIcons key={index} name="star" size={20} color={theme.colors.secondary} />
              ))}
              ({reviews.length} değerlendirme)
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Render the user's detailed information
  const renderUserDetails = () => (
    <View style={styles(theme).detailsCard}>
      <Text style={styles(theme).sectionTitle}>Kullanıcı Bilgileri</Text>

      <View style={styles(theme).detailRow}>
        <MaterialIcons name="email" size={20} color={theme.colors.secondary} />
        <Text style={styles(theme).detailText}>
          <Text style={styles(theme).detailLabel}>Email: </Text>
          {profile?.email}
        </Text>
      </View>

      {profile?.gender && (
        <View style={styles(theme).detailRow}>
          <MaterialIcons name="person" size={20} color={theme.colors.secondary} />
          <Text style={styles(theme).detailText}>
            <Text style={styles(theme).detailLabel}>Cinsiyet: </Text>
            {profile.gender}
          </Text>
        </View>
      )}

      {profile?.birthDate && (
        <View style={styles(theme).detailRow}>
          <MaterialIcons name="cake" size={20} color={theme.colors.secondary} />
          <Text style={styles(theme).detailText}>
            <Text style={styles(theme).detailLabel}>Doğum Tarihi: </Text>
            {formatDate(profile.birthDate)}
          </Text>
        </View>
      )}

      {profile?.createdAt && (
        <View style={styles(theme).detailRow}>
          <MaterialIcons name="date-range" size={20} color={theme.colors.secondary} />
          <Text style={styles(theme).detailText}>
            <Text style={styles(theme).detailLabel}>Katılma Tarihi: </Text>
            {formatDate(profile.createdAt)}
          </Text>
        </View>
      )}

      {/* Car Information */}
      {profile?.car && (
        <View style={styles(theme).carInfoContainer}>
          <Text style={styles(theme).carInfoTitle}>Araç Bilgileri</Text>

          <View style={styles(theme).carDetailsRow}>
            <View style={styles(theme).carDetailItem}>
              <MaterialIcons name="directions-car" size={20} color={theme.colors.primary} />
              <Text style={styles(theme).carDetailText}>
                {profile.car.brand} {profile.car.model} {profile.car.year || ''}
              </Text>
            </View>

            <View style={styles(theme).carDetailItem}>
              <MaterialIcons name="palette" size={20} color={theme.colors.textLight} />
              <Text style={styles(theme).carDetailText}>
                {profile.car.color}
              </Text>
            </View>
          </View>

          <View style={styles(theme).carPlateContainer}>
            <MaterialIcons name="credit-card" size={20} color={theme.colors.textLight} />
            <Text style={styles(theme).carPlateText}>
              {profile.car.plateNumber}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // Render the user's reviews
  const renderReviews = () => (
    <View style={styles(theme).sectionContainer}>
      <Text style={styles(theme).sectionTitle}>Değerlendirmeler</Text>
      <View style={styles(theme).reviewsContainer}>
        {reviews.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles(theme).reviewsScrollContent}
          >
            {reviews.map((review, index) => (
              <Review
                key={index}
                userId={review.userId}
                name={review.user.name}
                surname={review.user.surname || ''}
                comment={review.comment}
                star={review.star}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles(theme).emptyStateContainer}>
            <MaterialIcons name="star-border" size={40} color={theme.colors.textLight} />
            <Text style={styles(theme).emptyStateText}>Bu kullanıcının henüz değerlendirmesi yok</Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render the user's posts
  const renderPosts = () => (
    <View style={styles(theme).sectionContainer}>
      <Text style={styles(theme).sectionTitle}>Seyahatler</Text>
      {profile?.posts && profile.posts.length > 0 ? (
        profile.posts.map((post, index) => (
          <Post
            key={index}
            id={post.id}
            userId={post.userId}
            from={extractDistrict(post.sourceAddress)}
            to={post.destinationFaculty}
            userName={profile.name}
            date={formatDate(post.datetimeStart)}
            startTime={new Date(post.datetimeStart).toLocaleTimeString()}
            endTime={new Date(post.datetimeEnd).toLocaleTimeString()}

            route={post.route}
            userLocation={null}
            onPress={() => {
              router.push({
                pathname: '/(drawer)/PostDetailScreen',
                params: {
                  postId: post.id,
                  userLocation: null
                }
              });
            }}
            stars={profile.stars}
          />
        ))
      ) : (
        <View style={styles(theme).emptyStateContainer}>
          <MaterialIcons name="directions-car" size={40} color={theme.colors.textLight} />
          <Text style={styles(theme).emptyStateText}>Bu kullanıcının henüz seyahati yok</Text>
        </View>
      )}
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <View style={styles(theme).errorContainer}>
        <MaterialIcons name="error-outline" size={60} color={theme.colors.error} />
        <Text style={styles(theme).errorText}>{error || 'Profile information not available'}</Text>
        <TouchableOpacity
          style={styles(theme).retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles(theme).retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={colorScheme === 'dark' ? "light-content" : "dark-content"} />
      <ScrollView
        style={styles(theme).container}
        contentContainerStyle={styles(theme).contentContainer}
      >
        {renderProfileHeader()}
        {renderUserDetails()}
        {renderReviews()}
        {renderPosts()}
      </ScrollView>
    </>
  );
}

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl,
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
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  errorText: {
    ...theme.textStyles.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    ...theme.textStyles.button,
    color: theme.colors.white,
  },
  profileHeader: {
    backgroundColor: theme.colors.card,
    paddingTop: (StatusBar.currentHeight || 0) + theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
    ...theme.shadows.base,
  },
  backButton: {
    position: 'absolute',
    top: (StatusBar.currentHeight || 0) + theme.spacing.md,
    left: theme.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  headerTitle: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
  },
  nameContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  name: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
  },
  university: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  bio: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  stars: {
    marginTop: theme.spacing['sm'],
  },
  starsText: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  detailsCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.base,
  },
  sectionContainer: {
    margin: theme.spacing.md,
    marginTop: 0,
  },
  sectionTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailText: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
    marginLeft: theme.spacing.sm,
  },
  detailLabel: {
    fontWeight: '500',
  },
  reviewsContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    ...theme.shadows.base,
  },
  reviewsScrollContent: {
    paddingVertical: theme.spacing.xs,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyStateText: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  carInfoContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  carInfoTitle: {
    ...theme.textStyles.header3,
    fontSize: 16,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.sm,
  },
  carDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  carDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carDetailText: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
    marginLeft: theme.spacing.xs,
  },
  carPlateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  carPlateText: {
    ...theme.textStyles.body,
    fontWeight: 'bold',
    color: theme.colors.textDark,
    marginLeft: theme.spacing.xs,
  },
}); 