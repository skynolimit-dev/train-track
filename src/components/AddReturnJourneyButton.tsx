import { Storage } from '@ionic/storage';
import { useEffect, useState } from 'react';
import { IonButton, IonCol, IonRow } from '@ionic/react';

interface ContainerProps {
    from: string;
    to: string;
    editMode?: boolean;
}

const AddReturnJourneyButton: React.FC<ContainerProps> = ({ from, to, editMode }) => {

    const [showButton, setShowButton] = useState(false);

    async function addReturnJourney(from: string, to: string) {
        console.log('Adding return journey', to, from);
        const store = new Storage();
        await store.create();
        let journeys = await store.get('journeys');
        journeys.push({ from: to, to: from });
        await store.set('journeys', journeys);
        window.location.href = '/home';
    }

    async function init() {
        
        // If there's an existing journey from the origin to the destination, hide the button
        const store = new Storage();
        await store.create();
        let journeys = await store.get('journeys');
        const journeyExists = journeys.some((journey: any) => journey.to === from && journey.from === to);

        // Only if the return journey doesn't already exist, show the button
        if (!journeyExists)
            setShowButton(true);
    }

    useEffect(() => {
    //     console.log('Use effect - add return journey', editMode);
        init();
    }, [editMode]);


    if (editMode && showButton) {
        return (
            <IonRow>
                <IonCol className='ion-text-center'>
                    <IonButton color='secondary' expand='block' className='ion-margin-top' onClick={() => addReturnJourney(from, to)}>Add return journey</IonButton>
                </IonCol>
            </IonRow>
        )
    }
}

export default AddReturnJourneyButton;
