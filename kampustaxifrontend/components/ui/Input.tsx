import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { lightTheme, darkTheme, ThemeType } from '../../styles/theme';

interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  required?: boolean;
  secureTextToggle?: boolean;
  onClear?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  labelStyle,
  inputStyle,
  required = false,
  secureTextToggle = false,
  onClear,
  value,
  ...rest
}) => {
  const [secureTextEntry, setSecureTextEntry] = useState(
    rest.secureTextEntry || false
  );
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  const showClearButton = !!value && !!onClear;
  const showToggleButton = secureTextToggle && rest.secureTextEntry !== undefined;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          error ? styles.inputError : null,
          inputStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            (showClearButton || rightIcon || showToggleButton) 
              ? styles.inputWithRightIcon 
              : null,
          ]}
          placeholderTextColor={theme.colors.textLight}
          secureTextEntry={secureTextEntry}
          value={value}
          {...rest}
        />

        <View style={styles.rightIconContainer}>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          
          {showClearButton && (
            <TouchableOpacity style={styles.clearButton} onPress={onClear} activeOpacity={0.7}>
              <MaterialIcons 
                name="cancel" 
                size={16} 
                color={theme.colors.textLight} 
              />
            </TouchableOpacity>
          )}
          
          {showToggleButton && (
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setSecureTextEntry(!secureTextEntry)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={secureTextEntry ? 'visibility' : 'visibility-off'}
                size={20}
                color={theme.colors.textLight}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            error ? styles.errorText : styles.helperTextColor,
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const createStyles = (theme: ThemeType) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  labelContainer: {
    marginBottom: theme.spacing.xs,
    flexDirection: 'row',
  },
  label: {
    ...theme.textStyles.bodySmall,
    fontWeight: '500',
    color: theme.colors.textDark,
  },
  required: {
    color: theme.colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
    height: 48,
    overflow: 'hidden',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textDark,
    fontSize: 16,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIcon: {
    paddingLeft: theme.spacing.md,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightIcon: {
    paddingRight: theme.spacing.md,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  toggleButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  helperText: {
    marginTop: theme.spacing.xs,
    ...theme.textStyles.caption,
  },
  helperTextColor: {
    color: theme.colors.textLight,
  },
  errorText: {
    color: theme.colors.error,
  },
});

export default Input; 