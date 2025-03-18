import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  useColorScheme 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { lightTheme, darkTheme, ThemeType } from '../styles/theme';

// Custom date formatter functions to avoid dependency on date-fns
const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

interface RideHistoryItemProps {
  id: string;
  date: string | Date;
  from: string;
  to: string;
  price: number;
  status: 'completed' | 'cancelled' | 'ongoing';
  driverName?: string;
  passengerName?: string;
  isDriver?: boolean;
  onPress?: () => void;
}

const RideHistoryItem: React.FC<RideHistoryItemProps> = ({
  id,
  date,
  from,
  to,
  price,
  status,
  driverName,
  passengerName,
  isDriver = false,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  
  const formattedDate = typeof date === 'string' 
    ? new Date(date) 
    : date;

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      case 'ongoing':
        return theme.colors.primary;
      default:
        return theme.colors.textLight;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'cancelled':
        return 'cancel';
      case 'ongoing':
        return 'directions-car';
      default:
        return 'help';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles(theme).container]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles(theme).leftSection}>
        <View style={styles(theme).dateContainer}>
          <Text style={styles(theme).dateText}>
            {formatDate(formattedDate)}
          </Text>
          <Text style={styles(theme).timeText}>
            {formatTime(formattedDate)}
          </Text>
        </View>

        <View style={styles(theme).routeContainer}>
          <View style={styles(theme).locationMarkers}>
            <View style={styles(theme).startDot} />
            <View style={styles(theme).routeLine} />
            <View style={styles(theme).endDot} />
          </View>
          
          <View style={styles(theme).locationTexts}>
            <Text style={styles(theme).locationText} numberOfLines={1}>
              {from}
            </Text>
            <Text style={styles(theme).locationText} numberOfLines={1}>
              {to}
            </Text>
          </View>
        </View>
        
        {(driverName && !isDriver) && (
          <Text style={styles(theme).personText}>
            Driver: {driverName}
          </Text>
        )}
        
        {(passengerName && isDriver) && (
          <Text style={styles(theme).personText}>
            Passenger: {passengerName}
          </Text>
        )}
      </View>
      
      <View style={styles(theme).rightSection}>
        <View style={[
          styles(theme).statusBadge, 
          { backgroundColor: getStatusColor() + '20' }
        ]}>
          <MaterialIcons 
            name={getStatusIcon()} 
            size={14} 
            color={getStatusColor()} 
          />
          <Text style={[
            styles(theme).statusText,
            { color: getStatusColor() }
          ]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
        
        <Text style={styles(theme).priceText}>
          {price.toFixed(2)} ₺
        </Text>
        
        <MaterialIcons 
          name="chevron-right" 
          size={20} 
          color={theme.colors.textLight} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  leftSection: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  dateText: {
    ...theme.textStyles.bodySmall,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  timeText: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.xs,
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  locationMarkers: {
    width: 16,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  startDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: theme.colors.divider,
    marginVertical: 2,
  },
  endDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.secondary,
  },
  locationTexts: {
    flex: 1,
  },
  locationText: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  personText: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  rightSection: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    ...theme.textStyles.caption,
    fontWeight: '500',
    marginLeft: 4,
  },
  priceText: {
    ...theme.textStyles.body,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
});

export default RideHistoryItem;