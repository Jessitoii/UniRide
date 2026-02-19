import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeType } from '@/styles/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useShortcuts } from '@/hooks/useShortcuts';

// Add a type for Material Icons names
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

export interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

interface LocationSearchBoxProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectLocation: (location: LocationSuggestion) => void;
  suggestions: LocationSuggestion[];
  isLoading?: boolean;
  error?: string;
  label?: string;
  iconName?: MaterialIconName;
  iconColor?: string;
  onPressMap?: () => void;
  onClear?: () => void;
  showShortcuts?: boolean;
}

const LocationSearchBox: React.FC<LocationSearchBoxProps> = ({
  placeholder = 'Search for a location',
  value,
  onChangeText,
  onSelectLocation,
  suggestions,
  isLoading = false,
  error,
  label,
  iconName = 'location-on',
  iconColor,
  onPressMap,
  onClear,
  showShortcuts = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { shortcuts } = useShortcuts();

  const iconColorValue = iconColor || theme.colors.primary;

  // Close suggestions when clicking outside
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsFocused(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  const renderSuggestionItem = ({ item }: { item: LocationSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        onSelectLocation(item);
        setIsFocused(false);
      }}
      activeOpacity={0.7}
    >
      <MaterialIcons name="place" size={20} color={theme.colors.textLight} />
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.suggestionTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.suggestionAddress} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        <MaterialIcons name={iconName} size={20} color={iconColorValue} />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textLight}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          autoCapitalize="none"
        />

        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <View style={styles.rightIconsContainer}>
            {value.length > 0 && onClear && (
              <TouchableOpacity onPress={onClear} style={styles.iconButton}>
                <MaterialIcons name="clear" size={18} color={theme.colors.textLight} />
              </TouchableOpacity>
            )}

            {onPressMap && (
              <TouchableOpacity
                onPress={() => {
                  onPressMap();
                  setIsFocused(false);
                }}
                style={styles.iconButton}
              >
                <MaterialIcons name="map" size={18} color={theme.colors.secondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {isFocused && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestionItem}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.suggestionsList}
          />
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: ThemeType) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    position: 'relative',
    zIndex: 1,
  },
  label: {
    ...theme.textStyles.bodySmall,
    fontWeight: '500',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary,
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.textDark,
  },
  rightIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  errorText: {
    ...theme.textStyles.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
    maxHeight: 200,
    ...theme.shadows.base,
    zIndex: 2,
  },
  suggestionsList: {
    borderRadius: theme.borderRadius.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  suggestionTitle: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  suggestionAddress: {
    ...theme.textStyles.caption,
    color: theme.colors.textLight,
  },
  shortcutsContainer: {
    marginTop: theme.spacing.sm,
  },
  shortcutsList: {
    paddingHorizontal: 2,
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight, // Ensure this exists in your theme, or use a fallback like '#e3f2fd'
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  shortcutText: {
    ...theme.textStyles.caption,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});

export default LocationSearchBox;