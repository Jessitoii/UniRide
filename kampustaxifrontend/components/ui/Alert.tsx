import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { lightTheme, darkTheme, ThemeType } from '../../styles/theme';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  type: AlertType;
  message: string;
  title?: string;
  dismissable?: boolean;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const Alert: React.FC<AlertProps> = ({
  type,
  message,
  title,
  dismissable = false,
  onDismiss,
  style,
  action,
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle' as const,
          color: theme.colors.success,
          backgroundColor: theme.colors.success + '15',
          borderColor: theme.colors.success + '30',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: theme.colors.warning,
          backgroundColor: theme.colors.warning + '15',
          borderColor: theme.colors.warning + '30',
        };
      case 'error':
        return {
          icon: 'error' as const,
          color: theme.colors.error,
          backgroundColor: theme.colors.error + '15',
          borderColor: theme.colors.error + '30',
        };
      case 'info':
      default:
        return {
          icon: 'info' as const,
          color: theme.colors.primary,
          backgroundColor: theme.colors.primary + '15',
          borderColor: theme.colors.primary + '30',
        };
    }
  };

  const alertConfig = getAlertConfig();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: alertConfig.backgroundColor,
          borderColor: alertConfig.borderColor,
        },
        style,
      ]}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name={alertConfig.icon} size={24} color={alertConfig.color} />
      </View>

      <View style={styles.contentContainer}>
        {title && <Text style={[styles.title, { color: alertConfig.color }]}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
        
        {action && (
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: alertConfig.color }]} 
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionText, { color: alertConfig.color }]}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>

      {dismissable && onDismiss && (
        <TouchableOpacity style={styles.closeButton} onPress={onDismiss} activeOpacity={0.7}>
          <MaterialIcons name="close" size={16} color={theme.colors.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Toast alert for displaying temporary notifications
interface ToastAlertProps extends Omit<AlertProps, 'dismissable' | 'onDismiss'> {
  timeout?: number;
  onClose?: () => void;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({
  timeout = 3000,
  onClose,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, timeout);
    
    return () => clearTimeout(timer);
  }, [timeout, onClose]);

  return (
    <View style={styles.toastContainer}>
      <Alert 
        {...props} 
        dismissable={!!onClose}
        onDismiss={onClose}
        style={styles.toast}
      />
    </View>
  );
};

const createStyles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
    paddingTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    ...theme.textStyles.bodySmall,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  message: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
  },
  closeButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
  },
  actionText: {
    ...theme.textStyles.button,
    fontSize: 14,
  },
  toastContainer: {
    position: 'absolute',
    bottom: theme.spacing.xl + theme.spacing.lg,
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 9999,
  },
  toast: {
    ...theme.shadows.base,
  },
});

export default Alert; 