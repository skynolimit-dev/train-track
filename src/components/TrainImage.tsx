
import { IonImg } from '@ionic/react';
import './TrainImage.css';

const TrainImage: React.FC = () => {
    const imagePath = `assets/images/trains/train.jpg`; 
    return (
        <div className='ion-padding'>
            <IonImg src={imagePath} className='train-image' />
        </div>
    )
}

export default TrainImage;
