import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';

// Custom date formatter functions to avoid dependency on date-fns
const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year} `;
};

const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes} `;
};

interface RideHistoryItemProps {
  id: string;
  date: string | Date;
  from: string;
  to: string;

  status: 'completed' | 'cancelled' | 'ongoing' | 'upcoming' | 'pending' | 'expired';
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
  status,
  driverName,
  passengerName,
  isDriver = false,
  onPress,
}) => {
  const { theme, isDark } = useTheme();

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
      case 'upcoming':
        return theme.colors.info;
      case 'pending':
        return theme.colors.warning;
      case 'expired':
        return theme.colors.textLight;
      default:
        return theme.colors.textLight;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      case 'ongoing':
        return 'car-sport';
      case 'upcoming':
        return 'time-outline';
      case 'pending':
        return 'hourglass-outline';
      case 'expired':
        return 'alert-circle-outline';
      default:
        return 'help-circle';
    }
  };

  return (
    <TouchableOpacity
      style={[styles(theme).container]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles(theme).leftSection}>
        <View style={styles(theme).dateContainer}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.textLight} />
          <Text style={styles(theme).dateText}>
            {formatDate(formattedDate)}
          </Text>
          <Text style={styles(theme).timeText}>
            {formatTime(formattedDate)}
          </Text>
        </View>

        <View style={styles(theme).routeContainer}>
          <View style={styles(theme).timelineColumn}>
            <View style={styles(theme).startDot} />
            <View style={styles(theme).routeLine} />
            <View style={styles(theme).endDot} />
          </View>

          <View style={styles(theme).locationTexts}>
            <Text style={styles(theme).locationText} numberOfLines={1}>
              {from}
            </Text>
            <View style={{ height: 12 }} />
            <Text style={styles(theme).locationText} numberOfLines={1}>
              {to}
            </Text>
          </View>
        </View>

        {(driverName && !isDriver) && (
          <View style={styles(theme).personContainer}>
            <Ionicons name="person-outline" size={12} color={theme.colors.textLight} />
            <Text style={styles(theme).personText}>
              {driverName}
            </Text>
          </View>
        )}

        {(passengerName && isDriver) && (
          <View style={styles(theme).personContainer}>
            <Ionicons name="person-outline" size={12} color={theme.colors.textLight} />
            <Text style={styles(theme).personText}>
              {passengerName}
            </Text>
          </View>
        )}
      </View>

      <View style={styles(theme).rightSection}>
        <View style={[
          styles(theme).statusBadge,
          { backgroundColor: getStatusColor() + '15' }
        ]}>
          <Ionicons
            name={getStatusIcon() as any}
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

        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.divider}
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
    borderRadius: theme.borderRadius.lg, // 20px
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  leftSection: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  dateText: {
    ...theme.textStyles.caption,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 6,
  },
  timeText: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.xs,
  },
  routeContainer: {
    flexDirection: 'row',
    marginVertical: theme.spacing.xs,
  },
  timelineColumn: {
    width: 14,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    paddingVertical: 4,
  },
  startDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.text,
  },
  routeLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: 2,
  },
  endDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  locationTexts: {
    flex: 1,
    justifyContent: 'center',
  },
  locationText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
  },
  personContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  personText: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
    marginLeft: 4,
  },
  rightSection: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
});

export default RideHistoryItem;