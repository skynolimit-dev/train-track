
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
import { getStationNameFromCrs } from '../lib/stations';
import DeleteJourneyButton from './DeleteJourneyButton';
import AddReturnJourneyButton from './AddReturnJourneyButton';

import './Departures.css';


interface ContainerProps {
  from: string;
  to: string;
  editMode?: boolean;
}

const NoDeparturesFound: React.FC<ContainerProps> = ({ from, to, editMode }) => {
    return (
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
            {getStationNameFromCrs(from)} to {getStationNameFromCrs(to)}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>No direct trains found for today yet, but we'll keep on looking...</p>
          {DeleteJourneyButton({ from, to, editMode })}
          {AddReturnJourneyButton({ from, to, editMode })}
        </IonCardContent>
      </IonCard>
    )
}

export default NoDeparturesFound;
