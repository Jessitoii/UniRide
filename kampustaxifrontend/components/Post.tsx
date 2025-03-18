'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, useColorScheme } from 'react-native';
import MapView, { Polyline, Marker, Circle } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../env';
import { lightTheme, darkTheme, ThemeType } from '../styles/theme';
import { mapStyle } from '@/styles/mapStyle';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface PostProps {
  id: string;
  from: string;
  to: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  route: any;
  userId: string;
  stars: number;
  userLocation: { latitude: number; longitude: number } | null;
  onPress: () => void;
}

const Post: React.FC<PostProps> = ({ id, from, to, userName, date, startTime, endTime, price, route, userId, userLocation, onPress, stars }) => {
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [initialRegion, setInitialRegion] = useState<any>(null);
  const [latitudeDelta, setLatitudeDelta] = useState<number>(0);
  const [longitudeDelta, setLongitudeDelta] = useState<number>(0);
  const navigation = useNavigation();
  // Get the device color scheme
  const colorScheme = useColorScheme();
  
  // Use the appropriate theme based on color scheme
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    if (route) {
      const decodedRoute = typeof route === 'string' ? JSON.parse(JSON.parse(route)) : route;

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
    }
  }, []);

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      const response = await fetch(`${BASE_URL}/api/users/profilePhoto/${userId}`);
      if (response.ok) {
        setProfilePhoto(`${BASE_URL}/api/users/profilePhoto/${userId}`);
      } else {
        setProfilePhoto('https://img.icons8.com/ios/50/gender-neutral-user--v1.png');
      }
    };
    fetchProfilePhoto();
  }, [userId]);

  const handleProfilePress = () => {
    // @ts-ignore
    navigation.navigate('UserProfileScreen', { id: userId });
  };

  const getTimeDisplay = () => {
    try {
      const startTimeParts = startTime.split(':');
      const endTimeParts = endTime.split(':');
      return `${startTimeParts[0]}:${startTimeParts[1]} ${endTimeParts[0]}:${endTimeParts[1]}`;
    } catch (e) {
      return `${startTime} - ${endTime}`;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles(theme).postContainer}>
        <View style={styles(theme).cardContent}>
          <View style={styles(theme).routeSection}>
            <View style={styles(theme).timeColumn}>
              <Text style={styles(theme).timeText}>{getTimeDisplay()}</Text>
              <Text style={styles(theme).dateText}>{date}</Text>
            </View>
            
            <View style={styles(theme).routeColumn}>
              <View style={styles(theme).routeMarker}>
                <View style={styles(theme).pinkdot} />
                <View style={styles(theme).routeLine} />
                <View style={styles(theme).bluedot} />
              </View>
              
              <View style={styles(theme).locationNames}>
                <Text style={styles(theme).locationText}>{from}</Text>
                <Text style={styles(theme).locationText}>{to}</Text>
              </View>
            </View>
            
            <View style={styles(theme).priceColumn}>
              <Text style={styles(theme).currencySymbol}>₺</Text>
              <Text style={styles(theme).priceText}>{price}</Text>
            </View>
          </View>
          
          <View style={styles(theme).divider} />
          
          <View style={styles(theme).profileSection}>
            <View style={styles(theme).carInfo}>
              <MaterialIcons name="directions-car" size={24} color={theme.colors.primary} />
            </View>
            
            <TouchableOpacity style={styles(theme).userInfo} onPress={handleProfilePress}>
              <View style={styles(theme).avatarContainer}>
                <MaterialIcons name="person" size={24} color={'#ccc'} />
              </View>
              <View style={styles(theme).nameRating}>
                <Text style={styles(theme).nameText}>{userName}</Text>
                <View style={styles(theme).ratingContainer}>
                  {
                    Array.from({ length: Math.floor(stars) }, (_, index) => (
                      <MaterialIcons key={index} name="star" size={16} color={theme.colors.secondary} />
                    ))
                  }
                  <Text style={styles(theme).ratingText}>{stars.toFixed(1)}</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <View style={styles(theme).passengers}>
              <MaterialIcons name="person" size={24} color={theme.colors.primary} />
            </View>
          </View>
        </View>
        
        <View style={styles(theme).hiddenMap}>
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
              coordinates={JSON.parse(JSON.parse(route))}
              strokeWidth={8}
              style={{zIndex: 0}}
            />
            <Polyline
              key={1}
              coordinates={JSON.parse(JSON.parse(route))}
              strokeWidth={4}
              strokeColor={theme.colors.secondary}
              style={{zIndex: 1}}
            />
            <Circle
              center={JSON.parse(JSON.parse(route))[0]}
              radius={latitudeDelta * 5000}
              strokeColor={theme.colors.secondary}
              strokeWidth={2}
              fillColor={theme.colors.background}
              style={{zIndex: 2}}
              lineDashPattern={[10, 10]}
            />
            <Circle
              center={JSON.parse(JSON.parse(route))[JSON.parse(JSON.parse(route)).length - 1]}
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
                title="Your Location"
                description="This is your selected location"
              />
            )}
          </MapView>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = (theme: ThemeType) => StyleSheet.create({
  postContainer: {
    width: 300,
    marginHorizontal: '2.5%',
    marginVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
    ...theme.shadows.base,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  routeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeColumn: {
    alignItems: 'flex-start',
    width: '25%',
  },
  timeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.textDark,
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  routeColumn: {
    flexDirection: 'row',
    width: '50%',
    paddingHorizontal: theme.spacing.sm,
  },
  routeMarker: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  pinkdot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.secondary,
    marginVertical: 3,
  },
  bluedot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    marginVertical: 3,
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: theme.colors.textDark,
  },
  locationNames: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 60,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textDark,
  },
  priceColumn: {
    alignItems: 'flex-end',
    width: '25%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textDark,
    marginTop: 2,
  },
  priceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.md,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carInfo: {
    width: '20%',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    width: '60%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: '#f1f1f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRating: {
    flexDirection: 'column',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.textDark,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  ratingText: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.xs,
  },
  passengers: {
    width: '20%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  hiddenMap: {
    height: 0,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: 250,
  },
  interestedButton: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  interestedButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default Post; 