import { IonIcon, IonInput, IonItem, IonList, useIonViewDidEnter } from "@ionic/react";
import { search } from "ionicons/icons";
import { useRef } from "react";
import _ from 'lodash';
import { useEffect, useState } from "react";
import { getStations } from "../lib/stations";
import './StationPicker.css';
import StationPickerList from "./StationPickerList";

interface ContainerProps {
    title: string;
    selectStation: Function;
    clearSelection: Function;
    selectedStation: { crs: string, name: string } | null;
    shouldFocus: boolean;
}

const StationPicker: React.FC<ContainerProps> = ({ shouldFocus, title, selectStation, clearSelection, selectedStation }) => {

    const [stations, setStations] = useState<{ crs: string, name: string }[]>(getStations());
    const [filteredStations, setFilteredStations] = useState<{ crs: string, name: string }[]>([]);

    const input = useRef<HTMLIonInputElement>(null);

    useIonViewDidEnter(() => {
        if (shouldFocus)
           input.current?.setFocus();
      });

    function handleInput(search: string | null | undefined) {
        if (search && search.length >= 3) {
            // console.log('Handle input', search);
            clearSelection();

            let stationsFound = stations.filter((station) => {
                return station.name.toLowerCase().includes(search.toLowerCase()) || station.crs.toLowerCase().includes(search.toLowerCase());
            });
            stationsFound = _.orderBy(stationsFound, ['name'], ['asc']);

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
                        <IonInput ref={input} labelPlacement="stacked" label={label} counter={true} maxlength={200} counterFormatter={(inputLength, maxLength) => getInputCounterMessage(inputLength)} onIonInput={(ev) => handleInput(ev.detail.value)}>
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
                        <IonInput value={selectedStation.name} labelPlacement="stacked" label={label} counter={true} maxlength={100} counterFormatter={(inputLength, maxLength) => getInputCounterMessage(inputLength)} onIonInput={(ev) => handleInput(ev.detail.value)}>
                            <IonIcon slot="start" icon={search} aria-hidden="true"></IonIcon>
                        </IonInput>
                    </IonItem>
                </IonList>
            )
        }
    }

    // Show the station picker list unless a station has been selected
    function showStationOptions() {
        if (!selectedStation || !selectedStation.crs) {
            return (
                <StationPickerList stations={filteredStations} selectStation={selectStation} />
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