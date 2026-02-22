import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Polyline, Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import polyline from 'polyline';
import { BASE_URL } from '@/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import universities from '@/constants/Universities';
import { DEFAULT_MAP_REGION } from '@/constants';

import { Modal } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { Post } from '@/components';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { useTranslation } from 'react-i18next';
import useDebounce from '@/hooks/useDebounce';
import { useShortcuts } from '@/hooks/useShortcuts';

const PostScreen = () => {
  const { theme, isDark, mapStyle } = useTheme();
  const { t, i18n } = useTranslation();
  const { shortcuts, loading: shortcutsLoading } = useShortcuts();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [sourceAddress, setSourceAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [universitySuggestions, setUniversitySuggestions] = useState<any[]>([]);
  const [facultySuggestions, setFacultySuggestions] = useState<any[]>([]);
  const [sourceCoords, setSourceCoords] = useState<any>(null);
  const [destinationCoords, setDestinationCoords] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [initialRegion, setInitialRegion] = useState(DEFAULT_MAP_REGION);
  const [sourceSuggestions, setSourceSuggestions] = useState<any[]>([]);
  const [travelDate, setTravelDate] = useState<Date | null>(null);
  const [travelTime, setTravelTime] = useState<Date | null>(null);
  const [datetimeStart, setDatetimeStart] = useState<Date | null>(null);
  const [datetimeEnd, setDatetimeEnd] = useState<Date | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [universityInput, setUniversityInput] = useState('');
  const [facultyInput, setFacultyInput] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [step3region, setStep3Region] = useState({
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [step1Region, setStep1Region] = useState<any>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [post, setPost] = useState<any>(null);
  const router = useRouter();

  // Debounce the source address input for API calls
  const debouncedSourceAddress = useDebounce(sourceAddress, 500);

  const searchUniversities = (query: string) => {
    const isEn = i18n.language?.startsWith('en');
    const getLocalName = (nameObj: any) => isEn ? (nameObj.en || nameObj.tr) : (nameObj.tr || nameObj.en);

    if (!query.trim()) {
      return universities.map((uni, index) => ({
        label: getLocalName(uni.name),
        value: getLocalName(uni.name),
        universityName: getLocalName(uni.name),
        name: getLocalName(uni.name),
        index
      }));
    }
    const lowerQuery = query.toLowerCase();
    return universities
      .filter(uni => (uni.name.tr && uni.name.tr.toLowerCase().includes(lowerQuery)) ||
        (uni.name.en && uni.name.en.toLowerCase().includes(lowerQuery)))
      .slice(0, 5)
      .map((uni, index) => ({
        label: getLocalName(uni.name),
        value: getLocalName(uni.name),
        universityName: getLocalName(uni.name),
        name: getLocalName(uni.name),
        index
      }));
  };

  const searchFaculties = (query: string) => {
    const isEn = i18n.language?.startsWith('en');
    const getLocalName = (nameObj: any) => isEn ? (nameObj.en || nameObj.tr) : (nameObj.tr || nameObj.en);

    const uni = universities.find(u => getLocalName(u.name) === selectedUniversity || u.name.tr === selectedUniversity || u.name.en === selectedUniversity);

    if (!uni) return [];

    if (!query.trim()) {
      return uni.faculties.map((faculty, index) => ({
        label: getLocalName(faculty.name),
        value: getLocalName(faculty.name),
        universityName: getLocalName(uni.name),
        name: getLocalName(faculty.name),
        index
      }));
    }
    const lowerQuery = query.toLowerCase();
    return uni.faculties
      .filter(faculty => (faculty.name.tr && faculty.name.tr.toLowerCase().includes(lowerQuery)) ||
        (faculty.name.en && faculty.name.en.toLowerCase().includes(lowerQuery)))
      .slice(0, 5)
      .map((faculty, index) => ({
        label: getLocalName(faculty.name),
        value: getLocalName(faculty.name),
        universityName: getLocalName(uni.name),
        name: getLocalName(faculty.name),
        index
      }));
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setSourceCoords(location.coords);
      }
    })();
  }, []);

  const extractDistrict = (address: string) => {
    if (!address) return '';
    const parts = address.split(',');
    return parts.length > 1 ? parts[1].trim() : address;
  };

  useEffect(() => {
    setUniversitySuggestions(searchUniversities(universityInput));
  }, [universityInput]);

  useEffect(() => {
    setFacultySuggestions(searchFaculties(facultyInput) || []);
  }, [facultyInput, selectedUniversity]);

  const handleStep1RegionChange = (region: any) => {
    setStep1Region(region);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && sourceCoords) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedFaculty && destinationCoords) {
        fetchRoute();
        setCurrentStep(3);
        setCurrentStep(3);
      } else {
        Alert.alert(t('error'), t('select_locations_error'));
      }
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      handleCreatePost();
      setCurrentStep(5);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prevStep) => Math.max(prevStep - 1, 1));
  };

  // Nominatim Search Logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSourceAddress || debouncedSourceAddress.length < 3) {
        setSourceSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedSourceAddress)}&limit=5&addressdetails=1&countrycodes=tr`,
          {
            headers: {
              'User-Agent': 'UniRide-App-v1', // MANDATORY
              'Accept-Language': 'tr-TR,tr;q=0.9'   // Optional: For Turkish results
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSourceSuggestions(data.map((item: any) => ({
            place_id: item.place_id,
            description: item.display_name,
            geometry: {
              location: {
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
              }
            },
            formatted_address: item.display_name
          })));
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSourceAddress]);

  const handleLocationSelect = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const selectedLocation = { latitude, longitude };
    Location.reverseGeocodeAsync(selectedLocation).then((response) => {
      if (response[0]) {
        const address = `${response[0].street || ''} ${response[0].name || ''}, ${response[0].district || ''}, ${response[0].city || ''}`;
        if (currentStep === 1) {
          setSourceAddress(address);
          setSourceCoords(selectedLocation);
        } else {
          setDestinationAddress(address);
          setDestinationCoords(selectedLocation);
        }
      }
    }).catch((error) => {
      console.error('Error getting address:', error);
    });
  };

  const useCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const response = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (response[0]) {
        const address = `${response[0].street || ''} ${response[0].name || ''}, ${response[0].district || ''}, ${response[0].city || ''}`;
        if (currentStep === 1) {
          setSourceAddress(address);
          setSourceCoords(location.coords);
        }
      }
    } catch (error) {
      console.error('Error using current location:', error);
    }
  };

  const fetchRoute = async () => {
    if (sourceCoords && destinationCoords) {
      try {
        // OSRM requires {longitude},{latitude} format
        const start = `${sourceCoords.longitude},${sourceCoords.latitude}`;
        const end = `${destinationCoords.longitude},${destinationCoords.latitude}`;

        const url = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=polyline&alternatives=true`;
        console.log('OSRM Request URL:', url);

        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          // Transform OSRM routes to match our expected format
          const transformedRoutes = data.routes.map((route: any, index: number) => ({
            ...route,
            summary: `Route ${index + 1}`, // OSRM doesn't always provide a summary like Google
            legs: [{
              distance: { text: (route.distance / 1000).toFixed(1) + ' km', value: route.distance },
              duration: { text: Math.round(route.duration / 60) + ' mins', value: route.duration }
            }],
            overview_polyline: { points: route.geometry }
          }));

          setRoutes(transformedRoutes.slice(0, 2));
          setCurrentStep(3);
        } else {
          console.error('OSRM Error:', data);
          console.error('OSRM Error:', data);
          Alert.alert(t('route_not_found'), data.message || data.code);
        }
      } catch (error) {
        console.error('Fetch Route Error:', error);
        Alert.alert(t('route_fetch_error'));
      }
    } else {
      Alert.alert(t('error'), t('select_locations_error'));
    }
  };

  const handleRouteSelect = (route: any) => {
    setSelectedRoute(route);
    // OSRM geometries are usually polyline5 compatible, same as Google
    const points = route.overview_polyline.points;
    const decodedCoords = polyline.decode(points).map(([latitude, longitude]) => ({
      latitude,
      longitude,
    }));
    setRouteCoordinates(decodedCoords);
  };

  const handleCreatePost = async () => {
    try {
      if (!datetimeStart || isNaN(datetimeStart.getTime())) {
        Alert.alert(t('error'), t('invalid_start_time'));
        return;
      }
      if (!selectedRoute) {
        Alert.alert(t('error'), t('select_route_error'));
        return;
      }
      const routeDurationInSeconds = selectedRoute.legs[0].duration.value;
      const end = new Date(datetimeStart.getTime() + routeDurationInSeconds * 1000);
      const token = await AsyncStorage.getItem('token');
      const cleanedSourceCoords = JSON.stringify(sourceCoords);
      const cleanedRoute = JSON.stringify(routeCoordinates);

      const response = await fetch(`${BASE_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceAddress,
          sourceCoordinates: cleanedSourceCoords,
          destinationUniversity: selectedUniversity,
          destinationFaculty: selectedFaculty,
          route: cleanedRoute,
          datetimeStart: datetimeStart.toISOString(),
          datetimeEnd: end.toISOString(),
        })
      });

      if (response.ok) {
        const newPost = await response.json();
        setPost(newPost);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const d = selectedDate;
      setTravelDate(d);
      if (travelTime) {
        setDatetimeStart(new Date(d.getFullYear(), d.getMonth(), d.getDate(), travelTime.getHours(), travelTime.getMinutes()));
      } else {
        setDatetimeStart(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0));
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTravelTime(selectedTime);
      if (travelDate) {
        setDatetimeStart(new Date(travelDate.getFullYear(), travelDate.getMonth(), travelDate.getDate(), selectedTime.getHours(), selectedTime.getMinutes()));
      }
    }
  };

  const renderStep = () => {
    const s = styles(theme);
    switch (currentStep) {
      case 1:
        return (
          <View style={s.stepContainer}>
            <View style={s.header}>
              <Text style={s.headerText}>{t('step_1_title')}</Text>
            </View>
            <View style={s.locationContainer}>
              <View style={s.inputRow}>
                <View style={s.markerContainer}>
                  <View style={s.purpleMarker} />
                </View>
                <TextInput
                  style={s.locationInput}
                  placeholder={t('start_location_placeholder')}
                  placeholderTextColor={theme.colors.textLight}
                  value={sourceAddress}
                  onChangeText={setSourceAddress}
                />
              </View>
            </View>
            <ScrollView style={s.shortcutsScroll}>
              {/* Shortcuts Section */}
              {!sourceAddress && shortcuts.length > 0 && (
                <View style={s.shortcutsContainer}>
                  <Text style={s.sectionTitle}>{t('saved_locations')}</Text>
                  <FlatList
                    horizontal
                    data={shortcuts}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 5, paddingVertical: 10 }}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={s.shortcutChip}
                        onPress={() => {
                          setSourceAddress(item.address);
                          setSourceCoords({
                            latitude: item.latitude,
                            longitude: item.longitude
                          });
                        }}
                      >
                        <MaterialIcons
                          name={item.label.toLowerCase().includes('home') ? 'home' : item.label.toLowerCase().includes('work') ? 'work' : 'place'}
                          size={16}
                          color={theme.colors.primary}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={s.shortcutChipText}>{item.label}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}

              {sourceAddress.length >= 3 && sourceSuggestions.length > 0 ? (
                sourceSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.place_id}
                    style={s.shortcutButton}
                    onPress={() => {
                      setSourceCoords({
                        latitude: suggestion.geometry.location.lat,
                        longitude: suggestion.geometry.location.lng
                      });
                      setSourceAddress(suggestion.formatted_address);
                    }}
                  >
                    <MaterialIcons name="location-on" size={24} color={theme.colors.primary} />
                    <Text style={s.shortcutText}>{suggestion.description}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View>
                  <TouchableOpacity style={s.shortcutButton} onPress={useCurrentLocation}>
                    <MaterialIcons name="my-location" size={24} color={theme.colors.primary} />
                    <Text style={s.shortcutText}>{t('use_current_location')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.shortcutButton} onPress={() => setMapVisible(true)}>
                    <MaterialIcons name="map" size={24} color={theme.colors.primary} />
                    <Text style={s.shortcutText}>{t('select_on_map')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <Modal visible={mapVisible} onDismiss={() => setMapVisible(false)}>
              <View style={s.mapModalContent}>
                <MapView
                  style={s.map}
                  initialRegion={initialRegion}
                  onPress={handleLocationSelect}
                  customMapStyle={mapStyle}
                  onRegionChange={handleStep1RegionChange}
                >
                  {sourceCoords && (
                    <Marker coordinate={sourceCoords}>
                      <MaterialIcons name="location-on" size={30} color={theme.colors.primary} />
                    </Marker>
                  )}
                  {step1Region && (
                    <Marker coordinate={step1Region}>
                      <MaterialIcons name="location-on" size={30} color={theme.colors.primary} />
                    </Marker>
                  )}
                </MapView>
                <TouchableOpacity style={s.primaryButton} onPress={async () => {
                  if (step1Region) {
                    setSourceCoords(step1Region);
                    const address = await Location.reverseGeocodeAsync(step1Region);
                    setSourceAddress(address?.[0]?.formattedAddress || t('selected_location'));
                  }
                  setMapVisible(false);
                }}>
                  <Text style={s.primaryButtonText}>{t('confirm_location')}</Text>
                </TouchableOpacity>
              </View>
            </Modal>

            <TouchableOpacity style={s.fab} onPress={handleNextStep} disabled={!sourceAddress}>
              <MaterialIcons name="arrow-forward" size={36} color="white" />
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View style={s.stepContainer}>
            <View style={s.navRow}>
              <TouchableOpacity onPress={() => setCurrentStep(1)}>
                <MaterialIcons name="arrow-back" size={28} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={s.header}>
              <Text style={s.headerText}>{t('step_2_title')}</Text>
            </View>
            <View style={s.locationContainer}>
              <View style={s.inputRow}>
                <View style={s.markerContainer}><View style={s.purpleMarker} /></View>
                <TextInput
                  style={s.locationInput}
                  placeholder={t('university_placeholder')}
                  placeholderTextColor={theme.colors.textLight}
                  value={universityInput}
                  onChangeText={setUniversityInput}
                />
              </View>
              <View style={s.divider} />
              <View style={s.inputRow}>
                <View style={s.markerContainer}><View style={s.pinkMarker} /></View>
                <TextInput
                  style={s.locationInput}
                  placeholder={t('faculty_placeholder')}
                  placeholderTextColor={theme.colors.textLight}
                  value={facultyInput}
                  onChangeText={setFacultyInput}
                  editable={!!selectedUniversity}
                />
              </View>
            </View>
            <ScrollView style={s.shortcutsScroll}>
              {universityInput && universitySuggestions.length > 0 && universitySuggestions.map((u, index) => (
                <TouchableOpacity key={`${u.universityName}-${u.name}-${index}`} style={s.shortcutButton} onPress={() => {
                  setSelectedUniversity(u.label);
                  setUniversityInput(u.label);
                  setFacultyInput('');
                }}>
                  <MaterialIcons name="school" size={24} color={theme.colors.secondary} />
                  <Text style={s.shortcutText}>{u.label}</Text>
                </TouchableOpacity>
              ))}
              {selectedUniversity && facultySuggestions.length > 0 && facultySuggestions.map((f, index) => (
                <TouchableOpacity key={`${f.universityName}-${f.name}-${index}`} style={s.shortcutButton} onPress={() => {
                  setSelectedFaculty(f.label);
                  setFacultyInput(f.label);
                  const uniObj = universities.find(uni => uni.name.tr === selectedUniversity || uni.name.en === selectedUniversity || (i18n.language?.startsWith('en') ? uni.name.en : uni.name.tr) === selectedUniversity);
                  const loc = uniObj?.faculties.find(fac => fac.name.tr === f.label || fac.name.en === f.label || (i18n.language?.startsWith('en') ? fac.name.en : fac.name.tr) === f.label)?.location;
                  setDestinationCoords(loc);
                }}>
                  <MaterialIcons name="account-balance" size={24} color={theme.colors.primary} />
                  <Text style={s.shortcutText}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={s.fab} onPress={handleNextStep} disabled={!selectedUniversity || !selectedFaculty}>
              <MaterialIcons name="arrow-forward" size={36} color="white" />
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={s.stepContainer}>
            <View style={s.navRow}>
              <TouchableOpacity onPress={handlePreviousStep}>
                <MaterialIcons name="arrow-back" size={28} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={s.header}>
              <Text style={s.headerText}>{t('step_3_title')}</Text>
            </View>
            <View style={s.mapContainerSmall}>
              <MapView
                style={s.map}
                customMapStyle={mapStyle}
                initialRegion={{
                  latitude: (sourceCoords.latitude + destinationCoords.latitude) / 2,
                  longitude: (sourceCoords.longitude + destinationCoords.longitude) / 2,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
              >
                {selectedRoute && routeCoordinates.length > 0 && (
                  <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor={theme.colors.primary} />
                )}
                <Marker coordinate={sourceCoords} title={t('start_label')} />
                <Marker coordinate={destinationCoords} title={t('destination_label')} />
              </MapView>
            </View>
            <FlatList
              data={routes}
              keyExtractor={(item) => item.summary}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.routeItem, selectedRoute?.summary === item.summary && s.selectedRouteItem]}
                  onPress={() => handleRouteSelect(item)}
                >
                  <View style={s.routeInfo}>
                    <Text style={s.routeSummary}>{item.summary}</Text>
                    <Text style={s.routeDetails}>{item.legs[0].distance.text} • {item.legs[0].duration.text.replace('hours', 'sa').replace('mins', 'dk')}</Text>
                  </View>
                  {selectedRoute?.summary === item.summary && (
                    <MaterialIcons name="check-circle" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={s.fab} onPress={handleNextStep} disabled={!selectedRoute}>
              <MaterialIcons name="arrow-forward" size={36} color="white" />
            </TouchableOpacity>
          </View>
        );
      case 4:
        return (
          <View style={s.stepContainer}>
            <View style={s.navRow}>
              <TouchableOpacity onPress={() => setCurrentStep(3)}>
                <MaterialIcons name="arrow-back" size={28} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={s.header}>
              <Text style={s.headerText}>{t('step_4_title')}</Text>
            </View>
            <View style={s.dateTimeContainer}>
              <TouchableOpacity style={s.dateTimeButton} onPress={() => setShowDatePicker(true)}>
                <MaterialIcons name="event" size={24} color={theme.colors.primary} />
                <Text style={s.dateTimeButtonText}>{travelDate ? travelDate.toLocaleDateString() : t('select_date')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.dateTimeButton} onPress={() => setShowTimePicker(true)}>
                <MaterialIcons name="access-time" size={24} color={theme.colors.primary} />
                <Text style={s.dateTimeButtonText}>{travelTime ? travelTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('select_time')}</Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker value={travelDate || new Date()} mode="date" display="default" onChange={handleDateChange} />
            )}
            {showTimePicker && (
              <DateTimePicker value={travelTime || new Date()} mode="time" display="default" onChange={handleTimeChange} />
            )}
            <TouchableOpacity style={s.primaryButton} onPress={handleNextStep} disabled={!travelDate || !travelTime}>
              <Text style={s.primaryButtonText}>{t('share_ride')}</Text>
            </TouchableOpacity>
          </View>
        );
      case 5:
        return (
          <View style={s.confirmationContainer}>
            <MaterialIcons name="check-circle" size={100} color={theme.colors.success} />
            <Text style={s.confirmationTitle}>{t('ride_shared_success')}</Text>
            {post && (
              <Post
                id={post.id}
                from={extractDistrict(post.sourceAddress)}
                to={post.destinationFaculty}
                userName={post.user.name}
                startTime={new Date(post.datetimeStart).toLocaleTimeString()}
                endTime={new Date(post.datetimeEnd).toLocaleTimeString()}
                date={new Date(post.datetimeStart).toLocaleDateString()}
                route={post.route}
                userId={post.userId}
                stars={post.user.stars}
                userLocation={null}
                onPress={() => { router.push({ pathname: '/(drawer)/PostDetailScreen', params: { postId: post.id } }) }}
              />
            )}
            <TouchableOpacity style={s.primaryButton} onPress={() => { router.push('/(drawer)/(tabs)/PassengerScreen'); setCurrentStep(1); }}>
              <Text style={s.primaryButtonText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        );
      default: return null;
    }
  };

  return (
    <View style={styles(theme).container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      {renderStep()}
    </View>
  );
};

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  navRow: {
    paddingTop: 40,
    marginBottom: 10,
  },
  header: {
    marginBottom: 20,
  },
  headerText: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
  },
  locationContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 15,
    padding: 10,
    ...theme.shadows.sm,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  },
  markerContainer: {
    width: 30,
    alignItems: 'center',
  },
  purpleMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  pinkMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.secondary,
  },
  locationInput: {
    flex: 1,
    ...theme.textStyles.body,
    color: theme.colors.text,
    paddingLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: 5,
  },
  shortcutsScroll: {
    flex: 1,
  },
  shortcutsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textLight,
    marginBottom: 8,
    marginLeft: 4,
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm
  },
  shortcutChipText: {
    ...theme.textStyles.body,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  shortcutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  shortcutText: {
    ...theme.textStyles.body,
    color: theme.colors.text,
    marginLeft: 15,
    flex: 1,
  },
  mapModalContent: {
    backgroundColor: theme.colors.background,
    height: '90%',
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 10,
  },
  map: {
    flex: 1,
    borderRadius: 15,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  primaryButtonText: {
    ...theme.textStyles.button,
    color: 'white',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.base,
  },
  mapContainerSmall: {
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedRouteItem: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryTransparent,
  },
  routeInfo: {
    flex: 1,
  },
  routeSummary: {
    ...theme.textStyles.header3,
    color: theme.colors.text,
  },
  routeDetails: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
  },
  dateTimeContainer: {
    gap: 15,
    marginBottom: 30,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    ...theme.shadows.sm,
  },
  dateTimeButtonText: {
    ...theme.textStyles.body,
    color: theme.colors.text,
    marginLeft: 15,
  },
  confirmationContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  confirmationTitle: {
    ...theme.textStyles.header1,
    color: theme.colors.textDark,
    marginVertical: 20,
  },
});

export default PostScreen;
