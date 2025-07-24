import { IonButton, IonCol, IonIcon, IonRow } from '@ionic/react';
import { star, starOutline } from 'ionicons/icons';
import { toggleJourneyFavorite } from '../lib/user';

interface ContainerProps {
    from: string;
    to: string;
    editMode?: boolean;
    isFavorite?: boolean;
    onToggle?: () => void;
}

const ToggleFavoriteButton: React.FC<ContainerProps> = ({ from, to, editMode, isFavorite = false, onToggle }) => {

    async function handleToggleFavorite() {
        console.info('Toggling favorite for journey', from, to);
        await toggleJourneyFavorite(from, to);
        if (onToggle) {
            onToggle();
        }
    }

    if (editMode) {
        return (
            <IonRow>
                <IonCol className='ion-text-center'>
                    <IonButton 
                        color={isFavorite ? 'warning' : 'medium'} 
                        expand='block' 
                        className='ion-margin-top' 
                        onClick={handleToggleFavorite}
                    >
                        <IonIcon icon={isFavorite ? star : starOutline} slot="start" />
                        {isFavorite ? 'Remove from Favorites' : 'Mark as Favourite'}
                    </IonButton>
                </IonCol>
            </IonRow>
        )
    }
    
    return null;
}

export default ToggleFavoriteButton; 