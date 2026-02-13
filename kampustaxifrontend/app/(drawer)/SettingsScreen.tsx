'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  useColorScheme
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';

// Local imports
import { BASE_URL } from '@/env';
import { lightTheme, darkTheme, ThemeType } from '@/styles/theme';
import { Card, TouchableCard, Button, Input, Header } from '@/components/ui';

// Theme storage constants
const THEME_PREFERENCE_KEY = 'themePreference';
const THEME_AUTO = 'auto';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

// Reusable component for menu items with icons
const MenuItem = ({
  icon,
  title,
  subtitle,
  onPress,
  rightComponent,
  theme
}: {
  icon: React.ReactNode,
  title: string,
  subtitle?: string,
  onPress?: () => void,
  rightComponent?: React.ReactNode,
  theme: ThemeType
}) => (
  <TouchableCard
    onPress={onPress}
    style={styles(theme).menuItem}
  >
    <View style={styles(theme).menuIconContainer}>
      {icon}
    </View>
    <View style={styles(theme).menuTextContainer}>
      <Text style={styles(theme).menuItemTitle}>{title}</Text>
      {subtitle && <Text style={styles(theme).menuItemSubtitle}>{subtitle}</Text>}
    </View>
    {rightComponent}
  </TouchableCard>
);

export default function SettingsScreen() {
  // User data state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [userName, setUserName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [validationCode, setValidationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // App settings state
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [appAlerts, setAppAlerts] = useState(false);
  const [locationFeatures, setLocationFeatures] = useState(false);
  const [locationAccess, setLocationAccess] = useState(false);

  // Theme state
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<string>(THEME_AUTO);
  const [darkMode, setDarkMode] = useState(false);

  const router = useRouter();

  // Determine the current theme based on preference and system setting
  const currentTheme = useCallback(() => {
    if (themePreference === THEME_DARK) {
      return darkTheme;
    } else if (themePreference === THEME_LIGHT) {
      return lightTheme;
    } else {
      // Auto - follow system
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
  }, [themePreference, systemColorScheme]);

  // Effect to load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedPreference) {
          setThemePreference(savedPreference);
          setDarkMode(savedPreference === THEME_DARK);
        } else {
          // Default to auto if no preference is saved
          setThemePreference(THEME_AUTO);
          setDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, [systemColorScheme]);

  // Effect to fetch user data
  useEffect(() => {
    fetchUserData();
  }, []);

  // Function to fetch user data from API
  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        handleAuthError();
        return;
      }

      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 403) {
        handleAuthError();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setEmail(data.email);
        setOriginalEmail(data.email);
        setBirthDate(data.birthDate ? new Date(data.birthDate) : null);
        setUserName(`${data.name} ${data.surname || ""}`);

        // Load user preferences
        setEmailNotifications(data.emailNotifications || false);
        setPushNotifications(data.pushNotifications || false);
        setAppAlerts(data.appAlerts || false);
        setLocationFeatures(data.locationFeatures || false);
        setLocationAccess(data.locationAccess || false);
      } else {
        console.error('Error fetching user data:', await response.json());
        Alert.alert('Error', 'Failed to load user data. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'An error occurred while fetching your data.');
    }
  };

  // Handle authentication errors
  const handleAuthError = async () => {
    await AsyncStorage.removeItem('token');
    router.push('/auth/login');
  };

  // Handle dark mode toggle
  const handleDarkModeToggle = async (value: boolean) => {
    setDarkMode(value);
    const newThemePreference = value ? THEME_DARK : THEME_LIGHT;
    setThemePreference(newThemePreference);

    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, newThemePreference);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Handle date change for the DateTimePicker
  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setBirthDate(selectedDate ? new Date(selectedDate) : null);
    setShowDatePicker(false);
  };

  // Validate password format
  const validatePassword = (password: string) => {
    if (!password) return true; // Allow empty password (no change)

    // At least 8 characters, one uppercase, one number
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
  };

  // Handle save settings
  const handleSave = async () => {
    if (password && !validatePassword(password)) {
      Alert.alert(
        'Invalid Password Format',
        'Password must be at least 8 characters long, include an uppercase letter and a number.'
      );
      return;
    }

    if (email !== originalEmail && !isEmailVerified) {
      Alert.alert(
        'Email Verification Required',
        'Please verify your new email address before saving.'
      );
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        handleAuthError();
        return;
      }

      const response = await fetch(`${BASE_URL}/api/users/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password: password || undefined, // Only send if changed
          birthDate,
          emailNotifications,
          pushNotifications,
          appAlerts,
          locationFeatures,
          locationAccess,
          darkMode,
        }),
      });

      if (response.ok) {
        Alert.alert('Settings Saved', 'Your settings have been successfully updated.');
        router.push('/(drawer)/ProfileScreen');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to save settings.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  // Handle email change
  const handleEmailChange = async () => {
    if (!email || email === originalEmail) return;

    try {
      const response = await fetch(`${BASE_URL}/api/users/sendValidationCode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        Alert.alert('Validation Code Sent', 'A validation code has been sent to your new email address.');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to send validation code.');
      }
    } catch (error) {
      console.error('Error sending validation code:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  // Verify email with validation code
  const verifyEmail = async () => {
    if (!validationCode) {
      Alert.alert('Missing Code', 'Please enter the validation code.');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/users/verifyEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, validationCode }),
      });

      if (response.ok) {
        setIsEmailVerified(true);
        Alert.alert('Email Verified', 'Your email address has been successfully verified.');
      } else {
        Alert.alert('Invalid Code', 'The validation code you entered is incorrect.');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  // Show email change modal
  const showEmailModal = () => {
    Alert.prompt(
      "Change Email Address",
      "Enter your new email address:",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Send Verification",
          onPress: (newEmail?: string) => {
            if (newEmail) {
              setEmail(newEmail);
              handleEmailChange();
            }
          }
        }
      ],
      "plain-text",
      email
    );
  };

  // Format birth date for display
  const getFormattedBirthDate = () => {
    if (birthDate) {
      return birthDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return "Not set";
  };

  // Get theme description based on preference
  const getThemeDescription = () => {
    switch (themePreference) {
      case THEME_LIGHT:
        return "Light mode";
      case THEME_DARK:
        return "Dark mode";
      default:
        return "Follow system";
    }
  };

  // Get the current theme
  const theme = currentTheme();

  return (
    <ScrollView style={styles(theme).container}>
      <View style={styles(theme).header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={theme.colors.textDark}
          />
        </TouchableOpacity>
        <Text style={styles(theme).headerTitle}>Settings</Text>
        <View style={{ width: 24 }} /> {/* Empty view for header alignment */}
      </View>

      <Text style={styles(theme).sectionHeader}>General</Text>

      <MenuItem
        icon={
          <MaterialIcons
            name="person"
            size={24}
            color={theme.colors.primary}
          />
        }
        title={userName || "User"}
        subtitle={getFormattedBirthDate()}
        // @ts-ignore - Navigation typing will be fixed in a future update
        onPress={() => router.push('/(drawer)/EditProfileScreen')}
        theme={theme}
      />

      <MenuItem
        icon={
          <MaterialIcons
            name="email"
            size={24}
            color={theme.colors.primary}
          />
        }
        title={email}
        onPress={showEmailModal}
        theme={theme}
      />

      <MenuItem
        icon={
          <MaterialIcons
            name="nightlight-round"
            size={24}
            color={theme.colors.primary}
          />
        }
        title="Dark Theme"
        subtitle={getThemeDescription()}
        rightComponent={
          <Switch
            value={darkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primaryLight
            }}
            thumbColor={darkMode ? theme.colors.primary : theme.colors.background}
          />
        }
        theme={theme}
      />



      <MenuItem
        icon={
          <MaterialIcons
            name="drive-eta"
            size={24}
            color={theme.colors.primary}
          />
        }
        title="Ride with KampüsRoute"
        theme={theme}
      />

      <Text style={styles(theme).sectionHeader}>Shortcuts</Text>

      <MenuItem
        icon={
          <MaterialIcons
            name="home"
            size={24}
            color={theme.colors.primary}
          />
        }
        title="Add Home"
        theme={theme}
      />

      <MenuItem
        icon={
          <MaterialIcons
            name="work"
            size={24}
            color={theme.colors.primary}
          />
        }
        title="Add Work"
        theme={theme}
      />

      <MenuItem
        icon={
          <MaterialIcons
            name="list"
            size={24}
            color={theme.colors.primary}
          />
        }
        title="Manage All Shortcuts"
        theme={theme}
      />

      {showDatePicker && (
        <DateTimePicker
          value={birthDate ? new Date(birthDate) : new Date()}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1950, 0, 1)}
        />
      )}

      <Text style={styles(theme).sectionHeader}>Notification Settings</Text>

      <Card style={styles(theme).settingsSection}>
        <Text style={styles(theme).sectionTitle}>Notification Settings</Text>

        <View style={styles(theme).switchContainer}>
          <Text style={styles(theme).switchLabel}>Enable Email Notifications</Text>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primaryLight
            }}
            thumbColor={emailNotifications ? theme.colors.primary : theme.colors.background}
          />
        </View>

        <View style={styles(theme).switchContainer}>
          <Text style={styles(theme).switchLabel}>Enable Push Notifications</Text>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primaryLight
            }}
            thumbColor={pushNotifications ? theme.colors.primary : theme.colors.background}
          />
        </View>

        <View style={styles(theme).switchContainer}>
          <Text style={styles(theme).switchLabel}>Enable App Notifications</Text>
          <Switch
            value={appAlerts}
            onValueChange={setAppAlerts}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primaryLight
            }}
            thumbColor={appAlerts ? theme.colors.primary : theme.colors.background}
          />
        </View>
      </Card>

      <Text style={styles(theme).sectionHeader}>Location Settings</Text>

      <Card style={styles(theme).settingsSection}>
        <Text style={styles(theme).sectionTitle}>Location Settings</Text>

        <View style={styles(theme).switchContainer}>
          <Text style={styles(theme).switchLabel}>Location-Based Features</Text>
          <Switch
            value={locationFeatures}
            onValueChange={setLocationFeatures}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primaryLight
            }}
            thumbColor={locationFeatures ? theme.colors.primary : theme.colors.background}
          />
        </View>

        <View style={styles(theme).switchContainer}>
          <Text style={styles(theme).switchLabel}>Location Access</Text>
          <Switch
            value={locationAccess}
            onValueChange={setLocationAccess}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primaryLight
            }}
            thumbColor={locationAccess ? theme.colors.primary : theme.colors.background}
          />
        </View>
      </Card>

      {email !== originalEmail && (
        <Card style={styles(theme).validationSection}>
          <Text style={styles(theme).validationTitle}>Verify New Email</Text>

          <Input
            value={validationCode}
            onChangeText={setValidationCode}
            placeholder="Enter Verification Code"
            style={styles(theme).inputField}
          />

          <Button
            title="Verify Email"
            onPress={verifyEmail}
            variant="primary"
            style={styles(theme).verifyButton}
          />
        </Card>
      )}

      {/* Password change section */}
      <Card style={styles(theme).settingsSection}>
        <Text style={styles(theme).sectionTitle}>Password</Text>

        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="New Password (leave empty to keep current)"
          secureTextEntry
          style={styles(theme).inputField}
        />

        <Text style={styles(theme).helperText}>
          Password must be at least 8 characters with one uppercase letter and one number.
        </Text>
      </Card>

      <Button
        title="Save Changes"
        onPress={handleSave}
        variant="primary"
        style={styles(theme).saveButton}
      />
    </ScrollView>
  );
}

/**
 * Component styles using dynamic theme system
 */
const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing['3xl'],
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
  },
  sectionHeader: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuItemTitle: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  menuItemSubtitle: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  settingsSection: {
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  validationSection: {
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  validationTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  switchLabel: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    color: theme.colors.textDark,
    backgroundColor: theme.colors.background,
  },
  verifyButton: {
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  verifyButtonText: {
    ...theme.textStyles.button,
    color: theme.colors.white,
  },
  saveButton: {
    margin: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.base,
  },
  saveButtonText: {
    ...theme.textStyles.button,
    color: theme.colors.white,
  },
  sectionTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
  },
  helperText: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  inputField: {
    marginBottom: theme.spacing.md,
  },
}); 