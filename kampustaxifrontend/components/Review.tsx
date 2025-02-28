'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { BASE_URL } from '../env';

interface ReviewProps {
  name: string;
  surname: string;
  comment: string;
  star: number;
  userId: string;
}

const Review: React.FC<ReviewProps> = ({ name, surname, comment, star, userId }) => {
  const [profilePhoto, setProfilePhoto] = useState<string>('');

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
  }, []);

  return (
    <View style={styles.reviewContainer}>
      <View style={styles.header}>
        <Image
          source={{ uri: profilePhoto }}
          style={styles.avatar}
        />
        <Text style={styles.userName}>{name} {surname}</Text>
        <Text style={styles.stars}>{'⭐'.repeat(star)}</Text>
      </View>
      <Text style={styles.comment}>{comment}</Text>
      <View style={styles.reactions}>
        <Text style={styles.reaction}>👍</Text>
        <Text style={styles.reaction}>👎</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  reviewContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  stars: {
    fontSize: 16,
    color: '#f39c12',
  },
  comment: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  reactions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  reaction: {
    fontSize: 18,
    marginRight: 16,
  },
});

export default Review;
