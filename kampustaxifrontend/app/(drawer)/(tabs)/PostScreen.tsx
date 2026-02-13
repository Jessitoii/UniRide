'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Polyline, Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import polyline from 'polyline';
import { GOOGLE_MAPS_API_KEY, BASE_URL } from '@/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import universities from '@/constants/Universities';
import { DEFAULT_MAP_REGION } from '@/constants';
import { mapStyle } from '@/styles/mapStyle';
import { Modal } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { Post } from '@/components';

const PostScreen = () => {
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
  const [step1Region, setStep1Region] = useState();
  const [mapVisible, setMapVisible] = useState(false);
  const [post, setPost] = useState<any>(null);
  const router = useRouter();

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

  const extractDistrict = (address: string) => {
    const district = address.split(',')[1];
    return district;
  }

  useEffect(() => {
    const universitySuggestionsArray = searchUniversities(universityInput);
    setUniversitySuggestions(universitySuggestionsArray);
  }, [universityInput]);

  useEffect(() => {
    const facultySuggestionsArray = searchFaculties(facultyInput);
    // Handle undefined case by providing empty array fallback
    setFacultySuggestions(facultySuggestionsArray || []);
  }, [facultyInput]);

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
    if (address.length < 3) {
      setSourceSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        setSourceSuggestions(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  useEffect(() => {
    fetchSuggestions(sourceAddress, true);
  }, [sourceAddress]);

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
        Alert.alert('Error', 'Please select a valid route.');
        return;
      }

      // Calculate datetimeEnd based on the route's duration
      const routeDurationInSeconds = selectedRoute.legs[0].duration.value; // Assuming duration is in seconds
      const datetimeEnd = new Date(datetimeStart.getTime() + routeDurationInSeconds * 1000);

      const token = await AsyncStorage.getItem('token');

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
        })
      });

      if (response.ok) {
        const newPost = await response.json();
        console.log(newPost);
        setPost(newPost);
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
      setDatetimeStart(new Date(currentDate.setHours(travelTime?.getHours() || 0, travelTime?.getMinutes() || 0)));
    }
  };

  const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const currentTime = selectedTime || travelTime;
      setTravelTime(currentTime);
      setDatetimeStart(new Date(travelDate!.setHours(currentTime.getHours(), currentTime.getMinutes())));
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

  const handleRegionChange = (region: any) => {
    setStep3Region(region);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '100%' }}>
              <TouchableOpacity onPress={() => router.push('/(drawer)/(tabs)/PassengerScreen')}>
                <MaterialIcons name="close" size={24} color="#4b39ef" />
              </TouchableOpacity>
            </View>
            <View style={styles.header}>
              <Text style={styles.headerText}>1. Başlangıç Konumunu Seç</Text>
            </View>
            <View style={styles.locationContainer}>
              {/* Start location input */}
              <View style={styles.inputRow}>
                <View style={styles.markerContainer}>
                  <View style={styles.purpleMarker} />
                </View>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Başlangıç Konumu"
                  value={sourceAddress}
                  onChangeText={setSourceAddress}
                  onFocus={() => {
                  }}
                />
              </View>
            </View>
            <View style={styles.shortcutsContainer}>

              {sourceCoords && sourceSuggestions && sourceSuggestions.length > 0 ? sourceSuggestions.map((suggestion) => (
                <ScrollView>
                  <TouchableOpacity style={[styles.shortcutButton, { marginTop: 15 }]} onPress={async () => {
                    setIsLoading(true);
                    try {
                      const response = await fetch(
                        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&key=${GOOGLE_MAPS_API_KEY}`
                      );
                      const data = await response.json();
                      if (data.status === 'OK') {
                        const location = data.result.geometry.location;
                        setSourceCoords({ latitude: location.lat, longitude: location.lng });
                        setSourceAddress(data.result.formatted_address);
                      }
                    } catch (error) {
                      console.error('Error setting start location:', error);
                    } finally {
                      setIsLoading(false);
                    }
                  }}>
                    <View style={styles.shortcutIcon}>
                      <MaterialIcons name="location-on" size={24} color="#4b39ef" />
                    </View>
                    <Text style={styles.shortcutText}>{suggestion.description}</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                </ScrollView>
              )) : (
                <View style={{ flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <TouchableOpacity style={styles.shortcutButton}>
                    <View style={styles.shortcutIcon}>
                      <MaterialIcons name="home" size={24} color="#4b39ef" />
                    </View>
                    <Text style={styles.shortcutText}>Evimi Seç</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.shortcutButton, { marginLeft: 6 }]} onPress={useCurrentLocation}>
                    <MaterialIcons name="location-on" size={24} color="#4b39ef" />
                    <Text style={styles.shortcutText}>Mevcut konumu kullan</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.shortcutButton, { marginLeft: 6 }]} onPress={() => setMapVisible(true)}>
                    <MaterialIcons name="map" size={24} color="#4b39ef" />
                    <Text style={styles.shortcutText}>Haritada Konumu Seç</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>


            {initialRegion && (
              <Modal visible={mapVisible}>
                <View style={styles.mapModal}>
                  <MapView
                    style={styles.map}
                    initialRegion={initialRegion}
                    onPress={handleLocationSelect}
                    customMapStyle={mapStyle}
                    onRegionChange={handleStep1RegionChange}
                  >
                    {sourceCoords && (
                      <Marker
                        coordinate={sourceCoords}
                        title="Source"
                        description="Başlangıç Konumu"
                        image={require('@/assets/images/map-marker.png')}
                      />
                    )}

                    {
                      step1Region && (
                        <Marker
                          coordinate={step1Region}
                          image={require('@/assets/images/map-marker-2.png')}
                        />
                      )
                    }
                  </MapView>
                </View>
                {
                  step1Region && (
                    <TouchableOpacity style={styles.button} onPress={async () => {
                      setMapVisible(false);
                      setSourceCoords(step1Region);
                      //@ts-ignore
                      const address = await Location.reverseGeocodeAsync({ latitude: step1Region.latitude, longitude: step1Region.longitude });
                      setSourceAddress(address?.[0]?.formattedAddress || '');
                    }}>
                      <Text style={styles.buttonText}>Tamamla</Text>
                    </TouchableOpacity>
                  )
                }
                <TouchableOpacity style={styles.button} onPress={() => setMapVisible(false)}>
                  <Text style={styles.buttonText}>Haritadan Çık</Text>
                </TouchableOpacity>
              </Modal>
            )}


            <TouchableOpacity style={{ position: 'absolute', bottom: 50, right: 30 }} onPress={handleNextStep} disabled={!sourceAddress}>
              <MaterialIcons name="arrow-forward" size={36} color="#4b39ef" />
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '100%' }}>
              <TouchableOpacity onPress={() => setCurrentStep(1)}>
                <MaterialIcons name="arrow-back" size={24} color="#4b39ef" />
              </TouchableOpacity>
            </View>
            <View style={styles.header}>
              <Text style={styles.headerText}>2. Hedef Konumunu Seç</Text>
            </View>
            <View style={styles.locationContainer}>
              <View style={styles.inputRow}>
                <View style={styles.markerContainer}>
                  <View style={styles.purpleMarker} />
                </View>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Üniversite"
                  value={universityInput}
                  onChangeText={setUniversityInput}
                  onFocus={() => {
                    setFacultySuggestions([]);
                  }}
                />

              </View>

              <View style={styles.divider} />
              <View style={styles.inputRow}>
                <View style={styles.markerContainer}>
                  <View style={styles.pinkMarker} />
                </View>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Fakülte"
                  value={facultyInput}
                  onChangeText={setFacultyInput}
                  onFocus={() => {
                    setUniversitySuggestions([]);
                  }}
                />
              </View>
            </View>

            {universitySuggestions && universitySuggestions.length > 0 && universitySuggestions.map((university: any) => (
              <TouchableOpacity style={styles.shortcutButton} onPress={() => {
                setSelectedUniversity(university.label);
                setUniversityInput(university.label);
                setFacultyInput('');
              }}>
                <View style={styles.shortcutIcon}>
                  <MaterialIcons name="school" size={24} color="#e94e77" />
                </View>
                <Text style={styles.shortcutText}>{university.label}</Text>
              </TouchableOpacity>
            ))}

            {
              facultySuggestions && facultySuggestions.length > 0 && facultySuggestions.map((faculty: any) => (
                <TouchableOpacity style={styles.shortcutButton} onPress={() => {
                  setSelectedFaculty(faculty.label);
                  setFacultyInput(faculty.label);
                  setDestinationCoords(universities.find(uni => uni.name === selectedUniversity)?.faculties.find(fac => fac.name === faculty.label)?.location);
                }}>
                  <View style={styles.shortcutIcon}>
                    <MaterialIcons name="school" size={24} color="#4b39ef" />
                  </View>
                  <Text style={styles.shortcutText}>{faculty.label}</Text>
                </TouchableOpacity>
              ))
            }


            <TouchableOpacity style={{ position: 'absolute', bottom: 50, right: 30 }} onPress={handleNextStep} disabled={!selectedUniversity || !selectedFaculty}>
              <MaterialIcons name="arrow-forward" size={48} color="#4b39ef" />
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <TouchableOpacity style={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }} onPress={handlePreviousStep}>
              <MaterialIcons name="arrow-back" size={28} color="#4b39ef" />
            </TouchableOpacity>
            <View style={styles.header}>
              <Text style={styles.headerText}>3. Rota Seçimi</Text>
            </View>
            {routes.length > 0 && sourceCoords && destinationCoords && (
              <View style={styles.mapContainer}>
                <MapView
                  onRegionChange={handleRegionChange}
                  customMapStyle={mapStyle}
                  style={styles.map}
                  initialRegion={{
                    latitude: ((sourceCoords.latitude) + (destinationCoords.latitude)) / 2,
                    longitude: ((sourceCoords.longitude) + (destinationCoords.longitude)) / 2,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                  {selectedRoute && selectedRoute.overview_polyline && selectedRoute.overview_polyline.points && (
                    <>
                      <Polyline
                        key={0}
                        coordinates={polyline.decode(selectedRoute.overview_polyline.points).map(([latitude, longitude]) => ({
                          latitude,
                          longitude,
                        }))}
                        strokeWidth={8}
                        style={{ zIndex: 0 }}
                      />
                      <Polyline
                        key={1}
                        coordinates={polyline.decode(selectedRoute.overview_polyline.points).map(([latitude, longitude]) => ({
                          latitude,
                          longitude,
                        }))}
                        strokeWidth={4}
                        strokeColor={"#ff0d8e"}
                        style={{ zIndex: 1 }}
                      />
                      <Circle
                        center={{ latitude: polyline.decode(selectedRoute.overview_polyline.points)[0][0], longitude: polyline.decode(selectedRoute.overview_polyline.points)[0][1] }}
                        radius={step3region.latitudeDelta * 3000}
                        strokeColor="#ff0d8e"
                        strokeWidth={6}
                        fillColor="#ffffff"
                        lineDashPattern={[10, 10]}
                        style={{ zIndex: 2 }}
                      />
                      <Circle
                        center={{ latitude: polyline.decode(selectedRoute.overview_polyline.points)[polyline.decode(selectedRoute.overview_polyline.points).length - 1][0], longitude: polyline.decode(selectedRoute.overview_polyline.points)[polyline.decode(selectedRoute.overview_polyline.points).length - 1][1] }}
                        radius={step3region.latitudeDelta * 3000}
                        strokeColor="#ff0d8e"
                        strokeWidth={6}
                        fillColor="#ffffff"
                        lineDashPattern={[10, 10]}
                        style={{ zIndex: 2 }}
                      />
                    </>
                  )}
                </MapView>
              </View>
            )}
            <View style={styles.routeListContainer}>
              <FlatList
                data={routes}
                keyExtractor={(item) => item.summary}
                renderItem={({ item }) => (
                  <>
                    <TouchableOpacity
                      style={styles.routeItem}
                      onPress={() => handleRouteSelect(item)}
                    >
                      <View style={{ ...styles.circleSelector, alignSelf: 'center' }}>
                        <View style={styles.circle} />
                      </View>
                      <View style={{ flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginLeft: 10 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.summary}</Text>
                        <Text style={{ fontSize: 14 }}>Mesafe: {item.legs[0].distance.text}</Text>
                        <Text style={{ fontSize: 14 }}>Süre: {item.legs[0].duration.text.replace('hours', 'sa.').replace('mins', 'dk.').replace('seconds', 'sn.')}</Text>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                  </>
                )}
              />
            </View>

            <TouchableOpacity style={{ position: 'absolute', bottom: 50, right: 30 }} onPress={handleNextStep} disabled={!selectedRoute}>
              <MaterialIcons name="arrow-forward" size={48} color="#4b39ef" />
            </TouchableOpacity>

          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '100%' }}>
              <TouchableOpacity onPress={() => setCurrentStep(3)}>
                <MaterialIcons name="arrow-back" size={24} color="#4b39ef" />
              </TouchableOpacity>
            </View>
            <View style={styles.header}>
              <Text style={styles.headerText}>4. Yola Çıkış Zamanını Seç</Text>
            </View>
            <View style={styles.locationContainer}>
              <View style={styles.inputRow}>
                <View style={styles.markerContainer}>
                  <View style={styles.purpleMarker} />
                </View>
                <TextInput style={styles.locationInput}
                  onFocus={() => setShowDatePicker(true)}
                  placeholder={"Yolculuk Gününüzü Belirleyin"}
                  value={travelDate?.toDateString() || ''}
                />
              </View>
              <View style={styles.divider} />
              {showDatePicker && (
                <DateTimePicker
                  value={travelDate || new Date()}
                  mode="date"
                  display={'spinner'}
                  onChange={handleDateChange}
                />
              )}

              <View style={styles.inputRow}>
                <View style={styles.markerContainer}>
                  <View style={styles.pinkMarker} />
                </View>
                <TextInput style={styles.locationInput}
                  onFocus={() => setShowTimePicker(true)}
                  placeholder={"Yolculuk Saatinizi Belirleyin"}
                  value={travelTime?.toLocaleTimeString() || ''}
                />
              </View>
              <View style={styles.divider} />
              {showTimePicker && (
                <DateTimePicker
                  value={travelTime || new Date()}
                  mode="time"
                  display={'spinner'}
                  onChange={handleTimeChange}
                />
              )}

            </View>

            <TouchableOpacity style={styles.button} onPress={handleNextStep} disabled={!selectedRoute || !travelDate || !travelTime}>
              <Text style={styles.buttonText}>Paylaş</Text>
            </TouchableOpacity>
          </View>
        );
      case 5:
        return (
          <View style={styles.confirmationContainer}>
            <View style={styles.header}>
              <View style={styles.checkCircleContainer}>
                <MaterialIcons name="check-circle" size={48} color="green" />
                <Text style={styles.headerText}>Yolculuğunuz Başarıyla Oluşturuldu!</Text>
              </View>
            </View>
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
                //@ts-ignore
                onPress={() => { router.push({ pathname: '/(drawer)/PostDetailScreen', params: { postId: post.id, userLocation: JSON.stringify(post.userLocation) } }) }}
              />
            )}
            <View style={styles.shareButtonContainer}>
              <TouchableOpacity style={styles.shareButton}>
                <MaterialIcons name="share" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.confirmationTextContainer}>
              <Text style={styles.confirmationText}>Yolculuğunuz başarıyla oluşturuldu!</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => {
              router.push('/(drawer)/(tabs)/PassengerScreen');
              setCurrentStep(1)
            }}>
              <Text style={styles.buttonText}>Yolculukları Görüntüle</Text>
            </TouchableOpacity>
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
    height: '100%',
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 'auto',
  },
  header: {
    marginTop: 10,
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
    alignSelf: 'flex-start',
  },
  locationContainer: {
    marginBottom: 20,
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
    backgroundColor: '#e94e77',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pinkMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#4b39ef',
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  map: {
    height: 351,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    alignSelf: 'center',
  },
  continueButton: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
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
  continueButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 10,
    backgroundColor: 'gray',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 8,
    boxSizing: 'border-box',
    textAlign: 'left',
    fontSize: 12,
    color: '#000',
    fontFamily: 'Roboto',
    marginLeft: 10,
  },
  mapContainer: {
    borderWidth: 2,
    borderColor: '#e94e77',
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
    width: '70%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  priceButtonContainer: {
    backgroundColor: '#e94e77',
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
  suggestionList: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
  searchButton: {
    position: 'absolute',
    right: 10,
  },
  searchButtonText: {
    fontSize: 24,
    color: 'black',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mapModal: {
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
  button: {
    backgroundColor: '#4b39ef',
    marginTop: 10,
    padding: 10,
    borderRadius: 15,
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  shortcutsContainer: {
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
  divider: {
    height: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#e0e0e0',
    marginLeft: 50,
    marginRight: 50,
  },
  routeListContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
    alignSelf: 'center',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  circleSelector: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4b39ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  confirmationTextContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignSelf: 'center',
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#4b39ef',
    padding: 10,
    borderRadius: 15,
    marginHorizontal: 20,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  checkCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PostScreen;
