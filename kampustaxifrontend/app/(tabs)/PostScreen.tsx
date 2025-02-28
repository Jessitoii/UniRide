'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Platform, Button, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import polyline from 'polyline';
import { GOOGLE_MAPS_API_KEY } from '@/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import DropDownPicker from 'react-native-dropdown-picker';
import universities from '../../constants/Universities';
import { calculateDistance, formatDate } from '../../utils/helperFunctions';
import { DEFAULT_MAP_REGION } from '../../constants';

const PostScreen = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [sourceAddress, setSourceAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [sourceCoords, setSourceCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [initialRegion, setInitialRegion] = useState(DEFAULT_MAP_REGION);
  const [sourceSuggestions, setSourceSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [travelDate, setTravelDate] = useState(new Date());
  const [travelTime, setTravelTime] = useState(new Date());
  const [datetimeStart, setDatetimeStart] = useState<Date | null>(null);
  const [datetimeEnd, setDatetimeEnd] = useState<Date | null>(null);
  const [cost, setCost] = useState(100);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [universityOpen, setUniversityOpen] = useState(false);
  const [facultyOpen, setFacultyOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setSourceCoords(location.coords);
        setInitialRegion({
          ...DEFAULT_MAP_REGION,
        });
      }
    })();
  }, []);

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedFaculty && destinationCoords) {
        fetchRoute();
        setCurrentStep(3);
      } else {
        Alert.alert("Please select both source and destination locations.");
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

  const fetchSuggestions = async (address: string, isSource: boolean) => {
    if (address.length < 3) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        if (isSource) {
          setSourceSuggestions(data.predictions);
        } else {
          setDestinationSuggestions(data.predictions);
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSourceChange = (text: string) => {
    setSourceAddress(text);
    fetchSuggestions(text, true);
  };

  const handleDestinationChange = (text: string) => {
    setDestinationAddress(text);
    fetchSuggestions(text, false);
  };

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
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${sourceCoords.latitude},${sourceCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`
        );

        const data = await response.json();

        if (data.status === 'OK' && data.routes.length > 0) {
          setRoutes(data.routes.slice(0, 2)); // Limit to two routes
          setCurrentStep(3);
        } else {
          console.error('Error fetching route:', data);
          Alert.alert('No routes found. Please check your source and destination.');
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        Alert.alert('Error fetching route. Please try again.');
      }
    } else {
      Alert.alert("Please select both source and destination locations.");
    }
  };

  const handleRouteSelect = (route: any) => {
    setSelectedRoute(route);
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
        Alert.alert('Error', 'Invalid start date and time.');
        return;
      }

      if (!selectedRoute || !selectedRoute.legs[0].duration.value) {
        console.log("selectedRoute", selectedRoute.legs[0].duration.value);
        Alert.alert('Error', 'Please select a valid route.');
        return;
      }

      // Calculate datetimeEnd based on the route's duration
      const routeDurationInSeconds = selectedRoute.legs[0].duration.value; // Assuming duration is in seconds
      const datetimeEnd = new Date(datetimeStart.getTime() + routeDurationInSeconds * 1000);

      const token = await AsyncStorage.getItem('token');
      const BASE_URL = 'http://10.0.2.2:5000';

      // Clean sourceCoords and route by removing "/" characters
      const cleanedSourceCoords = JSON.stringify(sourceCoords).replace(/\//g, '');
      const cleanedRoute = JSON.stringify(routeCoordinates).replace(/\//g, '');

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
          datetimeEnd: datetimeEnd.toISOString(),
          price: cost
        })
      });

      if (response.ok) {
        const newPost = await response.json();
        console.log('Post created successfully:', newPost);
        setCurrentStep(5);
      } else {
        const errorText = await response.text();
        console.error('Error creating post:', errorText);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const currentDate = selectedDate || travelDate;
      setTravelDate(currentDate);
      setDatetimeStart(new Date(currentDate.setHours(travelTime.getHours(), travelTime.getMinutes())));
    }
  };

  const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const currentTime = selectedTime || travelTime;
      setTravelTime(currentTime);
      setDatetimeStart(new Date(travelDate.setHours(currentTime.getHours(), currentTime.getMinutes())));
    }
  };

  const calculateRouteTime = () => {
    if (selectedRoute) {
      const routeDuration = selectedRoute.duration; // Assuming duration is in seconds
      const endDateTime = new Date(datetimeStart!.getTime() + routeDuration * 1000);
      setDatetimeEnd(endDateTime);
    }
  };

  useEffect(() => {
    if (datetimeStart) {
      calculateRouteTime();
    }
  }, [datetimeStart, selectedRoute]);

  const handlePostCreation = async () => {
    if (!datetimeStart || !datetimeEnd) {
      Alert.alert('Error', 'Please select a valid start and end time.');
      return;
    }

    // Your existing post creation logic
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Başlangıç Konumunu Seç</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Tam adresi gir"
                value={sourceAddress}
                onChangeText={handleSourceChange}
              />
              {sourceSuggestions.length > 0 && (
                <FlatList
                  data={sourceSuggestions}
                  keyExtractor={(item) => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setSourceAddress(item.description)}>
                      <Text>{item.description}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
            <TouchableOpacity style={styles.useCurrentLocationContainer} onPress={useCurrentLocation}>
              <Text style={styles.useCurrentLocationText}>Mevcut konumu kullan</Text>
            </TouchableOpacity>
            {initialRegion && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={initialRegion}
                  onPress={handleLocationSelect}
                >
                  {routeCoordinates.length > 0 && currentStep === 3 && (
                    <Polyline
                      coordinates={routeCoordinates}
                      strokeWidth={3}
                      strokeColor="#0066ff"
                    />
                  )}
                </MapView>
              </View>
            )}

            
            <TouchableOpacity style={styles.continueButton} onPress={handleNextStep} disabled={!sourceAddress}>
              <Text style={styles.continueButtonText}>Devam et</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={handlePreviousStep}>
              <Text style={styles.backButtonText}>Geri</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.headerText}>Select Destination</Text>
            <DropDownPicker
              open={universityOpen}
              value={selectedUniversity}
              items={universities.map((uni) => ({ label: uni.name, value: uni.name }))}
              setOpen={setUniversityOpen}
              setValue={(callback) => setSelectedUniversity(callback(selectedUniversity))}
              containerStyle={{ height: 40 }}
              style={{ backgroundColor: '#fafafa', zIndex: 1 }}
              listItemContainerStyle={{ backgroundColor: '#fafafa' }}
            />
            <DropDownPicker
              open={facultyOpen}
              value={selectedFaculty}
              items={
                universities.find((uni) => uni.name === selectedUniversity)?.faculties.map((faculty) => ({
                  label: faculty.name,
                  value: faculty.name,
                })) || []
              }
              setOpen={setFacultyOpen}
              setValue={(callback) => {
                const facultyName = callback(selectedFaculty);
                setSelectedFaculty(facultyName);
                const faculty = universities
                  .find((uni) => uni.name === selectedUniversity)
                  ?.faculties.find((fac) => fac.name === facultyName);
                if (faculty) {
                  setDestinationCoords(faculty.location);
                }
              }}
              containerStyle={{ height: 40 }}
              style={{ backgroundColor: '#fafafa', zIndex: 0 }}
              listItemContainerStyle={{ backgroundColor: '#fafafa' }}
            />
            <TouchableOpacity style={styles.continueButton} onPress={handleNextStep} disabled={!selectedUniversity || !selectedFaculty}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.headerText}>Route Selection</Text>
            {routes.length > 0 && (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: sourceCoords.latitude,
                  longitude: sourceCoords.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
              >
                {selectedRoute && (
                  <Polyline
                    key={1}
                    coordinates={polyline.decode(selectedRoute.overview_polyline.points).map(([latitude, longitude]) => ({
                      latitude,
                      longitude,
                    }))}
                    strokeWidth={3}
                    strokeColor={"#0066ff"}
                    tappable
                  />
                )}
              </MapView>
            )}

            <FlatList 
              data={routes}
              keyExtractor={(item) => item.summary}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.routeItem}
                  onPress={() => handleRouteSelect(item)}
                >
                  <Text>Rota: {item.summary}</Text>
                  <Text>Mesafe: {item.legs[0].distance.text}</Text>
                  <Text>Süre: {item.legs[0].duration.text}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={() => setCurrentStep(4)} 
              disabled={!selectedRoute}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Yola Çıkış Zamanını Seç</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Yolculuk Gününüzü Belirleyin</Text>
              <TouchableOpacity style={styles.datePicker} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>{travelDate.toDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={travelDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              )}
              <Text style={styles.label}>Yolculuk Saatinizi Belirleyin</Text>
              <TouchableOpacity style={styles.datePicker} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.dateText}>{travelTime.toLocaleTimeString()}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={travelTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                />
              )}
              <Text style={styles.label}>Selected Price</Text>
              <View style={styles.priceContainer}>
                <TouchableOpacity onPress={() => setCost(cost - 1)} style={styles.priceButtonContainer}>
                  <Text style={styles.priceButton}>-</Text>
                </TouchableOpacity>
                <Text style={styles.priceText}>${cost}</Text>
                <TouchableOpacity onPress={() => setCost(cost + 1)} style={styles.priceButtonContainer}>
                  <Text style={styles.priceButton}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={handleNextStep}>
              <Text style={styles.continueButtonText}>Devam et</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={handlePreviousStep}>
              <Text style={styles.backButtonText}>Geri</Text>
            </TouchableOpacity>
          </View>
        );
      case 5:
        return (
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationText}>Your post has been published!</Text>
            <Button title="Go to Passenger Screen" onPress={() => {router.push('/passanger'); setCurrentStep(1)} }/>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderStep()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  stepContainer: {
    backgroundColor: 'white',
    overflow: 'hidden',
    padding: 20,
  },
  header: {
    height: 82,
    justifyContent: 'center',
    paddingLeft: 16,
    backgroundColor: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
  },
  inputContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  useCurrentLocationContainer: {
    marginBottom: 20,
  },
  useCurrentLocationText: {
    color: 'black',
    fontSize: 14,
  },
  map: {
    height: 351,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    alignSelf: 'center',
  },
  continueButton: {
    paddingVertical: 10,
    backgroundColor: 'black',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    paddingVertical: 10,
    backgroundColor: 'gray',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  routeItem: {
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 8,
    boxSizing: 'border-box',
    gap: '12px',
    textAlign: 'left',
    fontSize: 12,
    color: '#000',
    fontFamily: 'Roboto'
  },
  mapContainer: {
    borderWidth: 2,
    borderColor: 'gray',
    width: '100%',
    alignSelf: 'center',
    height: 351,
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  priceButtonContainer: {
    backgroundColor: 'black',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
  },
  priceButton: {
    fontSize: 24,
    color: 'white',
  },
  priceText: {
    fontSize: 18,
    marginHorizontal: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  datePicker: {
    height: 40,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderRadius: 5,
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  dateText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationText: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default PostScreen;
