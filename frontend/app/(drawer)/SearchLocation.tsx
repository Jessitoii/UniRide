import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Modal, Text, StatusBar, SafeAreaView, Alert, FlatList, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import universities from '../../src/constants/Universities';
import { getMapStyle } from '@/styles/mapStyle';
import { ActivityIndicator } from 'react-native-paper';
import * as Location from 'expo-location';
import { getAddressFromCoords } from '@/services/locationService';
import { useTranslation } from 'react-i18next';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useTheme } from '@/contexts/ThemeContext';

interface Suggestion {
  description: string;
  place_id: string;
  latitude: number;
  longitude: number;
}

interface UniversitySuggestion {
  label: string;
  value: string;
}

export default function SearchLocation() {
  const [inStartLocation, setInStartLocation] = useState(true);
  const [inDestinationUniversity, setInDestinationUniversity] = useState(false);
  const [inDestinationFaculty, setInDestinationFaculty] = useState(false);
  const [startLocation, setStartLocation] = useState('');
  const [destinationUniversity, setDestinationUniversity] = useState('');
  const [destinationFaculty, setDestinationFaculty] = useState('');
  const [mapVisible, setMapVisible] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<{ latitude: number; longitude: number } | null>(null);
  const [universitySuggestions, setUniversitySuggestions] = useState<UniversitySuggestion[]>([]);
  const [facultySuggestions, setFacultySuggestions] = useState<UniversitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<any>(null);

  const router = useRouter();
  const { t } = useTranslation();
  const { shortcuts } = useShortcuts();
  const { theme, isDark } = useTheme();

  const styles = createStyles(theme);

  const searchUniversities = (query: string) => {
    if (!query.trim()) {
      return universities.map((uni) => ({ label: uni.name, value: uni.name }));
    }
    return universities
      .filter(uni => uni.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map(uni => ({ label: uni.name, value: uni.name }));
  };

  const searchFaculties = (query: string) => {
    if (!query.trim()) {
      return universities.find(uni => uni.name === selectedUniversity)?.faculties.map(faculty => ({ label: faculty.name, value: faculty.name }));
    }
    return universities.find(uni => uni.name === selectedUniversity)?.faculties
      .filter(faculty => faculty.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map(faculty => ({ label: faculty.name, value: faculty.name }));
  };

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) return [];
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=tr`,
        {
          headers: {
            'User-Agent': 'KampusRoute-App-v1',
            'Accept-Language': 'tr-TR,tr;q=0.9'
          }
        }
      );

      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          description: item.display_name,
          place_id: item.place_id ? item.place_id.toString() : Math.random().toString(),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  };

  const handleSearch = async (query: string) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await fetchSuggestions(query);
      setSuggestions(results);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setError('Error fetching suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchUniversities = async (query: string) => {
    const universities = await searchUniversities(query);
    setUniversitySuggestions(universities);
  };

  const handleSearchFaculties = async (query: string) => {
    const faculties = await searchFaculties(query);
    setFacultySuggestions(faculties || []);
  };

  const refreshStates = () => {
    setStartLocation('');
    setDestinationUniversity('');
    setDestinationFaculty('');
    setSelectedUniversity('');
    setSelectedFaculty('');
    setSuggestions([]);
  };



  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    try {
      // 1. Check if services are enabled
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        Alert.alert(t('error'), t('location_services_disabled', 'Please enable location services.'));
        setIsLoading(false);
        return;
      }

      // 2. Request Permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('error'), t('permission_denied'));
        setIsLoading(false);
        return;
      }

      // 3. Get Position (default accuracy)
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const address = await getAddressFromCoords(location.coords.latitude, location.coords.longitude);

      if (address) {
        setStartLocation(address);
        setSelectedSuggestion({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        setInStartLocation(true);
        setInDestinationUniversity(false);
        setInDestinationFaculty(false);
        setSuggestions([]);
        Keyboard.dismiss();
      }
    } catch (e) {
      console.error('Location error:', e);
      Alert.alert(t('error'), t('location_error', 'Could not fetch location.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoneButtonPress = async () => {
    if (!startLocation) return;
    if (destinationUniversity && !destinationFaculty) return;
    if (!destinationUniversity && destinationFaculty) return;

    const params: any = {
      userLocation: JSON.stringify(selectedSuggestion)
    };

    if (destinationUniversity && destinationFaculty) {
      params.destinationUniversity = selectedUniversity;
      params.destinationFaculty = selectedFaculty;
    } else {
      params.destinationUniversity = '';
      params.destinationFaculty = '';
    }

    router.replace({
      pathname: '/(drawer)/(tabs)/PassengerScreen',
      params: params
    });
  };

  useEffect(() => {
    if (inStartLocation) handleSearch(startLocation);
  }, [startLocation, inStartLocation]);

  useEffect(() => {
    handleSearchFaculties(destinationFaculty);
  }, [destinationFaculty]);

  useEffect(() => {
    handleSearchUniversities(destinationUniversity);
  }, [destinationUniversity]);

  const clearStartLocation = () => {
    setStartLocation('');
    setSuggestions([]);
  };
  const clearDestinationUni = () => {
    setDestinationUniversity('');
    setSelectedUniversity('');
  };
  const clearDestinationFaculty = () => {
    setDestinationFaculty('');
    setSelectedFaculty('');
  };

  const renderHeader = () => (
    <View style={styles.header}>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {
          router.back();
          refreshStates();
          // Reset other states
          setFacultySuggestions([]);
          setSelectedSuggestion(null);
          setMapVisible(false);
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialIcons name="close" size={24} color={theme.colors.text} />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>{t('search_ride')}</Text>

      <TouchableOpacity
        style={styles.completeButton}
        onPress={handleDoneButtonPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.completeButtonText, { color: theme.colors.primary }]}>{t('complete')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.safeArea} />
      {renderHeader()}

      <View style={styles.locationContainer}>
        {/* Start Location Input */}
        <View style={styles.inputWrapper}>
          <View style={styles.markerContainer}>
            <View style={[styles.markerDot, { backgroundColor: theme.colors.primary }]} />
            <View style={styles.verticalLine} />
          </View>
          <View style={styles.inputContent}>
            <Text style={styles.label}>{t('start_location_placeholder')}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.locationInput}
                placeholder={t('start_location_placeholder')}
                placeholderTextColor={theme.colors.textLight}
                value={startLocation}
                onChangeText={setStartLocation}
                onFocus={() => {
                  setInStartLocation(true);
                  setInDestinationUniversity(false);
                  setInDestinationFaculty(false);
                  setSuggestions([]);
                  setUniversitySuggestions([]);
                  setFacultySuggestions([]);
                }}
              />
              {startLocation.length > 0 && inStartLocation && (
                <TouchableOpacity onPress={clearStartLocation} style={styles.clearButton}>
                  <MaterialIcons name="cancel" size={20} color={theme.colors.textLight} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Destination University Input */}
        <View style={styles.inputWrapper}>
          <View style={styles.markerContainer}>
            <View style={[styles.markerDot, { backgroundColor: theme.colors.secondary }]} />
            <View style={styles.verticalLine} />
          </View>
          <View style={styles.inputContent}>
            <Text style={styles.label}>{t('destination_university_placeholder')}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.locationInput}
                placeholder={t('destination_university_placeholder')}
                placeholderTextColor={theme.colors.textLight}
                value={destinationUniversity}
                onChangeText={setDestinationUniversity}
                onFocus={() => {
                  setInStartLocation(false);
                  setInDestinationUniversity(true);
                  setInDestinationFaculty(false);
                  setSuggestions([]);
                  setUniversitySuggestions([]);
                  setFacultySuggestions([]);
                }}
              />
              {destinationUniversity.length > 0 && inDestinationUniversity && (
                <TouchableOpacity onPress={clearDestinationUni} style={styles.clearButton}>
                  <MaterialIcons name="cancel" size={20} color={theme.colors.textLight} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Destination Faculty Input */}
        <View style={styles.inputWrapper}>
          <View style={styles.markerContainer}>
            <View style={[styles.markerDot, { backgroundColor: '#007bff' }]} />
          </View>
          <View style={styles.inputContent}>
            <Text style={styles.label}>{t('destination_faculty_placeholder')}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.locationInput}
                placeholder={t('destination_faculty_placeholder')}
                placeholderTextColor={theme.colors.textLight}
                value={destinationFaculty}
                onChangeText={setDestinationFaculty}
                onFocus={() => {
                  if (selectedUniversity) {
                    setInStartLocation(false);
                    setInDestinationUniversity(false);
                    setInDestinationFaculty(true);
                    setSuggestions([]);
                    setUniversitySuggestions([]);
                    setFacultySuggestions([]);
                  } else {
                    Keyboard.dismiss();
                    Alert.alert(t('error'), t('select_university_error'));
                  }
                }}
              />
              {destinationFaculty.length > 0 && inDestinationFaculty && (
                <TouchableOpacity onPress={clearDestinationFaculty} style={styles.clearButton}>
                  <MaterialIcons name="cancel" size={20} color={theme.colors.textLight} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      <FlatList
        data={
          inStartLocation && startLocation.length >= 3 ? suggestions :
            inStartLocation && !startLocation ? shortcuts :
              inDestinationUniversity ? universitySuggestions :
                inDestinationFaculty ? facultySuggestions : []
        }
        keyExtractor={(item: any) => item.place_id || item.value || item.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <TouchableOpacity
              style={styles.mapActionItem}
              onPress={() => setMapVisible(true)}
            >
              <View style={[styles.resultIconContainer, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }]}>
                <MaterialIcons name="map" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.resultTextContainer}>
                <Text style={styles.resultTitle}>{t('select_on_map')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={theme.colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapActionItem}
              onPress={handleUseCurrentLocation}
            >
              <View style={[styles.resultIconContainer, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }]}>
                <MaterialIcons name="my-location" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.resultTextContainer}>
                <Text style={[styles.resultTitle, { color: theme.colors.primary }]}>{t('use_current_location')}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.listDivider} />

            {isLoading ? <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} /> : null}
          </View>
        }
        renderItem={({ item }) => {
          let iconName: any = 'place';
          let iconColor = theme.colors.primary;
          let mainText = '';
          let subText = '';
          let onPress = () => { };

          if (inStartLocation && startLocation.length >= 3) {
            iconName = 'location-on';
            mainText = item.description;
            onPress = () => {
              setSelectedSuggestion({ latitude: item.latitude, longitude: item.longitude });
              setStartLocation(item.description);
              setSuggestions([]);
              Keyboard.dismiss();
            };
          } else if (inStartLocation && !startLocation) {
            iconName = item.label.toLowerCase().includes('home') ? 'home' : item.label.toLowerCase().includes('work') ? 'work' : 'place';
            mainText = item.label;
            subText = item.address;
            onPress = () => {
              setSelectedSuggestion({ latitude: item.latitude, longitude: item.longitude });
              setStartLocation(item.address);
              Keyboard.dismiss();
            };
          } else if (inDestinationUniversity) {
            iconName = 'school';
            iconColor = theme.colors.secondary;
            mainText = item.label;
            onPress = () => {
              setSelectedUniversity(item.label);
              setDestinationUniversity(item.label);
              setUniversitySuggestions([]);
              Keyboard.dismiss();
            };
          } else if (inDestinationFaculty) {
            iconName = 'business';
            iconColor = '#007bff';
            mainText = item.label;
            onPress = () => {
              setSelectedFaculty(item.label);
              setDestinationFaculty(item.label);
              setFacultySuggestions([]);
              Keyboard.dismiss();
            };
          }

          return (
            <TouchableOpacity style={styles.resultItem} onPress={onPress}>
              <View style={[styles.resultIconContainer, { backgroundColor: (inStartLocation && !startLocation) ? theme.colors.card : iconColor + '15', borderWidth: (inStartLocation && !startLocation) ? 1 : 0, borderColor: theme.colors.border }]}>
                <MaterialIcons name={iconName} size={24} color={iconColor} />
              </View>
              <View style={styles.resultTextContainer}>
                <Text style={styles.resultTitle} numberOfLines={2}>{mainText}</Text>
                {subText ? <Text style={styles.resultSubtitle} numberOfLines={1}>{subText}</Text> : null}
              </View>
              <MaterialIcons name="north-west" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={mapVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <MapView
            style={styles.map}
            customMapStyle={getMapStyle(theme)}
            initialRegion={{
              latitude: 40.193298,
              longitude: 29.074202,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onRegionChangeComplete={(region) => {
              setRegion(region)
            }}
          />

          <View pointerEvents="none" style={styles.centerMarker}>
            <MaterialIcons name="location-on" size={40} color={theme.colors.primary} />
          </View>

          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setMapVisible(false)}>
              <MaterialIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('select_on_map')}</Text>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.confirmLocationButton}
              onPress={async () => {
                if (region) {
                  setSelectedSuggestion({ latitude: region.latitude, longitude: region.longitude });
                  setIsLoading(true);
                  try {
                    const location = await Location.reverseGeocodeAsync({ latitude: region.latitude, longitude: region.longitude });
                    if (location && location[0]) {
                      setStartLocation(location[0].formattedAddress || `${location[0].street || ''} ${location[0].city || ''}`);
                    }
                  } catch (e) {
                    console.error("Reverse geocode failed", e);
                  } finally {
                    setIsLoading(false);
                  }
                  setMapVisible(false);
                }
              }}
            >
              <Text style={styles.buttonText}>{t('confirm_location')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg, // 16px
    paddingVertical: theme.spacing.md, // 12px
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
  },
  completeButton: {
    padding: 8,
    marginRight: -8,
  },
  completeButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
  },
  locationContainer: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  inputContent: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  markerContainer: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
    paddingTop: 8,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.border,
    marginTop: 4,
    minHeight: 20,
  },
  locationInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
  },
  mapActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  listDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg, // 16px
  },
  resultTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  resultTitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
  },
  buttonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.md,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    flex: 1,
  },
  modalHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.full,
    padding: 8,
    ...theme.shadows.md,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: 'bold',
    marginLeft: 12,
    color: theme.colors.text,
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -20,
    zIndex: 10,
  },
  modalFooter: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  confirmLocationButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    ...theme.shadows.lg,
  }
});