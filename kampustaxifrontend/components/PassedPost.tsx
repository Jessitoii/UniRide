import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';

interface PassedPostProps {
  from: string;
  to: string;
  date: string;
}

const PassedPost: React.FC<PassedPostProps> = ({ from, to, date }) => {
  const { theme } = useTheme();
  const s = styles(theme);

  return (
    <View style={s.container}>
      <View style={s.iconContainer}>
        <MaterialIcons name="history" size={20} color={theme.colors.primary} />
      </View>
      <View style={s.infoContainer}>
        <View style={s.titleRow}>
          <Text style={s.title}>{from}</Text>
          <MaterialIcons name="arrow-forward" size={16} color={theme.colors.primary} style={s.arrow} />
          <Text style={s.title}>{to}</Text>
        </View>
        <Text style={s.dateTime}>{date}</Text>
      </View>
    </View>
  );
};

const styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconContainer: {
    width: 36,
    height: 36,
    backgroundColor: theme.colors.primaryTransparent,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    ...theme.textStyles.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  arrow: {
    marginHorizontal: 8,
  },
  dateTime: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
  },
});

export default PassedPost;