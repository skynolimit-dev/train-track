import { IonIcon, IonInput, IonItem, IonList, useIonViewDidEnter, IonButton } from "@ionic/react";
import { search, close } from "ionicons/icons";
import { useRef } from "react";
import _ from 'lodash';
import { useEffect, useState } from "react";
import { getStations } from "../lib/stations";
import './StationPicker.css';
import StationPickerList from "./StationPickerList";
import { getCurrentLocation } from "../lib/location";
import { getPreferenceNumber } from "../lib/preferences";

interface ContainerProps {
    title: string;
    selectStation: Function;
    clearSelection: Function;
    selectedStation: { crs: string, name: string } | null;
    shouldFocus: boolean;
    userLocation?: { latitude: number, longitude: number } | null;
}

const StationPicker: React.FC<ContainerProps> = ({ shouldFocus, title, selectStation, clearSelection, selectedStation, userLocation }) => {

    const [stations, setStations] = useState<{ crs: string, name: string }[]>([]);
    const [filteredStations, setFilteredStations] = useState<{ crs: string, name: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const input = useRef<HTMLIonInputElement>(null);

    useEffect(() => {
        let stationsList;
        if (userLocation) {
            stationsList = getStations({ location: userLocation });
        } else {
            stationsList = getStations();
        }
        setStations(stationsList);
    }, [userLocation]);

    useIonViewDidEnter(() => {
        if (shouldFocus)
           input.current?.setFocus();
      });

    function handleInput(search: string | null | undefined) {
        setSearchTerm(search || '');
        // Only clear selection if a station is currently selected
        if (search && search.length >= 3) {
            if (selectedStation && selectedStation.crs) {
                clearSelection();
            }

            let stationsFound = stations.filter((station) => {
                return station.name.toLowerCase().includes(search.toLowerCase()) || station.crs.toLowerCase().includes(search.toLowerCase());
            });
            stationsFound = _.orderBy(stationsFound, ['name'], ['asc']);

            // De-dupe by CRS
            stationsFound = _.uniqBy(stationsFound, 'crs');
            
            // Limit to 10 stations when searching to prevent DOM manipulation issues
            stationsFound = stationsFound.slice(0, 10);
            console.log('Stations found', stationsFound);

            setFilteredStations(stationsFound);
        }
        else
            setFilteredStations([]);
    }

    function getInputCounterMessage(inputLength: number) {
        if (inputLength < 3) {
            return 'Please enter at least 3 characters';
        } else {
            return '';
        }
    }

    // If no station has been selected, show the search bar
    function showStationSearch(label: string) {
        if (!selectedStation || !selectedStation.crs) {
            return (
                // <IonSearchbar placeholder="Enter a station..." debounce={500} onIonInput={(ev) => handleInput(ev)}></IonSearchbar>
                <IonList className='ion-margin-top ion-margin-bottom'>
                    <IonItem className='no-border'>
                        <IonInput
                            ref={input}
                            labelPlacement="stacked"
                            label={label}
                            counter={true}
                            maxlength={200}
                            counterFormatter={(inputLength, maxLength) => getInputCounterMessage(inputLength)}
                            onIonInput={(ev) => handleInput(ev.detail.value)}
                            aria-label={label === 'From' ? 'from' : label === 'To' ? 'to' : undefined}
                            id={label === 'From' ? 'from' : label === 'To' ? 'to' : undefined}
                        >
                            <IonIcon slot="start" icon={search} aria-hidden="true"></IonIcon>
                        </IonInput>
                    </IonItem>
                </IonList>
            )
        }
        else {
            return (  
                <IonList className='ion-margin-top ion-margin-bottom'>
                    <IonItem className='no-border'>
                        <IonInput
                            value={selectedStation.name}
                            labelPlacement="stacked"
                            label={label}
                            counter={true}
                            maxlength={100}
                            counterFormatter={(inputLength, maxLength) => getInputCounterMessage(inputLength)}
                            readonly
                            aria-label={label === 'From' ? 'from' : label === 'To' ? 'to' : undefined}
                            id={label === 'From' ? 'from' : label === 'To' ? 'to' : undefined}
                        >
                            <IonIcon slot="start" icon={search} aria-hidden="true"></IonIcon>
                        </IonInput>
                        <IonButton fill="clear" slot="end" onClick={() => clearSelection()} style={{ marginLeft: 8 }}>
                            <IonIcon icon={close} />
                        </IonButton>
                    </IonItem>
                </IonList>
            )
        }
    }

    // Show the station picker list unless a station has been selected
    function showStationOptions() {
        if (!selectedStation || !selectedStation.crs) {
            return (
                <StationPickerList stations={filteredStations} selectStation={selectStation} userLocation={userLocation} searchTerm={searchTerm} />
            )
        }
    }

    useEffect(() => {
        // console.log('Use effect - station picker', shouldFocus);
        if (shouldFocus) {
            console.log('Focusing on search input');
            input.current?.setFocus();
        }
        
        // console.log('Selected station', selectedStation);
    }, [filteredStations, selectedStation, shouldFocus]);

    return (
        <>
            {showStationSearch(title)}
            {showStationOptions()}
        </>
    );
};

export default StationPicker;