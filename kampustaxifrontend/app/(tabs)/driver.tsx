'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../env';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import InterestedUser from '../../components/InterestedUser';

type DriverScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DriverScreen'>;

export default function DriverScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<string>('https://img.icons8.com/ios/50/gender-neutral-user--v1.png');
  const [car, setCar] = useState<any>(null);

  const router = useRouter();
  const navigation = useNavigation<DriverScreenNavigationProp>();

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
          setProfile(data);
          console.log("İnterested in : " , data.interestedIn);
          
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

    const fetchCarInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/api/cars`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const carData = await response.json();
          setCar(carData);
        } else {
          console.error('Error fetching car information:', await response.json());
        }
      } catch (error) {
        console.error('Error fetching car information:', error);
      }
    };

    fetchProfile();
    fetchCarInfo();
  }, []);

  const navigateToPostDetail = (postId: string) => {
    navigation.navigate('PostDetailScreen', {
      postId,
      userLocation: null, // Pass the selected location
    });
  };

  const navigateToCarDetail = () => {
    router.push('/(tabs)/CarDetail');
  };

  const navigateToWallet = () => {
    router.push('/(tabs)/Wallet');
  };

  if (!profile) {
    return <Text>Loading...</Text>; // Add a loading state
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Sürücü Sayfası</Text>
      </View>

      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={() => {
          router.push({
            pathname: '/(tabs)/UserProfileScreen',
            params: { id: profile.id }
          });
        }}>
          <Image source={{ uri: profilePhoto }} style={styles.avatar} />
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.name} {profile?.surname}</Text>
          <Text style={styles.profileRole}>{profile?.bio}</Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceText}>Mevcut bakiye</Text>
          <Text style={styles.balanceAmount}>{profile.wallet.earningsBalance + "₺"}</Text>
          <TouchableOpacity style={styles.detailsButton} onPress={navigateToWallet}>
            <Text style={styles.detailsButtonText}>Detaylar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.carContainer}>
        <Text style={styles.carTitle}>ARABAM</Text>
        <View style={styles.carInfo}>
          <Text style={styles.carModel}>{car ? `${car.brand} ${car.model}` : 'No car information available'}</Text>
          <TouchableOpacity style={styles.editCarButton} onPress={navigateToCarDetail}>
            <Text style={styles.editCarButtonText}>Arabamı düzenle</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.interestedUsersContainer}>
        <Text style={styles.interestedUsersTitle}>Interested Users:</Text>
        {profile?.interestedIn?.length > 0 ? (
          profile.interestedIn.filter((interestedIn: any) => interestedIn.post.datetimeStart > new Date()).map((interestedIn: any) => (
            <InterestedUser
              key={interestedIn.id}
              postId={interestedIn.post.id}
              userId={interestedIn.user.id}
              userName={interestedIn.user.name}
              university={interestedIn.user.university}
              bio={interestedIn.user.bio}
              route={interestedIn.post.route}
              userLocation={JSON.parse(interestedIn.locationCoordinates)}
              stars={interestedIn.user.stars}
            />
          ))
        ) : (
          <Text style={styles.noInterestedText}>Şu an yolculuklarınızla ilgilenen bir yolcu yok.</Text>
        )}
      </View>

      <TouchableOpacity style={styles.settingsButton}>
        <Text style={styles.settingsButtonText}>Sürücü Ayarları</Text>
      </TouchableOpacity>
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
    paddingHorizontal: 12,
    boxShadow: '0px 0px 6px rgba(0, 0, 0, 0.12)',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  profileRole: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
  },
  detailsButton: {
    marginTop: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#000',
    borderRadius: 4,
  },
  detailsButtonText: {
    fontSize: 12,
    color: '#fff',
  },
  carContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  carTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  carInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carModel: {
    fontSize: 14,
    color: '#000',
  },
  editCarButton: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#000',
    borderRadius: 4,
  },
  editCarButtonText: {
    fontSize: 12,
    color: '#fff',
  },
  postsContainer: {
    padding: 12,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  postItem: {
    marginBottom: 16,
  },
  interestedUsersContainer: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    marginTop: -16
  },
  interestedUsersTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  interestedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  interestedUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  interestedUserName: {
    fontSize: 14,
    color: '#333',
  },
  noInterestedText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 10,
  },
  settingsButton: {
    margin: 12,
    paddingVertical: 10,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});
