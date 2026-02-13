import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNotifications } from '../../../../src/contexts/NotificationContext'; // Adjust path if needed, assuming src is at root
// Actually src is at root, so from app/(drawer)/(tabs) it is ../../../src
// Wait, app is at root of kampustaxifrontend. src is at root of kampustaxifrontend.
// So path is ../../../src

import { useNotifications as useNotificationsContext } from '@/contexts/NotificationContext';
// Better use alias @ if available. internal files used relative paths.
// app/_layout.tsx used '../contexts/NotificationContext'. 
// So from app/(drawer)/(tabs), it is '../../../contexts/NotificationContext' if contexts is in default root?
// Wait, `app/_layout.tsx` import line 35: `import { ... } from '../contexts/NotificationContext';`
// This implies `contexts` is at `kampustaxifrontend/contexts`. 
// So path from `app/(drawer)/(tabs)` is `../../../contexts/NotificationContext`.

export default function TabLayout() {
    const { unreadCount } = useNotificationsContext();

    return (
        <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#4b39ef', tabBarInactiveTintColor: 'gray' }}>
            <Tabs.Screen
                name="PassengerScreen"
                options={{
                    title: 'Yolculuklar',
                    tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="PostScreen"
                options={{
                    title: 'Paylaş',
                    tabBarIcon: ({ color }) => <MaterialIcons name="add-circle-outline" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="TravelsScreen"
                options={{
                    title: 'Seyehatlerim',
                    tabBarIcon: ({ color }) => (
                        <View>
                            <MaterialIcons name="card-travel" size={24} color={color} />
                            {unreadCount > 0 && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />
            {/* Hide other screens that act as stack screens inside tabs but aren't tabs themselves if any */}

        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBadge: {
        position: 'absolute',
        top: -5,
        right: -10,
        backgroundColor: '#ff3b30',
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
