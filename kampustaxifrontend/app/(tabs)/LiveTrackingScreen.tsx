import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import polyline from 'polyline';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface LiveTrackingParams {
  post: {
    id: string;
    route: string; // encoded polyline string
    sourceAddress: string;
    destinationFaculty: string;
    datetimeStart: string;
    datetimeEnd: string;
    price: number;
    userId: string;
    matchedUserId: string;
    // ...other fields as needed
  };
}

const LiveTrackingScreen: React.FC = () => {
  const navigation = useNavigation();
  const routeNav = useRoute();
  const { post } = routeNav.params as LiveTrackingParams;

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [remainingRoute, setRemainingRoute] = useState<typeof routeCoords>([]);
  const [remainingDistance, setRemainingDistance] = useState<number>(0);
  const watchId = useRef<number | null>(null);

  // Decode polyline and set route
  useEffect(() => {
    if (post.route) {
      try {
        const decoded: number[][] = polyline.decode(JSON.parse(post.route));
        const coords = decoded.map((arr) => ({ latitude: arr[0], longitude: arr[1] }));
        setRouteCoords(coords);
      } catch (e) {
        setRouteCoords([]);
      }
    }
  }, [post.route]);

  // Get user location and watch
  useEffect(() => {
    let isMounted = true;
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (isMounted) setUserLocation(loc.coords);
      setLoading(false);
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (loc) => {
          if (isMounted) setUserLocation(loc.coords);
        }
      );
    })();
    return () => {
      isMounted = false;
      if (subscription) subscription.remove();
    };
  }, []);

  // Calculate remaining route and distance
  useEffect(() => {
    if (!userLocation || routeCoords.length === 0) return;
    // Find the closest point on the route to the user
    let minDist = Number.MAX_VALUE;
    let closestIdx = 0;
    for (let i = 0; i < routeCoords.length; i++) {
      const d = getDistance(userLocation, routeCoords[i]);
      if (d < minDist) {
        minDist = d;
        closestIdx = i;
      }
    }
    const remaining = routeCoords.slice(closestIdx);
    setRemainingRoute(remaining);
    setRemainingDistance(
      remaining.reduce((acc, curr, idx, arr) => {
        if (idx === 0) return acc;
        return acc + getDistance(arr[idx - 1], curr);
      }, getDistance(userLocation, remaining[0]) / 1000) // in km
    );
  }, [userLocation, routeCoords]);

  // Haversine formula for distance in meters
  function getDistance(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const aVal =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c;
  }

  if (loading || !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b39ef" />
        <Text>Konum alınıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        followsUserLocation
      >
        {remainingRoute.length > 1 && (
          <Polyline
            coordinates={remainingRoute}
            strokeColor="#4b39ef"
            strokeWidth={5}
          />
        )}
        <Marker coordinate={userLocation} title="Siz" />
        {remainingRoute.length > 0 && (
          <Marker coordinate={remainingRoute[remainingRoute.length - 1]} title="Varış" />
        )}
      </MapView>
      <View style={styles.infoPanel}>
        <Text style={styles.infoText}>Kalan Mesafe: {remainingDistance.toFixed(2)} km</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={28} color="#4b39ef" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoPanel: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  infoText: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    color: '#4b39ef',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  closeButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
});

export default LiveTrackingScreen; 