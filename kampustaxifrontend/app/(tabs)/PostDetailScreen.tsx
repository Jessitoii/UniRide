'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, useColorScheme } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BASE_URL } from '../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Post from '../../components/Post';
import InterestedUser from '../../components/InterestedUser';
import { lightTheme, darkTheme, ThemeType } from '../../styles/theme';
import MapView, { Polyline, Circle, Marker } from 'react-native-maps';
import { mapStyle } from '../../styles/mapStyle';
import { MaterialIcons } from '@expo/vector-icons';

// Define types for the post and profile data
interface PostData {
  id: string;
  userId: string;
  sourceAddress: string;
  destinationFaculty: string;
  datetimeStart: string;
  datetimeEnd: string;
  price: number;
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

export default function PostDetailScreen() {
  // State variables
  const [post, setPost] = useState<PostData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [avatars, setAvatars] = useState<{ [key: string]: string }>({});
  const [initialRegion, setInitialRegion] = useState<any>(null);
  const [latitudeDelta, setLatitudeDelta] = useState<number>(0);
  const [longitudeDelta, setLongitudeDelta] = useState<number>(0);
  
  // Navigation and route
  const navigation = useNavigation();
  const route = useRoute();
  const { postId, userLocation } = route.params as { 
    postId: string; 
    userLocation: LocationCoordinates | null 
  };

  // Get color scheme for theming
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  
  // Constants for date formatting
  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

  // Process route data when post changes
  useEffect(() => {
    if (post && post.route) {
      try {
        const decodedRoute = typeof post.route === 'string' ? JSON.parse(JSON.parse(post.route)) : post.route;

        if (decodedRoute.length > 0) {
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
          console.error('Error fetching post details:', errorData);
          return;
        }
        const data = await response.json();
        setPost(data);
      } catch (error) {
        console.error('Error fetching post details:', error);
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
  const formattedDate = `${postDate.getDate()} ${monthNames[postDate.getMonth()]} ${dayNames[postDate.getDay()]}`;

  // Render components
  const renderMap = () => (
    <View style={styles(theme).mapContainer}>
      <MapView
        style={styles(theme).map}
        initialRegion={initialRegion}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        customMapStyle={mapStyle}
      >
        <Polyline
          key={0}
          coordinates={JSON.parse(JSON.parse(post.route))}
          strokeWidth={8}
          style={{zIndex: 0}}
        />
        <Polyline
          key={1}
          coordinates={JSON.parse(JSON.parse(post.route))}
          strokeWidth={4}
          strokeColor={theme.colors.secondary}
          style={{zIndex: 1}}
        />
        <Circle
          center={JSON.parse(JSON.parse(post.route))[0]}
          radius={latitudeDelta * 5000}
          strokeColor={theme.colors.secondary}
          strokeWidth={2}
          fillColor={theme.colors.background}
          style={{zIndex: 2}}
          lineDashPattern={[10, 10]}
        />
        <Circle
          center={JSON.parse(JSON.parse(post.route))[JSON.parse(JSON.parse(post.route)).length - 1]}
          radius={latitudeDelta * 5000}
          strokeColor={theme.colors.secondary}
          strokeWidth={2}
          fillColor={theme.colors.background}
          style={{zIndex: 2}}
          lineDashPattern={[10, 10]}
        />
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Konumunuz"
            description="Bu konumunuzdur"
          />
        )}
      </MapView>
    </View>
  );

  const renderInterestedUsersList = () => (
    <View style={styles(theme).interestedContainer}>
      <Text style={styles(theme).interestedTitle}>İlgilenenler</Text>
      {post.interestedUsers?.length ? (
        post.interestedUsers.map((interestedUser) => (
          <InterestedUser
            key={interestedUser.id}
            postId={post.id}
            userId={interestedUser.user.id}
            userName={interestedUser.user.name}
            route={JSON.parse(JSON.parse(post.route))}
            userLocation={JSON.parse(interestedUser.locationCoordinates)}
            university={interestedUser.user.university}
            bio={interestedUser.user.bio}
            stars={interestedUser.user.stars}
          />
        ))
      ) : (
        <Text style={styles(theme).noInterestedText}>Henüz ilgilenen yok</Text>
      )}
    </View>
  );

  const renderDriverProfile = () => (
    <View style={styles(theme).profileContainer}>
      <Image 
        source={{ uri: post.user.avatar || 'https://img.icons8.com/ios/50/gender-neutral-user--v1.png' }} 
        style={styles(theme).avatar} 
      />
      <Text style={styles(theme).userName}>{post.user.name}</Text>
      {post.user.details && <Text style={styles(theme).userDetails}>{post.user.details}</Text>}
      
      {/* Driver Car Information */}
      {post.user.car && (
        <View style={styles(theme).carInfoContainer}>
          <Text style={styles(theme).carInfoTitle}>Araç Bilgileri</Text>
          
          <View style={styles(theme).carDetailsRow}>
            <View style={styles(theme).carDetailItem}>
              <MaterialIcons name="directions-car" size={20} color={theme.colors.textLight} />
              <Text style={styles(theme).carDetailText}>
                {post.user.car.brand} {post.user.car.model} {post.user.car.year || ''}
              </Text>
            </View>
            
            <View style={styles(theme).carDetailItem}>
              <MaterialIcons name="palette" size={20} color={theme.colors.textLight} />
              <Text style={styles(theme).carDetailText}>
                {post.user.car.color}
              </Text>
            </View>
          </View>
          
          <View style={styles(theme).carPlateContainer}>
            <MaterialIcons name="credit-card" size={20} color={theme.colors.textLight} />
            <Text style={styles(theme).carPlateText}>
              {post.user.car.plateNumber}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles(theme).container}>
      <StatusBar barStyle={colorScheme === 'dark' ? "light-content" : "dark-content"} />
      
      {/* Header with back button */}
      <TouchableOpacity 
        style={styles(theme).backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <MaterialIcons name="arrow-back" size={28} color={theme.colors.primary} />
      </TouchableOpacity>

      {/* Date display */}
      <View style={styles(theme).dateContainer}>
        <Text style={styles(theme).dateText}>{formattedDate}</Text>
      </View>
      
      {/* Post details */}
      <Post
        id={post.id}
        userId={post.userId}
        from={extractDistrict(post.sourceAddress)}
        to={post.destinationFaculty}
        userName={post.user.name}
        date={new Date(post.datetimeStart).toLocaleDateString()}
        startTime={new Date(post.datetimeStart).toLocaleTimeString()}
        endTime={new Date(post.datetimeEnd).toLocaleTimeString()}
        price={post.price}
        route={post.route}
        userLocation={post.userId !== profile.id ? userLocation : null}
        onPress={() => console.log('Post details viewed')}
        stars={post.user.stars}
      />

      <View style={styles(theme).separator} />

      {/* Map view */}
      {renderMap()}

      <View style={styles(theme).separator} />

      {/* Interested users or driver profile */}
      {isOwner ? renderInterestedUsersList() : renderDriverProfile()}
      
      {/* Reservation request button (if not owner) */}
      {!isOwner && (
        <TouchableOpacity 
          style={styles(theme).interestedButton} 
          onPress={handleInterested}
          activeOpacity={0.7}
        >
          <MaterialIcons name="calendar-month" size={24} color={theme.colors.white} style={styles(theme).buttonIcon}/>
          <Text style={styles(theme).interestedButtonText}>Rezarvasyon Talebi Gönder</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    paddingTop: 50,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
  },
  interestedContainer: {
    width: '100%',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 70,
    ...theme.shadows.base,
  },
  interestedTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
  },
  noInterestedText: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
  profileContainer: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 70,
    ...theme.shadows.base,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  userName: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  userDetails: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  interestedButton: {
    position: 'absolute',
    flexDirection: 'row',
    bottom: theme.spacing.md,
    width: '90%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.base,
  },
  buttonIcon: {
    marginRight: theme.spacing.sm,
  },
  interestedButtonText: {
    ...theme.textStyles.button,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginVertical: theme.spacing.md,
    ...theme.shadows.base,
  },
  backButton: {
    marginTop:StatusBar.currentHeight,
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  dateContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 50,
    marginBottom: theme.spacing.md,
  },
  dateText: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.md,
  },
  carInfoContainer: {
    width: '100%',
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
