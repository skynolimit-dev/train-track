import { App } from '@capacitor/app';
import { useEffect, useState } from 'react';

import { IonButton, IonCard, IonCardContent, IonCardHeader, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonPage, IonSpinner, IonTitle, IonToolbar, IonRefresher, IonRefresherContent, IonAlert } from '@ionic/react';
import { close, pencil, trash, search, add } from 'ionicons/icons';
import { useRef } from 'react';
import Departures from '../components/Departures';
import TrainImage from '../components/TrainImage';
import LocationWarning from '../components/LocationWarning';
import SwipeableJourneyCard from '../components/SwipeableJourneyCard';
import { getCurrentLocation } from '../lib/location';
import { getStationCoordinatesFromCrs, getDistanceMiles, getStationNameFromCrs } from '../lib/stations';
import { getFavoriteJourneys, getJourneys, toggleJourneyFavoriteBothWays } from '../lib/user';
import { setPreferenceJson } from '../lib/preferences';
import _ from 'lodash';
import './Favourites.css';
import { getPreferenceNumber, getPreferenceBoolean } from '../lib/preferences';
import stations from '../resources/stations.json';

const Favourites: React.FC = () => {

  const updateTimeout = useRef<any>(null);

  function clearUpdateTimer() {
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
      updateTimeout.current = null;
    }
  }

  const [initialised, setInitialised] = useState(false);
  const [journeys, setJourneys] = useState<{ from: string, to: string, favorite?: boolean }[]>([]);
  const [allJourneys, setAllJourneys] = useState<{ from: string, to: string, favorite?: boolean }[]>([]);
  const [updateInProgress, setUpdateInProgress] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [dataLastUpdated, setDataLastUpdated] = useState(new Date());
  const [showDeleteAllAlert, setShowDeleteAllAlert] = useState(false);
  const [hasNonFavoriteJourneys, setHasNonFavoriteJourneys] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxStationDistance, setMaxStationDistance] = useState<number>(3);
  const [stationFilteringEnabled, setStationFilteringEnabled] = useState<boolean>(true);

  // Fetch maxStationDistance and stationFilteringEnabled on mount and when preferences change
  useEffect(() => {
    async function fetchPrefs() {
      const dist = await getPreferenceNumber('maxStationDistanceMiles', 3);
      setMaxStationDistance(dist);
      const filtering = await getPreferenceBoolean('stationFilteringEnabled', true);
      setStationFilteringEnabled(filtering);
    }
    fetchPrefs();
    // Listen for preferencesChanged event to update state
    const handler = () => fetchPrefs();
    window.addEventListener('preferencesChanged', handler);
    return () => window.removeEventListener('preferencesChanged', handler);
  }, []);

  // Reload the page when the app is closed/re-opened
  App.addListener('appStateChange', ({ isActive }) => {
    updateJourneys();
  });

  async function init() {
    setInitialised(true);
    updateJourneys();
  }

  async function updateJourneys() {
    clearUpdateTimer();
    setUpdateInProgress(true);
    
    // First get and set the journeys
    const updatedJourneys = await getFavoriteJourneys();
    setAllJourneys(updatedJourneys); // Save unfiltered
    // Check for non-favorite journeys
    const allUserJourneys = await getJourneys();
    const nonFavoriteCount = allUserJourneys.filter((j: any) => !j.favorite).length;
    setHasNonFavoriteJourneys(nonFavoriteCount);
    // Then get location and update journeys order if location is available
    const location = await getCurrentLocation();
    let filteredJourneys = updatedJourneys;
    if (location && location.coords) {
      const maxMiles = await getPreferenceNumber('maxStationDistanceMiles', 3);
      const filteringEnabled = await getPreferenceBoolean('stationFilteringEnabled', true);
      
      if (filteringEnabled && maxMiles > 0) {
        filteredJourneys = updatedJourneys.filter((journey: any) => {
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
    }
    setJourneys(filteredJourneys);
    // Then order by proximity if location is available
    const journeysOrdered = await orderJourneysByProximityToCurrentLocation(filteredJourneys, location);
    if (journeysOrdered && journeysOrdered.length > 0) {
      setJourneys(journeysOrdered);
    }
    setUpdateInProgress(false);
    setDataLastUpdated(new Date());
    // Repeat every 15 seconds
    updateTimeout.current = setTimeout(() => {
      updateJourneys();
    }, 15000);
  }

  // Callback function to refresh journeys when favorites are toggled
  function handleFavoriteToggle() {
    updateJourneys();
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
      // Sort alphabetically by station names when location is not available
      return updatedJourneys.sort((a, b) => {
        const aFromName = getStationNameFromCrs(a.from) || '';
        const bFromName = getStationNameFromCrs(b.from) || '';
        const aToName = getStationNameFromCrs(a.to) || '';
        const bToName = getStationNameFromCrs(b.to) || '';
        
        // First sort by departure station name
        const fromComparison = aFromName.localeCompare(bFromName);
        if (fromComparison !== 0) {
          return fromComparison;
        }
        
        // If departure stations are the same, sort by destination station name
        return aToName.localeCompare(bToName);
      });
    }
  }


  function showEditButton() {
    if (journeys && journeys.length > 0) {
      return (
        <IonFab slot="fixed" vertical="top" horizontal="end" edge={true} style={{ top: '5px', zIndex: 11 }}>
          <IonFabButton color="medium"onClick={() => toggleEditMode()}>
            <IonIcon icon={editMode ? close : pencil}></IonIcon>
          </IonFabButton>
        </IonFab>
      )
    }
  }

  function toggleEditMode() {
    setEditMode(!editMode);
  }

  // Show the add journey card if no journeys exist
  function showPlanJourneyCard() {
    if (!updateInProgress && (!journeys || journeys.length === 0)) {
      return (
        <IonCard>
          <IonCardHeader>
          </IonCardHeader>
          <IonCardContent>
            <p className='ion-text-center'>No favorite journeys found. Add a journey and mark it as a favorite to see it here...</p>
            <TrainImage />
            <IonButton onClick={goToPlanJourneyScreen} className='ion-margin-top' expand='block'>
              <IonIcon icon={add} slot="start" />
              Add a journey
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
    window.location.href = '/add_journey'
  }

  function reload() {
    window.location.reload();
  }

  // Show the delete all favorites button if edit mode is enabled and there are journeys
  function showDeleteAllButton() {
    if (editMode && journeys && journeys.length > 0) {
      return (
        <IonButton expand='block' color='danger' onClick={() => setShowDeleteAllAlert(true)} className='ion-margin'>
          <IonIcon icon={trash} slot="start"></IonIcon>
          Delete all favorites
        </IonButton>
      );
    }
  }

  // Function to delete all favorite journeys
  async function deleteAllFavorites() {
    const allJourneys = await getJourneys();
    const updatedJourneys = allJourneys.filter((journey: any) => !journey.favorite);
    await setPreferenceJson('journeys', updatedJourneys);
    window.dispatchEvent(new CustomEvent('journeysChanged'));
    updateJourneys(); // Refresh the list
  }

  function showFilteredOutMessage() {
    const filteredOut = allJourneys.length - journeys.length;
    if (filteredOut > 0) {
      return (
        <div className="ion-text-center ion-padding-top subtle-info-link">
            {filteredOut} favorite journey{filteredOut > 1 ? 's are' : ' is'} hidden by your distance filter.{' '}
            <br />
            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault();
                await setPreferenceJson('stationFilteringEnabled', false);
                window.dispatchEvent(new CustomEvent('preferencesChanged'));
              }}
              className="filtered-info-link"
            >
              Show all journeys
            </a>
          </div>
      );
    }
    // If distance filtering is disabled, show a message to re-enable it
    if (!stationFilteringEnabled) {
      return (
        <div className="ion-text-center ion-padding-top subtle-info-link">
            Showing all stations, regardless of distance.{' '}
            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault();
                await setPreferenceJson('stationFilteringEnabled', true);
                window.dispatchEvent(new CustomEvent('preferencesChanged'));
              }}
              className="filtered-info-link"
            >
              <br />
              Hide stations further than {maxStationDistance} mile{maxStationDistance === 1 ? '' : 's'} from me
            </a>
          </div>
      );
    }
    return null;
  }

  function showNoFavouritesLink() {
    const nonFavoriteCount = hasNonFavoriteJourneys;
    if (!updateInProgress && typeof nonFavoriteCount === 'number' && nonFavoriteCount > 0) {
      return (
        <div className="ion-text-center ion-padding-top subtle-info-link">
          You have {nonFavoriteCount} saved journey{nonFavoriteCount === 1 ? '' : 's'} that {nonFavoriteCount === 1 ? "isn't a favourite" : "aren't favourites"}.{' '}
          <br />
          <a href="/my_journeys" className="filtered-info-link">View my (non-favourite) journeys</a>
        </div>
      );
    }
    return null;
  }

  useEffect(() => {
    if (!initialised) {
      init();
    }
    // Listen for preference changes
    const handlePreferenceChange = () => {
      clearUpdateTimer();
      updateJourneys();
    };
    window.addEventListener('preferencesChanged', handlePreferenceChange);
    // Listen for location becoming available again
    const handleLocationUnavailable = (e: any) => {
      if (e.detail && e.detail.unavailable === false) {
        updateJourneys();
      }
    };
    window.addEventListener('locationUnavailable', handleLocationUnavailable);
    return () => {
      window.removeEventListener('preferencesChanged', handlePreferenceChange);
      window.removeEventListener('locationUnavailable', handleLocationUnavailable);
      if (updateTimeout.current) clearTimeout(updateTimeout.current);
    };
    // eslint-disable-next-line
  }, [editMode]);

  function filterJourneysBySearch(journeys: any[]) {
    if (!searchTerm.trim()) return journeys;
    const term = searchTerm.trim().toLowerCase();
    return journeys.filter(journey => {
      const fromStation = stations.find((s: any) => s.crs === journey.from);
      const toStation = stations.find((s: any) => s.crs === journey.to);
      const fromName = fromStation?.name?.toLowerCase() || '';
      const toName = toStation?.name?.toLowerCase() || '';
      return (
        fromName.includes(term) ||
        toName.includes(term) ||
        journey.from.toLowerCase().includes(term) ||
        journey.to.toLowerCase().includes(term)
      );
    });
  }

  // Function to handle journey deletion from swipe gesture
  async function handleJourneyDelete(journey: any, deleteBoth: boolean) {
    const allJourneys = await getJourneys();
    let updatedJourneys;
    
    if (deleteBoth) {
      // Remove both the journey and its return leg
      updatedJourneys = allJourneys.filter((j: any) => {
        const isCurrentJourney = j.from === journey.from && j.to === journey.to;
        const isReturnJourney = j.from === journey.to && j.to === journey.from;
        return !isCurrentJourney && !isReturnJourney;
      });
    } else {
      // Remove only the current journey
      updatedJourneys = allJourneys.filter((j: any) => 
        !(j.from === journey.from && j.to === journey.to)
      );
    }
    
    await setPreferenceJson('journeys', updatedJourneys);
    window.dispatchEvent(new CustomEvent('journeysChanged'));
    updateJourneys(); // Refresh the list
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Favorites</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="favourites-content-scroll">
        {/* Add Journey FAB */}
        <IonFab slot="fixed" vertical="top" horizontal="end" edge={true} style={{ top: '5px', right: '16px', zIndex: 11 }}>
          <IonFabButton color="medium"onClick={goToPlanJourneyScreen}>
            <IonIcon icon={add}></IonIcon>
          </IonFabButton>
        </IonFab>

        {/* Edit FAB - only show when there are journeys to edit */}
        {journeys && journeys.length > 0 && (
          <IonFab slot="fixed" vertical="top" horizontal="end" edge={true} style={{ top: '5px', right: '80px', zIndex: 11 }}>
            <IonFabButton color="medium"onClick={() => setEditMode(!editMode)}>
              <IonIcon icon={editMode ? close : pencil}></IonIcon>
            </IonFabButton>
          </IonFab>
        )}

        {/* Search FAB */}
        {!showSearchBox && journeys && journeys.length > 0 && (
          <IonFab slot="fixed" vertical="top" horizontal="end" edge={true} style={{ top: '5px', right: '144px', zIndex: 11 }}>
            <IonFabButton color="medium"onClick={() => setShowSearchBox(true)}>
              <IonIcon icon={search}></IonIcon>
            </IonFabButton>
          </IonFab>
        )}
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Favorites</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Location Warning */}
        <LocationWarning />

        {/* Search box, only visible when showSearchBox is true */}
        {showSearchBox && (
          <div className="search-box-container" style={{ position: 'sticky', top: 0, zIndex: 12, display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by station name or CRS code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-box"
              autoFocus
            />
            <IonIcon icon={close} className="search-close-icon" style={{ marginLeft: 8, fontSize: 24, cursor: 'pointer' }} onClick={() => { setShowSearchBox(false); setSearchTerm(''); }} />
          </div>
        )}

        <IonRefresher slot="fixed" onIonRefresh={reload}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Add journey link if no saved journeys exist */}
        {showPlanJourneyCard()}

        {/* Departures for all saved user journeys */}
        {filterJourneysBySearch(journeys).map((journey) => (
          <SwipeableJourneyCard
            key={journey.from + journey.to}
            from={journey.from}
            to={journey.to}
            isFavorite={journey.favorite === true}
            onDelete={(deleteBoth) => handleJourneyDelete(journey, deleteBoth)}
          >
            <Departures 
              from={journey.from} 
              to={journey.to} 
              editMode={editMode}
              isFavorite={journey.favorite === true}
              onToggleFavorite={handleFavoriteToggle}
            />
          </SwipeableJourneyCard>
        ))}

        {showFilteredOutMessage()}

        {showNoFavouritesLink()}

        <div className='ion-text-center ion-padding-top ion-padding-bottom data-last-updated-label'>
          Last updated {dataLastUpdated.toLocaleTimeString()}
          {updateInProgress && <IonSpinner style={{ marginLeft: 8, width: 16, height: 16, verticalAlign: 'middle' }} className='location-spinner' />}
        </div>

        {/* Delete All Favorites Confirmation Alert */}
        <IonAlert
          isOpen={showDeleteAllAlert}
          onDidDismiss={() => setShowDeleteAllAlert(false)}
          header="Delete All Favorites"
          message="Are you sure you want to delete ALL favorite journeys? This action cannot be undone."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => setShowDeleteAllAlert(false)
            },
            {
              text: 'Delete All',
              role: 'destructive',
              handler: () => {
                deleteAllFavorites();
                setShowDeleteAllAlert(false);
              }
            }
          ]}
        />

      </IonContent>
    </IonPage>
  );
};

export default Favourites;
