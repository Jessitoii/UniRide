export interface LocationResult {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    boundingbox: string[];
    lat: string;
    lon: string;
    display_name: string;
    class: string;
    type: string;
    importance: number;
}

export const searchAddress = async (query: string): Promise<LocationResult[]> => {
    if (!query || query.length < 3) return [];
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                query
            )}&format=json&addressdetails=1&limit=5`,
            {
                headers: {
                    'User-Agent': 'KampusRoute/1.0',
                },
            }
        );
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error searching address:', error);
        return [];
    }
};

export const getAddressFromCoords = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'KampusRoute/1.0',
                },
            }
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.display_name || null;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
};
