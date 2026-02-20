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
  useColorScheme,
  Dimensions
} from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { lightTheme, darkTheme, ThemeType } from '../../src/styles/theme';
import api from '../../config/api';

const { width } = Dimensions.get('window');

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          router.replace('/(drawer)/(tabs)/PassengerScreen');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
      }
    };
    checkAuth();
  }, []);

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleLogin = async () => {
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
        await AsyncStorage.setItem('token', response.data.token);
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
    <View style={styles(theme).mainContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles(theme).backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles(theme).scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles(theme).headerSection}>
            <View style={styles(theme).logoWrapper}>
              <MaterialIcons name="local-taxi" size={48} color={theme.colors.white} />
            </View>
            <Text style={styles(theme).appName}>UniRide</Text>
            <Text style={styles(theme).tagline}>Geleceğin kampüs ulaşımı</Text>
          </View>

          <View style={styles(theme).card}>
            <Text style={styles(theme).title}>Hoş Geldiniz</Text>
            <Text style={styles(theme).subtitle}>Hesabınıza giriş yapın</Text>

            <View style={styles(theme).form}>
              <TextInput
                mode="flat"
                label="Kampüs E-postası"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles(theme).input}
                activeUnderlineColor={theme.colors.primary}
                underlineColor="transparent"
                textColor={theme.colors.textDark}
                placeholder="örnek@ogr.uü.edu.tr"
                left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
              />

              <TextInput
                mode="flat"
                label="Şifre"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry={!passwordVisible}
                style={styles(theme).input}
                activeUnderlineColor={theme.colors.primary}
                underlineColor="transparent"
                textColor={theme.colors.textDark}
                left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
                right={
                  <TextInput.Icon
                    icon={passwordVisible ? "eye-off" : "eye"}
                    onPress={() => setPasswordVisible(!passwordVisible)}
                    color={theme.colors.textLight}
                  />
                }
              />

              {error ? (
                <View style={styles(theme).errorContainer}>
                  <MaterialIcons name="error-outline" size={16} color={theme.colors.error} />
                  <Text style={styles(theme).errorText}>{error}</Text>
                </View>
              ) : null}

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles(theme).loginButton}
                contentStyle={styles(theme).loginButtonContent}
                buttonColor={theme.colors.primary}
              >
                Giriş Yap
              </Button>

              <TouchableOpacity
                onPress={() => router.push('/auth/signup')}
                style={styles(theme).signupLink}
              >
                <Text style={styles(theme).signupText}>
                  Henüz hesabınız yok mu? <Text style={styles(theme).signupTextBold}>Üye Olun</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles(theme).footer}>
            <Text style={styles(theme).footerText}>
              By continuing, you agree to our Terms and Conditions
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = (theme: ThemeType) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  appName: {
    ...theme.textStyles.header1,
    color: theme.colors.white,
    fontSize: 32,
    letterSpacing: 0.5,
  },
  tagline: {
    ...theme.textStyles.body,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 32,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
    marginTop: theme.spacing.md,
  },
  title: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    textAlign: 'center',
    fontSize: 26,
  },
  subtitle: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  form: {
    gap: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    height: 60,
    overflow: 'hidden',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error + '10',
    padding: theme.spacing.sm,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
  },
  loginButton: {
    borderRadius: 16,
    marginTop: theme.spacing.md,
    ...theme.shadows.base,
  },
  loginButtonContent: {
    height: 54,
  },
  signupLink: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  signupText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textLight,
  },
  signupTextBold: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    textAlign: 'center',
    opacity: 0.7,
  },
}); 