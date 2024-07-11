import { useEffect, useState } from 'react';
import { Storage } from '@ionic/storage';

import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/Departures';
import './Search.css';

const Search: React.FC = () => {

  const [initialised, setInitialised] = useState(false);
  const store = new Storage();

  async function init() {
    console.log('Initialising search');
    await store.create();
    console.log('Last tab', await store.get('lastTab') || 'N/A');
    console.log('Last date', await store.get('lastDate') || 'N/A');
    setInitialised(true);
    store.set('lastTab', 'search');
    store.set('lastDate', new Date().toUTCString());
  }

  useEffect(() => {
    if (!initialised) {
      init();
    }
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Search</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Search</IonTitle>
          </IonToolbar>
        </IonHeader>
      </IonContent>
    </IonPage>
  );
};

export default Search;
