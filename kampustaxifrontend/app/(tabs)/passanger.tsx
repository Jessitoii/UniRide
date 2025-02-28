'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, TextInput, FlatList, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Post from '../../components/Post';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_MAPS_API_KEY } from '@/env';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { BASE_URL } from '@/env';
import DropDownPicker from 'react-native-dropdown-picker';
import universities from '../../constants/Universities';

type PassengerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PassengerScreen'>;

export default function PassengerScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [visiblePosts, setVisiblePosts] = useState<number>(2);
  const [mapVisible, setMapVisible] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [sourceAddress, setSourceAddress] = useState('');
  const [destinationCoords, setDestinationCoords]: any = useState(null);
  const [universityOpen, setUniversityOpen] = useState(false);
  const [facultyOpen, setFacultyOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const navigation = useNavigation<PassengerScreenNavigationProp>();

  const fetchPosts = async () => {
    console.log("Selected location before fetching posts:", selectedLocation);

    if (!selectedLocation) {
      console.log("No location selected");
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');

      // Construct the query parameters
      const queryParams = new URLSearchParams({
        latitude: selectedLocation.latitude.toString(),
        longitude: selectedLocation.longitude.toString(),
      });

      if (selectedUniversity) {
        queryParams.append('university', selectedUniversity);
      }

      if (selectedFaculty) {
        queryParams.append('faculty', selectedFaculty);
      }

      const response = await fetch(`${BASE_URL}/api/posts/nearby?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Posts fetched:", data);
        setPosts(data);
      } else {
        console.error('Error fetching posts:', await response.json());
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchPosts();
    setRefreshing(true);
    setVisiblePosts(2);
  }, [selectedLocation, selectedFaculty]);

  const extractDistrict = (address: string) => {
    // Assuming the district is the second part of the address split by commas
    const parts = address.split(',');
    return parts.length > 1 ? parts[1].trim() : address;
  };

  const handleShowMore = () => {
    setVisiblePosts((prev) => prev + 3); // Increase the number of visible posts by 3
  };

  const handleSearchBarPress = () => {
    setMapVisible(true);
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedLocation, selectedFaculty]);

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    setMapVisible(false);
  };

  const fetchSuggestions = async (query: string) => {
    if (query.length < 1) return; // Fetch suggestions for each letter

    try {
      console.log('Fetching suggestions for:', query);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      console.log('Suggestions response:', data);

      if (data.status === 'OK') {
        setSuggestions(data.predictions);
      } else {
        console.error('Error in suggestions response:', data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    fetchSuggestions(text);
  };


  const navigateToPostDetail = (postId: string) => {
    navigation.navigate('PostDetailScreen', {
      postId,
      userLocation: selectedLocation, // Pass the selected location
    });
  };

  const handleFilterApply = () => {
    fetchPosts();
    setFilterModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.header, mapVisible && styles.dimmed]}>
        <Text style={styles.headerText}>Yolcu Sayfası</Text>
      </View>

      <View style={[styles.searchContainer, mapVisible && styles.dimmed]}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchText}
            placeholder="Konum ara ya da seç falan filan"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={handleSearchBarPress}
          />
          <View style={styles.searchButton}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </View>
        </View>
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleLocationSelect(item)}>
              <Text>{item.description}</Text>
            </TouchableOpacity>
          )}
          style={styles.suggestionsList}
        />
      </View>

      <TouchableOpacity 
        style={styles.filterButton} 
        onPress={() => setFilterModalVisible(true)}
      >
        <Text style={styles.filterButtonText}>Filter</Text>
      </TouchableOpacity>

      <Modal visible={filterModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Filters</Text>
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
            <TouchableOpacity style={styles.applyButton} onPress={handleFilterApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {!selectedLocation ? (
        <View style={styles.noLocationContainer}>
          <Text style={styles.noLocationText}>Please select a location to see nearby posts.</Text>
        </View>
      ) : (
        <View style={[styles.postsContainer, mapVisible && styles.dimmed]}>
          {posts.slice(0, visiblePosts).map((post) => (
            <Post
              key={post.id}
              id={post.id}
              userId={post.user.id}
              title={`${extractDistrict(post.sourceAddress)} ➡️ ${post.destinationFaculty}`}
              userName={post.user.name}
              date={new Date(post.datetimeStart).toLocaleDateString()}
              time={new Date(post.datetimeStart).toLocaleTimeString()}
              price={post.price}
              route={post.route}
              interested={true}
              userLocation={selectedLocation}
              onPress={() => navigateToPostDetail(post.id)}
            />
          ))}
        </View>
      )}

      {visiblePosts < posts.length && (
        <TouchableOpacity style={[styles.loadMoreButton, mapVisible && styles.dimmed]} onPress={handleShowMore}>
          <Text style={styles.loadMoreText}>Daha fazla görüntüle</Text>
        </TouchableOpacity>
      )}

      <Modal visible={mapVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 40.193298,
              longitude: 29.064237,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={(e) => handleLocationSelect(e.nativeEvent.coordinate)}
          >
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                title="Your Location"
                description="This is your selected location"
              />
            )}
          </MapView>
          <TouchableOpacity style={styles.closeButton} onPress={() => setMapVisible(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 24,
  },
  header: {
    height: 48,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
  },
  searchContainer: {
    height: 56,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchText: {
    flex: 1,
    color: '#808080',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#000',
    borderRadius: 4,
    padding: 4,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  suggestionsList: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 5,
  },
  noLocationContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noLocationText: {
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#0066ff',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 10,
    width: '50%',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  applyButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 10,
    width: '100%',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 10,
    width: '100%',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  postsContainer: {
    paddingHorizontal: 12,
  },
  loadMoreButton: {
    height: 42,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  map: {
    width: '100%',
    height: '70%',
  },
  dimmed: {
    opacity: 0.3,
  },
});
