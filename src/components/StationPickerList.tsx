import { IonItem, IonRadio, IonRadioGroup } from "@ionic/react";
import { useEffect } from "react";
import { getDistanceMiles } from "../lib/stations";

interface ContainerProps {
    stations: any[];
    selectStation: Function;
    userLocation?: { latitude: number, longitude: number } | null;
    searchTerm?: string;
}

const StationPickerList: React.FC<ContainerProps> = ({ stations, selectStation, userLocation, searchTerm }) => {
    function renderStationLabel(station: any) {
        if (userLocation && station.latitude && station.longitude) {
            const dist = getDistanceMiles(
                parseFloat(station.latitude),
                parseFloat(station.longitude),
                userLocation.latitude,
                userLocation.longitude
            );
            return `${station.name} (${dist.toFixed(1)} mi)`;
        } else {
            return station.name;
        }
    }

    if (stations && stations.length > 0) {
        return (
            <IonItem>
                <IonRadioGroup 
                    key={`station-group-${searchTerm}`}
                    onIonChange={(ev) => selectStation(ev.detail.value)} 
                    className='ion-padding'
                >
                    {stations.map((station) => {
                        const label = renderStationLabel(station);
                        return (
                            <IonRadio 
                                key={`${station.crs}-${station.name}`} 
                                value={station} 
                                labelPlacement="start"
                                aria-label={label}
                            >
                                {label}
                            </IonRadio>
                        );
                    })}
                </IonRadioGroup>
            </IonItem>
        );
    }
    // Show a message if no stations are found and the user has typed at least 3 characters
    if (searchTerm && searchTerm.length >= 3) {
        return (
            <IonItem>
                <div style={{ width: '100%', textAlign: 'center', color: 'gray', padding: '1em' }}>
                    No stations found. Please check your search.
                </div>
            </IonItem>
        );
    }
    // Otherwise, show nothing
    return null;
};

export default StationPickerList;