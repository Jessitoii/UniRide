import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps
} from 'react-native';
import { ThemeType } from '@/styles/theme';
import { useTheme } from '@/contexts/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
  disabled = false,
  ...rest
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Determine button and text styles based on variant and size
  const buttonStyles = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    fullWidth && styles.fullWidth,
    disabled && styles[`${variant}ButtonDisabled`],
    style,
  ];

  const buttonTextStyles = [
    styles.buttonText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={isLoading || disabled}
      activeOpacity={0.7}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? theme.colors.primary : theme.colors.white}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={buttonTextStyles}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: ThemeType) => StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full, // Rounder buttons for Lyft style
  },
  fullWidth: {
    width: '100%',
  },

  // Variant styles
  primaryButton: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
    ...theme.shadows.sm,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
    ...theme.shadows.sm,
  },

  // Disabled styles
  primaryButtonDisabled: {
    backgroundColor: theme.colors.primary + '80', // 50% opacity
    ...theme.shadows.none,
  },
  secondaryButtonDisabled: {
    backgroundColor: theme.colors.secondary + '80',
    ...theme.shadows.none,
  },
  outlineButtonDisabled: {
    borderColor: theme.colors.primary + '80',
  },
  dangerButtonDisabled: {
    backgroundColor: theme.colors.error + '80',
    ...theme.shadows.none,
  },

  // Size styles
  smallButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    minHeight: 32,
  },
  mediumButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 48, // Slightly taller
  },
  largeButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 56, // Taller for primary actions
  },

  // Text styles
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.medium,
  },
  primaryText: {
    color: theme.colors.white,
  },
  secondaryText: {
    color: theme.colors.white,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  dangerText: {
    color: theme.colors.white,
  },

  // Text size styles - using theme values
  smallText: {
    fontSize: theme.typography.fontSize.sm,
  },
  mediumText: {
    fontSize: theme.typography.fontSize.base,
  },
  largeText: {
    fontSize: theme.typography.fontSize.md,
  },
});

export default Button; 