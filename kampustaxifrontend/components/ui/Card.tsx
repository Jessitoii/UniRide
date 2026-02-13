import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  useColorScheme,
} from 'react-native';
import { lightTheme, darkTheme, ThemeType } from '../../src/styles/theme';

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
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
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
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
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