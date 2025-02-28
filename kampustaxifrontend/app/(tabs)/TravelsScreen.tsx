'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../env';
import Post from '../../components/Post';
import PassedPost from '../../components/PassedPost';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';

type TravelsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TravelsScreen'>;

export default function TravelsScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const navigation = useNavigation<TravelsScreenNavigationProp>();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/api/users/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
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

    fetchProfile();
  }, []);

  const extractDistrict = (address: string | undefined) => {
    if (!address) {
      console.warn('Address is undefined');
      return '';
    }
    const parts = address.split(',');
    return parts.length > 1 ? parts[1].trim() : address;
  };

  const navigateToPostDetail = (postId: string) => {
    navigation.navigate('PostDetailScreen', {
      postId,
      userLocation: null, // Pass the selected location
    });
  };


  if (!profile) {
    return <Text>Loading...</Text>;
  }

  const now = new Date();
  const matchedPosts = profile.matchedPosts || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Travels</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={styles.tabText}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={styles.tabText}>Past</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'upcoming' ? (
        matchedPosts
          .filter((post: any) => new Date(post.datetimeStart) > now)
          .map((post: any) => (
            <View key={post.id}>
              <Post
                id={post.id}
                userId={post.userId}
                title={`${extractDistrict(post.sourceAddress)} ➡️ ${extractDistrict(post.destinationFaculty)}`}
                userName={profile.name}
                date={new Date(post.datetimeStart).toLocaleDateString()}
                time={new Date(post.datetimeStart).toLocaleTimeString()}
                price={post.price}
                route={post.route}
                interested={false}
                userLocation={null}
                onPress={() => navigateToPostDetail(post.id)}
              />
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => {
                  navigation.navigate('ChatScreen', {
                    roomId: post.id,
                    currentUserId: profile.id,
                    recipientId: post.matchedUserId, // Assuming recipientId is the same as postId for simplicity
                  });
                }}
              >
                <Text style={styles.chatButtonText}>Chat</Text>
              </TouchableOpacity>
            </View>
          ))
      ) : (
        matchedPosts
          .filter((post: any) => new Date(post.datetimeStart) < now)
          .map((post: any) => (
            <View key={post.id}>
              <PassedPost
                key={post.id}
                title={`${extractDistrict(post.sourceAddress)} ➡️ ${post.destinationFaculty}`}
                date={new Date(post.datetimeStart).toLocaleDateString()}
                time={new Date(post.datetimeStart).toLocaleTimeString()}
                price={post.price}
              />
            </View>
          ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 24,
  },
  header: {
    height: 48,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 8,
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabText: {
    color: '#000',
    fontWeight: '500',
  },
  chatButton: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
}); 