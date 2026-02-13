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
  useColorScheme,
  Alert,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local imports
import { BASE_URL } from '@/env';
import { lightTheme, darkTheme, ThemeType } from '@/styles/theme';

// Types
interface CarFormData {
  brand: string;
  model: string;
  photoUri: string | null;
}

export default function CarDetail() {
  // State
  const [formData, setFormData] = useState<CarFormData>({
    brand: '',
    model: '',
    photoUri: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Theme
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

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
          "Permission Required",
          "You need to grant access to your photo library to select an image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData(prev => ({ ...prev, photoUri: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setErrorMessage('Could not access the image library');
    }
  }, []);

  // Form validation
  const validateForm = (): boolean => {
    if (!formData.brand.trim()) {
      setErrorMessage('Please enter your car brand');
      return false;
    }

    if (!formData.model.trim()) {
      setErrorMessage('Please enter your car model');
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
        setErrorMessage('You must be logged in to save your car details');
        return;
      }

      // First save the car details
      const carResponse = await fetch(`${BASE_URL}/api/cars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          brand: formData.brand,
          model: formData.model
        }),
      });

      if (!carResponse.ok) {
        const errorData = await carResponse.json();
        throw new Error(errorData.message || 'Failed to save car details');
      }

      const car = await carResponse.json();

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

        const photoResponse = await fetch(`${BASE_URL}/api/cars/${car.id}/photo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
          body: photoFormData,
        });

        if (!photoResponse.ok) {
          throw new Error('Failed to upload car photo');
        }
      }

      Alert.alert(
        "Success",
        "Your car details have been saved successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving car details:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [formData, router]);

  return (
    <ScrollView
      style={styles(theme).container}
      contentContainerStyle={styles(theme).contentContainer}
    >
      {/* Header */}
      <View style={styles(theme).header}>
        <TouchableOpacity
          style={styles(theme).backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textDark} />
        </TouchableOpacity>
        <Text style={styles(theme).headerText}>Car Details</Text>
      </View>

      {/* Error message */}
      {errorMessage && (
        <View style={styles(theme).errorContainer}>
          <MaterialIcons name="error-outline" size={20} color={theme.colors.error} />
          <Text style={styles(theme).errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Form sections */}
      <View style={styles(theme).formSection}>
        <Text style={styles(theme).sectionTitle}>Basic Information</Text>
        <Text style={styles(theme).sectionDescription}>
          Please provide your car details for better identification
        </Text>

        {/* Brand field */}
        <View style={styles(theme).inputGroup}>
          <Text style={styles(theme).label}>Car Brand</Text>
          <TextInput
            style={styles(theme).input}
            placeholder="Select your car brand"
            placeholderTextColor={theme.colors.textLight}
            value={formData.brand}
            onChangeText={(text) => handleChange('brand', text)}
          />
          <Text style={styles(theme).helperText}>
            Choose your car brand from the list
          </Text>
        </View>

        {/* Model field */}
        <View style={styles(theme).inputGroup}>
          <Text style={styles(theme).label}>Car Model</Text>
          <TextInput
            style={styles(theme).input}
            placeholder="Select your car model"
            placeholderTextColor={theme.colors.textLight}
            value={formData.model}
            onChangeText={(text) => handleChange('model', text)}
          />
          <Text style={styles(theme).helperText}>
            Please select your car brand first
          </Text>
        </View>
      </View>

      {/* Photo section */}
      <View style={styles(theme).formSection}>
        <Text style={styles(theme).sectionTitle}>Car Photo</Text>
        <Text style={styles(theme).sectionDescription}>
          Add a clear photo of your car to help passengers identify you
        </Text>

        <TouchableOpacity
          style={styles(theme).photoContainer}
          onPress={pickImage}
          activeOpacity={0.8}
        >
          {formData.photoUri ? (
            <Image
              source={{ uri: formData.photoUri }}
              style={styles(theme).photo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles(theme).photoPlaceholder}>
              <MaterialIcons name="add-a-photo" size={48} color={theme.colors.primary} />
              <Text style={styles(theme).photoPlaceholderText}>
                Tap to add a photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles(theme).helperText}>
          Please use a recent photo of your car to help passengers recognize it easily
        </Text>
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={[
          styles(theme).saveButton,
          (isLoading || !formData.brand || !formData.model) && styles(theme).saveButtonDisabled
        ]}
        onPress={handleSave}
        disabled={isLoading || !formData.brand || !formData.model}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.white} />
        ) : (
          <Text style={styles(theme).saveButtonText}>Save Car Details</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

/**
 * Component styles using dynamic theme system
 */
const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing['3xl'],
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  headerText: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '15',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  errorText: {
    ...theme.textStyles.body,
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  formSection: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.textStyles.bodySmall,
    fontWeight: '500',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  input: {
    height: 48,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textDark,
    fontSize: 16,
  },
  helperText: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  photoContainer: {
    aspectRatio: 4 / 3,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.divider,
    marginVertical: theme.spacing.sm,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
  },
  photoPlaceholderText: {
    ...theme.textStyles.body,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  saveButton: {
    marginTop: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    height: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.base,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.primary + '80',
    ...theme.shadows.sm,
  },
  saveButtonText: {
    ...theme.textStyles.button,
    color: theme.colors.white,
  },
}); 