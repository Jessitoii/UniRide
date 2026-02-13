import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Share } from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '@/env'; // Adjust path if needed. @ aliased?
import { useNotifications } from '@/contexts/NotificationContext'; // Adjust path
import { userService } from '@/src/services/userService'; // Adjust path. src is at root.

function CustomDrawerContent(props: DrawerContentComponentProps) {
    const [profile, setProfile] = useState<any>(null);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const { unreadCount } = useNotifications();
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    const data = await userService.getProfile();
                    setProfile(data);
                    setProfilePhoto(userService.getProfilePhotoUrl(data.id));
                }
            } catch (error) {
                console.error('Profile fetch error:', error);
                router.push('/auth/login');
            }
        };
        fetchProfile();
    }, []);

    const handleProfilePhotoChange = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setProfilePhoto(result.assets[0].uri);
            // TODO: Upload logic in userService
        }
    };

    if (!profile || !profilePhoto) {
        return (
            <DrawerContentScrollView {...props}>
                <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: '50%' }} />
                <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}>Yükleniyor...</Text>
            </DrawerContentScrollView>
        );
    }

    return (
        <DrawerContentScrollView {...props}>
            <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={handleProfilePhotoChange} style={styles.avatarWrapper}>
                    {/* Fallback if no photo */}
                    {profilePhoto ? (
                        <Image source={{ uri: profilePhoto }} style={styles.avatar} />
                    ) : (
                        <MaterialIcons name="person" size={80} color="#ccc" />
                    )}
                    <View style={styles.iconOverlay}>
                        <MaterialIcons name="edit" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>

                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{profile.name}</Text>
                </View>
                <TouchableOpacity style={styles.viewProfileButton} onPress={() => router.push('/(drawer)/ProfileScreen')}>
                    <Text style={styles.viewProfileText}>Profili Görüntüle</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.divider} />

            {/* Manual Drawer Items since we are customizing navigation */}

            <TouchableOpacity style={styles.drawerButton} onPress={() => router.push('/(drawer)/(tabs)/PassengerScreen')}>
                <MaterialIcons name='home' size={24} color='gray' />
                <Text style={styles.drawerButtonText}>Ana Sayfa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.drawerButton} onPress={() => router.push('/(drawer)/NotificationsScreen')}>
                <View style={styles.drawerButtonIcon}>
                    <MaterialIcons name='notifications' size={24} color='gray' />
                    {unreadCount > 0 && (
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.drawerButtonText}>Bildirimler</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.drawerButton} onPress={() => { Share.share({ url: `${BASE_URL}/profile/${profile.id}` }) }}>
                <MaterialIcons name='person-add' size={24} color='gray' />
                <Text style={styles.drawerButtonText}>Arkadaşları Davet Et</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerButton} onPress={() => router.push('/(drawer)/TravelHistory')}>
                <MaterialIcons name='history' size={24} color='gray' />
                <Text style={styles.drawerButtonText}>Seyehat Geçmişi</Text>
            </TouchableOpacity>

            {/* Wallet Removed */}

            <TouchableOpacity style={styles.drawerButton} onPress={() => router.push('/(drawer)/DriverScreen')}>
                <MaterialIcons name='directions-car' size={24} color='gray' />
                <Text style={styles.drawerButtonText}>Sürücü</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerButton} onPress={() => router.push('/(drawer)/SettingsScreen')}>
                <MaterialIcons name='settings' size={24} color='gray' />
                <Text style={styles.drawerButtonText}>Ayarlar</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.contactUsButton} onPress={() => { }}>
                <MaterialIcons name='help-outline' size={24} color='gray' />
                <Text style={styles.contactUsText}>İletişim</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerButton} onPress={async () => {
                await AsyncStorage.removeItem('token');
                router.replace('/auth/login');
            }}>
                <Text>Çıkış Yap</Text>
            </TouchableOpacity>
            <View style={{ padding: 16, marginTop: 'auto' }}>
                <Text style={{ fontSize: 10, color: 'gray', textAlign: 'center' }}>
                    Bu platform, ticari olmayan, öğrenciler arası bir dayanışma ağıdır.
                </Text>
            </View>
        </DrawerContentScrollView>
    );
}

export default function DrawerLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer
                drawerContent={(props) => <CustomDrawerContent {...props} />}
                screenOptions={{
                    headerShown: false,
                    drawerStyle: { width: '80%' },
                    overlayColor: 'rgba(0, 0, 0, 0.5)',
                }}
            >
                <Drawer.Screen name="(tabs)" options={{ headerShown: false, drawerLabel: 'Home' }} />
                {/* Hide other screens from the auto-generated drawer list if we are using custom content, 
            but CustomDrawerContent handles the UI so we might not need to hide them explicitly 
            unless we use <DrawerItemList>. We are NOT using <DrawerItemList>. 
            So we just need to register them. 
        */}
            </Drawer>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    drawerHeader: {
        alignItems: 'center',
        padding: 16,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 8,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 8,
    },
    drawerButton: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    drawerButtonIcon: {
        position: 'relative',
        width: 24,
        height: 24,
    },
    drawerButtonText: {
        fontSize: 16,
        marginLeft: 8,
    },
    contactUsButton: {
        padding: 16,
        alignItems: 'center',
    },
    contactUsText: {
        fontSize: 16,
        color: '#FF4081',
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
    avatarWrapper: {
        position: 'relative',
        backgroundColor: '#f1f1f1',
        borderRadius: 80,
        padding: 10,
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
    userInfo: {
        alignItems: 'center',
        marginVertical: 16,
    },
    viewProfileButton: {
        alignItems: 'center',
    },
    viewProfileText: {
        fontSize: 14,
        color: '#4b39ef',
    },
    badgeContainer: {
        position: 'absolute',
        top: -8,
        right: -8,
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
});
