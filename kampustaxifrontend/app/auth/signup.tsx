'use client';

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
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  SegmentedButtons,
  ProgressBar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { lightTheme, darkTheme, ThemeType } from '../../styles/theme';
import api from '../../config/api';
import universities from '../../constants/Universities';

// Define navigation types
type RootStackParamList = {
  LoginScreen: undefined;
  Signup: undefined;
  ValidateEmail: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;

// Interface for signup form data
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
  // Theme and navigation setup
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const navigation = useNavigation<NavigationProp>();
  
  // State management
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    surname: '',
    gender: '',
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

  // State for dropdown open status
  const [universityOpen, setUniversityOpen] = useState<boolean>(false);
  const [facultyOpen, setFacultyOpen] = useState<boolean>(false);

  // Calculate progress based on current step
  const progress = step / 3;

  // Form validation functions
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

  // Form navigation handlers
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

  // Form submission handler
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
        navigation.navigate('ValidateEmail');
      }
    } catch (error) {
      console.error('Signup failed:', error);
      setError('Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Date picker handlers
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

  // Form input handler
  const handleInputChange = (field: keyof SignupFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    setError(''); // Clear error when user types
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

  // Step 1: Personal Information
  const renderStep1 = () => (
    <>
      <View style={styles(theme).inputContainer}>
        <MaterialIcons name="person" size={20} color={theme.colors.primary} style={styles(theme).inputIcon} />
        <TextInput
          mode="outlined"
          label="Adınız"
          value={formData.name}
          onChangeText={(text) => handleInputChange('name', text)}
          style={styles(theme).input}
          outlineColor={theme.colors.border}
          activeOutlineColor={theme.colors.primary}
          contentStyle={{ color: theme.colors.textDark }}
          theme={{ colors: { text: theme.colors.textDark, background: theme.colors.card } }}
        />
      </View>

      <View style={styles(theme).inputContainer}>
        <MaterialIcons name="people" size={20} color={theme.colors.primary} style={styles(theme).inputIcon} />
        <TextInput
          mode="outlined"
          label="Soyadınız"
          value={formData.surname}
          onChangeText={(text) => handleInputChange('surname', text)}
          style={styles(theme).input}
          outlineColor={theme.colors.border}
          activeOutlineColor={theme.colors.primary}
          contentStyle={{ color: theme.colors.textDark }}
          theme={{ colors: { text: theme.colors.textDark, background: theme.colors.card } }}
        />
      </View>

      <Text style={styles(theme).fieldLabel}>Cinsiyet</Text>
      <SegmentedButtons
        value={formData.gender}
        onValueChange={value => handleInputChange('gender', value)}
        buttons={[
          { value: 'male', label: 'Erkek' },
          { value: 'female', label: 'Kadın' },
          { value: 'other', label: 'Diğer' },
        ]}
        style={styles(theme).segmentedButton}
      />

      <Text style={styles(theme).fieldLabel}>Doğum Tarihiniz</Text>
      <TouchableOpacity 
        style={styles(theme).datePickerButton} 
        onPress={() => setShowDatePicker(true)}
      >
        <MaterialIcons name="event" size={20} color={theme.colors.primary} style={styles(theme).datePickerIcon} />
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
        style={styles(theme).button}
        buttonColor={theme.colors.primary}
        textColor={theme.colors.white}
      >
        Devam Et
      </Button>
    </>
  );

  // Step 2: University Information
  const renderStep2 = () => (
    <View style={styles(theme).dropdownContainer}>
      <Text style={styles(theme).fieldLabel}>Üniversite Bilgileri</Text>
      
      <Text style={styles(theme).dropdownLabel}>Üniversiteniz</Text>
      <DropDownPicker
        open={universityOpen}
        value={formData.university}
        items={universities.map((uni) => ({ label: uni.name, value: uni.name }))}
        setOpen={setUniversityOpen}
        onOpen={() => setFacultyOpen(false)}
        setValue={(callback) => {
          const newValue = callback(formData.university);
          handleUniversityChange(newValue);
          handleFacultyChange(''); // Reset faculty when university changes
          setError('');
        }}
        style={styles(theme).dropdown}
        textStyle={styles(theme).dropdownText}
        dropDownContainerStyle={styles(theme).dropdownContainer}
        placeholderStyle={styles(theme).dropdownPlaceholder}
        placeholder={university ? university : "Önce üniversite seçin"}
        zIndex={3000}
        zIndexInverse={1000}
      />
      
      <View style={{ height: 20 }} />
      
      <Text style={styles(theme).dropdownLabel}>Fakülteniz</Text>
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
          setUniversityOpen(false); // Only one dropdown open at a time
        }}
        onOpen={() => setUniversityOpen(false)}
        setValue={(callback) => {
          const newValue = callback(formData.faculty);
          handleFacultyChange(newValue);
          setError('');
        }}
        disabled={!university}
        disabledStyle={styles(theme).disabledDropdown}
        style={styles(theme).dropdown}
        textStyle={styles(theme).dropdownText}
        dropDownContainerStyle={styles(theme).dropdownContainer}
        placeholderStyle={styles(theme).dropdownPlaceholder}
        placeholder={university ? (faculty ? faculty : "Fakülte seçin") : "Önce üniversite seçin"}
        zIndex={1}
      />
      
      <View style={styles(theme).buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => {
            setError('');
            setUniversityOpen(false);
            setFacultyOpen(false);
            handleBack();
          }}
          style={[styles(theme).button, styles(theme).buttonOutline]}
          textColor={theme.colors.primary}
        >
          Geri
        </Button>
        
        <Button
          mode="contained"
          onPress={handleNext}
          style={[styles(theme).button, styles(theme).buttonPrimary]}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.white}
          disabled={!(university && faculty)}
        >
          Devam Et
        </Button>
      </View>
    </View>
  );

  // Step 3: Account Information
  const renderStep3 = () => (
    <>
      <View style={styles(theme).inputContainer}>
        <MaterialIcons name="email" size={20} color={theme.colors.primary} style={styles(theme).inputIcon} />
        <TextInput
          mode="outlined"
          label="E-posta (.edu.tr)"
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
      
      <View style={styles(theme).inputContainer}>
        <MaterialIcons name="lock" size={20} color={theme.colors.primary} style={styles(theme).inputIcon} />
        <TextInput
          mode="outlined"
          label="Şifre Tekrar"
          value={formData.confirmPassword}
          onChangeText={(text) => handleInputChange('confirmPassword', text)}
          secureTextEntry={!confirmPasswordVisible}
          style={styles(theme).input}
          outlineColor={theme.colors.border}
          activeOutlineColor={theme.colors.primary}
          contentStyle={{ color: theme.colors.textDark }}
          theme={{ colors: { text: theme.colors.textDark, background: theme.colors.card } }}
          right={
            <TextInput.Icon 
              icon={confirmPasswordVisible ? "eye-off" : "eye"} 
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              color={theme.colors.textLight}
            />
          }
        />
      </View>
      
      <View style={styles(theme).buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleBack}
          style={[styles(theme).button, styles(theme).buttonOutline]}
          textColor={theme.colors.primary}
        >
          Geri
        </Button>
        
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={[styles(theme).button, styles(theme).buttonPrimary]}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.white}
        >
          Kayıt Ol
        </Button>
      </View>
    </>
  );

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
          <Text style={styles(theme).appName}>KampusTaxi</Text>
          <Text style={styles(theme).tagline}>Güvenli ve ekonomik kampüs ulaşımı</Text>
        </View>

        <View style={styles(theme).formContainer}>
          <Text style={styles(theme).title}>Hesap Oluştur</Text>
          
          <View style={styles(theme).progressContainer}>
            <Text style={styles(theme).stepText}>Adım {step}/3</Text>
            <ProgressBar 
              progress={progress} 
              color={theme.colors.primary} 
              style={styles(theme).progressBar}
            />
          </View>

          {error ? <Text style={styles(theme).errorText}>{error}</Text> : null}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </View>
        
        <TouchableOpacity
          // @ts-ignore
          onPress={() => navigation.navigate('Login')}
          style={styles(theme).linkButton}
        >
          <Text style={styles(theme).linkText}>
            Zaten hesabın var mı? <Text style={styles(theme).linkTextBold}>Giriş Yap</Text>
          </Text>
        </TouchableOpacity>
        
        <View style={styles(theme).footer}>
          <Text style={styles(theme).footerText}>
            © {new Date().getFullYear()} KampusTaxi - Tüm hakları saklıdır
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logo: {
    width: 80,
    height: 80,
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
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  progressContainer: {
    marginBottom: theme.spacing.md,
  },
  stepText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.divider,
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
  fieldLabel: {
    ...theme.textStyles.bodySmall,
    fontWeight: 'bold',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  segmentedButton: {
    marginBottom: theme.spacing.md,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  datePickerIcon: {
    marginRight: theme.spacing.sm,
  },
  datePickerText: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  dropdownContainer: {
    marginBottom: theme.spacing.md,
  },
  dropdownLabel: {
    ...theme.textStyles.bodySmall,
    fontWeight: 'bold',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  dropdown: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
  },
  dropdownText: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  dropdownPlaceholder: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
  },
  disabledDropdown: {
    opacity: 0.6,
    backgroundColor: theme.colors.divider,
  },
  button: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    height: 48,
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  buttonOutline: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  linkButton: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
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
    marginBottom: theme.spacing.md,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textLight,
  },
});

export default SignupScreen; 