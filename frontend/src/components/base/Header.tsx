import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  transparent?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  backIconColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = true,
  onBackPress,
  rightComponent,
  transparent = false,
  containerStyle,
  titleStyle,
  backIconColor,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme, insets.top);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const iconColor = backIconColor || theme.colors.textDark;

  return (
    <View
      style={[
        styles.container,
        transparent ? styles.transparentContainer : styles.solidContainer,
        containerStyle,
      ]}
    >
      <StatusBar
        backgroundColor={transparent ? 'transparent' : theme.colors.card}
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent={true}
      />
      <View style={styles.content}>
        <View style={styles.leftContainer}>
          {showBackButton && (
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={iconColor}
              />
            </TouchableOpacity>
          )}
        </View>

        <Text
          style={[styles.title, titleStyle]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>

        <View style={styles.rightContainer}>
          {rightComponent}
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: ThemeType, paddingTop: number) => StyleSheet.create({
  container: {
    paddingTop: paddingTop,
    width: '100%',
  },
  solidContainer: {
    backgroundColor: theme.colors.card,
    ...theme.shadows.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  transparentContainer: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: theme.spacing.md,
  },
  leftContainer: {
    width: 48,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  title: {
    ...theme.textStyles.header3,
    flex: 1,
    textAlign: 'center',
    color: theme.colors.textDark,
    fontWeight: '600',
  },
  rightContainer: {
    width: 48,
    alignItems: 'flex-end',
  },
});

export default Header; 