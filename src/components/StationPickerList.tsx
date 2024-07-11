import { IonItem, IonRadio, IonRadioGroup } from "@ionic/react";
import { useEffect } from "react";

interface ContainerProps {
    stations: any[];
    selectStation: Function;
}

const StationPickerList: React.FC<ContainerProps> = ({ stations, selectStation }) => {

    if (stations && stations.length > 0) {
        return (
            <IonItem>
                <IonRadioGroup onIonChange={(ev) => selectStation(ev.detail.value)} className='ion-padding'>
                    {stations.map((station, index) => {
                        return (
                            <IonRadio key={index} value={station} labelPlacement="start">{station.name}</IonRadio>
                        );
                    })}
                </IonRadioGroup>
            </IonItem>
        );
    }
};

export default StationPickerList;