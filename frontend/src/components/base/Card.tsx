import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { ThemeType } from '@/styles/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: 'none' | 'small' | 'medium' | 'large';
  padding?: boolean;
  borderRadius?: keyof ThemeType['borderRadius'];
}

interface TouchableCardProps extends TouchableOpacityProps, Omit<CardProps, 'children'> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 'small',
  padding = true,
  borderRadius = 'lg', // Default to 20px (lg)
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const elevationMapping = {
    none: styles.elevationNone,
    small: styles.elevationSmall,
    medium: styles.elevationMedium,
    large: styles.elevationLarge,
  };

  return (
    <View
      style={[
        styles.card,
        padding && styles.padding,
        elevationMapping[elevation],
        { borderRadius: theme.borderRadius[borderRadius] },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const TouchableCard: React.FC<TouchableCardProps> = ({
  children,
  style,
  elevation = 'small',
  padding = true,
  borderRadius = 'lg', // Default to 20px (lg)
  activeOpacity = 0.7,
  ...rest
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const elevationMapping = {
    none: styles.elevationNone,
    small: styles.elevationSmall,
    medium: styles.elevationMedium,
    large: styles.elevationLarge,
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        padding && styles.padding,
        elevationMapping[elevation],
        { borderRadius: theme.borderRadius[borderRadius] },
        style,
      ]}
      activeOpacity={activeOpacity}
      {...rest}
    >
      {children}
    </TouchableOpacity>
  );
};

const createStyles = (theme: ThemeType) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
  },
  padding: {
    padding: theme.spacing.md,
  },
  elevationNone: {
    ...theme.shadows.none,
  },
  elevationSmall: {
    ...theme.shadows.sm,
  },
  elevationMedium: {
    ...theme.shadows.base,
  },
  elevationLarge: {
    ...theme.shadows.lg,
  },
});

export default Card; 