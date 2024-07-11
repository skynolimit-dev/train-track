// Read ../resources/stations.json
import stations from '../resources/stations.json';

export function getStations() {
    return stations;
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