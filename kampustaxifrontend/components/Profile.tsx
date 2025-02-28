'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BASE_URL } from '../env';
import { useRouter } from 'expo-router';

interface ProfileProps {
  userId: string;
  userName: string;
  university: string;
  bio: string;
  stars: number;
}

const Profile: React.FC<ProfileProps> = ({ userId, userName, university, bio, stars }) => {
  const [avatar, setAvatar] = useState<string>('https://img.icons8.com/ios/50/gender-neutral-user--v1.png');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/users/profilePhoto/${userId}`);
        if (response.ok) {
          setAvatar(`${BASE_URL}/api/users/profilePhoto/${userId}`);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user avatar:', error);
      }
    };

    fetchAvatar();
  }, [userId]);

  const truncateBio = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.container} >
      <TouchableOpacity onPress={() => {
        router.push({
          pathname: '/(tabs)/UserProfileScreen',
          params: { id: userId }
        });
      }}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </TouchableOpacity>
      <View style={styles.infoContainer}>
        <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{userName}</Text>
        <Text style={styles.university} numberOfLines={1} ellipsizeMode="tail">{university}</Text>
        <View style={styles.starsContainer}>
          {Array.from({ length: stars }, (_, index) => (
            <Text key={index} style={styles.star}>⭐</Text>
          ))}
        </View>
        <Text style={styles.bio} numberOfLines={2} ellipsizeMode="tail">{truncateBio(bio, 24)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: '100%',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#007bff',
  },
  infoContainer: {
    
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  university: {
    fontSize: 12,
    color: '#666',
    marginVertical: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  star: {
    fontSize: 16,
    color: '#FFD700',
  },
  bio: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#555',
    marginTop: 8,
  },
});

export default Profile; 