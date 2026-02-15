import { useFonts } from 'expo-font';
import '../src/i18n'; // Initialize i18n
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SocketProvider } from '@/contexts/SocketContext';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false && segments[0] !== 'auth') {
      // Redirect to login if not authenticated and not in auth group
      // router.replace('/auth/login'); 
      // Logic handled by inner screens or protections usually, but good to have here.
      // For now, initially allow navigation, but specific screens might redirect.
      // Actually, the previous maplogic redirected to 'Auth' stack.
    }
  }, [isAuthenticated, segments]);


  if (!loaded || isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NotificationProvider>
          <SocketProvider>
            <PaperProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(drawer)" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </PaperProvider>
          </SocketProvider>
        </NotificationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
