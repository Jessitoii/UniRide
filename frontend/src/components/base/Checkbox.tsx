import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { lightTheme, darkTheme, ThemeType } from '@/styles/theme';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  checkboxStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  error?: string;
  size?: 'small' | 'medium' | 'large';
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  containerStyle,
  checkboxStyle,
  labelStyle,
  error,
  size = 'medium',
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          box: styles.smallBox,
          icon: 16,
        };
      case 'large':
        return {
          box: styles.largeBox,
          icon: 24,
        };
      case 'medium':
      default:
        return {
          box: styles.mediumBox,
          icon: 20,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => !disabled && onChange(!checked)}
        style={styles.touchableArea}
        disabled={disabled}
      >
        <View
          style={[
            styles.checkbox,
            sizeStyles.box,
            checked ? styles.checkedBox : styles.uncheckedBox,
            disabled && (checked ? styles.checkedDisabled : styles.uncheckedDisabled),
            checkboxStyle,
          ]}
        >
          {checked && (
            <MaterialIcons
              name="check"
              size={sizeStyles.icon}
              color={disabled ? theme.colors.textLight : theme.colors.white}
            />
          )}
        </View>
        {label && (
          <Text
            style={[
              styles.label,
              disabled && styles.disabledLabel,
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// Radio button component that uses similar styling
interface RadioButtonProps {
  selected: boolean;
  onChange: (selected: boolean) => void;
  label?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  radioStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  error?: string;
  size?: 'small' | 'medium' | 'large';
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  selected,
  onChange,
  label,
  disabled = false,
  containerStyle,
  radioStyle,
  labelStyle,
  error,
  size = 'medium',
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          radio: styles.smallRadio,
          dot: styles.smallDot,
        };
      case 'large':
        return {
          radio: styles.largeRadio,
          dot: styles.largeDot,
        };
      case 'medium':
      default:
        return {
          radio: styles.mediumRadio,
          dot: styles.mediumDot,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => !disabled && onChange(!selected)}
        style={styles.touchableArea}
        disabled={disabled}
      >
        <View
          style={[
            styles.radio,
            sizeStyles.radio,
            selected ? styles.selectedRadio : styles.unselectedRadio,
            disabled && (selected ? styles.selectedDisabled : styles.unselectedDisabled),
            radioStyle,
          ]}
        >
          {selected && (
            <View
              style={[
                styles.radioDot,
                sizeStyles.dot,
                disabled && styles.disabledDot,
              ]}
            />
          )}
        </View>
        {label && (
          <Text
            style={[
              styles.label,
              disabled && styles.disabledLabel,
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const createStyles = (theme: ThemeType) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  touchableArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: theme.borderRadius.sm,
  },
  smallBox: {
    width: 18,
    height: 18,
  },
  mediumBox: {
    width: 22,
    height: 22,
  },
  largeBox: {
    width: 28,
    height: 28,
  },
  checkedBox: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  uncheckedBox: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.divider,
  },
  checkedDisabled: {
    backgroundColor: theme.colors.primary + '60',
    borderColor: theme.colors.primary + '60',
  },
  uncheckedDisabled: {
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.divider + '40',
  },
  label: {
    ...theme.textStyles.body,
    marginLeft: theme.spacing.sm,
    color: theme.colors.textDark,
  },
  disabledLabel: {
    color: theme.colors.textLight,
  },
  errorText: {
    ...theme.textStyles.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.lg,
  },
  // Radio styles
  radio: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 999,
  },
  smallRadio: {
    width: 18,
    height: 18,
  },
  mediumRadio: {
    width: 22,
    height: 22,
  },
  largeRadio: {
    width: 28,
    height: 28,
  },
  selectedRadio: {
    borderColor: theme.colors.primary,
  },
  unselectedRadio: {
    borderColor: theme.colors.divider,
  },
  selectedDisabled: {
    borderColor: theme.colors.primary + '60',
  },
  unselectedDisabled: {
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.divider + '40',
  },
  radioDot: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
  },
  smallDot: {
    width: 8,
    height: 8,
  },
  mediumDot: {
    width: 12,
    height: 12,
  },
  largeDot: {
    width: 16,
    height: 16,
  },
  disabledDot: {
    backgroundColor: theme.colors.primary + '60',
  },
});

export default Checkbox; 