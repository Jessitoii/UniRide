'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BASE_URL } from '@/env';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';

interface ProfileProps {
  userId: string;
  userName: string;
  university: string;
  bio: string;
  stars: number;
}

const Profile: React.FC<ProfileProps> = ({ userId, userName, university, bio, stars }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={() => {
      router.push({
        pathname: '/(drawer)/UserProfileScreen',
        params: { id: userId }
      });
    }}>
      <View>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{userName}</Text>
        <Text style={styles.university} numberOfLines={1} ellipsizeMode="tail">{university}</Text>
        <View style={styles.starsContainer}>
          {Array.from({ length: Math.round(stars) }, (_, index) => (
            <Text key={index} style={styles.star}>⭐</Text>
          ))}
        </View>
        <Text style={styles.bio} numberOfLines={2} ellipsizeMode="tail">{truncateBio(bio, 24)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: '100%',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
    // Fix shadow/elevation logic
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20, // Full circle
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  infoContainer: {
    marginTop: theme.spacing.xs,
  },
  userName: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textDark,
  },
  university: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
    marginVertical: 4,
    fontFamily: theme.typography.fontFamily.regular,
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  star: {
    fontSize: 12,
    color: theme.colors.warning,
  },
  bio: {
    fontSize: 10,
    fontStyle: 'italic',
    color: theme.colors.textLight,
    marginTop: 8,
    fontFamily: theme.typography.fontFamily.regular,
  },
});

export default Profile; 