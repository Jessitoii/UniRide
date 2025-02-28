import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Button } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CarDetail = () => {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/cars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ brand, model }),
      });

      if (response.ok) {
        const car = await response.json();
        if (photo) {
          const formData = new FormData();
          formData.append('photo', {
            uri: photo,
            type: 'image/jpeg',
            name: 'car.jpg',
          } as any);

          const photoResponse = await fetch(`${BASE_URL}/api/cars/${car.id}/photo`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          if (!photoResponse.ok) {
            const errorText = await photoResponse.text();
            console.error('Error uploading photo:', errorText);
            alert('Error uploading photo');
            return;
          }
        }
        alert('Car details saved successfully');
      } else {
        const errorText = await response.text();
        console.error('Error saving car details:', errorText);
        alert('Error saving car details');
      }
    } catch (error) {
      console.error('Error saving car details:', error);
      alert('An unexpected error occurred');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>ARABA Ayarları</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Otomobil Markası</Text>
        <TextInput
          style={styles.inputBox}
          placeholder="Type here to search for brand"
          value={brand}
          onChangeText={setBrand}
        />
        <Text style={styles.helperText}>Araba markanızı listeden seçebilirsiniz</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Otomobil Modeli</Text>
        <TextInput
          style={styles.inputBox}
          placeholder="Type here to search for model"
          value={model}
          onChangeText={setModel}
        />
        <Text style={styles.helperText}>Lütfen önce arabanızın markasını seçin</Text>
      </View>
      <View style={styles.photoSection}>
        <Text style={styles.label}>Otomobilinizin Fotoğrafı</Text>
        <TouchableOpacity style={styles.photoBox} onPress={pickImage}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <Text style={styles.photoText}>Select a photo</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.helperText}>Lütfen yolcuların sizi daha kolay tanıyabilmesi için güncel bir fotoğraf kullanınız</Text>
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Kaydet</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    height: 72,
    backgroundColor: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: 'black',
    fontSize: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
  },
  section: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'black',
  },
  inputBox: {
    width: '100%',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 4,
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  photoSection: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  photoBox: {
    width: '100%',
    height: 220,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  photoText: {
    textAlign: 'center',
    color: 'black',
    fontSize: 16,
    fontWeight: '500',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  saveButton: {
    width: '90%',
    paddingVertical: 12,
    backgroundColor: 'black',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CarDetail; 