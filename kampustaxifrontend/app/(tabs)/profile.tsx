'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Review from '../../components/Review';
import { BASE_URL } from '../../env';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState<any>({});
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
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
        
        if (response.status === 403) {
          await AsyncStorage.removeItem('token');
          router.replace('/auth/login');
          return;
        }

        const data = await response.json();
        if (response.ok) {
          setProfile(data);
          setFormData(data);
          fetchProfilePhoto(data.id);
          fetchReviews(data.id);
        } else {
          console.error('Profile fetch error:', data.message);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfilePhoto = async (userId: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/users/profilePhoto/${userId}`);
        if (response.ok) {
          setProfilePhoto(`${BASE_URL}/api/users/profilePhoto/${userId}`);
        } else {
          console.error('Error fetching profile photo');
        }
      } catch (error) {
        console.error('Error fetching profile photo:', error);
      }
    };

    const fetchReviews = async (userId: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/review/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        } else {
          console.error('Error fetching reviews:', await response.json());
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/auth/login');
  };


  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error fetching profile information.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>User Profile</Text>
      </View>
      <View style={styles.profileInfo}>
        <TouchableOpacity onPress={()=>{router.push({
      pathname: '/(tabs)/UserProfileScreen',
      params: { id: profile.id }
    });}}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </TouchableOpacity>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{profile.name} {profile.surname}</Text>
          <Text style={styles.university}>{profile.university} University</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
          <View style={styles.stars}>
            <Text>{'⭐'.repeat(profile.stars)} ({reviews.length})</Text>
          </View>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>Personal Information</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/(tabs)/edit-profile')}>
            <Text style={styles.editButtonText}>Profili düzenle</Text>
          </TouchableOpacity>
        </View>
        {profile && (
          <>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>University</Text>
              <Text style={styles.infoValue}>{profile.university}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Faculty</Text>
              <Text style={styles.infoValue}>{profile.faculty}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{profile.gender}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>{new Date(profile.createdAt).toLocaleDateString()}</Text>
            </View>
          </>
        )}
      </View>
      <View style={styles.reviewsHeader}>
        <Text style={styles.reviewsTitle}>Reviews</Text>
      </View>
      <View style={styles.reviewsContainer}>
        {reviews.map((review, index) => (
          <Review
            key={index}
            userId={review.userId}
            name={review.user.name}
            surname={review.user.surname}
            comment={review.comment}
            star={review.star}
          />
        ))}
      </View>
      <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/(tabs)/settings')}>
        <Text style={styles.settingsButtonText}>Ayarlar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 72,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 40,
  },
  nameContainer: {
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  university: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  bio: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
    marginVertical: 4,
  },
  stars: {
    flexDirection: 'row',
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    fontSize: 12,
    color: '#000',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#000',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
  },
  reviewsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  reviewsContainer: {
    paddingHorizontal: 16,
  },
  settingsButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 10,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
}); 