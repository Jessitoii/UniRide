'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { BASE_URL } from '../../env';
import Review from '../../components/Review';
import Post from '../../components/Post';

export default function UserProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profilePhoto, setProfilePhoto] = useState<string>('https://via.placeholder.com/80'); // Default avatar
  const [reviews, setReviews] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [comment, setComment] = useState<string>('');
  const [star, setStar] = useState<number>(0);
  const route = useRoute();
  const { id } = route.params as { id: string };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/users/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setPosts(data.posts);
          fetchProfilePhoto(data.id);
          fetchReviews(data.id);
        } else {
          console.error('Profile fetch error:', await response.json());
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
          setProfilePhoto('https://img.icons8.com/ios/50/gender-neutral-user--v1.png'); // Set default avatar on error
        }
      } catch (error) {
        console.error('Error fetching profile photo:', error);
        setProfilePhoto('https://img.icons8.com/ios/50/gender-neutral-user--v1.png'); // Set default avatar on error
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
  }, [id]);

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
        <Image source={{ uri: profilePhoto }} style={styles.avatar} />
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
        <Text style={styles.infoLabel}>Email: {profile.email}</Text>
        <Text style={styles.infoLabel}>Gender: {profile.gender}</Text>
        <Text style={styles.infoLabel}>Birth Date: {new Date(profile.birthDate).toLocaleDateString()}</Text>
        <Text style={styles.infoLabel}>Joined: {new Date(profile.createdAt).toLocaleDateString()}</Text>
      </View>
      
      <View style={styles.reviewsContainer}>
        <Text style={styles.reviewsTitle}>Reviews</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <Review
                key={index}
                userId={review.userId}
                name={review.user.name}
                surname={review.user.surname}
                comment={review.comment}
                star={review.star}
              />
            ))
          ) : (
            <Text style={styles.noReviewsText}>This user has no reviews yet.</Text>
          )}
        </ScrollView>
      </View>
      <View style={styles.postsContainer}>
        <Text style={styles.postsTitle}>Posts</Text>
        {posts.map((post, index) => (
          <Post
            key={index}
            id={post.id}
            userId={post.userId}
            title={`${post.sourceAddress} ➡️ ${post.destinationAddress}`}
            userName={profile.name}
            date={new Date(post.datetimeStart).toLocaleDateString()}
            time={new Date(post.datetimeStart).toLocaleTimeString()}
            price={post.price}
            route={post.route}
            interested={true}
            userLocation={null}
            onPress={()=>{}}
          />
        ))}
      </View>
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
  infoLabel: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  reviewForm: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reviewFormTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  submitButton: {
    backgroundColor: '#000',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  reviewsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 10,
  },
  postsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
}); 