import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/base/Avatar';

interface InterestedUserProps {
  userId: string;
  postId: string;
  userName: string;
  university: string;
  bio: string;
  hasCustomPhoto?: boolean;
  route: any;
  userLocation: { latitude: number; longitude: number } | null;
  stars: number;
  matchedUserId?: string;
  onMatchPress?: (userId: string) => void;
  onChatPress?: (userId: string) => void;
}

const InterestedUser: React.FC<InterestedUserProps> = ({
  userId,
  postId,
  userName,
  university,
  bio,
  hasCustomPhoto,
  route,
  userLocation,
  stars,
  matchedUserId,
  onMatchPress,
  onChatPress,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = createStyles(theme);

  if (!userLocation) {
    return null;
  }

  const isMatchedWithThisUser = matchedUserId === userId;
  const isPostMatched = !!matchedUserId;

  // Don't show match button for other users if post is already matched to someone else
  const showMatchButton = (!isPostMatched || isMatchedWithThisUser) && !!onMatchPress;

  // Robust route parsing
  const getCoordinates = () => {
    try {
      if (Array.isArray(route)) return route;
      if (typeof route === 'string') return JSON.parse(route);
      return [];
    } catch (e) {
      return [];
    }
  };

  return (
    <View style={styles.card}>
      {/* Header / Identity Section */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push({ pathname: '/(drawer)/PostDetailScreen', params: { postId } })}
        activeOpacity={0.9}
      >
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={(e) => {
            e.stopPropagation();
            router.push({ pathname: '/(drawer)/UserProfileScreen', params: { id: userId } });
          }}
        >
          <Avatar
            user={{ id: userId, hasCustomPhoto }}
            size={48}
          />
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{userName}</Text>
            {/* Star Badge */}
            <View style={styles.badge}>
              <MaterialIcons name="star" size={12} color={theme.colors.warning} />
              <Text style={styles.badgeText}>{stars.toFixed(1)}</Text>
            </View>
          </View>

          {/* University Badge */}
          <View style={styles.uniBadge}>
            <MaterialIcons name="school" size={12} color={theme.colors.primary} />
            <Text style={styles.uniText}>{university}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Map Preview */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
        >
          <Polyline
            coordinates={getCoordinates()}
            strokeWidth={3}
            strokeColor={theme.colors.primary}
          />
          <Marker coordinate={userLocation}>
            <MaterialIcons name="location-on" size={30} color={theme.colors.primary} />
          </Marker>
        </MapView>
      </View>

      {/* Footer / Actions */}
      <View style={styles.footer}>
        <Text style={styles.bioText} numberOfLines={2}>
          {bio || t('no_bio')}
        </Text>

        {showMatchButton && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {onChatPress && (
              <TouchableOpacity
                style={[styles.actionButton, styles.chatButton]}
                onPress={() => onChatPress(userId)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="chat" size={18} color="white" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                isMatchedWithThisUser ? styles.matchedButton : styles.defaultButton
              ]}
              onPress={() => onMatchPress?.(userId)}
              disabled={isMatchedWithThisUser}
            >
              <Text style={styles.actionButtonText}>
                {isMatchedWithThisUser ? t('already_matched') : t('match')}
              </Text>
              {isMatchedWithThisUser && <MaterialIcons name="check" size={16} color="white" style={{ marginLeft: 4 }} />}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textDark,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textDark,
  },
  uniBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  uniText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
  },
  mapContainer: {
    height: 120,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    justifyContent: 'space-between',
  },
  bioText: {
    flex: 1,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
    marginRight: theme.spacing.md,
    fontFamily: theme.typography.fontFamily.regular,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButton: {
    backgroundColor: theme.colors.secondary,
    marginRight: 8,
    paddingHorizontal: 0, // Icon button
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  matchedButton: {
    backgroundColor: theme.colors.success,
  },
  defaultButton: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
});

export default InterestedUser;
