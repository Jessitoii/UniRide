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
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Review, Post, RideHistoryItem } from '@/components';
import { Card } from '@/components/ui';
import { BASE_URL } from '@/env';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [visiblePosts, setVisiblePosts] = useState<number>(2);
  const [isPostsLoading, setIsPostsLoading] = useState<boolean>(false);
  const [profilePhoto, setProfilePhoto] = useState<string>('');

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
        if (data.id) {
          setProfilePhoto(`${BASE_URL}/api/users/profilePhoto/${data.id}`);
        }
      } else {
        Alert.alert(t('error'), t('error_load_profile_info'));
      }
    } catch (error) {
      Alert.alert(t('error'), t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = async () => {
    await AsyncStorage.removeItem('token');
    router.push('/auth/login');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert(t('error'), t('error_logout'));
    }
  };

  const handleShareProfile = () => {
    if (!profile) return;
    Share.share({
      title: 'KampüsRoute Profili',
      message: `${profile.name} ${profile.surname} ile KampüsRoute'ta yolculuk yap!`,
      url: `${BASE_URL}/profile/${profile.id}` // Hypothetical deep link
    });
  };

  const navigateToPostDetail = (postId: string) => {
    router.push({ pathname: '/(drawer)/PostDetailScreen', params: { postId } });
  };

  if (loading) {
    return (
      <View style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles(theme).errorContainer}>
        <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
        <Text style={styles(theme).errorText}>{t('error_profile_info')}</Text>
        <TouchableOpacity
          style={styles(theme).retryButton}
          onPress={fetchProfile}
          activeOpacity={0.7}
        >
          <Text style={styles(theme).retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles(theme).scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles(theme).header}>
          <View style={styles(theme).headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles(theme).iconButton}>
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.textDark} />
            </TouchableOpacity>
            <Text style={styles(theme).headerTitle}>{t('my_profile')}</Text>
            <TouchableOpacity onPress={() => router.push('/(drawer)/EditProfileScreen')} style={styles(theme).iconButton}>
              <MaterialIcons name="edit" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles(theme).profileCard}>
            <View style={styles(theme).avatarContainer}>
              <Image
                source={{ uri: profilePhoto || 'https://via.placeholder.com/150' }}
                style={styles(theme).avatar}
              />
            </View>
            <Text style={styles(theme).userName}>{profile.name} {profile.surname}</Text>
            <Text style={styles(theme).userRole}>{profile.university} • {profile.faculty}</Text>

            <View style={styles(theme).statsRow}>
              <View style={styles(theme).statItem}>
                <Text style={styles(theme).statValue}>{profile.posts.length}</Text>
                <Text style={styles(theme).statLabel}>{t('trips_count')}</Text>
              </View>
              <View style={styles(theme).statDivider} />
              <View style={styles(theme).statItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles(theme).statValue}>{profile.stars || 0}</Text>
                  <MaterialIcons name="star" size={16} color={theme.colors.warning} style={{ marginLeft: 2 }} />
                </View>
                <Text style={styles(theme).statLabel}>{t('rating')}</Text>
              </View>
              <View style={styles(theme).statDivider} />
              <View style={styles(theme).statItem}>
                <Text style={styles(theme).statValue}>
                  {Math.floor((new Date().getTime() - new Date(profile.createdAt).getTime()) / (86400000))}
                </Text>
                <Text style={styles(theme).statLabel}>{t('days_member')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles(theme).menuSection}>
          <Text style={styles(theme).sectionTitle}>{t('account_info')}</Text>

          <MenuRow
            theme={theme}
            icon="email"
            title="Email"
            subtitle={profile.email}
            onPress={() => { }}
            rightIcon={false}
          />
          <MenuRow
            theme={theme}
            icon="school"
            title={t('university')}
            subtitle={profile.university}
            onPress={() => { }}
            rightIcon={false}
          />
          <MenuRow
            theme={theme}
            icon="business"
            title={t('faculty')}
            subtitle={profile.faculty}
            onPress={() => { }}
            rightIcon={false}
          />
          <MenuRow
            theme={theme}
            icon="person"
            title={t('gender')}
            subtitle={profile.gender}
            onPress={() => { }}
            rightIcon={false}
          />
          <MenuRow
            theme={theme}
            icon="share"
            title={t('share_profile')}
            subtitle={t('share_with_friends')}
            onPress={handleShareProfile}
            rightIcon={true}
          />
        </View>

        <View style={styles(theme).section}>
          <Text style={styles(theme).sectionTitle}>{t('shared_trips')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}>
            {profile.posts.slice(0, visiblePosts).map((post) => (
              <View key={post.id} style={{ width: 300, marginRight: 12 }}>
                <RideHistoryItem
                  id={post.id}
                  date={new Date(post.datetimeStart)}
                  from={post.sourceAddress}
                  to={post.destinationFaculty}
                  status="completed"
                  driverName="Siz"
                  onPress={() => navigateToPostDetail(post.id)}
                />
              </View>
            ))}
            {profile.posts.length === 0 && (
              <Text style={styles(theme).emptyText}>{t('no_shared_trips')}</Text>
            )}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles(theme).logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={theme.colors.error} />
          <Text style={styles(theme).logoutText}>{t('logout')}</Text>
        </TouchableOpacity>

        <Text style={styles(theme).versionText}>{t('version')} 1.0.0 • KampüsRoute</Text>
      </ScrollView>
    </View>
  );
}

const MenuRow = ({ theme, icon, title, subtitle, onPress, rightIcon }: any) => (
  <TouchableOpacity style={styles(theme).menuItem} onPress={onPress} activeOpacity={0.7} disabled={!rightIcon}>
    <View style={styles(theme).menuIconBox}>
      <MaterialIcons name={icon} size={20} color={theme.colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles(theme).menuTitle}>{title}</Text>
      {subtitle && <Text style={styles(theme).menuSubtitle}>{subtitle}</Text>}
    </View>
    {rightIcon && <MaterialIcons name="chevron-right" size={24} color={theme.colors.textLight} />}
  </TouchableOpacity>
);

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
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    ...theme.textStyles.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  header: {
    backgroundColor: theme.colors.card,
    paddingTop: theme.spacing['4xl'],
    borderBottomLeftRadius: theme.borderRadius['2xl'],
    borderBottomRightRadius: theme.borderRadius['2xl'],
    ...theme.shadows.md,
    marginBottom: theme.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
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
  profileCard: {
    alignItems: 'center',
    paddingBottom: theme.spacing.xl,
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: theme.colors.background,
  },
  userName: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    marginBottom: 4,
  },
  userRole: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    width: '85%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
  },
  statLabel: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginTop: 2,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
  },

  menuSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryTransparent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuTitle: {
    ...theme.textStyles.body,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  menuSubtitle: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
  },

  section: {
    marginBottom: theme.spacing.xl,
  },
  emptyText: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing['4xl'],
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  logoutText: {
    color: theme.colors.error,
    fontWeight: '700',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    opacity: 0.5,
  },
});