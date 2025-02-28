'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../env';

interface PostProps {
  id: string;
  title: string;
  userName: string;
  date: string;
  time: string;
  price: number;
  route: any;
  userId: string;
  interested: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  onPress: () => void;
}

const Post: React.FC<PostProps> = ({ id, title, userName, date, time, price, route, userId, interested, userLocation, onPress }) => {
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [initialRegion, setInitialRegion] = useState<any>(null);
  const router = useRouter();

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

  const handleInterestedClick = async () => {
    if (!userLocation) {
      console.error('No user location available');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${BASE_URL}/api/posts/${id}/interested`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          locationCoordinates: userLocation,
        })
      });

      if (response.ok) {
        console.log('User added to interested list');
        onLike();
      } else {
        console.error('Error adding user to interested list:', await response.json());
      }
    } catch (error) {
      console.error('Error adding user to interested list:', error);
    }
  };

  const handleProfilePress = () => {
    router.push({
      pathname: '/(tabs)/UserProfileScreen',
      params: { id: userId }
    });
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.postContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.userContainer}>
            <TouchableOpacity onPress={handleProfilePress}>
              <Image source={{ uri: profilePhoto}} style={styles.userAvatar} />
              <Text style={styles.userName}>{userName}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoContainer}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Tarih: {date}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Saat: {time}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Ücret</Text>
            <Text style={styles.priceValue}>{price}₺</Text>
          </View>
        </View>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={initialRegion}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            <Polyline coordinates={typeof route === 'string' ? JSON.parse(JSON.parse(route)) : route} strokeWidth={2} strokeColor="blue" />
            {userLocation && (
              <Marker
                coordinate={userLocation}
                title="Your Location"
                description="This is your selected location"
              />
            )}
          </MapView>
        </View>
        {interested && (
          <TouchableOpacity style={styles.interestedButton} onPress={handleInterestedClick}>
            <Text style={styles.interestedButtonText}>İlgileniyorum</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    width: 389,
    height: 220,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    marginBottom: 16,
    flexDirection: 'row',
  },
  textContainer: {
    width: 151,
    padding: 8,
  },
  title: {
    fontSize: 12,
    color: '#000',
    marginBottom: 8,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  userName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  infoContainer: {
    marginBottom: 8,
  },
  infoBox: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  priceContainer: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  priceLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  interestedButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  interestedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Post; 