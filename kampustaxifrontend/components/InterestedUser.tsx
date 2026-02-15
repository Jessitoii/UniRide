import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface InterestedUserProps {
  userId: string;
  postId: string; // Kept for navigation if needed, though simpler via parent
  userName: string;
  university: string;
  bio: string;
  route: any;
  userLocation: { latitude: number; longitude: number } | null;
  stars: number;
  matchedUserId?: string; // ID of the user who is matched (if any)
  onMatchPress: (userId: string) => void;
}

const InterestedUser: React.FC<InterestedUserProps> = ({
  userId,
  postId,
  userName,
  university,
  bio,
  route,
  userLocation,
  stars,
  matchedUserId,
  onMatchPress,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  if (!userLocation) {
    return null;
  }

  const isMatchedWithThisUser = matchedUserId === userId;
  const isPostMatched = !!matchedUserId;

  // Don't show match button for other users if post is already matched to someone else
  const showMatchButton = !isPostMatched || isMatchedWithThisUser;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      {/* Header / Identity Section */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push({ pathname: '/(drawer)/PostDetailScreen', params: { postId } })} // Or to user profile?
        activeOpacity={0.9}
      >
        <View style={styles.avatarContainer}>
          {/* Placeholder Avatar - in real app pass avatarUrl prop */}
          <View style={[styles.avatar, { backgroundColor: theme.colors.surface }]}>
            <MaterialIcons name="person" size={24} color={theme.colors.textLight} />
          </View>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: theme.colors.textDark }]}>{userName}</Text>
            {/* Star Badge */}
            <View style={[styles.badge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <MaterialIcons name="star" size={12} color="#FFD700" />
              <Text style={[styles.badgeText, { color: theme.colors.textDark }]}>{stars.toFixed(1)}</Text>
            </View>
          </View>

          {/* University Badge */}
          <View style={[styles.uniBadge, { backgroundColor: theme.colors.primaryLight + '20' }]}>
            <MaterialIcons name="school" size={12} color={theme.colors.primary} />
            <Text style={[styles.uniText, { color: theme.colors.primary }]}>{university}</Text>
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
          customMapStyle={[]} // Add map style if needed
        >
          <Polyline
            coordinates={typeof route === 'string' ? JSON.parse(route) : route} // Handle both string/object
            strokeWidth={3}
            strokeColor={theme.colors.primary}
          />
          <Marker coordinate={userLocation} />
        </MapView>
      </View>

      {/* Footer / Actions */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.bioText, { color: theme.colors.textLight }]} numberOfLines={2}>
          {bio || t('no_bio')}
        </Text>

        {showMatchButton && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: isMatchedWithThisUser ? theme.colors.success : theme.colors.primary }
            ]}
            onPress={() => onMatchPress(userId)}
            disabled={isMatchedWithThisUser} // Disable if already matched (or implement cancel logic here)
          >
            <Text style={styles.actionButtonText}>
              {isMatchedWithThisUser ? t('already_matched') : t('match')}
            </Text>
            {isMatchedWithThisUser && <MaterialIcons name="check" size={16} color="white" style={{ marginLeft: 4 }} />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  uniBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  uniText: {
    fontSize: 12,
    fontWeight: '500',
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
    padding: 12,
    borderTopWidth: 1,
    justifyContent: 'space-between',
  },
  bioText: {
    flex: 1,
    fontSize: 12,
    marginRight: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InterestedUser;
