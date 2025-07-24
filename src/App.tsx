import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { informationCircle, train, person, add as addIcon, list, star } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

import { Storage } from '@ionic/storage';
import About from './pages/About';
import PlanJourney from './pages/PlanJourney';
import AllJourneys from './pages/AllJourneys';
import Preferences from './pages/Preferences';
import Favourites from './pages/Favourites';
import { getJourneys, getFavoriteJourneys } from './lib/user';
import { getCurrentLocation } from './lib/location';
import { getStationCoordinatesFromCrs, getDistanceMiles } from './lib/stations';
import { getPreferenceNumber, getPreferenceBoolean } from './lib/preferences';
import { WarningBanner } from './components/LocationWarning';
import { warningOutline } from 'ionicons/icons';
import { App as CapacitorApp } from '@capacitor/app';

const store = new Storage();

setupIonicReact();

const App: React.FC = () => {

  const [appInitialised, setAppInitialised] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalJourneys, setTotalJourneys] = useState(0);
  const [favoriteJourneys, setFavoriteJourneys] = useState(0);
  const [nonFavoriteJourneys, setNonFavoriteJourneys] = useState(0);
  const [filteredFavoriteJourneys, setFilteredFavoriteJourneys] = useState(0);
  const [filteredNonFavoriteJourneys, setFilteredNonFavoriteJourneys] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    function handleApiError(e: any) {
      setApiError(e.detail?.message || null);
    }
    window.addEventListener('apiError', handleApiError);
    return () => window.removeEventListener('apiError', handleApiError);
  }, []);

  async function initApp() {
    console.info('Initialising app');
    setIsLoading(true);
    await updateJourneyCounts();
    setAppInitialised(true);
    
    // Give the app time to load journey data
    setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 second delay
  }

  async function updateJourneyCounts() {
    const allJourneys = await getJourneys();
    const favorites = await getFavoriteJourneys();
    const nonFavorites = allJourneys.filter((journey: any) => !journey.favorite);
    
    // Get location and filtering preferences
    const location = await getCurrentLocation();
    const maxMiles = await getPreferenceNumber('maxStationDistanceMiles', 3);
    const filteringEnabled = await getPreferenceBoolean('stationFilteringEnabled', true);
    
    // Apply station distance filtering if enabled and location is available
    let filteredFavorites = favorites;
    let filteredNonFavorites = nonFavorites;
    
    if (filteringEnabled && maxMiles > 0 && location && location.coords) {
      filteredFavorites = favorites.filter((journey: any) => {
        const coordinates = getStationCoordinatesFromCrs(journey.from);
        if (!coordinates || !coordinates.latitude || !coordinates.longitude) return false;
        const dist = getDistanceMiles(
          parseFloat(coordinates.latitude),
          parseFloat(coordinates.longitude),
          location.coords.latitude,
          location.coords.longitude
        );
        return dist <= maxMiles;
      });
      
      filteredNonFavorites = nonFavorites.filter((journey: any) => {
        const coordinates = getStationCoordinatesFromCrs(journey.from);
        if (!coordinates || !coordinates.latitude || !coordinates.longitude) return false;
        const dist = getDistanceMiles(
          parseFloat(coordinates.latitude),
          parseFloat(coordinates.longitude),
          location.coords.latitude,
          location.coords.longitude
        );
        return dist <= maxMiles;
      });
    }
    
    console.log('nonFavorites', nonFavorites);
    setTotalJourneys(allJourneys.length);
    setFavoriteJourneys(favorites.length);
    setNonFavoriteJourneys(nonFavorites.length);
    setFilteredFavoriteJourneys(filteredFavorites.length);
    setFilteredNonFavoriteJourneys(filteredNonFavorites.length);
  }

  // Listen for journey changes
  useEffect(() => {
    if (appInitialised) {
      updateJourneyCounts();
      
      // Listen for journey changes
      const handleJourneyChange = () => {
        updateJourneyCounts();
      };
      
      // Listen for preference changes
      const handlePreferenceChange = () => {
        updateJourneyCounts();
      };
      
      window.addEventListener('journeysChanged', handleJourneyChange);
      window.addEventListener('preferencesChanged', handlePreferenceChange);
      
      return () => {
        window.removeEventListener('journeysChanged', handleJourneyChange);
        window.removeEventListener('preferencesChanged', handlePreferenceChange);
      };
    }
  }, [appInitialised]);

  // Determine default route - always go to favourites
  function getDefaultRoute() {
    return '/favourites';
  }

  useEffect(() => {
    console.log('App init')
    if (!appInitialised) {
      initApp();
    }
    // Print the bundle identifier at runtime for debugging
    if (window && (window as any).Capacitor && CapacitorApp && CapacitorApp.getInfo) {
      CapacitorApp.getInfo().then(info => {
        console.log('Bundle identifier at runtime:', info.id);
      });
    } else {
      console.log('Capacitor App.getInfo not available.');
    }
  }, [appInitialised]);

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/favourites">
              <Favourites />
            </Route>
            <Route exact path="/add_journey">
              <PlanJourney />
            </Route>
            <Route exact path="/preferences">
              <Preferences />
            </Route>
            <Route exact path="/about">
              <About />
            </Route>
            <Route exact path="/my_journeys">
              <AllJourneys />
            </Route>
            <Route exact path="/">
              <Redirect to={getDefaultRoute()} />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="home" href="/favourites">
              <IonIcon aria-hidden="true" icon={star} />
              <IonLabel>Favorites</IonLabel>
            </IonTabButton>
            <IonTabButton tab="my_journeys" href="/my_journeys">
              <IonIcon aria-hidden="true" icon={list} />
              <IonLabel>My Journeys</IonLabel>
            </IonTabButton>
            <IonTabButton tab="add_journey" href="/add_journey">
              <IonIcon aria-hidden="true" icon={addIcon} />
              <IonLabel>Add Journey</IonLabel>
            </IonTabButton>
            <IonTabButton tab="preferences" href="/preferences">
              <IonIcon aria-hidden="true" icon={person} />
              <IonLabel>Preferences</IonLabel>
            </IonTabButton>
            <IonTabButton tab="about" href="/about" aria-label="About">
              <IonIcon aria-hidden="true" icon={informationCircle} />
              <IonLabel>About</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
        {/* API Error Banner - show sticky at bottom above tab bar */}
        {apiError && (
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 56, zIndex: 1000 }}>
            <WarningBanner icon={warningOutline} color="danger" message={apiError} style={{ color: '#fff' }} />
          </div>
        )}
      </IonReactRouter>
    </IonApp>
  )

}

export default App;
