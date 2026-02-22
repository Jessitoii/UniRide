'use client';

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local imports
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { useTranslation } from 'react-i18next';
import { userService } from '@/services/userService';

// Types
interface CarFormData {
  brand: string;
  model: string;
  photoUri: string | null;
}

export default function CarDetail() {
  // State
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CarFormData>({
    brand: '',
    model: '',
    photoUri: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);

  // Theme
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Router
  const router = useRouter();

  // Form change handlers
  const handleChange = (field: keyof CarFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMessage(null); // Clear error on input change
  };

  // Image picker
  const pickImage = useCallback(async () => {
    try {
      // Request permission if needed
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          t('permission_required'),
          t('photo_library_permission')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData(prev => ({ ...prev, photoUri: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setErrorMessage(t('error_access_gallery'));
    }
  }, []);

  // Form validation
  const validateForm = (): boolean => {
    if (!formData.brand.trim()) {
      setErrorMessage(t('enter_car_brand'));
      return false;
    }

    if (!formData.model.trim()) {
      setErrorMessage(t('enter_car_model'));
      return false;
    }

    return true;
  };

  // Save car details
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        setErrorMessage(t('login_required_save_car'));
        return;
      }

      // First save the car details
      const car = await userService.updateVehicleInfo(formData.brand, formData.model);

      // Upload car photo if provided
      if (formData.photoUri) {
        const photoFormData = new FormData();

        // Prepare the image for upload
        const filename = formData.photoUri.split('/').pop() || 'car.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        photoFormData.append('photo', {
          uri: Platform.OS === 'android'
            ? formData.photoUri
            : formData.photoUri.replace('file://', ''),
          type,
          name: filename,
        } as any);

        await userService.uploadCarPhoto(car.id, photoFormData);
      }

      Alert.alert(
        t('success'),
        t('car_saved_success'),
        [{ text: t('ok'), onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving car details:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [formData, router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          headerTitle: "", // Hide default title
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          headerRight: () => null, // Remove header save button
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.mainTitle}>{t('basic_info')}</Text>
            <Text style={styles.subtitle}>
              {t('car_details_desc')}
            </Text>
          </View>

          {/* Error message */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color={theme.colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Brand Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('car_brand')}</Text>
              <View style={[
                styles.inputWrapper,
                activeField === 'brand' && styles.inputWrapperActive
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder={t('select_car_brand')}
                  placeholderTextColor={theme.colors.textLight}
                  value={formData.brand}
                  onChangeText={(text) => handleChange('brand', text)}
                  onFocus={() => setActiveField('brand')}
                  onBlur={() => setActiveField(null)}
                />
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.textLight} />
              </View>
              <Text style={styles.helperText}>{t('car_brand_helper')}</Text>
            </View>

            {/* Model Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('car_model')}</Text>
              <View style={[
                styles.inputWrapper,
                activeField === 'model' && styles.inputWrapperActive
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder={t('select_car_model')}
                  placeholderTextColor={theme.colors.textLight}
                  value={formData.model}
                  onChangeText={(text) => handleChange('model', text)}
                  onFocus={() => setActiveField('model')}
                  onBlur={() => setActiveField(null)}
                />
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.textLight} />
              </View>
              <Text style={styles.helperText}>{t('select_brand_first')}</Text>
            </View>

            {/* Photo Upload */}
            <View style={styles.photoSection}>
              <Text style={styles.label}>{t('car_photo')}</Text>
              <TouchableOpacity
                style={[
                  styles.photoUploadContainer,
                  formData.photoUri ? styles.photoUploadContainerFilled : styles.photoUploadContainerEmpty
                ]}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                {formData.photoUri ? (
                  <>
                    <Image source={{ uri: formData.photoUri }} style={styles.photoImage} resizeMode="cover" />
                    <View style={styles.editOverlay}>
                      <MaterialIcons name="edit" size={16} color="white" />
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyPhotoContent}>
                    <View style={styles.iconCircle}>
                      <MaterialIcons name="add-a-photo" size={32} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.uploadText}>{t('tap_to_add_photo')}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.helperText}>{t('car_photo_helper')}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer with Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!formData.brand || !formData.model) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={isLoading || !formData.brand || !formData.model}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeType) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg, // 20px
    paddingBottom: theme.spacing.xl,
  },
  headerSection: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  mainTitle: {
    ...theme.textStyles.header2, // Large bold header
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '15',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    ...theme.textStyles.body,
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  formContainer: {
    gap: theme.spacing.xl,
  },
  inputGroup: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.textStyles.bodyBold,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 56, // Taller touch target
  },
  inputWrapperActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface, // Ensure surface background is maintained
  },
  input: {
    flex: 1,
    ...theme.textStyles.body,
    height: '100%',
  },
  helperText: {
    ...theme.textStyles.caption,
    marginTop: 4,
  },
  photoSection: {
    gap: theme.spacing.sm,
  },
  photoUploadContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.borderRadius.lg, // More rounded
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoUploadContainerEmpty: {
    borderWidth: 2,
    borderColor: theme.colors.primary + '40', // Faded primary
    borderStyle: 'dashed',
    backgroundColor: theme.colors.surface,
  },
  photoUploadContainerFilled: {
    backgroundColor: theme.colors.textLight, // Placeholder background
  },
  emptyPhotoContent: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    ...theme.textStyles.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  editOverlay: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.textLight,
    opacity: 0.7,
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});