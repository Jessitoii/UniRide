'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/env';
import { MaterialIcons } from '@expo/vector-icons';
import InterestedUser from '@/components/InterestedUser';
import { theme } from '@/styles/theme';
import { useNotifications } from '@/contexts/NotificationContext';

export default function DriverScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<string>(`${BASE_URL}/api/users/profilePhoto/default`);
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { unreadCount } = useNotifications();
  const router = useRouter();

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Fetch profile data
      const profileResponse = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setProfile(data);

        // Fetch profile photo if user exists
        if (data.id) {
          setProfilePhoto(`${BASE_URL}/api/users/profilePhoto/${data.id}`);
        }
      } else {
        console.error('Error fetching profile:', await profileResponse.json());
      }

      // Fetch car information
      const carResponse = await fetch(`${BASE_URL}/api/cars`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (carResponse.ok) {
        const carData = await carResponse.json();
        setCar(carData);
      } else {
        console.error('Error fetching car information:', await carResponse.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const navigateToScreen = (screen: string, params?: any) => {
    if (params) {
      router.push({ pathname: `/(drawer)/${screen}` as any, params });
    } else {
      router.push(`/(drawer)/${screen}` as any);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Sürücü bilgileri yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={styles.header}>

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Sürücü Sayfası</Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigateToScreen('NotificationsScreen')}>
            <MaterialIcons name="notifications" size={24} color="#333" />
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }>
        <View style={styles.profileContainer}>
          <TouchableOpacity
            onPress={() => navigateToScreen('UserProfileScreen', { id: profile.id })}
            style={styles.avatarContainer}>
            <Image
              source={{ uri: profilePhoto }}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.name} {profile?.surname}</Text>
            <Text style={styles.profileRole}>{profile?.bio || 'Sürücü'}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <MaterialIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.statText}>{profile?.stars || '0'}</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="directions-car" size={16} color={theme.colors.primary} />
                <Text style={styles.statText}>{profile?.ridesCompleted || '0'} Yolculuk</Text>
              </View>
            </View>
          </View>
        </View>



        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="directions-car" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>ARABAM</Text>
          </View>

          {car ? (
            <View style={styles.carInfo}>
              <View>
                <Text style={styles.carModel}>{car.brand} {car.model}</Text>
                <Text style={styles.carDetail}>{car.plate}</Text>
                <Text style={styles.carDetail}>{car.color}, {car.year}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigateToScreen('CarDetail')}>
                <Text style={styles.editButtonText}>Düzenle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noCarContainer}>
              <Text style={styles.noCarText}>Henüz araç bilgileriniz yok</Text>
              <TouchableOpacity
                style={styles.addCarButton}
                onPress={() => navigateToScreen('CarDetail')}>
                <Text style={styles.addCarButtonText}>Araç Ekle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="people" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>İLGİLENEN YOLCULAR</Text>
          </View>

          {profile?.interestedIn && profile.interestedIn.filter((interestedIn: any) =>
            interestedIn.post && new Date(interestedIn.post.datetimeStart) > new Date()
          ).length > 0 ? (
            profile.interestedIn
              .filter((interestedIn: any) =>
                interestedIn.post && new Date(interestedIn.post.datetimeStart) > new Date()
              )
              .map((interestedIn: any) => (
                <InterestedUser
                  key={interestedIn.id}
                  postId={interestedIn.post.id}
                  userId={interestedIn.user.id}
                  userName={interestedIn.user.name}
                  university={interestedIn.user.university}
                  bio={interestedIn.user.bio}
                  route={JSON.parse(JSON.parse(interestedIn.post.route))}
                  userLocation={JSON.parse(interestedIn.locationCoordinates)}
                  stars={interestedIn.user.stars}
                  matched={interestedIn.matched}
                />
              ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="person-outline" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>
                Şu an güzergahınızla ilgilenen bir yolcu yok.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(drawer)/(tabs)/PostScreen')}>
            <MaterialIcons name="add-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Yeni Yolculuk Oluştur</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigateToScreen('TravelsScreen')}>
            <MaterialIcons name="history" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Yolculuk Geçmişi</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  header: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'center',
    justifyContent: 'flex-start',
  },
  notificationButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
  },
  profileContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 4,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  balanceInfo: {
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  balanceButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginRight: 8,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 8,
  },
  carInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carModel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  carDetail: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  noCarContainer: {
    alignItems: 'center',
    padding: 16,
  },
  noCarText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 12,
  },
  addCarButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addCarButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  actionsContainer: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

