'use client';

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Profile from './Profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../env';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

interface InterestedUserProps {
  userId: string;
  postId: string;
  userName: string;
  university: string;
  bio: string;
  route: any;
  userLocation: { latitude: number; longitude: number } | null;
  stars: number;
}

const InterestedUser: React.FC<InterestedUserProps> = ({
  userId,
  postId,
  userName,
  university,
  bio,
  route,
  userLocation,
  stars,
}) => {
  if (!userLocation) {
    console.error('User location is not defined for user:', userId);
    return null;
  }

  const handleMatch = async (interestedUserId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/posts/${postId}/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ matchedUserId: interestedUserId }),
      });

      const responseText = await response.text();

      if (response.ok) {
        console.log('User matched successfully');
        // Optionally, update the state to reflect the change
      } else {
        console.error('Error matching user:', responseText);
      }
    } catch (error) {
      console.error('Error matching user:', error);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/(tabs)/PostDetailScreen?postId=${postId}`)}
      activeOpacity={0.9}
    >
      <View style={styles.container}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <MaterialIcons name="person" size={24} color="#ccc" />
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userUniversity}>{university}</Text>
              <View style={styles.starsRow}>
                <MaterialIcons name="star" size={16} color="#4b39ef" />
                <Text style={styles.starsText}>{stars}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.userBio} numberOfLines={3}>
            {bio}
          </Text>
        </View>

        {/* Map Section */}
        <View style={styles.mapSection}>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Polyline
                coordinates={typeof route === 'string' ? JSON.parse(JSON.parse(route)) : route}
                strokeWidth={2}
                strokeColor="#4b39ef"
              />
              <Marker
                coordinate={userLocation}
                title="Passenger Location"
                description="Current location of the passenger"
              />
            </MapView>
          </View>
          
          {/* Match Button */}
          <TouchableOpacity 
            style={styles.matchButton} 
            onPress={() => handleMatch(userId)}
            activeOpacity={0.8}
          >
            <Text style={styles.matchButtonText}>Eşleş</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    height: 180,
  },
  profileSection: {
    flex: 1,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#f1f1f4',
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f1f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  userUniversity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  userBio: {
    fontSize: 12,
    color: '#444',
    lineHeight: 16,
    flex: 1,
  },
  mapSection: {
    width: '50%',
    position: 'relative',
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  matchButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#4b39ef',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default InterestedUser; 