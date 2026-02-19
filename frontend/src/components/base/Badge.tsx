import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ThemeType } from '@/styles/theme';
import { useTheme } from '@/contexts/ThemeContext';

export type BadgeVariant = 'filled' | 'outlined' | 'subtle';
export type BadgeSize = 'small' | 'medium' | 'large';
export type BadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: BadgeColor;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'filled',
  size = 'medium',
  color = 'primary',
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getBackgroundColor = () => {
    if (variant === 'filled') {
      return theme.colors[color];
    } else if (variant === 'outlined') {
      return 'transparent';
    } else {
      // 'subtle' variant
      return theme.colors[color] + '15';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outlined') {
      return theme.colors[color];
    }
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'filled') {
      return theme.colors.white;
    } else {
      return theme.colors[color];
    }
  };

  const badgeStyles = [
    styles.badge,
    styles[`${size}Badge`],
    {
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor(),
    },
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${size}Text`],
    {
      color: getTextColor(),
    },
    textStyle,
  ];

  return (
    <View style={badgeStyles}>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      <Text style={textStyles}>{label}</Text>
      {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
    </View>
  );
};

// Dot badge for notification indicators
interface DotBadgeProps {
  count?: number;
  color?: BadgeColor;
  size?: BadgeSize;
  showZero?: boolean;
  maxCount?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const DotBadge: React.FC<DotBadgeProps> = ({
  count,
  color = 'error',
  size = 'medium',
  showZero = false,
  maxCount = 99,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Don't render if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  const isDot = count === undefined;
  const displayCount = count !== undefined && count > maxCount ? `${maxCount}+` : count;

  const dotStyles = [
    styles.dotBadge,
    styles[`${size}Dot`],
    {
      backgroundColor: theme.colors[color],
    },
    !isDot && styles.countBadge,
    style,
  ];

  if (isDot) {
    return <View style={dotStyles} />;
  }

  return (
    <View style={dotStyles}>
      <Text style={[styles.countText, styles[`${size}CountText`], textStyle]}>
        {displayCount}
      </Text>
    </View>
  );
};

const createStyles = (theme: ThemeType) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
  },
  text: {
    fontWeight: '500',
  },
  leftIcon: {
    marginRight: theme.spacing.xs,
  },
  rightIcon: {
    marginLeft: theme.spacing.xs,
  },

  // Size styles
  smallBadge: {
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
  },
  mediumBadge: {
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
  },
  largeBadge: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
  },

  // Text size styles
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },

  // Dot badge styles
  dotBadge: {
    borderRadius: 999,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  smallDot: {
    width: 8,
    height: 8,
  },
  mediumDot: {
    width: 10,
    height: 10,
  },
  largeDot: {
    width: 12,
    height: 12,
  },
  countText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  smallCountText: {
    fontSize: 8,
  },
  mediumCountText: {
    fontSize: 10,
  },
  largeCountText: {
    fontSize: 12,
  },
});

export default Badge; 