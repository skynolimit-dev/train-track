import { App } from '@capacitor/app';
import { useEffect, useState } from 'react';

import { IonButton, IonCard, IonCardContent, IonCardHeader, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonPage, IonSpinner, IonTitle, IonToolbar, IonRefresher, IonRefresherContent } from '@ionic/react';
import { close, pencil } from 'ionicons/icons';
import { useRef } from 'react';
import Departures from '../components/Departures';
import TrainImage from '../components/TrainImage';
import { getCurrentLocation } from '../lib/location';
import { getStationCoordinatesFromCrs } from '../lib/stations';
import { getJourneys } from '../lib/user';
import _ from 'lodash';
import './Home.css';

const Home: React.FC = () => {

  let updateTimeout: any;

  const [initialised, setInitialised] = useState(false);
  const [journeys, setJourneys] = useState<{ from: string, to: string }[]>([]);
  const [updateInProgress, setUpdateInProgress] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [dataLastUpdated, setDataLastUpdated] = useState(new Date());

  // Reload the page when the app is closed/re-opened
  App.addListener('appStateChange', ({ isActive }) => {
    updateJourneys();
  });

  async function init() {
    setInitialised(true);
    updateJourneys();
  }

  async function updateJourneys() {
    setUpdateInProgress(true);
    
    // First get and set the journeys
    const updatedJourneys = await getJourneys();
    setJourneys(updatedJourneys);
    
    // Then get location and update journeys order if location is available
    const location = await getCurrentLocation();
    const journeysOrdered = await orderJourneysByProximityToCurrentLocation(updatedJourneys, location);
    if (journeysOrdered && journeysOrdered.length > 0) {
      setJourneys(journeysOrdered);
    }
    
    setUpdateInProgress(false);
    setDataLastUpdated(new Date());

    // Repeat every 15 seconds
    if (updateTimeout)
      clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      updateJourneys();
    }, 15000);
  }

  // Order the journeys by proximity to the current location
  async function orderJourneysByProximityToCurrentLocation(updatedJourneys: any[], location: any) {
    const latitude = _.get(location, 'coords.latitude');
    const longitude = _.get(location, 'coords.longitude');
    if (latitude && longitude) {
      // Enrich the journeys with the coordinates
      updatedJourneys.forEach((journey) => {
        const coordinates = getStationCoordinatesFromCrs(journey.from);
        journey.latitude = coordinates?.latitude;
        journey.longitude = coordinates?.longitude;
      });
      return updatedJourneys.sort((a, b) => {
        const distanceA = Math.abs(a.latitude - latitude) + Math.abs(a.longitude - longitude);
        const distanceB = Math.abs(b.latitude - latitude) + Math.abs(b.longitude - longitude);
        return distanceA - distanceB;
      });
    }
    else {
      return updatedJourneys;
    }
  }


  function showEditButton() {
    if (journeys && journeys.length > 0) {
      return (
        <IonFab slot="fixed" vertical="top" horizontal="end" edge={true}>
          <IonFabButton onClick={() => toggleEditMode()}>
            <IonIcon icon={editMode ? close : pencil}></IonIcon>
          </IonFabButton>
        </IonFab>
      )
    }
  }

  function toggleEditMode() {
    setEditMode(!editMode);
  }

  // Show the plan journey button if edit mode is enabled
  function showPlanJourneyButton() {
    if (editMode) {
      return (
        <IonButton expand='block' onClick={goToPlanJourneyScreen} className='ion-margin'>
          Plan a new journey
        </IonButton>
      );
    }
  }

  // Show the plan journey card if no journeys exist
  function showPlanJourneyCard() {
    if (!updateInProgress && (!journeys || journeys.length === 0)) {
      return (
        <IonCard>
          <IonCardHeader>
          </IonCardHeader>
          <IonCardContent>
            <p className='ion-text-center'>Plan a journey to get started...</p>
            <TrainImage />
            <IonButton onClick={goToPlanJourneyScreen} className='ion-margin-top' expand='block'>
              Plan a journey
            </IonButton>
          </IonCardContent>
        </IonCard>
      );
    }
  }

  // Show the update in progress progress indicator
  function showUpdateInProgress() {
    if (updateInProgress) {
      return (
        <div className='ion-text-center ion-padding-top'>Updating data and finding your location... <IonSpinner className='location-spinner' /></div>
      )
    }
  }

  function goToPlanJourneyScreen() {
    window.location.href = '/plan_journey'
  }

  function reload() {
    window.location.reload();
  }

  useEffect(() => {
    if (!initialised) {
      init();
    }
  }, [journeys, updateInProgress, editMode]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>TrainTrack</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">TrainTrack</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonRefresher slot="fixed" onIonRefresh={reload}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Toggle delete mode button */}
        {showEditButton()}

        {/* Add journey link if no saved journeys exist */}
        {showPlanJourneyCard()}

        {/* Show update in progress indicator */}
        {showUpdateInProgress()}

        {/* Plan a new journey button */}
        {showPlanJourneyButton()}

        {/* Departures for all saved user journeys */}
        {journeys.map((journey) => (<Departures key={journey.from + journey.to} from={journey.from} to={journey.to} editMode={editMode} />))}

        <div className='ion-text-center ion-padding-top ion-padding-bottom data-last-updated-label'>Last updated {dataLastUpdated.toLocaleTimeString()}</div>

      </IonContent>
    </IonPage>
  );
};

export default Home;
