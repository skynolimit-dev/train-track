import { Storage } from '@ionic/storage';
import { useEffect } from 'react';

import { IonButton, IonCol, IonRow } from '@ionic/react';


interface ContainerProps {
    from: string;
    to: string;
    editMode?: boolean;
}

const DeleteJourneyButton: React.FC<ContainerProps> = ({ from, to, editMode }) => {

    async function deleteJourney(from: string, to: string) {
        console.log('Deleting journey', from, to);
        const store = new Storage();
        await store.create();
        const journeys = await store.get('journeys');
        const updatedJourneys = journeys.filter((journey: any) => journey.from !== from || journey.to !== to);
        await store.set('journeys', updatedJourneys);
        window.location.href = '/home';
    }

    useEffect(() => {
        // console.log('Use effect - delete journey', editMode);
    }, [editMode]);


    if (editMode) {
        return (
            <IonRow>
                <IonCol className='ion-text-center'>
                    <IonButton color='danger' expand='block' className='ion-margin-top' onClick={() => deleteJourney(from, to)}>Delete</IonButton>
                </IonCol>
            </IonRow>
        )
    }
}

export default DeleteJourneyButton;
