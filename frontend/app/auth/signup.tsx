import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  useColorScheme,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  SegmentedButtons,
  ProgressBar,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { lightTheme, darkTheme, ThemeType } from '../../src/styles/theme';
import api from '../../config/api';
import universities from '../../src/constants/Universities';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface SignupFormData {
  name: string;
  surname: string;
  gender: string;
  birthDate: Date;
  university: string;
  faculty: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignupScreen = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    surname: '',
    gender: 'male',
    birthDate: new Date(2000, 0, 1),
    university: '',
    faculty: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState<boolean>(false);
  const [university, setUniversity] = useState<string>('');
  const [faculty, setFaculty] = useState<string>('');

  const [universityOpen, setUniversityOpen] = useState<boolean>(false);
  const [facultyOpen, setFacultyOpen] = useState<boolean>(false);

  const progress = step / 3;

  const validateStep1 = (): boolean => {
    if (!formData.name || !formData.surname || !formData.gender) {
      setError('Lütfen tüm alanları doldurun');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!university || !faculty) {
      setError('Lütfen üniversite ve fakülte seçin');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Lütfen tüm alanları doldurun');
      return false;
    }

    if (!formData.email.endsWith('.edu.tr')) {
      setError('Lütfen geçerli bir .edu.tr uzantılı e-posta adresi kullanın');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    setError('');

    try {
      const dataToSubmit = {
        name: formData.name,
        surname: formData.surname,
        gender: formData.gender,
        birthDate: formData.birthDate,
        university: formData.university,
        faculty: formData.faculty,
        email: formData.email,
        password: formData.password,
      };

      const response = await api.post('/api/auth/signup', dataToSubmit);

      if (response.error) {
        setError(response.error);
      } else {
        router.push({
          pathname: '/auth/validate-email',
          params: { email: formData.email }
        });
      }
    } catch (error) {
      console.error('Signup failed:', error);
      setError('Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.birthDate;
    setShowDatePicker(Platform.OS === 'ios');
    setFormData({ ...formData, birthDate: currentDate });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleInputChange = (field: keyof SignupFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleUniversityChange = (value: string) => {
    handleInputChange('university', value);
    setUniversity(value);
    setFaculty('');
    setError('');
  };

  const handleFacultyChange = (value: string) => {
    handleInputChange('faculty', value);
    setFaculty(value);
    setError('');
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://jessitoii.github.io/UniRide-User-Terms-and-Conditions/');
  };

  const renderStep1 = () => (
    <View style={styles(theme).stepContainer}>
      <TextInput
        mode="flat"
        label="Adınız"
        value={formData.name}
        onChangeText={(text) => handleInputChange('name', text)}
        style={styles(theme).input}
        activeUnderlineColor={theme.colors.primary}
        underlineColor="transparent"
        textColor={theme.colors.textDark}
        left={<TextInput.Icon icon="account" color={theme.colors.primary} />}
      />

      <TextInput
        mode="flat"
        label="Soyadınız"
        value={formData.surname}
        onChangeText={(text) => handleInputChange('surname', text)}
        style={styles(theme).input}
        activeUnderlineColor={theme.colors.primary}
        underlineColor="transparent"
        textColor={theme.colors.textDark}
        left={<TextInput.Icon icon="account-multiple" color={theme.colors.primary} />}
      />

      <Text style={styles(theme).fieldLabel}>Cinsiyet</Text>
      <SegmentedButtons
        value={formData.gender}
        onValueChange={value => handleInputChange('gender', value)}
        buttons={[
          { value: 'male', label: 'Erkek', icon: 'human-male' },
          { value: 'female', label: 'Kadın', icon: 'human-female' },
          { value: 'other', label: 'Diğer', icon: 'human' },
        ]}
        style={styles(theme).segmentedButton}
        theme={{ colors: { secondaryContainer: theme.colors.primaryTransparent, onSecondaryContainer: theme.colors.primary } }}
      />

      <Text style={styles(theme).fieldLabel}>Doğum Tarihiniz</Text>
      <TouchableOpacity
        style={styles(theme).datePickerButton}
        onPress={() => setShowDatePicker(true)}
      >
        <MaterialIcons name="event" size={22} color={theme.colors.primary} />
        <Text style={styles(theme).datePickerText}>
          {formatDate(formData.birthDate)}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={formData.birthDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1950, 0, 1)}
        />
      )}

      <Button
        mode="contained"
        onPress={handleNext}
        style={styles(theme).mainButton}
        contentStyle={styles(theme).mainButtonContent}
        buttonColor={theme.colors.primary}
      >
        Sonraki Adım
      </Button>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles(theme).stepContainer}>
      <Text style={styles(theme).fieldLabel}>Üniversite</Text>
      <DropDownPicker
        open={universityOpen}
        value={formData.university}
        items={universities.map((uni) => ({ label: uni.name, value: uni.name }))}
        setOpen={setUniversityOpen}
        onOpen={() => setFacultyOpen(false)}
        setValue={(val) => {
          const newValue = typeof val === 'function' ? val(formData.university) : val;
          handleUniversityChange(newValue);
        }}
        style={styles(theme).dropdown}
        textStyle={styles(theme).dropdownText}
        dropDownContainerStyle={styles(theme).dropdownListContainer}
        placeholderStyle={styles(theme).dropdownPlaceholder}
        placeholder="Üniversite seçin"
        zIndex={3000}
        listMode="SCROLLVIEW"
      />

      <Text style={[styles(theme).fieldLabel, { marginTop: 16 }]}>Fakülte</Text>
      <DropDownPicker
        open={facultyOpen}
        value={formData.faculty}
        items={
          universities.find((uni) => uni.name === university)?.faculties.map((faculty) => ({
            label: faculty.name,
            value: faculty.name,
          })) || []
        }
        setOpen={(open) => {
          setFacultyOpen(open);
          setUniversityOpen(false);
        }}
        onOpen={() => setUniversityOpen(false)}
        setValue={(val) => {
          const newValue = typeof val === 'function' ? val(formData.faculty) : val;
          handleFacultyChange(newValue);
        }}
        disabled={!university}
        style={[styles(theme).dropdown, !university && styles(theme).disabledDropdown]}
        textStyle={styles(theme).dropdownText}
        dropDownContainerStyle={styles(theme).dropdownListContainer}
        placeholderStyle={styles(theme).dropdownPlaceholder}
        placeholder={university ? "Fakülte seçin" : "Önce üniversite seçin"}
        zIndex={1000}
        listMode="SCROLLVIEW"
      />

      <View style={styles(theme).actions}>
        <Button
          mode="outlined"
          onPress={handleBack}
          style={styles(theme).secondaryButton}
          textColor={theme.colors.primary}
        >
          Geri
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          style={styles(theme).primaryButton}
          buttonColor={theme.colors.primary}
          disabled={!(university && faculty)}
        >
          İlerle
        </Button>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles(theme).stepContainer}>
      <TextInput
        mode="flat"
        label="E-posta (.edu.tr)"
        value={formData.email}
        onChangeText={(text) => handleInputChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles(theme).input}
        activeUnderlineColor={theme.colors.primary}
        underlineColor="transparent"
        textColor={theme.colors.textDark}
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

      <TextInput
        mode="flat"
        label="Şifre Tekrar"
        value={formData.confirmPassword}
        onChangeText={(text) => handleInputChange('confirmPassword', text)}
        secureTextEntry={!confirmPasswordVisible}
        style={styles(theme).input}
        activeUnderlineColor={theme.colors.primary}
        underlineColor="transparent"
        textColor={theme.colors.textDark}
        left={<TextInput.Icon icon="lock-check" color={theme.colors.primary} />}
        right={
          <TextInput.Icon
            icon={confirmPasswordVisible ? "eye-off" : "eye"}
            onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            color={theme.colors.textLight}
          />
        }
      />

      <View style={styles(theme).actions}>
        <Button
          mode="outlined"
          onPress={handleBack}
          style={styles(theme).secondaryButton}
          textColor={theme.colors.primary}
        >
          Geri
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles(theme).primaryButton}
          buttonColor={theme.colors.primary}
        >
          Tamamla
        </Button>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles(theme).mainContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles(theme).backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
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
          <View style={styles(theme).header}>
            <TouchableOpacity onPress={() => router.back()} style={styles(theme).backIcon}>
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.white} />
            </TouchableOpacity>
            <Text style={styles(theme).headerTitle}>Hesap Oluştur</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles(theme).card}>
            <View style={styles(theme).progressSection}>
              <Text style={styles(theme).stepIndicator}>Adım {step} / 3</Text>
              <ProgressBar
                progress={progress}
                color={theme.colors.primary}
                style={styles(theme).progressBar}
              />
            </View>

            {error ? (
              <View style={styles(theme).errorBox}>
                <MaterialIcons name="error-outline" size={16} color={theme.colors.error} />
                <Text style={styles(theme).errorText}>{error}</Text>
              </View>
            ) : null}

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>

          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            style={styles(theme).loginLink}
          >
            <Text style={styles(theme).loginText}>
              Zaten hesabınız var mı? <Text style={styles(theme).loginTextBold}>Giriş Yap</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles(theme).footer}>
        <Text style={styles(theme).footerText}>
          {"Devam ederek "}
          <Text style={styles(theme).footerTextBold} onPress={handleOpenPrivacyPolicy}>
            {"Kullanım Koşullarını"}
          </Text>
          {" kabul etmiş olursunuz."}
        </Text>
      </View>
    </SafeAreaView>
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
    height: 140,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 50,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerTitle: {
    ...theme.textStyles.header2,
    color: theme.colors.white,
    fontSize: 22,
  },
  backIcon: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 32,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  progressSection: {
    marginBottom: theme.spacing.xl,
  },
  stepIndicator: {
    ...theme.textStyles.caption,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.surface,
  },
  stepContainer: {
    gap: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    height: 56,
    overflow: 'hidden',
  },
  fieldLabel: {
    ...theme.textStyles.caption,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginTop: 8,
  },
  segmentedButton: {
    marginTop: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  datePickerText: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  dropdown: {
    backgroundColor: theme.colors.surface,
    borderColor: 'transparent',
    borderRadius: 12,
    minHeight: 56,
  },
  dropdownListContainer: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.divider,
    borderRadius: 12,
    ...theme.shadows.lg,
  },
  dropdownText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textDark,
  },
  dropdownPlaceholder: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textLight,
  },
  disabledDropdown: {
    opacity: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: theme.spacing.lg,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: theme.colors.primary,
    height: 50,
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 2,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
  },
  mainButton: {
    borderRadius: 16,
    marginTop: theme.spacing.md,
  },
  mainButtonContent: {
    height: 54,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '10',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    flex: 1,
  },
  loginLink: {
    marginTop: 30,
    alignItems: 'center',
  },
  loginText: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  loginTextBold: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xs,
    alignItems: 'center',
  },
  footerText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textDark,
    textAlign: 'center',
    opacity: 0.7,
  },
  footerTextBold: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});

export default SignupScreen; 