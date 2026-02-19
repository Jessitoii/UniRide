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
import { useProfile } from '@/contexts/ProfileContext';
import { userService } from '@/services/userService';
import { getAvatarSource } from '@/utils/fetchProfilePhoto';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { profile, refreshProfile } = useProfile();

  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setUniversity((profile as any).university || '');
      setFaculty((profile as any).faculty || '');
      setBio((profile as any).bio || '');
      setGender((profile as any).gender || '');

      // Use helper to get correct source, then extract URI
      const source = getAvatarSource(profile);
      if (source && typeof source === 'object' && 'uri' in source) {
        setProfilePhoto(source.uri as string);
      } else {
        // It's a required local asset (number)
        setProfilePhoto(null);
      }
      setLoading(false);
    } else {
      // If no profile yet, wait for context (which handles fetch)
      // or manual fetch if context failed? Context should handle it.
      // If context is loading, we wait.
    }
  }, [profile]);

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');

      // 1. Upload Photo if changed (local file)
      if (profilePhoto && !profilePhoto.startsWith('http')) {
        const formData = new FormData();
        const photo = {
          uri: profilePhoto,
          type: 'image/jpeg',
          name: 'profile.jpg',
        };
        formData.append('profilePhoto', photo as any);
        await userService.updateProfilePhoto(formData);
      }

      // 2. Update Text Fields
      // Construct body manually as passing JSON
      const updateBody = {
        name,
        university,
        faculty,
        bio,
        gender
      };

      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateBody)
      });

      if (response.ok) {
        await refreshProfile();
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
      allowsEditing: true, // 1:1 Aspect Ratio enforced
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

  if (loading && !profile) {
    return (
      <View style={styles(theme).centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Determine what to show in avatar circle
  // If profilePhoto state is set (either from profile or new pick), use it. 
  // If null/empty, revert to default.
  // Note: if setProfilePhoto was set from remote URL, it works. 
  // If set from local picker, it works.
  // If null (meaning local default asset), we render default.

  const displayAvatar = profilePhoto ? { uri: profilePhoto } : getAvatarSource(null);

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
          <Image source={displayAvatar} style={styles(theme).avatar} />

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