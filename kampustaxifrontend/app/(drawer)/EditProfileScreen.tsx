'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '@/env';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { useTranslation } from 'react-i18next';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();

  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

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
        setName(data.name || '');
        setUniversity(data.university || '');
        setFaculty(data.faculty || '');
        setBio(data.bio || '');
        setGender(data.gender || '');
        // If profile photo URL exists, set it
        if (data.id) {
          // Check if photo exists via API or just construct URL?
          // Using existing logic from other files:
          setProfilePhoto(`${BASE_URL}/api/users/profilePhoto/${data.id}`);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', name);
      formData.append('university', university);
      formData.append('faculty', faculty);
      formData.append('bio', bio);
      formData.append('gender', gender);

      if (profilePhoto && !profilePhoto.startsWith('http')) {
        const photo = {
          uri: profilePhoto,
          type: 'image/jpeg',
          name: 'profile.jpg',
        };
        formData.append('profilePhoto', photo as any);
      }

      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        router.back();
      } else {
        console.error(t('error_update_profile'));
      }
    } catch (error) {
      console.error(t('error_update_profile'), error);
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePhotoChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const getInputStyle = (field: string) => [
    styles(theme).input,
    focusedInput === field && styles(theme).inputFocused
  ];

  if (loading) {
    return (
      <View style={styles(theme).centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles(theme).container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles(theme).header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles(theme).backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textDark} />
        </TouchableOpacity>
        <Text style={styles(theme).headerTitle}>{t('edit_profile_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Avatar Section */}
      <View style={styles(theme).avatarSection}>
        <TouchableOpacity
          onPress={handleProfilePhotoChange}
          style={styles(theme).avatarContainer}
          activeOpacity={0.8}
        >
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles(theme).avatar} />
          ) : (
            <View style={styles(theme).avatarPlaceholder}>
              <MaterialIcons name="person" size={48} color={theme.colors.textLight} />
            </View>
          )}
          <View style={styles(theme).editIconContainer}>
            <MaterialIcons name="camera-alt" size={18} color="white" />
          </View>
        </TouchableOpacity>
        <Text style={styles(theme).photoHint}>{t('change_photo')}</Text>
      </View>

      {/* Form Fields */}
      <View style={styles(theme).formSection}>
        <View style={styles(theme).inputGroup}>
          <Text style={styles(theme).label}>{t('full_name')}</Text>
          <TextInput
            style={getInputStyle('name')}
            value={name}
            onChangeText={setName}
            onFocus={() => setFocusedInput('name')}
            onBlur={() => setFocusedInput(null)}
            placeholder={t('full_name_placeholder')}
            placeholderTextColor={theme.colors.textLight}
          />
        </View>

        <View style={styles(theme).inputGroup}>
          <Text style={styles(theme).label}>{t('university')}</Text>
          <TextInput
            style={getInputStyle('university')}
            value={university}
            onChangeText={setUniversity}
            onFocus={() => setFocusedInput('university')}
            onBlur={() => setFocusedInput(null)}
            placeholder={t('university_placeholder')}
            placeholderTextColor={theme.colors.textLight}
          />
        </View>

        <View style={styles(theme).inputGroup}>
          <Text style={styles(theme).label}>{t('faculty')}</Text>
          <TextInput
            style={getInputStyle('faculty')}
            value={faculty}
            onChangeText={setFaculty}
            onFocus={() => setFocusedInput('faculty')}
            onBlur={() => setFocusedInput(null)}
            placeholder={t('faculty_placeholder')}
            placeholderTextColor={theme.colors.textLight}
          />
        </View>

        <View style={styles(theme).inputGroup}>
          <Text style={styles(theme).label}>{t('bio')}</Text>
          <TextInput
            style={[getInputStyle('bio'), styles(theme).bioInput]}
            value={bio}
            onChangeText={setBio}
            onFocus={() => setFocusedInput('bio')}
            onBlur={() => setFocusedInput(null)}
            placeholder={t('bio_placeholder')}
            placeholderTextColor={theme.colors.textLight}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles(theme).inputGroup}>
          <Text style={styles(theme).label}>{t('gender')}</Text>
          <View style={styles(theme).genderContainer}>
            {[t('male'), t('female'), t('prefer_not_to_say')].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles(theme).genderOption,
                  gender === option && styles(theme).genderOptionSelected
                ]}
                onPress={() => setGender(option)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles(theme).genderText,
                  gender === option && styles(theme).genderTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles(theme).footer}>
        <TouchableOpacity
          style={styles(theme).saveButton}
          onPress={handleSaveChanges}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles(theme).saveButtonText}>{t('save_changes')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    padding: 4,
    backgroundColor: theme.colors.card,
    borderRadius: 75,
    ...theme.shadows.sm,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    padding: 10,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  photoHint: {
    ...theme.textStyles.caption,
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.textStyles.body,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  bioInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  genderOption: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  genderOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  genderText: {
    ...theme.textStyles.caption,
    color: theme.colors.text,
    fontWeight: '500',
  },
  genderTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  saveButtonText: {
    ...theme.textStyles.button,
    color: 'white',
    fontSize: 16,
  },
});