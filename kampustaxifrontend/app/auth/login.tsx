'use client';

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useColorScheme
} from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { lightTheme, darkTheme, ThemeType } from '../../styles/theme';
import api from '../../config/api';

// Define navigation types
type RootStackParamList = {
  LoginScreen: undefined;
  Signup: undefined;
  Home: { screen: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'LoginScreen'>;

// Interface for form data
interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  // Theme and navigation setup
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();

  // State management
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          // If authenticated, redirect to profile
          // Navigate to Home (bubbles to Drawer)
          // @ts-ignore
          router.replace('/(drawer)/(tabs)/PassengerScreen');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
      }
    };
    checkAuth();
  }, []);

  // Form input handlers
  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError(''); // Clear error when user types
  };

  // Handle login submission
  const handleLogin = async () => {
    // Validate form data
    if (!formData.email || !formData.password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    if (!formData.email.endsWith('.edu.tr')) {
      setError('Lütfen geçerli bir .edu.tr uzantılı e-posta adresi kullanın');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post<{ token: string }>('/api/auth/login', formData);

      if (response.error) {
        setError(response.error);
      } else if (response.data?.token) {
        // Store token
        await AsyncStorage.setItem('token', response.data.token);

        // Navigate to main app
        // Navigate to Home
        // @ts-ignore
        router.replace('/(drawer)/(tabs)/PassengerScreen');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Giriş işlemi başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles(theme).container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles(theme).logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles(theme).logo}
            resizeMode="contain"
          />
          <Text style={styles(theme).appName}>KampüsRoute</Text>
          <Text style={styles(theme).tagline}>Güvenli ve ekonomik kampüs ulaşımı</Text>
        </View>

        <View style={styles(theme).formContainer}>
          <Text style={styles(theme).title}>Giriş Yap</Text>

          <View style={styles(theme).inputContainer}>
            <MaterialIcons name="email" size={20} color={theme.colors.primary} style={styles(theme).inputIcon} />
            <TextInput
              mode="outlined"
              label="Email (edu.tr)"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles(theme).input}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.primary}
              contentStyle={{ color: theme.colors.textDark }}
              theme={{ colors: { text: theme.colors.textDark, background: theme.colors.card } }}
            />
          </View>

          <View style={styles(theme).inputContainer}>
            <MaterialIcons name="lock" size={20} color={theme.colors.primary} style={styles(theme).inputIcon} />
            <TextInput
              mode="outlined"
              label="Şifre"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry={!passwordVisible}
              style={styles(theme).input}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.primary}
              contentStyle={{ color: theme.colors.textDark }}
              theme={{ colors: { text: theme.colors.textDark, background: theme.colors.card } }}
              right={
                <TextInput.Icon
                  icon={passwordVisible ? "eye-off" : "eye"}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  color={theme.colors.textLight}
                />
              }
            />
          </View>

          {error ? <Text style={styles(theme).errorText}>{error}</Text> : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles(theme).button}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.white}
          >
            Giriş Yap
          </Button>

          <TouchableOpacity
            onPress={() => {
              router.push('/auth/signup');
            }}
            style={styles(theme).linkButton}
          >
            <Text style={styles(theme).linkText}>
              Hesabın yok mu? <Text style={styles(theme).linkTextBold}>Üye Ol</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles(theme).footer}>
          <Text style={styles(theme).footerText}>
            © 2025 KampüsRoute - Tüm hakları saklıdır
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: theme.spacing.sm,
  },
  appName: {
    ...theme.textStyles.header1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  tagline: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.base,
  },
  title: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
    alignSelf: 'center',
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.card,
  },
  button: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    height: 48,
    justifyContent: 'center',
  },
  linkButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  linkText: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  linkTextBold: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  errorText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  footer: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textLight,
  },
}); 