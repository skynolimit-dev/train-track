import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, IonLabel, IonToggle, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonList, IonSelect, IonSelectOption, IonButton } from '@ionic/react';
import { useEffect, useState } from 'react';
import { informationCircle } from 'ionicons/icons';
import { Storage } from '@ionic/storage';
import './Preferences.css';

const Preferences: React.FC = () => {

  const [currentMaxDepartures, setCurrentMaxDepartures] = useState(0);

  async function init() {
    const store = new Storage();
    await store.create();
    const maxDepartures = await store.get('maxDepartures') || 3;
    setCurrentMaxDepartures(maxDepartures);
  }

  async function updateMaxDepartures(value: number) {
    console.log('Updating max departures', value);
    setCurrentMaxDepartures(value);
    const store = new Storage();
    await store.create();
    store.set('maxDepartures', value);
  }

  function goToHomeScreen() {
    window.location.href = '/home';
  }

  useEffect(() => {
    init();
  }, [currentMaxDepartures]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Preferences</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Preferences</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Departures
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p className='ion-padding-bottom'>How many departures would you like to see?</p>
            <IonList>
              <IonItem>
                <IonSelect
                  aria-label="Maximum number of departures to show"
                  interface="action-sheet"
                  placeholder={currentMaxDepartures.toString()}
                  onIonChange={(e) => updateMaxDepartures(e.detail.value)}
                >
                  <IonSelectOption value="1">1</IonSelectOption>
                  <IonSelectOption value="2">2</IonSelectOption>
                  <IonSelectOption value="3">3</IonSelectOption>
                  <IonSelectOption value="4">4</IonSelectOption>
                  <IonSelectOption value="5">5</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonIcon icon={informationCircle}></IonIcon>
                <IonLabel className="ion-text-wrap ion-padding">
                  Note: If there are fewer departures than the number you select, only the available departures will be shown.
                </IonLabel>
              </IonItem>
            </IonList>

          </IonCardContent>
        </IonCard>

        {/* <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Notifications
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonToggle>Send me notifications</IonToggle>
          </IonCardContent>
        </IonCard> */}

        {/* Apply button, redirect to home screen */}
        <IonButton expand='block' className='ion-padding' onClick={goToHomeScreen}>
          Apply
        </IonButton>

      </IonContent>
    </IonPage>
  );
};

export default Preferences;
