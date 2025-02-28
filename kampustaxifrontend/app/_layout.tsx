import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { PaperProvider } from 'react-native-paper';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// A custom bottom tab bar with 5 buttons using the specified icons.
function BottomTabBar() {
  const router = useRouter();
  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity onPress={() => router.push('/passanger')}>
        <Text style={styles.tabIcon}>🏠︎</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/driver')}>
        <Text style={styles.tabIcon}>🚗</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/PostScreen')}>
        <Text style={styles.tabIcon}>➕</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/TravelsScreen')}>
        <Text style={styles.tabIcon}>🛫</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/profile')}>
        <Text style={styles.tabIcon}>👤</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const showBottomTabBar = segments.length > 0 && segments[0] === "(tabs)";

  // Hide the splash screen once fonts are loaded.
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Check for a token in AsyncStorage.
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      console.log('Token:', token); // Debug log
      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.replace('/auth/login');
      }
    };
    checkAuth();
  }, [router]);

  // While checking authentication status, render nothing.
  if (!loaded || isAuthenticated === null) {
    return null;
  }

  // If not authenticated, the user is already redirected to /auth/login.
  return (
    <PaperProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* The main app screens (including tabs) */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
          <Stack.Screen name="auth/validate-email" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)/profile" options={{ title: 'Profile' }} />
          <Stack.Screen name="(tabs)/settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="(tabs)/edit-profile" options={{ title: 'Edit Profile' }} />
          <Stack.Screen name="(tabs)/UserProfileScreen" options={{ title: 'User Profile' }} />
          <Stack.Screen name="(tabs)/PostDetailScreen" options={{ title: 'Post Detail' }} />
          <Stack.Screen name="(tabs)/ChatScreen" options={{ title: 'Chat' }} />
          <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
          <Stack.Screen name="(tabs)/CarDetail" options={{ title: 'Car Detail' }} />
          <Stack.Screen name="(tabs)/Wallet" options={{ title: 'Wallet' }} />
        </Stack>
        {showBottomTabBar && <BottomTabBar />}
        <StatusBar style="auto" />
      </ThemeProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  tabIcon: {
    fontSize: 28,
  },
});
