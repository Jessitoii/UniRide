import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { Avatar } from '@/components/base/Avatar';
import { FontAwesome } from '@expo/vector-icons';

interface ReviewItemProps {
  userId: string;
  name: string;
  surname?: string;
  comment: string;
  star: number;
  date?: string;
  hasCustomPhoto?: boolean;
}

const ReviewItem: React.FC<ReviewItemProps> = ({
  userId,
  name,
  surname,
  comment,
  star,
  date,
  hasCustomPhoto
}) => {
  const { theme } = useTheme();

  const formattedDate = date
    ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).header}>
        <Avatar
          user={{ id: userId, hasCustomPhoto }}
          size={40}
        />
        <View style={styles(theme).headerText}>
          <Text style={styles(theme).name}>{name} {surname}</Text>
          <View style={styles(theme).metaRow}>
            <View style={styles(theme).ratingContainer}>
              {[...Array(5)].map((_, i) => (
                <FontAwesome
                  key={i}
                  name="star"
                  size={12}
                  color={i < star ? theme.colors.warning : theme.colors.divider}
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
            {formattedDate ? (
              <Text style={styles(theme).date}>• {formattedDate}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <Text style={styles(theme).comment}>{comment}</Text>
    </View>
  );
};

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  headerText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  name: {
    ...theme.textStyles.bodyBold,
    color: theme.colors.textDark,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginRight: theme.spacing.sm,
  },
  date: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
  },
  comment: {
    ...theme.textStyles.body,
    color: theme.colors.text,
    lineHeight: 20,
  },
});

export default ReviewItem;
