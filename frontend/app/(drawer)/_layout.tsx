import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Share, StatusBar } from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '@/env';
import { useNotifications } from '@/contexts/NotificationContext';
import { userService } from '@/services/userService';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { useProfile } from '@/contexts/ProfileContext';
import { getAvatarSource } from '@/utils/fetchProfilePhoto';
import { DrawerActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

function CustomDrawerContent(props: DrawerContentComponentProps) {
    const { theme } = useTheme();
    const { profile, isLoading, refreshProfile } = useProfile();
    const { unreadCount } = useNotifications();
    const router = useRouter();
    const { t } = useTranslation();
    const s = styles(theme);

    const handleProfilePhotoChange = async () => {
        router.push('/(drawer)/EditProfileScreen');
    };

    if (isLoading) {
        return (
            <DrawerContentScrollView {...props} contentContainerStyle={s.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </DrawerContentScrollView>
        );
    }

    if (!profile) {
        return (
            <DrawerContentScrollView {...props} contentContainerStyle={s.loadingContainer}>
                <MaterialIcons name="error-outline" size={48} color={theme.colors.error} />
                <Text style={{ ...theme.textStyles.body, color: theme.colors.error, marginTop: 8, textAlign: 'center' }}>
                    {t('error_load_profile')}
                </Text>
                <TouchableOpacity
                    style={{
                        marginTop: 16,
                        backgroundColor: theme.colors.primary,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20
                    }}
                    onPress={refreshProfile}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>{t('retry')}</Text>
                </TouchableOpacity>
            </DrawerContentScrollView>
        );
    }

    const avatarSource = getAvatarSource(profile);

    return (
        <DrawerContentScrollView {...props} style={s.drawerScrollView}>
            <View style={s.avatarContainer}>
                <TouchableOpacity onPress={handleProfilePhotoChange} style={s.avatarWrapper}>
                    <Image source={avatarSource} style={s.avatar} />
                    <View style={s.iconOverlay}>
                        <MaterialIcons name="edit" size={16} color="#fff" />
                    </View>
                </TouchableOpacity>

                <View style={s.userInfo}>
                    <Text style={s.userName}>{profile.name}</Text>
                </View>
                <TouchableOpacity style={s.viewProfileButton} onPress={() => router.push('/(drawer)/ProfileScreen')}>
                    <Text style={s.viewProfileText}>{t('view_profile')}</Text>
                </TouchableOpacity>
            </View>
            <View style={s.divider} />

            <DrawerItem
                theme={theme}
                icon="home"
                label={t('home')}
                onPress={() => router.push('/(drawer)/(tabs)/PassengerScreen')}
            />

            <DrawerItem
                theme={theme}
                icon="notifications"
                label={t('notifications')}
                onPress={() => router.push('/(drawer)/NotificationsScreen')}
                badge={unreadCount > 0 ? unreadCount : undefined}
            />

            <DrawerItem
                theme={theme}
                icon="person-add"
                label={t('invite_friends')}
                onPress={() => { Share.share({ url: `${BASE_URL}/profile/${profile.id}` }) }}
            />

            <DrawerItem
                theme={theme}
                icon="history"
                label={t('travel_history')}
                onPress={() => router.push('/(drawer)/TravelHistory')}
            />

            <DrawerItem
                theme={theme}
                icon="directions-car"
                label={t('driver_panel')}
                onPress={() => router.push('/(drawer)/DriverScreen')}
            />

            <DrawerItem
                theme={theme}
                icon="settings"
                label={t('settings')}
                onPress={() => router.push('/(drawer)/SettingsScreen')}
            />

            <View style={s.divider} />

            <TouchableOpacity style={s.contactUsButton} onPress={() => { }}>
                <MaterialIcons name='help-outline' size={24} color={theme.colors.primary} />
                <Text style={s.contactUsText}>{t('contact_us')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.logoutButton} onPress={async () => {
                await AsyncStorage.removeItem('token');
                router.replace('/auth/login');
            }}>
                <MaterialIcons name="logout" size={20} color={theme.colors.error} />
                <Text style={s.logoutText}>{t('logout')}</Text>
            </TouchableOpacity>

            <View style={s.footer}>
                <Text style={s.footerText}>
                    UniRide v1.0.0
                </Text>
                <Text style={[s.footerText, { fontSize: 10, marginTop: 4 }]}>
                    {t('student_network_slogan')}
                </Text>
            </View>
        </DrawerContentScrollView>
    );
}

const DrawerItem = ({ theme, icon, label, onPress, badge }: any) => {
    const s = styles(theme);
    return (
        <TouchableOpacity style={s.drawerButton} onPress={onPress}>
            <View style={s.drawerButtonIcon}>
                <MaterialIcons name={icon} size={24} color={theme.colors.textDark} />
                {badge && (
                    <View style={s.badgeContainer}>
                        <Text style={s.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                    </View>
                )}
            </View>
            <Text style={s.drawerButtonText}>{label}</Text>
        </TouchableOpacity>
    );
};

export default function DrawerLayout() {
    const { t } = useTranslation();
    const { theme, isDark } = useTheme();

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <Drawer
                drawerContent={(props) => <CustomDrawerContent {...props} />}
                screenOptions={({ navigation }) => ({
                    headerShown: true, // Enable global header for the drawer
                    headerStyle: {
                        backgroundColor: theme.colors.card,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                        shadowColor: 'transparent', // Remove shadow
                        elevation: 0,
                    },
                    headerTintColor: theme.colors.textDark,
                    headerTitleStyle: {
                        ...theme.textStyles.header3,
                        color: theme.colors.textDark,
                    },
                    drawerStyle: {
                        width: '80%',
                        backgroundColor: theme.colors.card,
                    },
                    overlayColor: 'rgba(0, 0, 0, 0.5)',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                            style={{ padding: theme.spacing.lg, marginLeft: -theme.spacing.sm }}
                        >
                            <MaterialIcons name="menu" size={28} color={theme.colors.textDark} />
                        </TouchableOpacity>
                    ),
                    headerTitleAlign: 'center',
                })}
            >
                <Drawer.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false, // Header is now handled by the Tabs navigator
                        drawerLabel: t('home')
                    }}
                />

                {/* 
                  Other screens in the drawer stack should NOT show the double header 
                  if they have their own headers or if we want to hide the drawer header for them.
                  Usually, detailed screens (like Profile, DriverScreen) are part of the navigation stack 
                  and might want to show a "Back" button instead of "Menu".
                  
                  However, in Expo Router, if they are defined as screens in the Drawer, 
                  they will have the Drawer header by default unless we disable it.

                  The user requested: "Ensure that nested Stack headers are disabled". 
                  Since we are setting screenOptions in <Drawer>, it applies to all direct children.
                  
                  Let's explicitly hide the header for specific children if needed, 
                  or rely on the fact that `(tabs)` is the main one we want the hamburger for.
                  
                  Wait, `ProfileScreen`, `DriverScreen` are likely pushed on top of the stack 
                  rather than being sibling drawer screens. 
                  In Expo Router file-based nav, only files directly in `app/(drawer)` are drawer screens 
                  if they are not `_layout.tsx`.
                  
                  Screens like `ProfileScreen.tsx` are in `app/(drawer)/`, so they ARE drawer screens.
                  BUT, usually we want a Back button for them if navigated from Home. 
                  If they are accessed via Drawer Menu, they are top-level.
                  
                  The user's prompt specifically asked for Menu button on "Passenger, Paylaş, and Seyehatlerim".
                  These are in `(tabs)`.
                  
                  For other screens like `ProfileScreen`, if we want a back button, 
                  we might need to set `headerShown: false` here and let them manage their own Stack header,
                  OR configure the Drawer header to show a back button (which is tricky for Drawer navigator).
                  
                  Best practice: Use Drawer header for the Tabs. Use Stack header (or custom header) for Detail screens.
                  So for `ProfileScreen`, etc., we should set `headerShown: false` in their options if they are to have their own custom headers (which they do, based on my refactoring of `ProfileScreen` having a custom header).
                */}

                <Drawer.Screen name="ProfileScreen" options={{ headerShown: false }} />
                <Drawer.Screen name="NotificationsScreen" options={{ headerShown: false }} />
                <Drawer.Screen name="DriverScreen" options={{ headerShown: false }} />
                <Drawer.Screen name="TravelHistory" options={{ headerShown: false }} />
                <Drawer.Screen name="EditProfileScreen" options={{ headerShown: false }} />
                <Drawer.Screen name="SettingsScreen" options={{ headerShown: false }} />
                <Drawer.Screen name="PostDetailScreen" options={{ headerShown: false }} />
                <Drawer.Screen name="ChatScreen" options={{ headerShown: false }} />
                <Drawer.Screen name="UserProfileScreen" options={{ headerShown: false }} />
                <Drawer.Screen name="CarDetail" options={{ headerShown: false }} />
                <Drawer.Screen name="LiveTrackingScreen" options={{ headerShown: false }} />
                <Drawer.Screen name="SearchLocation" options={{ headerShown: false }} />

            </Drawer>
        </GestureHandlerRootView>
    );
}

const styles = (theme: ThemeType) => StyleSheet.create({
    drawerScrollView: {
        backgroundColor: theme.colors.card,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
    },
    avatarWrapper: {
        position: 'relative',
        backgroundColor: theme.colors.surface,
        borderRadius: 50,
        padding: 4,
        ...theme.shadows.sm,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    iconOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        padding: 6,
        borderWidth: 2,
        borderColor: theme.colors.card,
    },
    userInfo: {
        alignItems: 'center',
        marginTop: theme.spacing.md,
    },
    userName: {
        ...theme.textStyles.header3,
        color: theme.colors.textDark,
        textAlign: 'center',
    },
    viewProfileButton: {
        marginTop: theme.spacing.sm,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    viewProfileText: {
        ...theme.textStyles.caption,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.md,
    },
    drawerButton: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
    },
    drawerButtonIcon: {
        position: 'relative',
        marginRight: theme.spacing.md,
    },
    drawerButtonText: {
        ...theme.textStyles.body,
        color: theme.colors.textDark,
        fontWeight: '500',
    },
    contactUsButton: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
        gap: 8,
    },
    contactUsText: {
        ...theme.textStyles.body,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
    },
    logoutText: {
        ...theme.textStyles.body,
        color: theme.colors.error,
        fontWeight: '600',
        marginLeft: 8,
    },
    badgeContainer: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: theme.colors.error,
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1,
        borderColor: theme.colors.card,
    },
    badgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
    },
    footer: {
        padding: theme.spacing.lg,
        marginTop: theme.spacing.lg,
        alignItems: 'center',
    },
    footerText: {
        ...theme.textStyles.caption,
        color: theme.colors.textLight,
    },
});
