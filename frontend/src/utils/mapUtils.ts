import polyline from 'polyline';

export interface Coordinate {
    latitude: number;
    longitude: number;
}

export const decodePolyline = (encoded: string): Coordinate[] => {
    if (!encoded) return [];
    try {
        const points = polyline.decode(encoded);
        return points.map(point => ({
            latitude: point[0],
            longitude: point[1]
        }));
    } catch (error) {
        console.warn('Failed to decode polyline:', error);
        return [];
    }
};

export const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(coord2.latitude - coord1.latitude);
    const dLon = deg2rad(coord2.longitude - coord1.longitude);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(coord1.latitude)) * Math.cos(deg2rad(coord2.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

export const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
};

export const calculateETA = (distanceKm: number, averageSpeedKmH: number = 40): number => {
    const timeHours = distanceKm / averageSpeedKmH;
    return Math.ceil(timeHours * 60); // Return in minutes
};
