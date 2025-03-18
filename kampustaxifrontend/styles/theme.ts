import { Dimensions } from 'react-native';

// Device constants
const { width, height } = Dimensions.get('window');

// Typography
const typography = {
  fontFamily: {
    regular: 'Inter',
    medium: 'Inter-Medium',
    bold: 'Inter-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    regular: '400' as '400',
    medium: '500' as '500',
    bold: '700' as '700',
  },
};

// Spacing
const spacing = {
  '0': 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

// Border radius
const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  full: 9999,
};

// Shadows
const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
};

// Colors - Light theme
const lightColors = {
  // Primary brand colors
  primary: '#ff0d8e', // Pink
  primaryLight: '#ff6eb5',
  primaryDark: '#cc0970',

  // Secondary brand colors
  secondary: '#4b39ef', // Purple
  secondaryLight: '#7865ff',
  secondaryDark: '#382dc2',

  // Accent colors
  accent: '#bbbcff', // Light purple
  accentLight: '#e1e1ff',
  accentDark: '#9a9be2',

  // Semantic UI colors
  success: '#34c759',
  warning: '#ffcc00',
  error: '#ff3b30',
  info: '#5ac8fa',

  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  background: '#ffffff',
  surface: '#f8f8f8',
  card: '#ffffff',
  text: '#212121',
  textLight: '#757575',
  textDark: '#000000',
  border: '#e0e0e0',
  divider: '#f1f1f4',

  // Gradients - Represented as arrays of colors
  gradients: {
    primary: ['#e1d0ff', '#ffc0e4'],
    secondary: ['#bbbcff', '#ff6eb5'],
    accent: ['#e1e1ff', '#f8f8f8'],
  },

  // Status colors
  online: '#00c853',
  offline: '#757575',
  busy: '#ff3b30',
};

// Colors - Dark theme
const darkColors = {
  // Primary brand colors
  primary: '#ff5ea9', // Brighter and warmer pink for better visibility
  primaryLight: '#ff8cbe',
  primaryDark: '#cc0970',

  // Secondary brand colors
  secondary: '#7c6bff', // Brighter purple for visibility
  secondaryLight: '#9f91ff',
  secondaryDark: '#5648cf',

  // Accent colors
  accent: '#a88dfc', // More vibrant purple accent
  accentLight: '#c7b8ff',
  accentDark: '#7b59ee',

  // Semantic UI colors
  success: '#4ade80', // Brighter green for better visibility
  warning: '#fbbf24', // Warmer amber for better visibility
  error: '#f87171', // Softer red for better visibility
  info: '#60a5fa', // Brighter blue for better visibility

  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  background: '#111827', // Subtle blue-gray dark background
  surface: '#1f2937', // Slightly lighter blue-gray
  card: '#2a3441', // Card background with subtle blue tint
  text: '#f3f4f6', // Off-white text for better readability
  textLight: '#9ca3af', // Soft gray for secondary text
  textDark: '#f9fafb', // Almost white for headers
  border: '#374151', // Subtle blue-gray border
  divider: '#2d3748', // Slightly visible divider

  // Gradients - Represented as arrays of colors
  gradients: {
    primary: ['#7c6bff', '#ff5ea9'], // Purple to pink
    secondary: ['#4c1d95', '#9333ea'], // Deep purple to medium purple
    accent: ['#6366f1', '#2563eb'], // Indigo to blue
  },

  // Status colors
  online: '#10b981', // Emerald green
  offline: '#9ca3af', // Gray
  busy: '#ef4444', // Red
};

// Common Text Styles
const createTextStyles = (colors: typeof lightColors) => ({
  header1: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    fontFamily: typography.fontFamily.bold,
  },
  header2: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    fontFamily: typography.fontFamily.bold,
  },
  header3: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    fontFamily: typography.fontFamily.medium,
  },
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.text,
    fontFamily: typography.fontFamily.regular,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textLight,
    fontFamily: typography.fontFamily.regular,
  },
  button: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
    fontFamily: typography.fontFamily.medium,
  },
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    color: colors.textLight,
    fontFamily: typography.fontFamily.regular,
  },
});

// Button Styles
const createButtonStyles = (colors: typeof lightColors) => ({
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.base,
    alignItems: 'center' as const,
    ...shadows.base,
  },
  secondary: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.base,
    alignItems: 'center' as const,
    ...shadows.base,
  },
  outline: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center' as const,
  },
  text: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
  },
});

// Input Styles
const createInputStyles = (colors: typeof lightColors) => ({
  default: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  focused: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 2,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  error: {
    backgroundColor: colors.surface,
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
});

// Card Styles
const createCardStyles = (colors: typeof lightColors) => ({
  default: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    ...shadows.base,
  },
  elevated: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    ...shadows.lg,
  },
  outlined: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

// Create a theme object with light and dark variants
const createTheme = (isDark: boolean) => {
  const colors = isDark ? darkColors : lightColors;
  
  return {
    isDark,
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    dimensions: {
      width,
      height,
      screen: {
        width,
        height,
      },
    },
    textStyles: createTextStyles(colors),
    buttonStyles: createButtonStyles(colors),
    inputStyles: createInputStyles(colors),
    cardStyles: createCardStyles(colors),
  };
};

// Export the light and dark themes
export const lightTheme = createTheme(false);
export const darkTheme = createTheme(true);

// For backward compatibility, export the light theme as the default theme
export const theme = lightTheme;

// Type definitions for type safety when using the theme
export type ThemeType = typeof lightTheme;
export type ColorsType = typeof lightColors;
export type TypographyType = typeof typography;
export type SpacingType = typeof spacing;
export type BorderRadiusType = typeof borderRadius;
export type ShadowsType = typeof shadows;
export type TextStylesType = ReturnType<typeof createTextStyles>;
export type ButtonStylesType = ReturnType<typeof createButtonStyles>;
export type InputStylesType = ReturnType<typeof createInputStyles>;
export type CardStylesType = ReturnType<typeof createCardStyles>;
