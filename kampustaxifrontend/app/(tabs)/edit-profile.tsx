'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '../../env';
import { MaterialIcons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
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
          fetchProfilePhoto(data.id);
        } else {
          console.error('Error fetching profile:', await response.json());
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
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
    
    console.log("sa");
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
      router.push('/(tabs)/profile');
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Profil Ayarları</Text>
      </View>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleProfilePhotoChange} style={styles.avatarWrapper}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>abiburayadüzenlemeyle ilgili bişiler koyak</Text>
            </View>
          )}
          <View style={styles.iconOverlay}>
            <MaterialIcons name="edit" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>İsim Soyisim</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.label}>University</Text>
        <TextInput
          style={styles.input}
          value={university}
          onChangeText={setUniversity}
        />
        <Text style={styles.label}>Fakülte</Text>
        <TextInput
          style={styles.input}
          value={faculty}
          onChangeText={setFaculty}
        />
        <Text style={styles.label}>Hakkımda</Text>
        <TextInput
          style={styles.input}
          value={bio}
          onChangeText={setBio}
        />
        <Text style={styles.label}>Cinsiyet</Text>
        <View style={styles.genderContainer}>
          {['Erkek', 'Kadın', 'Other'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.genderButton, gender === option && styles.genderButtonSelected]}
              onPress={() => setGender(option)}
            >
              <Text style={styles.genderButtonText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 72,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.7,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
  },
  iconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  form: {
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginTop: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#ddd',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#000',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: '#000',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#fff',
  },
}); 