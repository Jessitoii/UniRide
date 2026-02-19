import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  useColorScheme,
  Platform,
  Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { lightTheme, darkTheme, ThemeType } from '@/styles/theme';
import { Avatar } from '@/components/base/Avatar';
import { BASE_URL } from '@/env';

interface Vehicle {
  model: string;
  brand: string;
  color?: string;
  plateNumber?: string;
  photoUrl?: string; // Should be full URL if possible, or path managed by component
  photoPath?: string;
}

interface DriverCardProps {
  id: string;
  name: string;
  avatar?: string;
  hasCustomPhoto?: boolean;
  rating: number;
  numberOfRides?: number;
  vehicle?: Vehicle;
  isAvailable?: boolean;
  distance?: number;
  distanceUnit?: 'km' | 'min';
  onPress?: () => void;
  onMessagePress?: () => void;
  onCallPress?: () => void;
}

const DriverCard: React.FC<DriverCardProps> = ({
  id,
  name,
  avatar,
  hasCustomPhoto,
  rating,
  numberOfRides = 0,
  vehicle,
  isAvailable = true,
  distance,
  distanceUnit = 'km',
  onPress,
  onMessagePress,
  onCallPress,
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  // Generate initials (fallback)
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Sanitize and validate URL
  const getSanitizedUrl = (url?: string) => {
    if (!url) return null;
    try {
      // Fix potential double slashes (except protocol)
      return url.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
      return url;
    }
  };

  const photoUrl = getSanitizedUrl(vehicle?.photoUrl);

  return (
    <TouchableOpacity
      style={styles(theme).container}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={!onPress}
    >
      {/* Background/Car Image Layer */}
      {photoUrl && !imageError ? (
        <View style={styles(theme).carBackgroundContainer}>
          <Image
            source={{ uri: photoUrl }}
            style={{ width: '100%', height: '100%', backgroundColor: theme.colors.surface }}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
          <View style={styles(theme).overlay} />
        </View>
      ) : (
        <View style={[styles(theme).carBackgroundContainer, { backgroundColor: theme.colors.surface }]}>
          {/* Fallback pattern or icon could go here if design requires */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.1 }}>
            <MaterialIcons name="directions-car" size={64} color={theme.colors.text} />
          </View>
        </View>
      )}

      {/* Content Layer */}
      <View style={styles(theme).contentContainer}>

        {/* Top Row: Ratings & Availability */}
        <View style={styles(theme).topRow}>
          <View style={styles(theme).ratingBadge}>
            <FontAwesome name="star" size={12} color={theme.colors.warning} />
            <Text style={styles(theme).ratingText}>{rating.toFixed(1)}</Text>
          </View>
          {isAvailable && (
            <View style={styles(theme).statusBadge}>
              <View style={styles(theme).statusDot} />
              <Text style={styles(theme).statusText}>Active</Text>
            </View>
          )}
        </View>

        {/* Middle: Driver Info */}
        <View style={styles(theme).driverInfo}>
          <View style={styles(theme).avatarWrapper}>
            <Pressable
              onPress={() => router.push({ pathname: "/(drawer)/UserProfileScreen", params: { userId: id } })}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1.0 })}
              hitSlop={10}
            >
              <Avatar user={{ id, hasCustomPhoto }} size={64} style={styles(theme).avatarBorder} />
            </Pressable>
          </View>
          <View style={styles(theme).textInfo}>
            <Text style={styles(theme).nameText}>{name}</Text>
            {vehicle ? (
              <Text style={styles(theme).carText}>{vehicle.brand} {vehicle.model}</Text>
            ) : (
              <Text style={styles(theme).carText}>No vehicle info</Text>
            )}
            {distance !== undefined && (
              <View style={styles(theme).distanceBadge}>
                <MaterialIcons name="location-on" size={12} color={theme.colors.textLight} />
                <Text style={styles(theme).distanceText}>{distance} {distanceUnit}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
    height: 180, // Fixed height for card look, or let it grow
    position: 'relative',
  },
  carBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  carBackgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)', // Darken background for text readability
    zIndex: 1, // Ensure overlay is above image but below content
  },
  contentContainer: {
    flex: 1,
    zIndex: 10, // Ensure content is above everything
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFD700', // Gold
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ecc71',
    marginRight: 4,
    fontSize: 10,
  },
  statusText: {
    color: '#2ecc71',
    fontSize: 10,
    fontWeight: 'bold',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  avatarWrapper: {
    marginRight: theme.spacing.md,
  },
  avatarBorder: {
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  textInfo: {
    flex: 1,
  },
  nameText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  carText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginLeft: 4,
  },
  actionsRow: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  callButton: {
    backgroundColor: theme.colors.primary,
  }
});

export default DriverCard;