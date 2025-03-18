import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  useColorScheme 
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { lightTheme, darkTheme, ThemeType } from '../styles/theme';

interface Vehicle {
  model: string;
  brand: string;
  color?: string;
  plateNumber?: string;
  photoUrl?: string;
}

interface DriverCardProps {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  numberOfRides?: number;
  vehicle?: Vehicle;
  isAvailable?: boolean;
  distance?: number; // in km or minutes
  distanceUnit?: 'km' | 'min';
  onPress?: () => void;
  onMessagePress?: () => void;
  onCallPress?: () => void;
}

const DriverCard: React.FC<DriverCardProps> = ({
  id,
  name,
  avatar,
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
  
  // Generate initials from name
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  return (
    <TouchableOpacity 
      style={styles(theme).container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles(theme).driverInfoSection}>
        <View style={styles(theme).avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles(theme).avatar} />
          ) : (
            <View style={styles(theme).defaultAvatar}>
              <Text style={styles(theme).avatarInitials}>{initials}</Text>
            </View>
          )}
          {isAvailable !== undefined && (
            <View 
              style={[
                styles(theme).statusDot, 
                { backgroundColor: isAvailable ? theme.colors.success : theme.colors.error }
              ]} 
            />
          )}
        </View>
        
        <View style={styles(theme).driverDetails}>
          <Text style={styles(theme).driverName}>{name}</Text>
          
          <View style={styles(theme).ratingContainer}>
            <FontAwesome name="star" size={14} color={theme.colors.warning} />
            <Text style={styles(theme).ratingText}>{rating.toFixed(1)}</Text>
            {numberOfRides > 0 && (
              <Text style={styles(theme).ridesText}>
                ({numberOfRides} {numberOfRides === 1 ? 'ride' : 'rides'})
              </Text>
            )}
          </View>
          
          {distance !== undefined && (
            <Text style={styles(theme).distanceText}>
              <MaterialIcons 
                name={distanceUnit === 'min' ? 'schedule' : 'directions-car'} 
                size={12} 
                color={theme.colors.textLight} 
              />
              {' '}
              {distance} {distanceUnit === 'min' ? 'minutes away' : 'km away'}
            </Text>
          )}
        </View>
      </View>
      
      {vehicle && (
        <View style={styles(theme).vehicleInfoSection}>
          <Text style={styles(theme).vehicleTitle}>Vehicle</Text>
          <Text style={styles(theme).vehicleInfo}>
            {vehicle.brand} {vehicle.model} 
            {vehicle.color && ` • ${vehicle.color}`}
          </Text>
          {vehicle.plateNumber && (
            <Text style={styles(theme).plateNumber}>{vehicle.plateNumber}</Text>
          )}
          {vehicle.photoUrl && (
            <Image 
              source={{ uri: vehicle.photoUrl }} 
              style={styles(theme).vehicleImage}
              resizeMode="contain"
            />
          )}
        </View>
      )}
      
      {(onMessagePress || onCallPress) && (
        <View style={styles(theme).actionsSection}>
          {onMessagePress && (
            <TouchableOpacity 
              style={styles(theme).actionButton}
              onPress={onMessagePress}
              activeOpacity={0.7}
            >
              <MaterialIcons name="message" size={16} color={theme.colors.primary} />
              <Text style={styles(theme).actionText}>Message</Text>
            </TouchableOpacity>
          )}
          
          {onCallPress && (
            <TouchableOpacity 
              style={styles(theme).actionButton}
              onPress={onCallPress}
              activeOpacity={0.7}
            >
              <MaterialIcons name="phone" size={16} color={theme.colors.primary} />
              <Text style={styles(theme).actionText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
    marginBottom: theme.spacing.md,
  },
  driverInfoSection: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    ...theme.textStyles.header3,
    color: theme.colors.primary,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  driverDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  driverName: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  ratingText: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  ridesText: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
  },
  distanceText: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
  },
  vehicleInfoSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  vehicleTitle: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  vehicleInfo: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  plateNumber: {
    ...theme.textStyles.body,
    fontWeight: '500',
    color: theme.colors.textDark,
    marginTop: theme.spacing.xs,
  },
  vehicleImage: {
    width: '100%',
    height: 80,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
  },
  actionsSection: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  actionText: {
    ...theme.textStyles.body,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
});

export default DriverCard; 