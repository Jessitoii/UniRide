'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, TextInput, FlatList, Alert, StatusBar, Image} from 'react-native';
import Post from '../../components/Post';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BASE_URL } from '@/env';
import { lightTheme, ThemeType } from '../../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Circle } from 'react-native-maps';
import { mapStyle } from '../../styles/mapStyle'; 
import { getCurrentPositionAsync } from 'expo-location';

export default function PassengerScreen() {
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [visiblePosts, setVisiblePosts] = useState<number>(2);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [initialRegion, setInitialRegion] = useState<any>(null);
  const [posts, setPosts] = useState<any[] | null>(null);

  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { userLocation: any | null, selectedUniversity: string | null, selectedFaculty: string | null };
  const userLocation = params?.userLocation;
  const selectedUniversity = params?.selectedUniversity;
  const selectedFaculty = params?.selectedFaculty;

  const fetchPosts = async () => {
    if(!userLocation) {
      return;
    }

    setLoading(true);
    if(!selectedUniversity && !selectedFaculty) {
      const queryParams = new URLSearchParams({
        latitude: userLocation.latitude.toString(),
        longitude: userLocation.longitude.toString(),
      });
      const res = await fetch(`${BASE_URL}/api/posts/nearby?${queryParams.toString()}`, {
        method: 'GET',
      });
      const data = await res.json();
      setPosts(data);
      setLoading(false);
      return;
    }
    const queryParams = new URLSearchParams({
      latitude: userLocation.latitude.toString(),
      longitude: userLocation.longitude.toString(),
      destinationUniversity: selectedUniversity || '',
      destinationFaculty: selectedFaculty || '',
    });
    const res = await fetch(`${BASE_URL}/api/posts/nearby?${queryParams.toString()}`, {
      method: 'GET',
    });
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  }


  useEffect(() => {
    fetchPosts();
  }, [userLocation, selectedUniversity, selectedFaculty]);

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
      if(!token) {
        // @ts-ignore
        navigation.navigate('Auth', {screen: 'Login'});
        return;
      }

      console.log(token);
      
      const res = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if(res.status === 403) {
        await AsyncStorage.removeItem('token');
        // @ts-ignore
        navigation.navigate('Auth', {screen: 'Login'});
        return;
      }
      
      const data = await res.json();
      setProfile(data);
    } catch (error) {
      console.error('Error checking auth token:', error);
    }
  };

  const getUserLocation = async () => {
    try {
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
    fetchPosts();
    setRefreshing(false);
  }, []);

  const extractDistrict = (address: string) => {
    const parts = address.split(',');
    return parts.length > 1 ? parts[0].trim() : address;
  };

  const handleShowMore = () => {
    setVisiblePosts((prev) => prev + 3);
  };

  const navigateToPostDetail = (postId: string) => {
    // @ts-ignore
    navigation.navigate('PostDetailScreen', {
      postId,
      userLocation: params.userLocation,
    });
  };

  const handleSearchLocationPress = () => {
    // @ts-ignore
    navigation.navigate('SearchLocationScreen');
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[lightTheme.colors.primary]} 
        />
      }
    >
      <LinearGradient 
        style={styles.header}
        colors={['#e1d0ff', '#ffc0e4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo} 
        />
        <Text style={styles.welcomeTitle}>
          Merhaba, {profile?.name || 'Yolcu'}
        </Text>
        
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.searchBox}
            onPress={handleSearchLocationPress}
            activeOpacity={0.8}
          >
            <MaterialIcons 
              name="search" 
              size={24} 
              color={lightTheme.colors.primary} 
            />
            <TextInput
              style={styles.searchText}
              placeholder="Konum ara ya da seç"
              value={searchQuery}
              onFocus={handleSearchLocationPress}
              editable={false}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {!posts ? (
        <View style={styles.noLocationContainer}>
          <Text style={styles.sectionTitle}>Şu anki konumunuz</Text>
          <View style={styles.mapContainer}>
            {initialRegion && (
              <MapView
                style={styles.map}
                initialRegion={initialRegion}
                customMapStyle={mapStyle}
              >
                <Circle
                  center={{
                    latitude: initialRegion.latitude,
                    longitude: initialRegion.longitude,
                  }}
                  radius={50}
                  strokeColor={lightTheme.colors.white}
                  strokeWidth={6}
                  fillColor={lightTheme.colors.primary}
                />
              </MapView>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.postsContainer}>
          {posts.length > 0 ? (
            <View style={styles.postsContainer}>
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
                    price={post.price}
                    route={post.route}
                    userLocation={params.userLocation}
                    onPress={() => navigateToPostDetail(post.id)}
                    stars={post.user.stars}
                  />
                  <View style={styles.postSeparator} />
                </React.Fragment>
              ))}
              
              {visiblePosts < posts.length && (
                <TouchableOpacity 
                  style={styles.loadMoreButton} 
                  onPress={handleShowMore}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loadMoreText}>
                    Daha fazla görüntüle
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons 
                name="directions-car" 
                size={64} 
                color={lightTheme.colors.textLight} 
              />
              <Text style={styles.emptyStateText}>
                Bu alanda henüz bir yolculuk bulunmamaktadır.
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: ThemeType) => StyleSheet.create({
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
    paddingTop: theme.spacing['3xl'],
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  logo: {
    width: 75,
    height: 75,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  welcomeTitle: {
    ...theme.textStyles.header1,
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
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchText: {
    flex: 1,
    ...theme.textStyles.body,
    marginLeft: theme.spacing.sm,
  },
  noLocationContainer: {
    padding: theme.spacing.xl,
  },
  mapContainer: {
    height: 200,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.secondary,
    ...theme.shadows.base,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    ...theme.textStyles.header3,
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
    paddingVertical: theme.spacing.base,
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
});

const styles = createStyles(lightTheme);
