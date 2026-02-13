'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '@/env';
import { MaterialIcons } from '@expo/vector-icons';
import { lightTheme as theme } from '@/styles/theme';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [id, setId] = useState('');

  const router = useRouter();

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

        if (response.ok) {
          const data = await response.json();
          setName(data.name);
          setUniversity(data.university);
          setFaculty(data.faculty);
          setBio(data.bio);
          setGender(data.gender);
          setId(data.id);
        } else {
          console.error('Error fetching profile:', await response.json());
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveChanges = async () => {
    const token = await AsyncStorage.getItem('token');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('university', university);
    formData.append('faculty', faculty);
    formData.append('bio', bio);
    formData.append('gender', gender);

    if (profilePhoto) {
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
      console.log('Profile updated successfully');
      router.push('/(drawer)/ProfileScreen');
    } else {
      console.error('Error updating profile:', await response.json());
    }
  };

  const handleProfilePhotoChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
      </View>

      {/* Profile Photo */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handleProfilePhotoChange} style={styles.avatarContainer}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={60} color="#ccc" />
            </View>
          )}
          <View style={styles.editIconContainer}>
            <MaterialIcons name="photo-camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.photoHint}>Fotoğrafı değiştir</Text>
      </View>

      {/* Form Fields */}
      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tam Adınız</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Tam Adınız"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Üniversitesi</Text>
          <TextInput
            style={styles.input}
            value={university}
            onChangeText={setUniversity}
            placeholder="Your university"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fakültesi</Text>
          <TextInput
            style={styles.input}
            value={faculty}
            onChangeText={setFaculty}
            placeholder="Fakültesi"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Biyografi</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cinsiyet</Text>
          <View style={styles.genderContainer}>
            {['Erkek', 'Kadın', 'Diğer'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.genderOption,
                  gender === option && styles.genderOptionSelected
                ]}
                onPress={() => setGender(option)}
              >
                <Text style={[
                  styles.genderText,
                  gender === option && styles.genderTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>İptal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveChanges}
        >
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    color: '#000',
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f1f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4b39ef',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#444',
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#4b39ef',
  },
  genderText: {
    color: '#444',
    fontWeight: '500',
  },
  genderTextSelected: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    marginRight: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    marginLeft: 6,
    backgroundColor: '#4b39ef',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
}); 