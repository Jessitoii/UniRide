
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

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

const lightColors = {
    primary: '#FF00BF', // High-contrast Pink/Purple
    primaryLight: '#FF6ecf',
    primaryDark: '#c70093',

    secondary: '#3300FF', // Deep Blue/Purple for contrast
    secondaryLight: '#664eff',
    secondaryDark: '#0000ba',

    accent: '#E0E0E0',
    accentLight: '#F5F5F5',
    accentDark: '#BDBDBD',

    success: '#34C759',
    warning: '#FFCC00',
    error: '#FF3B30',
    info: '#5AC8FA',

    white: '#FFFFFF',
    black: '#000000',
    background: '#FFFFFF',
    surface: '#F9F9F9',
    card: '#FFFFFF',

    text: '#111111',
    textLight: '#757575',
    textDark: '#000000',

    border: '#E0E0E0',
    divider: '#F1F1F4',

    gradients: {
        primary: ['#FF00BF', '#3300FF'],
        secondary: ['#3300FF', '#FF00BF'],
    },
};

const darkColors = {
    primary: '#FF00BF',
    primaryLight: '#FF6ecf',
    primaryDark: '#c70093',

    secondary: '#3300FF',
    secondaryLight: '#664eff',
    secondaryDark: '#0000ba',

    accent: '#424242',
    accentLight: '#616161',
    accentDark: '#212121',

    success: '#30D158',
    warning: '#FFD60A',
    error: '#FF453A',
    info: '#64D2FF',

    white: '#FFFFFF',
    black: '#000000',
    background: '#000000', // Deep black
    surface: '#121212',
    card: '#1C1C1E', // Dark card

    text: '#FFFFFF',
    textLight: '#EBEBF5', // 60% white
    textDark: '#FFFFFF',

    border: '#38383A',
    divider: '#545458', // Separator

    gradients: {
        primary: ['#FF00BF', '#3300FF'],
        secondary: ['#3300FF', '#FF00BF'],
    },
};

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

const createTheme = (isDark: boolean) => {
    const colors = isDark ? darkColors : lightColors;
    return {
        isDark,
        colors,
        typography,
        spacing,
        borderRadius,
        shadows,
        dimensions: { width, height },
        textStyles: createTextStyles(colors),
    };
};

export const lightTheme = createTheme(false);
export const darkTheme = createTheme(true);
export const theme = lightTheme;

export type ThemeType = typeof lightTheme;
