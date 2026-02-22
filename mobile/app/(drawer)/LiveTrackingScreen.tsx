'use client';

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, StatusBar, Platform } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/contexts/SocketContext';
import { useProfile } from '@/contexts/ProfileContext';
import { decodePolyline, calculateDistance } from '@/utils/mapUtils';
import { Avatar } from '@/components/base/Avatar';

const { width, height } = Dimensions.get('window');

const LiveTrackingScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme, isDark, mapStyle } = useTheme();
  const router = useRouter();
  const { post: postParam } = useLocalSearchParams<{ post: string }>();
  const post = postParam ? JSON.parse(postParam) : {};

  const { socket } = useSocket();
  const { profile } = useProfile();
  const isDriver = profile?.id === post.userId;
  const mapRef = useRef<MapView>(null);
  const lastZoomLocation = useRef<{ latitude: number; longitude: number } | null>(null);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [driverCoords, setDriverCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [passengerCoords, setPassengerCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Animated region for smooth driver movement
  const driverLocationAnim = useRef(new AnimatedRegion({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  })).current;

  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [remainingRoute, setRemainingRoute] = useState<typeof routeCoords>([]);
  const [remainingDistance, setRemainingDistance] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);

  useEffect(() => {
    // Join the ride room for socket events
    if (socket && post.id) {
      socket.emit('joinRoom', { rideId: post.id });

      socket.on('ride_completed', () => {
        router.replace({ pathname: '/(drawer)/ReviewScreen', params: { post: JSON.stringify(post) } });
      });

      if (!isDriver) {
        // If I am passenger, I listen for driver updates (and potentially other passengers)
        socket.on('update_location', (data: { location: { latitude: number; longitude: number }, userId: string }) => {
          const { latitude, longitude } = data.location;

          if (data.userId === post.userId) {
            // It's the driver
            if (Platform.OS === 'android') {
              if (driverCoords) {
                driverLocationAnim.animateMarkerToCoordinate({ latitude, longitude }, 2000);
              } else {
                driverLocationAnim.setValue({ latitude, longitude, latitudeDelta: 0.015, longitudeDelta: 0.015 });
              }
            } else {
              driverLocationAnim.timing({
                latitude,
                longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
                duration: 2000,
                useNativeDriver: false
              } as any).start();
            }
            setDriverCoords(data.location);
          } else {
            // It's another participant (passenger) - technically could be me if I emit, but useful for sync
            setPassengerCoords(data.location);
          }
        });
      } else {
        // If I am driver, I listen for passenger updates
        socket.on('update_location', (data: { location: { latitude: number; longitude: number }, userId: string }) => {
          if (data.userId !== profile?.id) {
            setPassengerCoords(data.location);
          }
        });
      }
    }
    return () => {
      if (socket) {
        socket.off('ride_completed');
        socket.off('update_location');
      }
    };
  }, [socket, post.id, isDriver, driverCoords]);

  useEffect(() => {
    if (post.route) {
      const coords = decodePolyline(JSON.parse(post.route));
      setRouteCoords(coords);
      setRemainingRoute(coords); // Initialize remaining route
      // Initialize driver location to start if not yet received and we are passenger
      if (!isDriver && !driverCoords && coords.length > 0) {
        const startLoc = coords[0];
        setDriverCoords(startLoc);
        driverLocationAnim.setValue({
          latitude: startLoc.latitude,
          longitude: startLoc.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015
        });
      }
    }
  }, [post.route, isDriver]);

  useEffect(() => {
    let isMounted = true;
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const serviceEnabled = await Location.hasServicesEnabledAsync();
        if (!serviceEnabled && isMounted) {
          console.log("Location services disabled");
          // Optionally prompt user
        }

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (isMounted) setUserLocation(loc.coords);
        if (isMounted) setLoading(false);

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5 },
          (loc) => {
            if (isMounted) {
              // Update my own coords in state
              if (isDriver) {
                setDriverCoords(loc.coords);
                // Animate my own marker if I want to see usage? Actually driver sees self as 'user location'.
              } else {
                setPassengerCoords(loc.coords);
              }

              // Emit location
              if (socket && post.id) {
                socket.emit('update_location', { rideId: post.id, location: loc.coords, userId: profile?.id });
              }
            }
          }
        );
      } catch (err) {
        console.error("LiveTracking location error:", err);
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
      if (subscription) subscription.remove();
    };
  }, [isDriver, socket, post.id, profile?.id]);

  const handleFinishRide = async () => {
    if (post.id) {
      if (socket) {
        socket.emit('ride_completed', { rideId: post.id, userId: profile?.id });
      }

      try {
        // Persist completion to backend
        const token = await require('@react-native-async-storage/async-storage').default.getItem('token');
        await fetch(`${require('@/env').BASE_URL}/api/posts/${post.id}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error completing ride:', error);
      }

      // Navigate self
      router.replace({ pathname: '/(drawer)/ReviewScreen', params: { post: JSON.stringify(post) } });
    }
  };

  // Auto-Zoom Logic
  useEffect(() => {
    if (driverCoords && mapRef.current) {
      const dist = lastZoomLocation.current
        ? calculateDistance(driverCoords, lastZoomLocation.current)
        : 100; // Force first zoom

      if (dist > 0.05) { // 50 meters
        const dest = remainingRoute.length > 0 ? remainingRoute[remainingRoute.length - 1] : driverCoords;
        mapRef.current.fitToCoordinates([driverCoords, dest], {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
        lastZoomLocation.current = driverCoords;
      }
    }
  }, [driverCoords, remainingRoute]);

  // Metrics Logic
  useEffect(() => {
    if (driverCoords && remainingRoute.length > 0) {
      const dest = remainingRoute[remainingRoute.length - 1];
      const dist = calculateDistance(driverCoords, dest);
      setRemainingDistance(dist);
      // Estimate time: 40km/h average speed? or use data
      setEta(Math.ceil((dist / 40) * 60));
    }
  }, [driverCoords, remainingRoute]);

  const displayLocation = userLocation; // We use markers now, initial region fallback

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
        ref={mapRef}
        style={styles(theme).map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        showsUserLocation={false} // We render custom markers
        customMapStyle={mapStyle}
      >
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={theme.colors.primary}
            strokeWidth={4}
            style={{ opacity: 0.8 }}
          />
        )}

        {/* Driver Marker - Avatar */}
        {driverCoords && (
          //@ts-ignore
          <Marker.Animated coordinate={isDriver ? { latitude: driverCoords.latitude, longitude: driverCoords.longitude } : driverLocationAnim} title={t('driver')}>
            <View style={styles(theme).driverMarkerContainer}>
              <Avatar user={post.user} size={40} />
            </View>
          </Marker.Animated>
        )}

        {/* Passenger Marker */}
        {passengerCoords && (
          <Marker coordinate={passengerCoords} title={t('passenger')}>
            <MaterialIcons name="location-pin" size={40} color={'#FF007A'} />
          </Marker>
        )}

        {/* Destination Marker */}
        {remainingRoute.length > 0 && (
          <Marker coordinate={remainingRoute[remainingRoute.length - 1]} title={t('destination')}>
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
            <Text style={styles(theme).infoValue}>{eta} dk</Text>
          </View>
        </View>

        {isDriver && (
          <TouchableOpacity style={styles(theme).finishButton} onPress={handleFinishRide}>
            <Text style={styles(theme).finishButtonText}>{t('finish_ride')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

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
  driverMarkerContainer: {
    padding: 2,
    borderRadius: 22, // size/2 + border
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'white',
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
  finishButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    ...theme.shadows.md,
  },
  finishButtonText: {
    ...theme.textStyles.button,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default LiveTrackingScreen;