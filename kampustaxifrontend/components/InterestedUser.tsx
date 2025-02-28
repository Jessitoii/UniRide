'use client';

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Profile from './Profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../env';
import { useRouter } from 'expo-router';
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
  const router = useRouter();
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
    <TouchableOpacity style={styles.post} onPress={() => router.push(`/(tabs)/PostDetailScreen?postId=${postId}`)}>
      <View style={styles.imageContainer}>
        <View style={styles.image}>
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
              strokeColor="blue"
            />
            <Marker
              coordinate={userLocation}
              title="User Location"
              description="This is the user's location"
            />
          </MapView>
          <View style={styles.pagination}>
            <View style={styles.paginationChild} />
            <View style={styles.paginationItem} />
            <View style={styles.paginationItem} />
            <View style={styles.paginationItem} />
          </View>
        </View>
      </View>
      <View style={styles.article}>
        <Profile bio={bio} university={university} userName={userName} userId={userId} stars={stars} />
      </View>
      <TouchableOpacity style={styles.primary} onPress={() => handleMatch(userId)}>
        <Text style={styles.title2}>Eşleş</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  post: {
    width: '100%',
    position: 'relative',
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    boxSizing: 'border-box',
    height: 192,
    overflow: 'hidden',
    textAlign: 'center',
    fontSize: 12,
    color: '#000',
    fontFamily: 'Roboto',
  },
  imageContainer: {
    position: 'absolute',
    top: 8,
    left: 164,
    width: 212,
    height: 176,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    width: 218,
    height: 132,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  paginationChild: {
    width: 20,
    position: 'relative',
    borderRadius: 100,
    backgroundColor: '#fff',
    height: 4,
  },
  paginationItem: {
    width: 4,
    position: 'relative',
    borderRadius: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    height: 4,
  },
  avatar: {
    position: 'absolute',
    top: 8,
    left: 17,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    width: 46,
    height: 46,
    overflow: 'hidden',
  },
  userParent: {
    position: 'absolute',
    top: 8,
    left: 17,
    width: 148,
    height: 166,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 12,
    boxSizing: 'border-box',
  },
  user: {
    alignSelf: 'stretch',
    height: 26,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 4,
    boxSizing: 'border-box',
  },
  avatar1: {
    width: 136,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  titleWrapper: {
    width: 136,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  title1: {
    alignSelf: 'stretch',
    position: 'relative',
    lineHeight: 16,
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  avatarChild: {
    width: 58,
    position: 'relative',
    height: 10,
  },
  subtitle: {
    alignSelf: 'stretch',
    position: 'relative',
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    height: 18,
    flexShrink: 0,
  },
  subtitle1: {
    width: 136,
    position: 'relative',
    fontSize: 10,
    lineHeight: 20,
    textAlign: 'left',
    height: 114,
    flexShrink: 0,
  },
  article: {
    position: 'absolute',
    top: 8,
    left: 0,
    width: 165,
    height: 174,
    textAlign: 'right',
    fontSize: 15,
  },
  primary: {
    position: 'absolute',
    top: 148,
    left: 165,
    borderRadius: 8,
    backgroundColor: '#000',
    width: 211,
    height: 36,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    textAlign: 'left',
    fontSize: 16,
    color: 'white',
  },
  title2: {
    position: 'relative',
    lineHeight: 22,
    fontWeight: '500',
    color: 'white',
    fontSize: 16,
    fontFamily: 'Roboto',
  },
});

export default InterestedUser; 