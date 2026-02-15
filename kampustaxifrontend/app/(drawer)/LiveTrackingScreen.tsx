'use client';

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import polyline from 'polyline';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface LiveTrackingParams {
  post: {
    id: string;
    route: string;
    sourceAddress: string;
    destinationFaculty: string;
    datetimeStart: string;
    datetimeEnd: string;
    userId: string;
    matchedUserId: string;
  };
}

const LiveTrackingScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { post: postParam } = useLocalSearchParams<{ post: string }>();
  // Parse params safely
  const post = postParam ? JSON.parse(postParam) : {};

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [remainingRoute, setRemainingRoute] = useState<typeof routeCoords>([]);
  const [remainingDistance, setRemainingDistance] = useState<number>(0);

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

  useEffect(() => {
    if (!userLocation || routeCoords.length === 0) return;
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

    // Simple remaining distance calc
    let dist = 0;
    if (remaining.length > 0) {
      dist += getDistance(userLocation, remaining[0]);
      for (let i = 0; i < remaining.length - 1; i++) {
        dist += getDistance(remaining[i], remaining[i + 1]);
      }
    }
    setRemainingDistance(dist / 1000); // km
  }, [userLocation, routeCoords]);

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
      <View style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles(theme).loadingText}>{t('getting_location')}</Text>
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      <StatusBar barStyle="dark-content" />
      <MapView
        style={styles(theme).map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        showsUserLocation
        followsUserLocation
        customMapStyle={isDark ? darkMapStyle : []}
      >
        {remainingRoute.length > 1 && (
          <Polyline
            coordinates={remainingRoute}
            strokeColor={theme.colors.primary}
            strokeWidth={5}
          />
        )}
        <Marker coordinate={userLocation} title="You">
          <View style={styles(theme).markerContainer}>
            <MaterialIcons name="navigation" size={24} color="white" style={{ transform: [{ rotate: '45deg' }] }} />
          </View>
        </Marker>
        {remainingRoute.length > 0 && (
          <Marker coordinate={remainingRoute[remainingRoute.length - 1]} title="Destination">
            <MaterialIcons name="location-pin" size={40} color={theme.colors.error} />
          </Marker>
        )}
      </MapView>

      {/* Header Overlay */}
      <View style={styles(theme).headerOverlay}>
        <TouchableOpacity style={styles(theme).closeButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textDark} />
        </TouchableOpacity>
        <Text style={styles(theme).headerTitle}>{t('live_tracking')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Bottom Info Panel */}
      <View style={styles(theme).infoPanel}>
        <View style={styles(theme).infoRow}>
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).infoLabel}>{t('remaining_distance')}</Text>
            <Text style={styles(theme).infoValue}>{remainingDistance.toFixed(1)} km</Text>
          </View>
          <View style={styles(theme).divider} />
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).infoLabel}>{t('estimated_arrival')}</Text>
            {/* Rough estimate: 40km/h avg speed */}
            <Text style={styles(theme).infoValue}>{Math.ceil(remainingDistance / 40 * 60)} dk</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#2c2c2c" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8a8a8a" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  }
];

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    ...theme.textStyles.body,
    marginTop: theme.spacing.md,
    color: theme.colors.textLight,
  },
  markerContainer: {
    backgroundColor: theme.colors.primary,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    ...theme.shadows.md,
  },
  headerOverlay: {
    position: 'absolute',
    top: theme.spacing['4xl'],
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.md,
  },
  closeButton: {
    padding: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
  },
  headerTitle: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
  },
  infoPanel: {
    position: 'absolute',
    bottom: theme.spacing['4xl'],
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  infoValue: {
    ...theme.textStyles.header2,
    color: theme.colors.primary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
  },
});

export default LiveTrackingScreen;