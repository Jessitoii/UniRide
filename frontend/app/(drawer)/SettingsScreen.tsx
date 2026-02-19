
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
  useColorScheme,
  Linking,
  Modal
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

// Local imports
import { BASE_URL } from '@/env';
import { lightTheme, darkTheme, ThemeType } from '@/styles/theme';
import { Card, TouchableCard, Button, Input, Header } from '@/components/base';
import { useTheme } from '@/contexts/ThemeContext';
import { searchAddress, LocationResult } from '@/services/locationService';
import { getShortcuts, createShortcut, deleteShortcut, Shortcut } from '@/services/shortcutService';
import { userService } from '@/services/userService';

const MenuItem = ({
  icon,
  title,
  subtitle,
  onPress,
  rightComponent,
}: {
  icon: React.ReactNode,
  title: string,
  subtitle?: string,
  onPress?: () => void,
  rightComponent?: React.ReactNode,
}) => {
  const { theme } = useTheme();
  return (
    <TouchableCard
      onPress={onPress}
      style={styles(theme).menuItem}
    >
      <View style={styles(theme).menuIconContainer}>
        {icon}
      </View>
      <View style={styles(theme).menuTextContainer}>
        <Text style={styles(theme).menuItemTitle}>{title}</Text>
        {subtitle ? <Text style={styles(theme).menuItemSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightComponent}
    </TouchableCard>
  );
};

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  // User data state
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [userName, setUserName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [validationCode, setValidationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // App settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [appAlerts, setAppAlerts] = useState(false);
  const [locationFeatures, setLocationFeatures] = useState(false);
  const [locationAccess, setLocationAccess] = useState(false);

  // Shortcut state
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [isShortcutModalVisible, setIsShortcutModalVisible] = useState(false);
  const [shortcutLabel, setShortcutLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [loadingShortcuts, setLoadingShortcuts] = useState(false);

  // Map Selection State
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedMapCoordinate, setSelectedMapCoordinate] = useState<{ latitude: number, longitude: number } | null>(null);

  // Theme state from global context
  const { theme, setTheme, themePreference, isDark } = useTheme();

  const router = useRouter();

  // Effect to fetch user data
  useEffect(() => {
    fetchUserData();
    fetchShortcuts();
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
        setNotificationsEnabled(data.notificationsEnabled ?? true);
        setEmailNotifications(data.emailNotifications || false);
        setPushNotifications(data.pushNotifications || false);
        setAppAlerts(data.appAlerts || false);
        setLocationFeatures(data.locationFeatures || false);
        setLocationAccess(data.locationAccess || false);
      } else {
        console.error('Error fetching user data:', await response.json());
        Alert.alert(t('error'), 'Failed to load user data. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert(t('error'), 'An error occurred while fetching your data.');
    }
  };

  const fetchShortcuts = async () => {
    try {
      const data = await getShortcuts();
      setShortcuts(data);
    } catch (error) {
      console.error('Error fetching shortcuts:', error);
    }
  };

  const handleSearchAddress = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      const results = await searchAddress(text);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectLocation = (location: LocationResult) => {
    setSelectedLocation(location);
    setSearchQuery(location.display_name);
    setSearchResults([]);
  };

  const handleSaveShortcut = async () => {
    if (!shortcutLabel || !selectedLocation) {
      Alert.alert(t('error'), 'Please fill all fields');
      return;
    }

    setLoadingShortcuts(true);
    try {
      await createShortcut({
        label: shortcutLabel,
        address: selectedLocation.display_name,
        latitude: parseFloat(selectedLocation.lat),
        longitude: parseFloat(selectedLocation.lon)
      });
      setShortcutLabel('');
      setSearchQuery('');
      setSelectedLocation(null);
      setIsShortcutModalVisible(false);
      fetchShortcuts(); // Refresh list
      Alert.alert(t('success'), 'Shortcut saved successfully');
    } catch (error) {
      console.error('Error saving shortcut:', error);
      Alert.alert(t('error'), 'Failed to save shortcut');
    } finally {
      setLoadingShortcuts(false);
    }
  };

  const handleConfirmMapLocation = async () => {
    if (selectedMapCoordinate) {
      setIsMapModalVisible(false);
      // Reverse Geocode
      try {
        const result = await Location.reverseGeocodeAsync(selectedMapCoordinate);
        if (result && result.length > 0) {
          const address = result[0];
          const formattedAddress = [
            address.street,
            address.name,
            address.district,
            address.city
          ].filter(Boolean).join(', ');

          setSearchQuery(formattedAddress);
          setSelectedLocation({
            display_name: formattedAddress,
            lat: selectedMapCoordinate.latitude.toString(),
            lon: selectedMapCoordinate.longitude.toString(),
            place_id: Date.now(),
            importance: 1,
            licence: '',
            osm_type: 'node',
            osm_id: Date.now(),
            boundingbox: [],
            class: 'place',
            type: 'house'
          });
        }
      } catch (e) {
        console.error(e);
        Alert.alert(t('error'), 'Could not get address from location');
      }
    }
  };

  const handleDeleteShortcut = async (id: string) => {
    Alert.alert(
      t('delete'),
      'Are you sure you want to delete this shortcut?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteShortcut(id);
              await fetchShortcuts();
              Alert.alert(t('success'), t('shortcut_deleted'));
            } catch (error) {
              Alert.alert(t('error'), 'Failed to delete shortcut.');
            }
          }
        }
      ]
    );
  };

  // Handle authentication errors
  const handleAuthError = async () => {
    await AsyncStorage.removeItem('token');
    router.push('/auth/login');
  };

  // Handle language change
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  // Handle dark mode toggle
  const handleDarkModeToggle = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  // Handle push notifications toggle
  const handlePushNotificationsToggle = async (value: boolean) => {
    if (value) {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          Alert.alert(
            'Notifications Disabled',
            'To receive updates about your rides, please enable push notifications in system settings.',
            [
              { text: t('cancel'), style: 'cancel' },
              { text: t('settings'), onPress: () => Linking.openSettings() }
            ]
          );
          setPushNotifications(false);
          return;
        }
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
        setPushNotifications(false);
        return;
      }
    }
    setPushNotifications(value);
  };

  // Handle location access toggle
  const handleLocationAccessToggle = async (value: boolean) => {
    if (value) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          Alert.alert(
            'Location Access Required',
            'KampüsRoute needs location access to show nearby rides and provide navigation. Please enable it in system settings.',
            [
              { text: t('cancel'), style: 'cancel' },
              { text: t('settings'), onPress: () => Linking.openSettings() }
            ]
          );
          setLocationAccess(false);
          return;
        }
      } catch (error) {
        console.error('Error requesting location permissions:', error);
        setLocationAccess(false);
        return;
      }
    }
    setLocationAccess(value);
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
          notificationsEnabled,
          emailNotifications,
          pushNotifications,
          appAlerts,
          locationFeatures,
          locationAccess,
          darkMode: isDark,
        }),
      });

      if (response.ok) {

        // Handle Password Change if fields are present
        if (oldPassword && password) {
          if (!validatePassword(password)) {
            Alert.alert(
              'Invalid Password Format',
              'Password must be at least 8 characters long, include an uppercase letter and a number.'
            );
            return;
          }
          try {
            await userService.changePassword({ oldPassword, newPassword: password });
            setOldPassword('');
            setPassword('');
            Alert.alert(t('success'), 'Settings and Password updated successfully.');
          } catch (pwError: any) {
            console.error('Password change error:', pwError);
            Alert.alert(t('warning'), 'Settings saved, but password change failed: ' + (pwError.response?.data?.message || 'Unknown error'));
            return; // Stop here so we don't double alert
          }
        } else if (password && !oldPassword) {
          Alert.alert(t('warning'), 'Settings saved, but password was NOT changed because Old Password is missing.');
          return;
        }

        Alert.alert(t('success'), 'Your settings have been successfully updated.');
        router.push('/(drawer)/ProfileScreen');
      } else {
        const errorData = await response.json();
        Alert.alert(t('error'), errorData.message || 'Failed to save settings.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert(t('error'), 'An error occurred. Please try again.');
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
        Alert.alert(t('error'), errorData.message || 'Failed to send validation code.');
      }
    } catch (error) {
      console.error('Error sending validation code:', error);
      Alert.alert(t('error'), 'An error occurred. Please try again.');
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
      Alert.alert(t('error'), 'An error occurred. Please try again.');
    }
  };

  // Show email change modal
  const showEmailModal = () => {
    Alert.prompt(
      "Change Email Address",
      "Enter your new email address:",
      [
        {
          text: t('cancel'),
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
      return birthDate.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return t('not_set');
  };

  // Get theme description based on preference
  const getThemeDescription = () => {
    switch (themePreference) {
      case 'light':
        return t('light_mode');
      case 'dark':
        return t('dark_mode');
      default:
        return t('system_default');
    }
  };

  // Handle immediate notification toggle
  const handleImmediateNotificationToggle = async (value: boolean) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${BASE_URL}/api/users/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          notificationsEnabled: value
        })
      });

      if (response.ok) {
        // Optional: Show a small toast or just silent success
        // Alert.alert(t('success'), t('notifications_updated')); 
      } else {
        console.error('Failed to update notification toggle immediately');
        Alert.alert(t('error'), t('notifications_update_error'));
        setNotificationsEnabled(!value); // Revert UI
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      setNotificationsEnabled(!value); // Revert UI
    }
  };

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
        <Text style={styles(theme).headerTitle}>{t('settings')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles(theme).sectionHeader}>{t('general')}</Text>

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
        onPress={() => router.push('/(drawer)/EditProfileScreen')}
      />

      <MenuItem
        icon={
          <MaterialIcons
            name="language"
            size={24}
            color={theme.colors.primary}
          />
        }
        title={t('language')}
        subtitle={i18n.language === 'tr' ? 'Türkçe' : 'English'}
        onPress={() => {
          Alert.alert(t('select_language'), undefined, [
            { text: 'English', onPress: () => handleLanguageChange('en') },
            { text: 'Türkçe', onPress: () => handleLanguageChange('tr') },
            { text: t('cancel'), style: 'cancel' }
          ]);
        }}
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
      />

      <MenuItem
        icon={
          <MaterialIcons
            name="nightlight-round"
            size={24}
            color={theme.colors.primary}
          />
        }
        title={t('dark_mode')}
        subtitle={getThemeDescription()}
        rightComponent={
          <Switch
            value={isDark}
            onValueChange={handleDarkModeToggle}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primaryLight
            }}
            thumbColor={isDark ? theme.colors.primary : theme.colors.background}
          />
        }
      />

      <Text style={styles(theme).sectionHeader}>{t('shortcuts')}</Text>

      <MenuItem
        icon={<MaterialIcons name="add" size={24} color={theme.colors.primary} />}
        title={t('add_shortcut')}
        onPress={() => {
          setShortcutLabel('');
          setSearchQuery('');
          setSelectedLocation(null);
          setIsShortcutModalVisible(true);
        }}
      />

      {shortcuts.map((shortcut) => (
        <MenuItem
          key={shortcut.id}
          icon={<MaterialIcons name="place" size={24} color={theme.colors.secondary} />}
          title={shortcut.label}
          subtitle={shortcut.address}
          onPress={() => {
            // Future: Utilize shortcut
          }}
          rightComponent={
            <TouchableOpacity onPress={() => handleDeleteShortcut(shortcut.id)}>
              <MaterialIcons name="delete" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          }
        />
      ))}

      {showDatePicker ? (
        <DateTimePicker
          value={birthDate ? new Date(birthDate) : new Date()}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1950, 0, 1)}
        />
      ) : null}

      <Text style={styles(theme).sectionHeader}>{t('notifications')}</Text>

      <Card style={styles(theme).settingsSection}>
        <Text style={styles(theme).sectionTitle}>{t('notifications')}</Text>

        <View style={styles(theme).switchContainer}>
          <Text style={styles(theme).switchLabel}>{t('master_notification_title')}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={(val) => {
              setNotificationsEnabled(val);
              handleImmediateNotificationToggle(val);
            }}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primaryLight
            }}
            thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.background}
          />
        </View>

        <View style={styles(theme).switchContainer}>
          <Text style={styles(theme).switchLabel}>{t('email_notifications')}</Text>
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
          <Text style={styles(theme).switchLabel}>{t('push_notifications_title')}</Text>
          <Switch
            value={pushNotifications}
            onValueChange={handlePushNotificationsToggle}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primaryLight
            }}
            thumbColor={pushNotifications ? theme.colors.primary : theme.colors.background}
          />
        </View>

        <View style={styles(theme).switchContainer}>
          <Text style={styles(theme).switchLabel}>{t('app_notifications')}</Text>
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

      <Text style={styles(theme).sectionHeader}>{t('location_settings')}</Text>

      <Card style={styles(theme).settingsSection}>
        <Text style={styles(theme).sectionTitle}>{t('location_settings')}</Text>

        <View style={styles(theme).switchContainer}>
          <Text style={styles(theme).switchLabel}>{t('location_features')}</Text>
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
          <Text style={styles(theme).switchLabel}>{t('location_access')}</Text>
          <Switch
            value={locationAccess}
            onValueChange={handleLocationAccessToggle}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primaryLight
            }}
            thumbColor={locationAccess ? theme.colors.primary : theme.colors.background}
          />
        </View>
      </Card>

      {email !== originalEmail ? (
        <Card style={styles(theme).validationSection}>
          <Text style={styles(theme).validationTitle}>{t('verify_new_email')}</Text>

          <Input
            value={validationCode}
            onChangeText={setValidationCode}
            placeholder={t('enter_verification_code')}
            style={styles(theme).inputField}
          />

          <Button
            title={t('verify_email_button')}
            onPress={verifyEmail}
            variant="primary"
            style={styles(theme).verifyButton}
          />
        </Card>
      ) : null}
      <Card style={styles(theme).settingsSection}>
        <Text style={styles(theme).sectionTitle}>{t('password')}</Text>

        <Input
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder={t('old_password_placeholder') || "Old Password"}
          secureTextEntry={true}
          style={styles(theme).inputField}
        />

        <Input
          value={password}
          onChangeText={setPassword}
          placeholder={t('new_password_placeholder')}
          secureTextEntry={true}
          style={styles(theme).inputField}
        />

        <Text style={styles(theme).helperText}>
          {t('password_requirements')}
        </Text>
      </Card>

      <Button
        title={t('save')}
        onPress={handleSave}
        variant="primary"
        style={styles(theme).saveButton}
      />

      {/* Shortcut Modal */}
      <Modal
        visible={isShortcutModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsShortcutModalVisible(false)}
      >
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).modalContainer}>
            <Text style={styles(theme).modalTitle}>{t('add_shortcut')}</Text>

            <TextInput
              style={styles(theme).input}
              placeholder={t('shortcut_name')}
              value={shortcutLabel}
              onChangeText={setShortcutLabel}
            />

            <TextInput
              style={styles(theme).input}
              placeholder={t('search_address')}
              value={searchQuery}
              onChangeText={handleSearchAddress}
            />

            <Button
              title={t('select_on_map')}
              onPress={() => setIsMapModalVisible(true)}
              variant="secondary"
              style={{ marginBottom: 16 }}
            />

            {searchResults.length > 0 && (
              <ScrollView style={styles(theme).searchResults}>
                {searchResults.map((result) => (
                  <TouchableOpacity
                    key={result.place_id}
                    style={styles(theme).searchResultItem}
                    onPress={() => handleSelectLocation(result)}
                  >
                    <Text style={styles(theme).resultText}>{result.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles(theme).modalButtons}>
              <Button
                title={t('cancel')}
                onPress={() => setIsShortcutModalVisible(false)}
                variant="secondary"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={loadingShortcuts ? t('loading') : t('save')}
                onPress={handleSaveShortcut}
                variant="primary"
                disabled={loadingShortcuts}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Map Selection Modal */}
      <Modal
        visible={isMapModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsMapModalVisible(false)}
      >
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={mapRegion}
            onRegionChangeComplete={setMapRegion}
            onPress={(e) => setSelectedMapCoordinate(e.nativeEvent.coordinate)}
          >
            {selectedMapCoordinate && (
              <Marker coordinate={selectedMapCoordinate} />
            )}
          </MapView>

          <View style={{ position: 'absolute', bottom: 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button
              title={t('cancel')}
              onPress={() => setIsMapModalVisible(false)}
              variant="secondary"
              style={{ flex: 1, marginRight: 10 }}
            />
            <Button
              title="Confirm Location"
              onPress={handleConfirmMapLocation}
              variant="primary"
              style={{ flex: 1, marginLeft: 10 }}
              disabled={!selectedMapCoordinate}
            />
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

/**
 * Component styles using dynamic theme system
 */
const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
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
    backgroundColor: theme.colors.card,
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
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  validationSection: {
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.card,
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
    backgroundColor: theme.colors.surface,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  modalTitle: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  searchResults: {
    maxHeight: 150,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  searchResultItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultText: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
});