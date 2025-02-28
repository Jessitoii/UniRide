import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

type LocationCoords = Location.LocationObjectCoords | null;

export const useLocation = () => {
    const [location, setLocation] = useState<LocationCoords>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const currentLocation = await Location.getCurrentPositionAsync({});
                setLocation(currentLocation.coords);
            }
        })();
    }, []);

    return location;
}; 