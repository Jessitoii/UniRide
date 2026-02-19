import { Tabs, useRouter, useNavigation } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DrawerActions } from '@react-navigation/native';
import { useNotifications as useNotificationsContext } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
    const { unreadCount } = useNotificationsContext();
    const { theme } = useTheme();
    const { t } = useTranslation();

    const router = useRouter();
    const navigation = useNavigation();

    return (
        <Tabs screenOptions={{
            headerShown: true, // Enable header for Tabs
            headerTitleAlign: 'center',
            headerStyle: {
                backgroundColor: theme.colors.card,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
                ...theme.shadows.sm,
                elevation: 0, // Remove default Android shadow
            },
            headerTitleStyle: {
                ...theme.textStyles.header3,
                color: theme.colors.textDark,
            },
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                    style={{ paddingLeft: theme.spacing.md }}
                >
                    <MaterialIcons name="menu" size={28} color={theme.colors.primary} />
                </TouchableOpacity>
            ),
            headerRight: () => <View style={{ width: 44 }} />, // Balance the left icon
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textLight,
            tabBarStyle: {
                backgroundColor: theme.colors.card,
                borderTopColor: theme.colors.border,
                ...theme.shadows.base,
            },
            tabBarLabelStyle: {
                ...theme.textStyles.caption,
                fontWeight: '600',
            }
        }}>
            <Tabs.Screen
                name="PassengerScreen"
                options={{
                    title: t('passenger_screen'),
                    tabBarLabel: t('passenger_screen'),
                    tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="PostScreen"
                options={{
                    title: t('post_screen'),
                    tabBarLabel: t('post_screen'),
                    tabBarIcon: ({ color }) => <MaterialIcons name="add-circle-outline" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: t('messages'), // Ensure 'messages' key exists in translation or fallback
                    tabBarLabel: t('messages'),
                    tabBarIcon: ({ color }) => <MaterialIcons name="chat-bubble-outline" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="TravelsScreen"
                options={{
                    title: t('my_travels'),
                    tabBarLabel: () => t('post_screen'),
                    tabBarAccessibilityLabel: t('my_travels'),
                    tabBarIcon: ({ color }) => (
                        <View style={{ alignItems: 'center', justifyContent: 'center', top: 5 }}>
                            <MaterialIcons name="card-travel" size={24} color={color} />
                            {unreadCount > 0 && (
                                <View style={styles(theme).tabBadge}>
                                    <Text style={styles(theme).tabBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = (theme: ThemeType) => StyleSheet.create({
    tabBadge: {
        position: 'absolute',
        top: -5,
        right: -10,
        backgroundColor: theme.colors.error || '#ff3b30',
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    tabBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
