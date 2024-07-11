
import { IonPage, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonButton } from '@ionic/react';
import TrainImage from '../components/TrainImage';
import { App } from '@capacitor/app';
import { useEffect, useState } from 'react';

import './About.css';

const About: React.FC = () => {

  const [versionInfo, setVersionInfo] = useState('');

  async function populateVersionInfo() {
      const appInfo = await App.getInfo();
      if (appInfo && appInfo.version) {
          setVersionInfo(appInfo.version);
      }
  }

  useEffect(() => {
      populateVersionInfo();
  }, [versionInfo]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>About</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">About</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              TrainTrack
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <TrainImage />
            <p className='ion-text-center'>Version: {versionInfo}</p>
            <p className='ion-text-center'>By Mike Wagstaff, <a href='https://skynolimit.dev/' target="_blank">Sky No Limit</a></p>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Widget
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>A <a href='https://itunes.apple.com/us/app/scriptable/id1405459188?mt=12'>Scriptable</a> based home screen widget is available.</p>
            <IonButton className='ion-padding-top ion-padding-bottom' expand='block' href='https://github.com/mwagstaff/scriptable/tree/main/train-track' target='_blank'>Download &amp; setup instructions</IonButton>
            <img className='widget-image' src='https://raw.githubusercontent.com/mwagstaff/scriptable/main/train-track/screenshot.jpg' alt='Widget screenshot' />
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Acknowledgements
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <ul>
              <li>Train times data supplied with thanks by <a href='https://www.realtimetrains.co.uk/' target='_blank'>RealTime Trains</a></li>
              <li>Station data courtesy of <a href='http://www.railwaycodes.org.uk/' target='_blank'>Railway Codes</a></li>
              <li>Image courtesy of <a href='https://unsplash.com/' target='_blank'>Unsplash</a></li>
            </ul>
          </IonCardContent>
        </IonCard>

      </IonContent>
    </IonPage>
  );
}

export default About;
