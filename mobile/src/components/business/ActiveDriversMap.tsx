import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '@/contexts/ThemeContext';
import { DriverBubble } from './DriverBubble';
import { BASE_URL } from '@/env';
import { getMapStyle } from '@/styles/mapStyle';

interface ActiveDriversMapProps {
    initialRegion?: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
    onDriverPress?: (driverId: string) => void;
}

export const ActiveDriversMap: React.FC<ActiveDriversMapProps> = ({ initialRegion, onDriverPress }) => {
    const { theme, isDark } = useTheme();
    const [drivers, setDrivers] = useState<any[]>([]);

    const fetchActiveDrivers = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/drivers/active-map`);
            if (response.ok) {
                const data = await response.json();
                setDrivers(data);
            }
        } catch (error) {
            console.error('Error fetching active drivers:', error);
        }
    };

    useEffect(() => {
        fetchActiveDrivers();
        const interval = setInterval(fetchActiveDrivers, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                customMapStyle={getMapStyle(theme)}
                initialRegion={initialRegion || {
                    latitude: 41.0082,
                    longitude: 28.9784,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                showsUserLocation={true}
                showsMyLocationButton={false} // We can implement custom one
            >
                {drivers.map((driver) => (
                    <DriverBubble
                        key={driver.postId || driver.id}
                        driver={driver}
                        onPress={() => onDriverPress && onDriverPress(driver.id)}
                    />
                ))}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
        borderRadius: 20,
    },
    map: {
        width: '100%',
        height: '100%',
    },
});
