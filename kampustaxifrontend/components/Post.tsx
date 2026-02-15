'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import MapView, { Polyline, Marker, Circle } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../env';
import { lightTheme, darkTheme, ThemeType } from '../src/styles/theme';
import { mapStyle } from '@/styles/mapStyle';
import { useTheme } from '@/contexts/ThemeContext';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface PostProps {
  id: string;
  from: string;
  to: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;

  route: any;
  userId: string;
  stars: number;
  userLocation: { latitude: number; longitude: number } | null;
  onPress: () => void;
}

const Post: React.FC<PostProps> = ({ id, from, to, userName, date, startTime, endTime, route, userId, userLocation, onPress, stars }) => {
  const { theme } = useTheme();
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [initialRegion, setInitialRegion] = useState<any>(null);
  const [latitudeDelta, setLatitudeDelta] = useState<number>(0);
  const [longitudeDelta, setLongitudeDelta] = useState<number>(0);
  const router = useRouter();
  // Get the device color scheme

  // Use the appropriate theme based on color scheme

  useEffect(() => {
    if (route) {
      let decodedRoute = route;
      // Handle stringified JSON (safe parsing with support for double-encoding)
      if (typeof decodedRoute === 'string') {
        try {
          decodedRoute = JSON.parse(decodedRoute);
          // If it's still a string (double encoded), parse again
          if (typeof decodedRoute === 'string') {
            decodedRoute = JSON.parse(decodedRoute);
          }
        } catch (e) {
          console.error("Error parsing route JSON in Post component:", e);
          decodedRoute = [];
        }
      }

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
    router.push({ pathname: '/(drawer)/UserProfileScreen', params: { id: userId } });
  };

  const getTimeDisplay = () => {
    try {
      const startTimeParts = startTime.split(':');
      const endTimeParts = endTime.split(':');
      return `${startTimeParts[0]}:${startTimeParts[1]} - ${endTimeParts[0]}:${endTimeParts[1]}`;
    } catch (e) {
      return `${startTime} - ${endTime}`;
    }
  };

  const getDayDisplay = () => {
    // Assuming date is in a format like "12 Feb 2026" or similar
    return date;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles(theme).touchableContainer}>
      <View style={styles(theme).postContainer}>
        {/* Header: Driver Info & Price */}
        <View style={styles(theme).headerSection}>
          <TouchableOpacity style={styles(theme).userInfo} onPress={handleProfilePress}>
            <View style={styles(theme).avatarContainer}>
              {profilePhoto && !profilePhoto.includes('icons8') ? (
                <Image source={{ uri: profilePhoto }} style={styles(theme).avatarImage} />
              ) : (
                <MaterialIcons name="person" size={24} color={theme.colors.textLight} />
              )}
            </View>
            <View style={styles(theme).nameContainer}>
              <Text style={styles(theme).nameText}>{userName}</Text>
              <View style={styles(theme).ratingContainer}>
                <Ionicons name="star" size={12} color={theme.colors.warning} />
                <Text style={styles(theme).ratingText}>{stars.toFixed(1)}</Text>
              </View>
            </View>
          </TouchableOpacity>


        </View>

        <View style={styles(theme).divider} />

        {/* Route Section with Vertical Timeline */}
        <View style={styles(theme).routeSection}>
          <View style={styles(theme).timelineColumn}>
            <Text style={styles(theme).timeText}>{startTime.substring(0, 5)}</Text>
            <View style={styles(theme).timelineConnector}>
              <View style={styles(theme).timelineDotStart} />
              <View style={styles(theme).timelineLine} />
              <View style={styles(theme).timelineDotEnd} />
            </View>
            <Text style={styles(theme).timeText}>{endTime.substring(0, 5)}</Text>
          </View>

          <View style={styles(theme).locationColumn}>
            <Text style={styles(theme).locationText} numberOfLines={1}>{from}</Text>
            <View style={styles(theme).spacer} />
            <Text style={styles(theme).locationText} numberOfLines={1}>{to}</Text>
          </View>
        </View>

        {/* Footer: Date & Car */}
        <View style={styles(theme).footerSection}>
          <View style={styles(theme).dateContainer}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.textLight} />
            <Text style={styles(theme).dateText}>{date}</Text>
          </View>
          <View style={styles(theme).carContainer}>
            <FontAwesome5 name="car" size={12} color={theme.colors.textLight} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = (theme: ThemeType) => StyleSheet.create({
  touchableContainer: {
    marginVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    ...theme.shadows.sm,
  },
  postContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg, // 20px
    padding: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent', // Cleaner look, rely on shadow
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  nameContainer: {
    justifyContent: 'center',
  },
  nameText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
    marginLeft: 2,
    marginTop: 1,
  },
  priceContainer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
  },
  priceText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.xs,
  },
  routeSection: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    height: 70, // Fixed height for timeline
  },
  timelineColumn: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 40,
    marginRight: theme.spacing.xs,
    paddingVertical: 4,
  },
  timeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.text,
  },
  timelineConnector: {
    flex: 1,
    alignItems: 'center',
    // marginVertical: 2,
    justifyContent: 'center',
    width: 20,
  },
  timelineDotStart: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.text,
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  timelineDotEnd: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 2,
  },
  locationColumn: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  locationText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textDark,
    fontFamily: theme.typography.fontFamily.regular,
  },
  spacer: {
    flex: 1,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 6,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
  },
  carContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Post; 