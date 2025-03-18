import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  useColorScheme,
  StyleProp,
  ViewStyle,
  TextStyle 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { lightTheme, darkTheme, ThemeType } from '../styles/theme';

interface PriceBreakdown {
  baseFare?: number;
  distance?: number;
  time?: number;
  discount?: number;
  tax?: number;
  total: number;
}

interface PriceEstimateProps {
  estimate: PriceBreakdown;
  showDetails?: boolean;
  onToggleDetails?: () => void;
  isLoading?: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  estimateText?: string;
  currency?: string;
}

interface StylesType {
  container: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  estimateText: StyleProp<TextStyle>;
  detailsButton: StyleProp<ViewStyle>;
  detailsButtonText: StyleProp<TextStyle>;
  priceContainer: StyleProp<ViewStyle>;
  totalPrice: StyleProp<TextStyle>;
  breakdown: StyleProp<ViewStyle>;
  breakdownRow: StyleProp<ViewStyle>;
  breakdownLabel: StyleProp<TextStyle>;
  breakdownValue: StyleProp<TextStyle>;
  discountLabel: StyleProp<TextStyle>;
  discountValue: StyleProp<TextStyle>;
  totalRow: StyleProp<ViewStyle>;
  totalLabel: StyleProp<TextStyle>;
  totalValue: StyleProp<TextStyle>;
  confirmButton: StyleProp<ViewStyle>;
  confirmText: StyleProp<TextStyle>;
}

const PriceEstimate: React.FC<PriceEstimateProps> = ({
  estimate,
  showDetails = false,
  onToggleDetails,
  isLoading = false,
  onConfirm,
  confirmText = 'Confirm Price',
  estimateText = 'Estimated Price',
  currency = '₺',
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  
  const formatPrice = (price?: number) => {
    if (price === undefined) return `-`;
    return `${price.toFixed(2)} ${currency}`;
  };

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).header}>
        <Text style={styles(theme).estimateText}>{estimateText}</Text>
        {onToggleDetails && (
          <TouchableOpacity 
            onPress={onToggleDetails}
            style={styles(theme).detailsButton}
            activeOpacity={0.7}
          >
            <Text style={styles(theme).detailsButtonText}>
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Text>
            <MaterialIcons 
              name={showDetails ? 'expand-less' : 'expand-more'} 
              size={18} 
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles(theme).priceContainer}>
        <Text style={styles(theme).totalPrice}>
          {formatPrice(estimate.total)}
        </Text>
      </View>
      
      {showDetails && (
        <View style={styles(theme).breakdown}>
          {estimate.baseFare !== undefined && (
            <View style={styles(theme).breakdownRow}>
              <Text style={styles(theme).breakdownLabel}>Base Fare</Text>
              <Text style={styles(theme).breakdownValue}>
                {formatPrice(estimate.baseFare)}
              </Text>
            </View>
          )}
          
          {estimate.distance !== undefined && (
            <View style={styles(theme).breakdownRow}>
              <Text style={styles(theme).breakdownLabel}>Distance</Text>
              <Text style={styles(theme).breakdownValue}>
                {formatPrice(estimate.distance)}
              </Text>
            </View>
          )}
          
          {estimate.time !== undefined && (
            <View style={styles(theme).breakdownRow}>
              <Text style={styles(theme).breakdownLabel}>Time</Text>
              <Text style={styles(theme).breakdownValue}>
                {formatPrice(estimate.time)}
              </Text>
            </View>
          )}
          
          {estimate.tax !== undefined && (
            <View style={styles(theme).breakdownRow}>
              <Text style={styles(theme).breakdownLabel}>Tax</Text>
              <Text style={styles(theme).breakdownValue}>
                {formatPrice(estimate.tax)}
              </Text>
            </View>
          )}
          
          {estimate.discount !== undefined && estimate.discount > 0 && (
            <View style={styles(theme).breakdownRow}>
              <Text style={styles(theme).discountLabel}>Discount</Text>
              <Text style={styles(theme).discountValue}>
                -{formatPrice(estimate.discount)}
              </Text>
            </View>
          )}
          
          <View style={styles(theme).totalRow}>
            <Text style={styles(theme).totalLabel}>Total</Text>
            <Text style={styles(theme).totalValue}>
              {formatPrice(estimate.total)}
            </Text>
          </View>
        </View>
      )}
      
      {onConfirm && (
        <TouchableOpacity
          style={styles(theme).confirmButton}
          onPress={onConfirm}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <Text style={styles(theme).confirmText}>Calculating...</Text>
          ) : (
            <Text style={styles(theme).confirmText}>{confirmText}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = (theme: ThemeType): StylesType => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  estimateText: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButtonText: {
    ...theme.textStyles.caption,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  totalPrice: {
    ...theme.textStyles.header2,
    color: theme.colors.textDark,
  },
  breakdown: {
    marginBottom: theme.spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  breakdownLabel: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
  },
  breakdownValue: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  discountLabel: {
    ...theme.textStyles.body,
    color: theme.colors.success,
  },
  discountValue: {
    ...theme.textStyles.body,
    color: theme.colors.success,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  totalLabel: {
    ...theme.textStyles.body,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  totalValue: {
    ...theme.textStyles.body,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  confirmText: {
    ...theme.textStyles.button,
    color: theme.colors.white,
  },
}) as StylesType;

export default PriceEstimate; 