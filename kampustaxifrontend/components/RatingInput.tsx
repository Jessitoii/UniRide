import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  useColorScheme 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { lightTheme, darkTheme, ThemeType } from '../styles/theme';

interface RatingInputProps {
  initialRating?: number;
  maxRating?: number;
  onRatingChange: (rating: number) => void;
  label?: string;
  showFeedback?: boolean;
  feedbackLabel?: string;
  feedbackPlaceholder?: string;
  onFeedbackChange?: (feedback: string) => void;
  feedbackRequired?: boolean;
  disabled?: boolean;
  starSize?: number;
  starColor?: string;
  emptyStarColor?: string;
  style?: any;
}

const RatingInput: React.FC<RatingInputProps> = ({
  initialRating = 0,
  maxRating = 5,
  onRatingChange,
  label = 'Rate your experience',
  showFeedback = false,
  feedbackLabel = 'Leave your feedback',
  feedbackPlaceholder = 'Tell us about your experience',
  onFeedbackChange,
  feedbackRequired = false,
  disabled = false,
  starSize = 36,
  starColor,
  emptyStarColor,
  style,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [feedback, setFeedback] = useState('');
  const [isFeedbackFocused, setIsFeedbackFocused] = useState(false);
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  
  const activeStarColor = starColor || theme.colors.warning;
  const inactiveStarColor = emptyStarColor || theme.colors.divider;
  
  const handleRatingPress = (newRating: number) => {
    if (disabled) return;
    
    setRating(newRating);
    onRatingChange(newRating);
  };
  
  const handleFeedbackChange = (text: string) => {
    setFeedback(text);
    if (onFeedbackChange) {
      onFeedbackChange(text);
    }
  };
  
  return (
    <View style={[styles(theme).container, style]}>
      {label && <Text style={styles(theme).label}>{label}</Text>}
      
      <View style={styles(theme).starsContainer}>
        {Array.from({ length: maxRating }).map((_, index) => {
          const starValue = index + 1;
          const isActive = starValue <= rating;
          
          return (
            <TouchableOpacity
              key={`star-${index}`}
              onPress={() => handleRatingPress(starValue)}
              disabled={disabled}
              style={styles(theme).starButton}
              activeOpacity={0.7}
            >
              <FontAwesome
                name={isActive ? 'star' : 'star-o'}
                size={starSize}
                color={isActive ? activeStarColor : inactiveStarColor}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      
      <View style={styles(theme).ratingTextContainer}>
        <Text style={styles(theme).ratingText}>
          {getRatingDescription(rating)}
        </Text>
      </View>
      
      {showFeedback && (
        <View style={styles(theme).feedbackContainer}>
          {feedbackLabel && (
            <Text style={styles(theme).feedbackLabel}>
              {feedbackLabel}
              {feedbackRequired && <Text style={styles(theme).required}> *</Text>}
            </Text>
          )}
          
          <TextInput
            style={[
              styles(theme).feedbackInput,
              isFeedbackFocused && styles(theme).feedbackInputFocused,
            ]}
            placeholder={feedbackPlaceholder}
            placeholderTextColor={theme.colors.textLight}
            value={feedback}
            onChangeText={handleFeedbackChange}
            onFocus={() => setIsFeedbackFocused(true)}
            onBlur={() => setIsFeedbackFocused(false)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!disabled}
          />
        </View>
      )}
    </View>
  );
};

const getRatingDescription = (rating: number): string => {
  switch (rating) {
    case 0:
      return '';
    case 1:
      return 'Poor';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Very Good';
    case 5:
      return 'Excellent';
    default:
      return '';
  }
};

const styles = (theme: ThemeType) => {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    label: {
      ...theme.textStyles.body,
      color: theme.colors.textDark,
      marginBottom: theme.spacing.sm,
    },
    starsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    starButton: {
      padding: theme.spacing.xs,
    },
    ratingTextContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    ratingText: {
      ...theme.textStyles.bodySmall,
      color: theme.colors.textDark,
      fontWeight: '500',
    },
    feedbackContainer: {
      marginTop: theme.spacing.sm,
    },
    feedbackLabel: {
      ...theme.textStyles.bodySmall,
      color: theme.colors.textDark,
      marginBottom: theme.spacing.xs,
    },
    required: {
      color: theme.colors.error,
    },
    feedbackInput: {
      borderWidth: 1,
      borderColor: theme.colors.divider,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
      minHeight: 100,
      ...theme.textStyles.body,
      color: theme.colors.textDark,
      backgroundColor: theme.colors.card,
    },
    feedbackInputFocused: {
      borderColor: theme.colors.primary,
    },
  });
};

export default RatingInput;