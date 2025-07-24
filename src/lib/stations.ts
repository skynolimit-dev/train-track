// Read ../resources/stations.json
import stations from '../resources/stations.json';

// Calculate distance in miles between two lat/lon points using the Haversine formula
export function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => value * Math.PI / 180;
    const R = 3958.8; // Radius of Earth in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Get stations, optionally filtered by distance from a location
export function getStations(options?: { location?: { latitude: number, longitude: number }, maxMiles?: number }) {
    if (!options || !options.location || !options.maxMiles || options.maxMiles <= 0) {
        return stations;
    }
    const { latitude, longitude } = options.location;
    const maxMiles = options.maxMiles ?? 3;
    return stations.filter(station => {
        if (!station.latitude || !station.longitude) return false;
        const dist = getDistanceMiles(
            parseFloat(station.latitude),
            parseFloat(station.longitude),
            latitude,
            longitude
        );
        return dist <= maxMiles;
    });
}

export function getStationNameFromCrs(crs: string) {
    return stations.find(station => station.crs === crs)?.name;
}

export function getStationCoordinatesFromCrs(crs: string) {
    const station = stations.find(station => station.crs === crs);
    if (station) {
        return {
            latitude: station.latitude,
            longitude: station.longitude
        };
    }
}

export function getStationCrsFromName(name: string) {
    return stations.find(station => station.name === name)?.crs;
}

// Generate a consistent color for a platform number
export function getPlatformColor(platform: string): string {
    if (!platform || platform === 'TBC' || platform === 'BUS') {
        return '#121212'; // Default dark color
    }
    
    // Extract numeric part from platform (e.g., "1A" -> "1", "12B" -> "12")
    const numericPart = platform.replace(/[^0-9]/g, '');
    if (!numericPart) {
        return '#121212'; // Default if no numeric part
    }
    
    const platformNumber = parseInt(numericPart, 10);
    
    // Define a palette of distinct colors
    const colors = [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#45B7D1', // Blue
        '#96CEB4', // Green
        '#FFEAA7', // Yellow
        '#DDA0DD', // Plum
        '#98D8C8', // Mint
        '#F7DC6F', // Gold
        '#BB8FCE', // Purple
        '#85C1E9', // Light Blue
        '#F8C471', // Orange
        '#82E0AA', // Light Green
        '#F1948A', // Salmon
        '#85C1E9', // Sky Blue
        '#F7DC6F', // Yellow
        '#D7BDE2', // Lavender
        '#A9DFBF', // Light Mint
        '#FAD7A0', // Peach
        '#AED6F1', // Baby Blue
        '#F9E79F', // Light Yellow
    ];
    
    // Use modulo to cycle through colors
    return colors[platformNumber % colors.length];
}