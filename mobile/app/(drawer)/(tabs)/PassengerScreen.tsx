import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StatusBar,
  Image,
} from 'react-native';
import { Post } from '@/components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BASE_URL } from '@/env';
import { ThemeType } from '@/styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Circle } from 'react-native-maps';
import { getMapStyle } from '@/styles/mapStyle';

import { getCurrentPositionAsync, requestForegroundPermissionsAsync } from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function PassengerScreen() {
  const { theme, isDark } = useTheme();
  const currentMapStyle = React.useMemo(() => getMapStyle(theme), [theme]);
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [visiblePosts, setVisiblePosts] = useState<number>(2);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [initialRegion, setInitialRegion] = useState<any>(null);
  const [posts, setPosts] = useState<any[] | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  const router = useRouter();
  const params = useLocalSearchParams();
  const rawUserLocation = params?.userLocation;
  // Use destinationUniversity/Faculty keys as sent by SearchLocation
  const destinationUniversity = params?.destinationUniversity as string;
  const destinationFaculty = params?.destinationFaculty as string;

  // Safely parse userLocation if it comes as a string
  const userLocation = React.useMemo(() => {
    if (!rawUserLocation) return null;
    try {
      return typeof rawUserLocation === 'string' ? JSON.parse(rawUserLocation) : rawUserLocation;
    } catch (e) {
      console.error('Error parsing userLocation:', e);
      return null;
    }
  }, [rawUserLocation]);

  const fetchPosts = async () => {
    if (!userLocation || !userLocation.latitude) {
      return;
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        latitude: userLocation.latitude.toString(),
        longitude: userLocation.longitude.toString(),
        destinationUniversity: destinationUniversity || '',
        destinationFaculty: destinationFaculty || '',
      });
      const res = await fetch(`${BASE_URL}/api/posts/nearby?${queryParams.toString()}`, {
        method: 'GET',
      });
      const data = await res.json();
      setPosts(data);
      setIsOffline(false);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      if (error.message === 'Network request failed' || error.isNetworkError) {
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [userLocation, destinationUniversity, destinationFaculty]);

  useEffect(() => {
    const initScreen = async () => {
      await checkAuthToken();
      await getUserLocation();
    };

    initScreen();
  }, []);

  const checkAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const res = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 403) {
        await AsyncStorage.removeItem('token');
        router.push('/auth/login');
        return;
      }

      const data = await res.json();
      setProfile(data);
    } catch (error: any) {
      console.error('Error checking auth token:', error);
      if (error.message === 'Network request failed' || error.isNetworkError) {
        setIsOffline(true);
      }
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await getCurrentPositionAsync();
      setInitialRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setVisiblePosts(2);
    fetchPosts().then(() => setRefreshing(false));
  }, []);

  const handleRetry = () => {
    setIsOffline(false);
    setLoading(true);
    fetchPosts();
  };

  const extractDistrict = (address: string) => {
    if (!address) return '';
    const parts = address.split(',');
    return parts.length > 1 ? parts[0].trim() : address;
  };

  const handleShowMore = () => {
    setVisiblePosts((prev) => prev + 3);
  };

  const navigateToPostDetail = (postId: string) => {
    router.push({
      pathname: '/(drawer)/PostDetailScreen',
      params: {
        postId,
        userLocation: JSON.stringify(params.userLocation),
      }
    });
  };

  const handleSearchLocationPress = () => {
    router.push('/(drawer)/SearchLocation');
  };

  if (loading && !posts) {
    return (
      <View style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (isOffline) {
    return (
      <View style={styles(theme).offlineContainer}>
        <MaterialIcons name="cloud-off" size={64} color={theme.colors.error} />
        <Text style={styles(theme).offlineTitle}>Sunucuya Ulaşılamıyor</Text>
        <Text style={styles(theme).offlineText}>
          İnternet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.
        </Text>
        <TouchableOpacity style={styles(theme).retryButton} onPress={handleRetry}>
          <Text style={styles(theme).retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles(theme).container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <LinearGradient
        style={styles(theme).header}
        colors={theme.colors.gradients.primary as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent={true}
        />
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles(theme).logo}
          resizeMode="contain"
        />
        <Text style={styles(theme).welcomeTitle}>
          {t('hello_passenger', { name: profile?.name || 'Yolcu' })}
        </Text>

        <View style={styles(theme).searchContainer}>
          <TouchableOpacity
            style={styles(theme).searchBox}
            onPress={handleSearchLocationPress}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="search"
              size={24}
              color={theme.colors.primary}
            />
            <TextInput
              style={styles(theme).searchText}
              placeholder={t('search_address')}
              placeholderTextColor={theme.colors.textLight}
              value={searchQuery}
              onFocus={handleSearchLocationPress}
              editable={false}
              onChangeText={setSearchQuery}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {!posts ? (
        <View style={styles(theme).noLocationContainer}>
          <Text style={styles(theme).sectionTitle}>{t('current_location')}</Text>
          <View style={styles(theme).mapContainer}>
            {initialRegion && (
              <MapView
                style={styles(theme).map}
                initialRegion={initialRegion}
                customMapStyle={currentMapStyle}
              >
                <Circle
                  center={{
                    latitude: initialRegion.latitude,
                    longitude: initialRegion.longitude,
                  }}
                  radius={50}
                  strokeColor={theme.colors.white}
                  strokeWidth={6}
                  fillColor={theme.colors.primary}
                />
              </MapView>
            )}
          </View>
        </View>
      ) : (
        <View style={styles(theme).postsContainer}>
          {posts.length > 0 ? (
            <View>
              {posts.slice(0, visiblePosts).map((post) => (
                <React.Fragment key={post.id}>
                  <Post
                    id={post.id}
                    userId={post.user.id}
                    from={extractDistrict(post.sourceAddress)}
                    to={post.destinationFaculty}
                    userName={post.user.name}
                    date={new Date(post.datetimeStart).toLocaleDateString()}
                    startTime={new Date(post.datetimeStart).toLocaleTimeString()}
                    endTime={new Date(post.datetimeEnd).toLocaleTimeString()}
                    route={post.route}
                    userLocation={userLocation}
                    onPress={() => navigateToPostDetail(post.id)}
                    stars={post.user.stars}
                  />
                  <View style={styles(theme).postSeparator} />
                </React.Fragment>
              ))}

              {visiblePosts < posts.length && (
                <TouchableOpacity
                  style={styles(theme).loadMoreButton}
                  onPress={handleShowMore}
                  activeOpacity={0.8}
                >
                  <Text style={styles(theme).loadMoreText}>
                    {t('load_more')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles(theme).emptyStateContainer}>
              <MaterialIcons
                name="directions-car"
                size={64}
                color={theme.colors.primary}
              />
              <Text style={styles(theme).emptyStateText}>
                {t('no_rides_found')}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
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
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    ...theme.shadows.base,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
    tintColor: '#FFFFFF',
  },
  welcomeTitle: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  searchContainer: {
    marginTop: theme.spacing.base,
    ...theme.shadows.base,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchText: {
    flex: 1,
    ...theme.textStyles.body,
    marginLeft: theme.spacing.sm,
    color: theme.colors.text,
  },
  noLocationContainer: {
    padding: theme.spacing.xl,
  },
  mapContainer: {
    height: 200,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.base,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
  },
  postsContainer: {
    padding: theme.spacing.base,
  },
  postSeparator: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.base,
  },
  loadMoreButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.sm,
  },
  loadMoreText: {
    ...theme.textStyles.button,
  },
  emptyStateContainer: {
    padding: theme.spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    ...theme.textStyles.body,
    textAlign: 'center',
    marginTop: theme.spacing.base,
    color: theme.colors.textLight,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  offlineTitle: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  offlineText: {
    ...theme.textStyles.body,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.sm,
  },
  retryButtonText: {
    ...theme.textStyles.button,
    color: theme.colors.white,
  },
});
