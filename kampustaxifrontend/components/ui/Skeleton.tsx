import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  StyleProp,
  useColorScheme,
} from 'react-native';
import { lightTheme, darkTheme, ThemeType } from '../../src/styles/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  shimmerWidth?: number;
}

interface SkeletonCircleProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  shimmerWidth = 100,
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  const translateX = useRef(new Animated.Value(-shimmerWidth)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: shimmerWidth,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [translateX, shimmerWidth]);

  return (
    <View
      style={[
        styles.container,
        { height, borderRadius },
        { width } as any,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            width: shimmerWidth,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  size = 40,
  style,
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  const translateX = useRef(new Animated.Value(-size)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: size,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [translateX, size]);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            width: size,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

// Usage example for a card skeleton
export const CardSkeleton: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  return (
    <View style={[styles.cardSkeleton, style]}>
      <View style={styles.cardSkeletonHeader}>
        <SkeletonCircle size={40} />
        <View style={styles.cardSkeletonHeaderTexts}>
          <Skeleton width="60%" height={16} style={styles.cardSkeletonTitle} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <Skeleton height={120} style={styles.cardSkeletonContent} />
      <View style={styles.cardSkeletonFooter}>
        <Skeleton width="30%" height={14} />
        <Skeleton width="20%" height={14} />
      </View>
    </View>
  );
};

const createStyles = (theme: ThemeType) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.divider,
    overflow: 'hidden',
  },
  shimmer: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardSkeleton: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  cardSkeletonHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  cardSkeletonHeaderTexts: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  cardSkeletonTitle: {
    marginBottom: theme.spacing.xs,
  },
  cardSkeletonContent: {
    marginBottom: theme.spacing.md,
  },
  cardSkeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default Skeleton; 