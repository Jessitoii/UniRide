import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Modal, Text, StatusBar, SafeAreaView, Alert, Image, FlatList } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import universities from '../../constants/Universities';
import { mapStyle } from '../../styles/mapStyle';
import { ActivityIndicator } from 'react-native-paper';
import { BASE_URL, GOOGLE_MAPS_API_KEY } from '@/env';
import * as Location from 'expo-location';
import { lightTheme, ThemeType } from '../../styles/theme';
import { useTranslation } from 'react-i18next';
import { useShortcuts } from '@/src/hooks/useShortcuts';

// Define types for suggestions
interface Suggestion {
  description: string;
  place_id: string;
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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [universitySuggestions, setUniversitySuggestions] = useState<any[]>([]);
  const [facultySuggestions, setFacultySuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<any>(null);

  const router = useRouter();
  const { t } = useTranslation();
  const { shortcuts, loading: shortcutsLoading } = useShortcuts();


  const searchUniversities = (query: string) => {
    if (!query.trim()) {
      // If empty query, show all universities
      return universities.map((uni) => ({ label: uni.name, value: uni.name }));
    }

    // Filter universities that match the query (case insensitive)
    const filtered = universities
      .filter(uni =>
        uni.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5) // Limit to top 5 results
      .map(uni => ({ label: uni.name, value: uni.name }));

    return filtered;
  };

  const searchFaculties = (query: string) => {
    //if query is empty, show all faculties of selected university
    if (!query.trim()) {
      return universities.find(uni => uni.name === selectedUniversity)?.faculties.map(faculty => ({ label: faculty.name, value: faculty.name }));
    }

    // Filter faculties that match the query (case insensitive) of selected university
    const filtered = universities.find(uni => uni.name === selectedUniversity)?.faculties
      .filter(faculty =>
        faculty.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5) // Limit to top 5 results
      .map(faculty => ({ label: faculty.name, value: faculty.name }));

    return filtered;
  }
  const fetchSuggestions = async (query: string) => {

    if (query.length < 3) return;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK') {
        return data.predictions
      }
      else {
        return []
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }

  };

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const suggestions = await fetchSuggestions(query);
      setSuggestions(suggestions);
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
  }

  const handleDoneButtonPress = async () => {
    if (!startLocation) {
      return;
    }
    if (destinationUniversity && !destinationFaculty) {
      return;
    }
    else if (!destinationUniversity && destinationFaculty) {
      return;
    }
    else if (destinationUniversity && destinationFaculty) {
      router.replace({
        pathname: '/(drawer)/(tabs)/PassengerScreen',
        params: {
          destinationUniversity: selectedUniversity,
          destinationFaculty: selectedFaculty,
          userLocation: JSON.stringify(selectedSuggestion)
        }
      });
    }
    else if (startLocation && !destinationUniversity && !destinationFaculty) {
      router.replace({
        pathname: '/(drawer)/(tabs)/PassengerScreen',
        params: {
          destinationUniversity: '',
          destinationFaculty: '',
          userLocation: JSON.stringify(selectedSuggestion)
        }
      });
    }
    else {
      console.log('startLocation is empty');
      return;
    }
  }

  useEffect(() => {
    handleSearch(startLocation);
  }, [startLocation]);

  useEffect(() => {
    handleSearchFaculties(destinationFaculty);
  }, [destinationFaculty]);

  useEffect(() => {
    handleSearchUniversities(destinationUniversity);
  }, [destinationUniversity]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header with back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          router.back();
          refreshStates();
          setFacultySuggestions([]);
          setSelectedSuggestion(null);
          setMapVisible(false);
        }}
      >
        <MaterialIcons name="close" size={28} color="#000" />
      </TouchableOpacity>

      {/* Location input container */}
      <View style={styles.locationContainer}>
        {/* Start location input */}
        <View style={styles.inputRow}>
          <View style={styles.markerContainer}>
            <View style={styles.purpleMarker} />
          </View>
          <TextInput
            style={styles.locationInput}
            placeholder={t('start_location_placeholder')}
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
        </View>

        <View style={styles.divider} />

        {/* Destination input */}
        <View style={styles.inputRow}>
          <View style={styles.markerContainer}>
            <View style={styles.pinkMarker} />
          </View>
          <TextInput
            style={styles.locationInput}
            placeholder={t('destination_university_placeholder')}
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
        </View>

        <View style={styles.divider} />
        <View style={styles.inputRow}>
          <View style={styles.markerContainer}>
            <View style={styles.blueMarker} />
          </View>
          <TextInput
            style={styles.locationInput}
            placeholder={t('destination_faculty_placeholder')}
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
              }
              else {
                //user can not write anything from here
                Alert.alert(t('error'), t('select_university_error'));
                return;
              }
            }}
          />
        </View>
      </View>

      {/* Shortcut buttons */}
      <View style={styles.shortcutsContainer}>
        {
          isLoading && (
            <ActivityIndicator size={'large'} color='#4b39ef' />
          )
        }

        {/* Shortcuts Chips for Start Location */}
        {inStartLocation && !startLocation && shortcuts.length > 0 && (
          <View style={styles.chipsContainer}>
            <FlatList
              horizontal
              data={shortcuts}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.shortcutChip}
                  onPress={() => {
                    setStartLocation(item.address);
                    setSelectedSuggestion({ latitude: item.latitude, longitude: item.longitude });
                  }}
                >
                  <MaterialIcons
                    name={item.label.toLowerCase().includes('home') ? 'home' : item.label.toLowerCase().includes('work') ? 'work' : 'place'}
                    size={18}
                    color="#4b39ef"
                  />
                  <Text style={styles.shortcutChipText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {inDestinationUniversity && universitySuggestions.length > 0 ? (
          universitySuggestions.map((suggestion) => (
            <TouchableOpacity
              key={`uni-${suggestion.value}`}
              style={styles.shortcutButton}
              onPress={() => {
                setSelectedUniversity(suggestion.label);
                setDestinationUniversity(suggestion.label);
              }}
            >
              <View style={styles.shortcutIcon}>
                <MaterialIcons name="school" size={24} color="#e94e77" />
              </View>
              <Text style={styles.shortcutText}>{suggestion.label}</Text>
            </TouchableOpacity>
          ))
        ) : null}

        {inDestinationFaculty && facultySuggestions.length > 0 ? (
          facultySuggestions.map((suggestion) => (
            <TouchableOpacity
              key={`faculty-${suggestion.value}`}
              style={styles.shortcutButton}
              onPress={() => {
                setSelectedFaculty(suggestion.label);
                setDestinationFaculty(suggestion.label);
              }}
            >
              <View style={styles.shortcutIcon}>
                <MaterialIcons name="business" size={24} color="#007bff" />
              </View>
              <Text style={styles.shortcutText}>{suggestion.label}</Text>
            </TouchableOpacity>
          ))
        ) : null}


        {inStartLocation && suggestions && suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <TouchableOpacity
              key={`suggestion-${suggestion.place_id}`}
              style={styles.shortcutButton}
              onPress={async () => {
                setIsLoading(true);
                try {
                  const response = await fetch(
                    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&key=${GOOGLE_MAPS_API_KEY}`
                  );
                  const data = await response.json();
                  if (data.status === 'OK') {
                    const location = data.result.geometry.location;
                    setSelectedSuggestion({ latitude: location.lat, longitude: location.lng });
                    setStartLocation(data.result.formatted_address);
                  }
                } catch (error) {
                  console.error('Error setting start location:', error);
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              <View style={styles.shortcutIcon}>
                <MaterialIcons name="location-on" size={24} color="#4b39ef" />
              </View>
              <Text style={styles.shortcutText}>{suggestion.description}</Text>
            </TouchableOpacity>
          ))
        ) : null}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => setMapVisible(true)}>
        <Text style={styles.buttonText}>{t('select_on_map')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleDoneButtonPress}>
        <Text style={styles.buttonText}>{t('complete')}</Text>
      </TouchableOpacity>

      {/* Map Modal */}
      <Modal visible={mapVisible} animationType="fade" transparent={true}>
        <View style={styles.modalContainer}>
          <MapView
            style={styles.map}
            customMapStyle={mapStyle}
            initialRegion={{
              latitude: 40.193298,
              longitude: 29.074202,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onRegionChange={setRegion}
          >
            {selectedSuggestion?.latitude != null && selectedSuggestion?.longitude != null ? (
              <Marker
                coordinate={{ latitude: selectedSuggestion.latitude, longitude: selectedSuggestion.longitude }}
              />
            ) : null}

            {region ? (
              <Marker
                coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                image={require('../../assets/images/map-marker-2.png')}
              />
            ) : null}

          </MapView>

          <TouchableOpacity style={styles.button} onPress={async () => {
            setSelectedSuggestion({ latitude: region.latitude, longitude: region.longitude });
            const location = await Location.reverseGeocodeAsync({ latitude: region.latitude, longitude: region.longitude });
            setStartLocation(location?.[0]?.formattedAddress || '');
            setMapVisible(false);
          }}>
            <Text style={styles.buttonText}>{t('select_on_map')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setMapVisible(false)}
          >
            <Text style={styles.closeButtonText}>{t('close')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  backButton: {
    padding: 10,
    marginLeft: 10,
  },
  optionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    justifyContent: 'center',
  },
  optionButtonText: {
    fontWeight: '500',
    marginHorizontal: 8,
  },
  locationContainer: {
    marginTop: 10,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  markerContainer: {
    width: 30,
    alignItems: 'center',
  },
  purpleMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4b39ef',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pinkMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e94e77',
    borderWidth: 2,
    borderColor: '#fff',
  },
  blueMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007bff',
    borderWidth: 2,
    borderColor: '#fff',
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 50,
  },
  plusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutsContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  shortcutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  map: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b39ef',
    textAlign: 'center',
  },
  dropdown: {
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4b39ef',
    marginTop: 10,
    padding: 10,
    borderRadius: 15,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  pin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    resizeMode: 'contain',
    zIndex: 1000,
  },
  pinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chipsContainer: {
    marginBottom: 10,
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  shortcutChipText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#4b39ef',
  },
});