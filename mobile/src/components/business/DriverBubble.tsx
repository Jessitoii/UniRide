import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar } from '@/components/base/Avatar';

interface DriverBubbleProps {
    driver: {
        id: string;
        latitude: number;
        longitude: number;
        name: string;
        hasCustomPhoto: boolean;
    };
    onPress: () => void;
}

export const DriverBubble: React.FC<DriverBubbleProps> = ({ driver, onPress }) => {
    const { theme } = useTheme();

    return (
        <Marker
            coordinate={{ latitude: driver.latitude, longitude: driver.longitude }}
            onPress={onPress}
            tracksViewChanges={false} // Optimization
        >
            <View style={styles.bubbleContainer}>
                <View style={styles.avatarWrapper}>
                    <Avatar user={{ id: driver.id, hasCustomPhoto: driver.hasCustomPhoto }} size={40} />
                    <View style={styles.activeIndicator} />
                </View>
            </View>

            <Callout tooltip>
                <View style={styles.calloutContainer}>
                    <Text style={styles.driverName}>{driver.name}</Text>
                    <View style={styles.arrow} />
                </View>
            </Callout>
        </Marker>
    );
};

const styles = StyleSheet.create({
    bubbleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarWrapper: {
        padding: 2,
        backgroundColor: 'white',
        borderRadius: 22,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50', // Green for active
        borderWidth: 2,
        borderColor: 'white',
    },
    calloutContainer: {
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 8,
        marginBottom: 5,
        width: 100,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    driverName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    arrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 5,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: 'white',
        alignSelf: 'center',
        marginTop: -1, // Overlap slightly to look connected
    }
});
