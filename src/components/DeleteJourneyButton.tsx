import { getPreferenceJson, setPreferenceJson } from '../lib/preferences';
import { useEffect, useState } from 'react';
import { IonButton, IonCol, IonRow, IonAlert, IonIcon } from '@ionic/react';
import { trash } from 'ionicons/icons';
import { getStationNameFromCrs } from '../lib/stations';
import { hasReturnLeg } from '../lib/user';

interface ContainerProps {
    from: string;
    to: string;
    editMode?: boolean;
}

const DeleteJourneyButton: React.FC<ContainerProps> = ({ from, to, editMode }) => {
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [returnLegExists, setReturnLegExists] = useState(false);

    async function deleteJourney(deleteBoth: boolean = false) {
        console.info('Deleting journey', from, to, deleteBoth);
        const journeys = await getPreferenceJson('journeys') || [];
        
        if (deleteBoth) {
            // Delete both this journey and its return leg
            const updatedJourneys = journeys.filter((journey: any) => 
                !((journey.from === from && journey.to === to) || 
                  (journey.from === to && journey.to === from))
            );
            await setPreferenceJson('journeys', updatedJourneys);
        } else {
            // Delete only this journey
            const updatedJourneys = journeys.filter((journey: any) => 
                !(journey.from === from && journey.to === to)
            );
            await setPreferenceJson('journeys', updatedJourneys);
        }
        
        window.dispatchEvent(new CustomEvent('journeysChanged'));
        window.location.reload();
    }

    useEffect(() => {
        // Check for return leg on mount
        (async () => {
            if (from && to) {
                setReturnLegExists(await hasReturnLeg(from, to));
            }
        })();
    }, [from, to]);

    const handleDelete = (deleteBoth: boolean) => {
        deleteJourney(deleteBoth);
        setShowDeleteAlert(false);
    };

    if (editMode) {
        return (
            <>
                <IonRow>
                    <IonCol className='ion-text-center'>
                        <IonButton 
                            color='danger' 
                            expand='block' 
                            className='ion-margin-top' 
                            onClick={() => setShowDeleteAlert(true)}
                        >
                            <IonIcon icon={trash} slot="start"></IonIcon>
                            Delete
                        </IonButton>
                    </IonCol>
                </IonRow>
                
                {/* Delete confirmation alert */}
                <IonAlert
                    isOpen={showDeleteAlert}
                    onDidDismiss={() => setShowDeleteAlert(false)}
                    header="Delete Journey"
                    message={`Are you sure you want to delete "${getStationNameFromCrs(from)}${to ? ` to ${getStationNameFromCrs(to)}` : ''}"?${returnLegExists ? ' This journey has a return leg.' : ''}`}
                    buttons={[
                        ...(returnLegExists ? [{
                            text: 'Delete both journeys',
                            role: 'destructive',
                            handler: () => handleDelete(true)
                        }] : []),
                        {
                            text: 'Delete this journey only',
                            handler: () => handleDelete(false)
                        },
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            handler: () => setShowDeleteAlert(false)
                        }
                    ]}
                />
            </>
        )
    }
}

export default DeleteJourneyButton;
