'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  Share,
  Alert,
  useColorScheme
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

// Local imports
import { Review, Post, RideHistoryItem, PriceEstimate } from '@/components';
import { Card, Header, Button, Badge } from '@/components/ui';
import { BASE_URL } from '@/env';
import { lightTheme, darkTheme, ThemeType } from '@/styles/theme';

// Types definition
interface ProfileData {
  id: string;
  name: string;
  surname: string;
  email: string;
  university: string;
  faculty: string;
  gender: string;
  stars: number;
  createdAt: string;
  posts: Post[];
  reviews: Review[];
}

interface Post {
  id: string;
  userId: string;
  sourceAddress: string;
  destinationFaculty: string;
  datetimeStart: string;
  datetimeEnd: string;
  route: string;
}

interface Review {
  id: string;
  userId: string;
  comment: string;
  stars: number;
  name: string;
  surname: string;
}

export default function ProfileScreen() {
  // State
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [visiblePosts, setVisiblePosts] = useState<number>(2);
  const [isPostsLoading, setIsPostsLoading] = useState<boolean>(false);

  // Get the device color scheme
  const colorScheme = useColorScheme();

  // Use the appropriate theme based on color scheme
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;



  const router = useRouter();

  /**
   * Fetch user profile data and profile photo
   */
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        handleAuthError();
        return;
      }

      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 403) {
        handleAuthError();
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setProfile(data);
      } else {
        console.error('Profile fetch error:', data.message);
        Alert.alert('Error', 'Failed to load profile information');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'An error occurred while fetching your profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle authentication errors
   */
  const handleAuthError = async () => {
    await AsyncStorage.removeItem('token');
    router.push('/auth/login');
  };

  /**
   * Handle logout action
   */
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  /**
   * Handle share profile
   */
  const handleShareProfile = () => {
    if (!profile) return;

    const shareOptions = {
      title: 'Share Profile',
      message: `Travel with me, ${profile.name} ${profile.surname}!`,
      url: `${BASE_URL}/profile/${profile.id}`
    };

    Share.share(shareOptions)
      .catch(error => console.error('Error sharing profile:', error));
  };

  /**
   * Navigate to post detail
   */
  const navigateToPostDetail = (postId: string) => {
    router.push({ pathname: '/(drawer)/PostDetailScreen', params: { postId } });
  };

  /**
   * Show more posts
   */
  const handleShowMorePosts = () => {
    setVisiblePosts(prev => prev + 2);
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Error state
  if (!profile) {
    return (
      <View style={styles(theme).errorContainer}>
        <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
        <Text style={styles(theme).errorText}>Error fetching profile information.</Text>
        <TouchableOpacity
          style={styles(theme).retryButton}
          onPress={fetchProfile}
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
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles(theme).header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={theme.colors.textDark}
          />
        </TouchableOpacity>
        <Text style={styles(theme).headerTitle}>Profil</Text>
        <TouchableOpacity
          onPress={() => router.push('/(drawer)/EditProfileScreen')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="edit"
            size={24}
            color={theme.colors.textDark}
          />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <Card style={styles(theme).profileSection}>
        <View style={styles(theme).avatarContainer}>
          <MaterialIcons name="person" size={60} color={theme.colors.textLight} />
        </View>
        <Text style={styles(theme).userName}>
          {profile.name} {profile.surname}
        </Text>

        {/* Stats */}
        <View style={styles(theme).statsContainer}>
          <View style={styles(theme).statItem}>
            <Text style={styles(theme).statValue}>
              {profile.posts.length || 0}
            </Text>
            <Text style={styles(theme).statLabel}>Yolculuklar</Text>
          </View>

          <View style={styles(theme).statDivider} />

          <View style={styles(theme).statItem}>
            <View style={styles(theme).ratingContainer}>
              {Array.from({ length: Math.floor(profile.stars || 0) }).map((_, index) => (
                <MaterialIcons
                  key={`star-${index}`}
                  name="star"
                  size={18}
                  color={theme.colors.primary}
                />
              ))}
              <Text style={styles(theme).statValue}>
                {profile.stars || 0}
              </Text>
            </View>
            <Text style={styles(theme).statLabel}>Değerlendirme</Text>
          </View>

          <View style={styles(theme).statDivider} />

          <View style={styles(theme).statItem}>
            <Text style={styles(theme).statValue}>
              {Math.floor((new Date().getTime() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
            </Text>
            <Text style={styles(theme).statLabel}>Gün</Text>
          </View>
        </View>
      </Card>

      {/* Account Information */}
      <Text style={styles(theme).sectionTitle}>Hesap Bilgileri</Text>

      <TouchableOpacity
        style={styles(theme).menuItem}
        onPress={() => router.push('/(drawer)/EditProfileScreen')}
        activeOpacity={0.7}
      >
        <View style={styles(theme).menuIconContainer}>
          <MaterialIcons
            name="person"
            size={24}
            color={theme.colors.secondary}
          />
        </View>
        <View style={styles(theme).menuTextContainer}>
          <Text style={styles(theme).menuItemTitle}>Email</Text>
          <Text style={styles(theme).menuItemSubtitle}>{profile.email}</Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={theme.colors.secondary}
        />
      </TouchableOpacity>

      <View style={styles(theme).menuItem}>
        <View style={styles(theme).menuIconContainer}>
          <MaterialIcons
            name="school"
            size={24}
            color={theme.colors.secondary}
          />
        </View>
        <View style={styles(theme).menuTextContainer}>
          <Text style={styles(theme).menuItemTitle}>University</Text>
          <Text style={styles(theme).menuItemSubtitle}>{profile.university}</Text>
        </View>
      </View>

      <View style={styles(theme).menuItem}>
        <View style={styles(theme).menuIconContainer}>
          <MaterialIcons
            name="business"
            size={24}
            color={theme.colors.secondary}
          />
        </View>
        <View style={styles(theme).menuTextContainer}>
          <Text style={styles(theme).menuItemTitle}>Faculty</Text>
          <Text style={styles(theme).menuItemSubtitle}>{profile.faculty}</Text>
        </View>
      </View>

      <View style={styles(theme).menuItem}>
        <View style={styles(theme).menuIconContainer}>
          <MaterialIcons
            name="gesture"
            size={24}
            color={theme.colors.secondary}
          />
        </View>
        <View style={styles(theme).menuTextContainer}>
          <Text style={styles(theme).menuItemTitle}>Gender</Text>
          <Text style={styles(theme).menuItemSubtitle}>{profile.gender}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles(theme).menuItem}
        onPress={handleShareProfile}
        activeOpacity={0.7}
      >
        <View style={styles(theme).menuIconContainer}>
          <MaterialIcons
            name="link"
            size={24}
            color={theme.colors.secondary}
          />
        </View>
        <View style={styles(theme).menuTextContainer}>
          <Text style={styles(theme).menuItemTitle}>Share Profile</Text>
        </View>
        <MaterialIcons
          name="share"
          size={24}
          color={theme.colors.secondary}
        />
      </TouchableOpacity>

      {/* Reviews Section */}
      <View style={styles(theme).section}>
        <Text style={styles(theme).sectionTitle}>Değerlendirme</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles(theme).reviewsContainer}
        >
          {profile.reviews && profile.reviews.length > 0 ? (
            profile.reviews.map((review) => (
              <Review
                key={review.id}
                comment={review.comment}
                star={review.stars}
                name={review.name}
                surname={review.surname}
                userId={review.userId}
              />
            ))
          ) : (
            <View style={styles(theme).emptyStateContainer}>
              <MaterialIcons
                name="rate-review"
                size={48}
                color={theme.colors.textLight}
              />
              <Text style={styles(theme).emptyStateText}>
                Henüz değerlendirme yapılmadı.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Shared Trips Section */}
      <View style={styles(theme).section}>
        <Text style={styles(theme).sectionTitle}>Paylaşılan Yolculuklar</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles(theme).postsContainer}
        >
          {profile.posts && profile.posts.length > 0 ? (
            <>
              {profile.posts.slice(0, visiblePosts).map((post) => (
                <View key={post.id} style={styles(theme).postWrapper}>
                  <RideHistoryItem
                    id={post.id}
                    date={new Date(post.datetimeStart)}
                    from={post.sourceAddress}
                    to={post.destinationFaculty}
                    status="completed"
                    driverName={`${profile.name} ${profile.surname}`}
                    onPress={() => navigateToPostDetail(post.id)}
                  />
                </View>
              ))}

              {profile.posts.length > visiblePosts && (
                <TouchableOpacity
                  style={styles(theme).showMoreButton}
                  onPress={handleShowMorePosts}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="refresh"
                    size={24}
                    color={theme.colors.white}
                  />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles(theme).emptyStateContainer}>
              <MaterialIcons
                name="directions-car"
                size={48}
                color={theme.colors.textLight}
              />
              <Text style={styles(theme).emptyStateText}>
                No trips shared yet.
              </Text>
            </View>
          )}

          {isPostsLoading && (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              style={styles(theme).loadingIndicator}
            />
          )}
        </ScrollView>
      </View>

      {/* Shortcuts Section */}
      <Text style={styles(theme).sectionTitle}>Kısayollar</Text>

      <TouchableOpacity style={styles(theme).menuItem} activeOpacity={0.7}>
        <View style={styles(theme).menuIconContainer}>
          <MaterialIcons
            name="home"
            size={24}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles(theme).menuTextContainer}>
          <Text style={styles(theme).menuItemTitle}>Evimi Seç</Text>
        </View>
        <MaterialIcons
          name="add"
          size={24}
          color={theme.colors.textLight}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles(theme).menuItem} activeOpacity={0.7}>
        <View style={styles(theme).menuIconContainer}>
          <MaterialIcons
            name="work"
            size={24}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles(theme).menuTextContainer}>
          <Text style={styles(theme).menuItemTitle}>İş Yerini Seç</Text>
        </View>
        <MaterialIcons
          name="add"
          size={24}
          color={theme.colors.textLight}
        />
      </TouchableOpacity>

      {/* Join Date */}
      <View style={styles(theme).joinedContainer}>
        <Text style={styles(theme).joinedText}>
          Joined {new Date(profile.createdAt).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles(theme).logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name="logout"
          size={20}
          color={theme.colors.error}
          style={styles(theme).logoutIcon}
        />
        <Text style={styles(theme).logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/**
 * Component styles using dynamic theme system
 * Convert to a function that accepts the current theme
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
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  retryButtonText: {
    ...theme.textStyles.button,
    color: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing['3xl'],
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    ...theme.shadows.base,
    marginBottom: theme.spacing.md,
  },
  avatarContainer: {
    backgroundColor: '#f1f1f1',
    borderRadius: 40,
    padding: 10,
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: theme.colors.primary,

  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: '#f1f1f1',
  },
  userName: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '85%',
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
  },
  statLabel: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: theme.colors.border,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    marginRight: theme.spacing.md,
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuItemTitle: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  menuItemSubtitle: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
  },
  section: {
    marginVertical: theme.spacing.md,
    borderTopWidth: 4,
    borderTopColor: theme.colors.background,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.background,
    paddingBottom: theme.spacing.lg,
  },
  reviewsContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  postsContainer: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postWrapper: {
    width: 280,
    marginRight: theme.spacing.md,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
    height: 200,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    marginLeft: theme.spacing.lg,
  },
  emptyStateText: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
  },
  showMoreButton: {
    flexDirection: 'row',
    width: 40,
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.md,
    ...theme.shadows.base,
  },
  showMoreText: {
    ...theme.textStyles.button,
    color: theme.colors.white,
    marginLeft: theme.spacing.xs,
  },
  loadingIndicator: {
    marginLeft: theme.spacing.md,
  },
  joinedContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    marginTop: theme.spacing.lg,
  },
  joinedText: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
  },
  logoutButton: {
    flexDirection: 'row',
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  logoutIcon: {
    marginRight: theme.spacing.xs,
  },
  logoutButtonText: {
    ...theme.textStyles.button,
    color: theme.colors.error,
  },
}); 