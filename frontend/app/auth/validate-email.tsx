import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useColorScheme,
  Dimensions,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, ThemeType } from '../../src/styles/theme';
import api from '../../config/api';

const { height } = Dimensions.get('window');

const ValidateEmailScreen = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();

  const [validationCode, setValidationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!validationCode) {
      setError('Lütfen doğrulama kodunu girin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post<{ token: string }>('/api/auth/validate-email', {
        code: validationCode
      });

      if (response.error) {
        setError(response.error);
      } else if (response.data?.token) {
        await AsyncStorage.setItem('token', response.data.token);
        router.replace('/(drawer)/(tabs)/PassengerScreen');
      }
    } catch (err) {
      setError('Doğrulama başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles(theme).mainContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

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
        <View style={styles(theme).container}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles(theme).backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>

          <View style={styles(theme).card}>
            <View style={styles(theme).iconWrapper}>
              <MaterialIcons name="mark-email-unread" size={40} color={theme.colors.primary} />
            </View>

            <Text style={styles(theme).title}>E-posta Doğrulaması</Text>
            <Text style={styles(theme).subtitle}>
              Lütfen .edu.tr adresinize gönderilen 6 haneli doğrulama kodunu girin.
            </Text>

            <TextInput
              mode="flat"
              label="Doğrulama Kodu"
              value={validationCode}
              onChangeText={setValidationCode}
              keyboardType="number-pad"
              maxLength={6}
              style={styles(theme).input}
              activeUnderlineColor={theme.colors.primary}
              underlineColor="transparent"
              textColor={theme.colors.textDark}
              left={<TextInput.Icon icon="shield-check" color={theme.colors.primary} />}
            />

            {error ? (
              <View style={styles(theme).errorContainer}>
                <MaterialIcons name="error-outline" size={16} color={theme.colors.error} />
                <Text style={styles(theme).errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles(theme).verifyButton}
              contentStyle={styles(theme).verifyButtonContent}
              buttonColor={theme.colors.primary}
            >
              Doğrula ve İlerle
            </Button>

            <TouchableOpacity style={styles(theme).resendLink}>
              <Text style={styles(theme).resendText}>
                Kod gelmedi mi? <Text style={styles(theme).resendTextBold}>Tekrar Gönder</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

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
    height: height * 0.4,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 50,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 32,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryTransparent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    height: 60,
    overflow: 'hidden',
    marginBottom: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '10',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    flex: 1,
  },
  verifyButton: {
    width: '100%',
    borderRadius: 16,
    ...theme.shadows.base,
  },
  verifyButtonContent: {
    height: 54,
  },
  resendLink: {
    marginTop: 20,
  },
  resendText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textLight,
  },
  resendTextBold: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});

export default ValidateEmailScreen; 