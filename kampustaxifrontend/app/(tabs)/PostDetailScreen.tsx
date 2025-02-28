'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { BASE_URL } from '../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Post from '../../components/Post';
import InterestedUser from '../../components/InterestedUser';
import { appConfig } from '../../config/appConfig';

export default function PostDetailScreen() {
  const [post, setPost] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [avatars, setAvatars] = useState<{ [key: string]: string }>({});
  const route = useRoute();

  const { postId, userLocation } = route.params as { postId: string; userLocation: { latitude: number; longitude: number } | null };

  const extractDistrict = (address: string) => {
    // Assuming the district is the second part of the address split by commas
    const parts = address?.split(',');
    return parts?.length > 1 ? parts[1].trim() : address;
  };

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        const response = await fetch(`${appConfig.apiUrl}/api/posts/${postId}`);
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


  useEffect(() => {
    const fetchAvatars = async () => {
      if (post && post.interestedUsers) {
        const newAvatars: { [key: string]: string } = {};
        for (const interestedUser of post.interestedUsers) {
          newAvatars[interestedUser.user.id] = await getUserAvatar(interestedUser.user.id);
        }
        setAvatars(newAvatars);
      }
    };

    fetchAvatars();
  }, [post]);

  const handleInterested = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/posts/${postId}/interested`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('Marked as interested');
        // Optionally, update the state to reflect the change
      } else {
        console.error('Error marking as interested:', await response.json());
      }
    } catch (error) {
      console.error('Error marking as interested:', error);
    }
  };

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

  if (!post || !profile) {
    return <Text>Loading...</Text>;
  }

  const isOwner = post.userId === profile.id;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Post
        id={post.id}
        userId={post.userId}
        title={`${extractDistrict(post.sourceAddress)} ➡️ ${post.destinationFaculty}`}
        userName={post.user.name}
        date={new Date(post.datetimeStart).toLocaleDateString()}
        time={new Date(post.datetimeStart).toLocaleTimeString()}
        price={post.price}
        route={post.route}
        interested={false}
        userLocation={post.userId !== profile.id ? userLocation : null}
        onPress={() => console.log('Pressed post:', post.id)}
      />

      {isOwner ? (
        <View style={styles.interestedContainer}>
          <Text style={styles.interestedTitle}>İlgilenenler</Text>
          {post.interestedUsers?.map((interestedUser: any) => (
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
          ))}
        </View>
      ) : (
        <View style={styles.profileContainer}>
          <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
          <Text style={styles.userName}>{post.user.name}</Text>
          <Text style={styles.userDetails}>{post.user.details}</Text>
          <TouchableOpacity style={styles.interestedButton} onPress={handleInterested}>
            <Text style={styles.interestedButtonText}>Interested</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
    paddingTop: 50,
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: 200,
    marginTop: 16,
  },
  interestedContainer: {
    marginTop: 16,
    width: '100%',
  },
  interestedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  interestedButton: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  interestedButtonText: {
    color: '#fff',
    fontSize: 16,
  },
}); 