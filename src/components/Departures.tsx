import { getPreferenceNumber, getPreferenceBoolean } from '../lib/preferences';
import { useEffect, useState } from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonGrid, IonIcon, IonRow, IonSpinner, IonAlert } from '@ionic/react';
import { bus, star, starOutline } from 'ionicons/icons';
import { getStationNameFromCrs, getPlatformColor } from '../lib/stations';
import { getTrainTimes } from '../lib/trains';
import DeleteJourneyButton from './DeleteJourneyButton';
import AddReturnJourneyButton from './AddReturnJourneyButton';
import ToggleFavoriteButton from './ToggleFavoriteButton';
import './Departures.css';
import NoDeparturesFound from './NoDeparturesFound';
import _, { get } from 'lodash';
import moment from 'moment';
import React from 'react';
import { toggleJourneyFavorite } from '../lib/user';
import { hasReturnLeg, toggleJourneyFavoriteBothWays } from '../lib/user';

interface ContainerProps {
  from: string;
  to: string;
  editMode?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

// Set lastDeparturesUpdateTime to 5 minutes ago to force an update on first load
let lastDeparturesUpdateTime = moment().subtract(5, 'minutes');

// Calculates the difference in minutes between the two times
// Note that the times are in the format "HH:MM"
function getDelayInMinutes(scheduledDepartureTime: any, estimatedDepartureTime: any) {
  // Use moment to calculate the difference in minutes
  scheduledDepartureTime = moment(scheduledDepartureTime, 'HH:mm');
  estimatedDepartureTime = moment(estimatedDepartureTime, 'HH:mm');
  const diff = estimatedDepartureTime.diff(scheduledDepartureTime, 'minutes');
  return diff;
}

// Returns a class name based on the delay
function getDelayClass(delay: number) {
  if (delay >= 5) {
    return 'big-delay';
  } else if (delay > 0) {
    return 'mild-delay';
  } else {
    return 'no-delay';
  }
}

// Returns a class name based on the platform
function getPlatformClass(platform: string) {
  if (platform === 'BUS') {
    return 'platform-bus';
  } else {
    return 'platform-train';
  }
}

// Returns a label based on the platform - show a bus icon if the platform is "BUS"
function getPlatformLabel(platform: string) {
  if (platform === 'BUS') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <IonIcon icon={bus} style={{ fontSize: '14px' }} />
        Bus
      </span>
    );
  } else if (platform && platform.length > 0) {
    return platform;
  } else {
    return 'TBC';
  }
}

// Format destination and route information
function formatDestinationAndRoute(departure: any) {
  // Handle both old format (destination.locationName) and new format (destination[0].locationName)
  const destination = _.get(departure, 'destination.locationName') || 
                     (_.get(departure, 'destination[0].locationName', ''));
  const via = _.get(departure, 'destination.via') || 
              (_.get(departure, 'destination[0].via', ''));
  
  if (via && via.length > 0) {
    return `${destination} ${via}`;
  } else {
    return destination;
  }
}

// Format departure details row
function formatDepartureDetails(departure: any) {
  const scheduledTime = _.get(departure, 'departure_time.scheduled', '');
  const destinationRoute = formatDestinationAndRoute(departure);
  const delayReason = _.get(departure, 'delayReason', '');
  const operator = _.get(departure, 'operator', '');
  
  let details = `${scheduledTime} to ${destinationRoute}`;
  
  if (delayReason && delayReason.length > 0) {
    details += ` - ${delayReason}`;
  }
  
  if (operator && operator.length > 0) {
    details += ` (${operator})`;
  }
  
  return details;
}

const Departures: React.FC<ContainerProps> = ({ from, to, editMode, isFavorite = false, onToggleFavorite }) => {

  const [departures, setDepartures] = useState<any[]>([]);
  const [initialised, setInitialised] = useState(false);
  const [platformColorEnabled, setPlatformColorEnabled] = useState(false);
  const [highlightShortTrainLength, setHighlightShortTrainLength] = useState(4);
  const [highlightShortTrainsEnabled, setHighlightShortTrainsEnabled] = useState(true);
  const [showRemoveFavoriteAlert, setShowRemoveFavoriteAlert] = useState(false);
  const [showAddFavoriteAlert, setShowAddFavoriteAlert] = useState(false);
  const [showBothLegsAlert, setShowBothLegsAlert] = useState<null | 'add' | 'remove'>(null);
  const [returnLegExists, setReturnLegExists] = useState(false);
  const headerRowKey = `${from}-${to}-header`;

  let updateTimeout: any;

  // Returns a class name based on the train length
  function getTrainLengthClass(length: number) {
    if (highlightShortTrainsEnabled && length > 0 && length <= highlightShortTrainLength) {
      return 'short-length';
    } else {
      return 'train-length';
    }
  }

  async function init() {
    const platformColor = await getPreferenceBoolean('platformColourEnabled', false);
    setPlatformColorEnabled(platformColor);
    const highlightLength = await getPreferenceNumber('highlightShortTrainLength', 4);
    setHighlightShortTrainLength(highlightLength);
    const highlightShortTrainsEnabled = await getPreferenceBoolean('highlightShortTrainsEnabled', true);
    setHighlightShortTrainsEnabled(highlightShortTrainsEnabled);
    updateDepartures();
    setInitialised(true);
  }

  async function updateDepartures(retryCount = 0) {
    if (lastDeparturesUpdateTime && moment().diff(lastDeparturesUpdateTime, 'seconds') < 10) {
      return;
    }
    else {
      if (retryCount < 3) {
        const apiData = await getTrainTimes(from, to);
        const maxDepartures = await getPreferenceNumber('maxDepartures', 3);
        
        // Handle both old 'departures' format and new 'trainServices' format
        let departures = _.get(apiData, 'departures') || _.get(apiData, 'trainServices');
        
        if (!departures) {
          console.warn(`No departures found from ${from} to ${to} on retry count ${retryCount}`);
          updateDepartures(retryCount + 1);
        } else {
          departures = departures.slice(0, maxDepartures);
          setDepartures(departures);
        }
      }
    }

    // Repeat call every 10 seconds
    if (updateTimeout)
      clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      updateDepartures();
    }, 10000);
  }

  // Show the departures
  function showDepartures(departures: any[], to: string) {
    if (departures && departures.length > 0) {
      // Sort by estimated departure time (or scheduled if estimated is missing), handling next-day rollovers
      const now = moment();
      const today = now.format('YYYY-MM-DD');
      const sorted = [...departures].sort((a, b) => {
        // For both cancelled and non-cancelled, use estimated if present, otherwise scheduled
        const getSortTime = (dep: any) => {
          // If cancelled, still use estimated if present, otherwise scheduled
          let t = _.get(dep, 'departure_time.estimated');
          if (!t || t.toLowerCase() === 'cancelled' || t.toLowerCase() === 'unknown') {
            t = _.get(dep, 'departure_time.scheduled') || _.get(dep, 'etd') || _.get(dep, 'std');
          }
          return t;
        };
        const aTimeRaw = getSortTime(a);
        const bTimeRaw = getSortTime(b);
        let aTime = moment(`${today} ${aTimeRaw}`, 'YYYY-MM-DD HH:mm');
        let bTime = moment(`${today} ${bTimeRaw}`, 'YYYY-MM-DD HH:mm');
        // If aTime is before now by more than 6 hours, treat as next day
        if (aTime.isBefore(now) && now.diff(aTime, 'hours') > 6) {
          aTime.add(1, 'day');
        }
        if (bTime.isBefore(now) && now.diff(bTime, 'hours') > 6) {
          bTime.add(1, 'day');
        }
        return aTime.diff(bTime);
      });
      const showDestination = !to || to.length === 0;
      return sorted.map((departure: any, index: number) => {
        const scheduledDeparture = _.get(departure, 'departure_time.scheduled') || _.get(departure, 'std', '');
        const key = `${departure.serviceID || ''}-${scheduledDeparture}-${index}`;
        return (
          <React.Fragment key={key}>
            {showDeparture(departure, index, showDestination)}
          </React.Fragment>
        );
      });
    }
  }

  function showDeparture(departure: any, index: number, showDestination: boolean) {
    const estimatedDeparture = _.get(departure, 'departure_time.estimated');

    if (departure.isCancelled) {
      return showDepartureCancelled(departure, index, showDestination);
    }
    else if (estimatedDeparture) {
      return showDepartureRealTimeActivated(departure, index, showDestination);
    }
    else {
      return showDepartureRealTimeUnavailable(departure, index, showDestination);
    }
  }

  function showDepartureCancelled(departure: any, index: number, showDestination: boolean) {
    const scheduledDeparture = _.get(departure, 'departure_time.scheduled') || _.get(departure, 'std', '');
    let estimatedDeparture = _.get(departure, 'departure_time.estimated');
    // If estimated is 'Cancelled' or 'Unknown', fall back to scheduled
    if (!estimatedDeparture || estimatedDeparture.toLowerCase() === 'cancelled' || estimatedDeparture.toLowerCase() === 'unknown') {
      estimatedDeparture = null;
    }
    const timeLabel = estimatedDeparture || scheduledDeparture;
    const rowKey = `${departure.serviceID}-${scheduledDeparture}-${index}`;
    const rowKeyInfo = `${rowKey}-info`;
    const detailsRowKey = `${rowKey}-details`;

    // For planned journeys, where a destination is specified
    if (!showDestination) {
      return (
        <>
          <IonRow key={rowKey}>
            <IonCol size='4' className='ion-text-center'>
              <div className='cancelled'>
                <span className='strikethrough'>{timeLabel}</span>
              </div>
            </IonCol>
            <IonCol className="ion-text-center">
              <div className='cancelled'>
                Cancelled
              </div>
            </IonCol>
          </IonRow>

          <IonRow key={rowKeyInfo}>
            <IonCol size='12' className='ion-text-center'>
              <div className='cancel-info'>
                Cancellation reason: {departure.cancelReason}
              </div>
            </IonCol>
          </IonRow>

          <IonRow key={detailsRowKey}>
            <IonCol size='12' className='ion-text-center'>
              <div className='departure-details'>
                {formatDepartureDetails(departure)}
              </div>
            </IonCol>
          </IonRow>
        </>
      )
    }
    // For nearby station departures, where no destination is specified
    else {
      return (
        <>
          <IonRow key={rowKey}>
            <IonCol className='ion-text-center'>
              <div className='cancelled'>
                <span className='strikethrough'>{timeLabel}</span>
              </div>
            </IonCol>
            <IonCol className="ion-text-center">
              <div className='destination'>
                {_.get(departure, 'destination.locationName') || _.get(departure, 'destination[0].locationName', '')}
              </div>
            </IonCol>
            <IonCol className="ion-text-center">
              <div className='cancelled'>
                Cancelled
              </div>
            </IonCol>
          </IonRow>

          <IonRow key={rowKeyInfo}>
            <IonCol size='12' className='ion-text-center'>
              <div className='cancel-info'>
                Cancellation reason: {departure.cancelReason}
              </div>
            </IonCol>
          </IonRow>

          <IonRow key={detailsRowKey}>
            <IonCol size='12' className='ion-text-center'>
              <div className='departure-details'>
                {formatDepartureDetails(departure)}
              </div>
            </IonCol>
          </IonRow>
        </>
      )
    }
  }

  // Show the departure when real-time data is available
  function showDepartureRealTimeActivated(departure: any, index: number, showDestination: boolean) {

    // console.log('Showing departure', departure, index);

    // Get scheduled and actual departure times - handle both old and new formats
    const scheduledDeparture = _.get(departure, 'departure_time.scheduled') || _.get(departure, 'std', '');
    let estimatedDeparture = _.get(departure, 'departure_time.estimated') || _.get(departure, 'etd', scheduledDeparture);

    let platform = _.get(departure, 'platform');
    platform = platform && platform.length > 0 ? platform : 'TBC';

    const departureDelayInMinutes = estimatedDeparture.toLowerCase() !== 'on time' ? getDelayInMinutes(scheduledDeparture, estimatedDeparture) : 0;

    const rowKey = `${departure.serviceID}-${scheduledDeparture}-${index}`;
    const detailsRowKey = `${rowKey}-details`;

    // For planned journeys, where a destination is specified
    if (!showDestination) {
      const isBus = departure.serviceType === 'bus' || _.get(departure, 'platform') === 'BUS';
      return (
        <>
          <IonRow key={rowKey}>
            <IonCol className='ion-text-center'>
              <div className={getDelayClass(departureDelayInMinutes)}>
                {estimatedDeparture}
              </div>
            </IonCol>
            {isBus ? (
              <IonCol size='8' className='ion-text-center bus-label-col'>
                <div className='bus-label'>
                  <IonIcon icon={bus} style={{ fontSize: '16px' }} />
                  Bus
                </div>
              </IonCol>
            ) : (
              <>
                <IonCol className="ion-text-center">
                  <div className={getTrainLengthClass(departure.length)}>
                    {departure.length > 0 ? departure.length : 'TBC'}
                  </div>
                </IonCol>
                <IonCol className='ion-text-center'>
                  <div className={getPlatformClassWithColor(departure.platform)} style={getPlatformStyle(departure.platform)}>
                    {getPlatformLabel(departure.platform)}
                  </div>
                </IonCol>
              </>
            )}
          </IonRow>
          <IonRow key={detailsRowKey}>
            <IonCol size='12' className='ion-text-center'>
              <div className='departure-details'>
                {formatDepartureDetails(departure)}
              </div>
            </IonCol>
          </IonRow>
        </>
      )
    }
    // For nearby station departures, where no destination is specified
    else {
      const isBus = departure.serviceType === 'bus' || _.get(departure, 'platform') === 'BUS';
      return (
        <>
          <IonRow key={rowKey}>
            <IonCol size='4' className='ion-text-center'>
              <div className={getDelayClass(departureDelayInMinutes)}>
                {estimatedDeparture}
              </div>
            </IonCol>
            <IonCol className='destination'>
              {_.get(departure, 'destination.locationName') || _.get(departure, 'destination[0].locationName', '')}
            </IonCol>
            {isBus ? (
              <IonCol size='8' className='ion-text-center bus-label-col'>
                <div className='bus-label'>
                  <IonIcon icon={bus} style={{ fontSize: '16px' }} />
                  Bus
                </div>
              </IonCol>
            ) : (
              <IonCol size='3' className='ion-text-center'>
                <div className={getPlatformClassWithColor(departure.platform)} style={getPlatformStyle(departure.platform)}>
                  {getPlatformLabel(departure.platform)}
                </div>
              </IonCol>
            )}
          </IonRow>
          <IonRow key={detailsRowKey}>
            <IonCol size='12' className='ion-text-center'>
              <div className='departure-details'>
                {formatDepartureDetails(departure)}
              </div>
            </IonCol>
          </IonRow>
        </>
      )
    }
  }

  // Show the departure when real-time data is unavailable, e.g. a replacement bus service is in operation
  function showDepartureRealTimeUnavailable(departure: any, index: number, showDestination: boolean) {

    // console.log('Showing departure', departure, index);

    // Get the booked departure time - handle both old and new formats
    const scheduledDeparture = _.get(departure, 'departure_time.scheduled') || _.get(departure, 'std', '');

    let platform = _.get(departure, 'platform');
    platform = platform && platform.length > 0 ? platform : getServiceTypeIcon(departure.serviceType);

    const rowKey = `${departure.serviceID}-${scheduledDeparture}-${index}`;
    const detailsRowKey = `${rowKey}-details`;

    // For planned journeys, where a destination is specified
    if (!showDestination) {
      const isBus = departure.serviceType === 'bus' || _.get(departure, 'platform') === 'BUS';
      return (
        <>
          <IonRow key={rowKey}>
            <IonCol className='ion-text-center'>
              <div className='mild-delay'>
                Unknown
              </div>
            </IonCol>
            {isBus ? (
              <IonCol size='8' className='ion-text-center bus-label-col'>
                <div className='bus-label'>
                  <IonIcon icon={bus} style={{ fontSize: '16px' }} />
                  Bus
                </div>
              </IonCol>
            ) : (
              <>
                <IonCol className="ion-text-center">
                  <div className='mild-delay'>
                    Unknown
                  </div>
                </IonCol>
                <IonCol className='ion-text-center'>
                  <div className={getServiceTypeClass(departure.serviceType)} style={getPlatformStyle(departure.platform)}>
                    {platform}
                  </div>
                </IonCol>
              </>
            )}
          </IonRow>
          <IonRow key={detailsRowKey}>
            <IonCol size='12' className='ion-text-center'>
              <div className='departure-details'>
                {formatDepartureDetails(departure)}
              </div>
            </IonCol>
          </IonRow>
        </>
      )
    }
    // For nearby station departures, where no destination is specified
    else {
      const isBus = departure.serviceType === 'bus' || _.get(departure, 'platform') === 'BUS';
      return (
        <>
          <IonRow key={rowKey}>
            <IonCol size='4' className='ion-text-center'>
              <div className='mild-delay'>
                {scheduledDeparture}
              </div>
            </IonCol>
            <IonCol className='destination'>
              {_.get(departure, 'destination.locationName') || _.get(departure, 'destination[0].locationName', '')}
            </IonCol>
            {isBus ? (
              <IonCol size='8' className='ion-text-center bus-label-col'>
                <div className='bus-label'>
                  <IonIcon icon={bus} style={{ fontSize: '16px' }} />
                  Bus
                </div>
              </IonCol>
            ) : (
              <IonCol size='3' className='ion-text-center'>
                <div className={getServiceTypeClass(departure.serviceType)} style={getPlatformStyle(departure.platform)}>
                  {platform}
                </div>
              </IonCol>
            )}
          </IonRow>
          <IonRow key={detailsRowKey}>
            <IonCol size='12' className='ion-text-center'>
              <div className='departure-details'>
                {formatDepartureDetails(departure)}
              </div>
            </IonCol>
          </IonRow>
        </>
      )
    }
  }

  function getServiceTypeClass(serviceType: string) {
    let serviceTypeClass = 'platform';
    if (serviceType !== 'train') {
      serviceTypeClass += ' replacement-bus-service';
    }
    return serviceTypeClass;
  }

  // Shows an icon if the service type isn't a train, e.g. a replacement bus service
  function getServiceTypeIcon(serviceType: string) {
    if (serviceType !== 'train') {
      return (
        <IonIcon className='service-type-icon' icon={bus} />
      )
    }
  }

  // Get platform class with color coding if enabled
  function getPlatformClassWithColor(platform: string) {
    const baseClass = getPlatformClass(platform);
    if (platformColorEnabled && platform && platform !== 'TBC' && platform !== 'BUS') {
      const color = getPlatformColor(platform);
      return `${baseClass} platform-colored`;
    }
    return baseClass;
  }

  // Get platform style with color coding if enabled
  function getPlatformStyle(platform: string) {
    if (platformColorEnabled && platform && platform !== 'TBC' && platform !== 'BUS') {
      const color = getPlatformColor(platform);
      return { backgroundColor: color, color: '#000000' };
    }
    return {};
  }

  async function handleRemoveFavorite(both: boolean = false) {
    if (both) {
      await toggleJourneyFavoriteBothWays(from, to);
    } else {
      await toggleJourneyFavorite(from, to);
    }
    if (onToggleFavorite) {
      onToggleFavorite();
    }
  }

  async function handleAddFavorite(both: boolean = false) {
    if (both) {
      await toggleJourneyFavoriteBothWays(from, to);
    } else {
      await toggleJourneyFavorite(from, to);
    }
    if (onToggleFavorite) {
      onToggleFavorite();
    }
  }

  // Always initialize platformColorEnabled from preferences on mount
  useEffect(() => {
    async function fetchPlatformColor() {
      const platformColor = await getPreferenceBoolean('platformColourEnabled', false);
      setPlatformColorEnabled(platformColor);
    }
    fetchPlatformColor();
    // Listen for preferencesChanged event to update platformColorEnabled
    const handlePreferencesChanged = async () => {
      const platformColor = await getPreferenceBoolean('platformColourEnabled', false);
      setPlatformColorEnabled(platformColor);
    };
    window.addEventListener('preferencesChanged', handlePreferencesChanged);
    return () => {
      window.removeEventListener('preferencesChanged', handlePreferencesChanged);
    };
  }, []);

  useEffect(() => {
    if (!initialised) {
      init();
    }
    // Check for return leg
    (async () => {
      if (from && to) {
        setReturnLegExists(await hasReturnLeg(from, to));
      } else {
        setReturnLegExists(false);
      }
    })();
  }, [departures, from, to]);

  // Check if any departure is a bus service
  function hasBusService(departures: any[]) {
    return departures.some(departure => {
      const serviceType = _.get(departure, 'serviceType');
      const platform = _.get(departure, 'platform');
      return serviceType === 'bus' || platform === 'BUS';
    });
  }

  // Show bus service warning if any departure is a bus
  function showBusServiceWarning(departures: any[]) {
    if (hasBusService(departures)) {
      return (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          color: '#856404', 
          padding: '8px 12px', 
          marginBottom: '8px', 
          borderRadius: '4px', 
          border: '1px solid #ffeaa7',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <IonIcon icon={bus} style={{ fontSize: '16px' }} />
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            Replacement bus service in operation
          </span>
        </div>
      );
    }
    return null;
  }

  if (departures && departures.length > 0) {
    if (to && to.length > 0) {
      return (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              {getStationNameFromCrs(from)} to {getStationNameFromCrs(to)}
              {isFavorite ? (
                <IonIcon 
                  icon={star} 
                  color="warning" 
                  style={{ marginLeft: '8px', cursor: 'pointer' }} 
                  onClick={async () => {
                    if (returnLegExists) {
                      setShowBothLegsAlert('remove');
                    } else {
                      setShowRemoveFavoriteAlert(true);
                    }
                  }}
                />
              ) : (
                <IonIcon 
                  icon={starOutline} 
                  color="medium" 
                  style={{ marginLeft: '8px', cursor: 'pointer' }} 
                  onClick={async () => {
                    if (returnLegExists) {
                      setShowBothLegsAlert('add');
                    } else {
                      setShowAddFavoriteAlert(true);
                    }
                  }}
                />
              )}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {showBusServiceWarning(departures)}
            <IonGrid>
              <IonRow key={headerRowKey}>
                <IonCol className='ion-text-center'>
                  Estimated
                </IonCol>
                <IonCol className='ion-text-center'>
                  Length
                </IonCol>
                <IonCol className='ion-text-center'>
                  Platform
                </IonCol>
              </IonRow>
              {showDepartures(departures as any[], to)}
              <DeleteJourneyButton from={from} to={to} editMode={editMode} />
              <AddReturnJourneyButton from={from} to={to} editMode={editMode} />
              <ToggleFavoriteButton
                from={from}
                to={to}
                editMode={editMode}
                isFavorite={isFavorite}
                onToggle={onToggleFavorite}
              />
            </IonGrid>
          </IonCardContent>
          <IonAlert
            isOpen={showRemoveFavoriteAlert}
            onDidDismiss={() => setShowRemoveFavoriteAlert(false)}
            header="Remove from Favorites"
            message={`Are you sure you want to remove \"${getStationNameFromCrs(from)}${to ? ` to ${getStationNameFromCrs(to)}` : ''}\" from your favorites?`}
            buttons={[
              {
                text: 'Cancel',
                role: 'cancel',
                handler: () => setShowRemoveFavoriteAlert(false)
              },
              {
                text: 'Remove',
                role: 'destructive',
                handler: () => {
                  handleRemoveFavorite();
                  setShowRemoveFavoriteAlert(false);
                }
              }
            ]}
          />
          <IonAlert
            isOpen={showAddFavoriteAlert}
            onDidDismiss={() => setShowAddFavoriteAlert(false)}
            header="Add to Favorites"
            message={`Are you sure you want to add \"${getStationNameFromCrs(from)}${to ? ` to ${getStationNameFromCrs(to)}` : ''}\" to your favorites?`}
            buttons={[
              {
                text: 'Cancel',
                role: 'cancel',
                handler: () => setShowAddFavoriteAlert(false)
              },
              {
                text: 'Add',
                handler: () => {
                  handleAddFavorite();
                  setShowAddFavoriteAlert(false);
                }
              }
            ]}
          />
          <IonAlert
            isOpen={!!showBothLegsAlert}
            onDidDismiss={() => setShowBothLegsAlert(null)}
            header={showBothLegsAlert === 'add' ? 'Add to Favorites' : 'Remove from Favorites'}
            message={`Would you like to ${showBothLegsAlert === 'add' ? 'add' : 'remove'} just this journey or both this journey (${getStationNameFromCrs(from)}${to ? ` to ${getStationNameFromCrs(to)}` : ''}) and its return leg (${getStationNameFromCrs(to)}${to ? ` to ${getStationNameFromCrs(from)}` : ''})?`}
            buttons={[
              {
                text: showBothLegsAlert === 'add' ? 'Add both journeys' : 'Remove both journeys',
                handler: () => {
                  if (showBothLegsAlert === 'add') handleAddFavorite(true);
                  else handleRemoveFavorite(true);
                  setShowBothLegsAlert(null);
                }
              },
              {
                text: showBothLegsAlert === 'add' ? 'Add this journey only' : 'Remove this journey only',
                handler: () => {
                  if (showBothLegsAlert === 'add') handleAddFavorite(false);
                  else handleRemoveFavorite(false);
                  setShowBothLegsAlert(null);
                }
              },
              {
                text: 'Cancel',
                role: 'cancel',
                handler: () => setShowBothLegsAlert(null)
              }
            ]}
          />
        </IonCard>
      )
    }
    else {
      return (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '10px' }}>
              {getStationNameFromCrs(from)}
              {isFavorite ? (
                <IonIcon 
                  icon={star} 
                  color="warning" 
                  style={{ marginLeft: '8px', cursor: 'pointer' }} 
                  onClick={async () => {
                    if (returnLegExists) {
                      setShowBothLegsAlert('remove');
                    } else {
                      setShowRemoveFavoriteAlert(true);
                    }
                  }}
                />
              ) : (
                <IonIcon 
                  icon={starOutline} 
                  color="medium" 
                  style={{ marginLeft: '8px', cursor: 'pointer' }} 
                  onClick={async () => {
                    if (returnLegExists) {
                      setShowBothLegsAlert('add');
                    } else {
                      setShowAddFavoriteAlert(true);
                    }
                  }}
                />
              )}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {showBusServiceWarning(departures)}
            <IonGrid>
              <IonRow key={headerRowKey}>
                <IonCol size='3' className='ion-text-center'>
                  Departing
                </IonCol>
                <IonCol className='destination'>
                  Destination
                </IonCol>
                <IonCol size='3' className='ion-text-center'>
                  Platform
                </IonCol>
              </IonRow>
              {showDepartures(departures as any[], to)}
              <DeleteJourneyButton from={from} to={to} editMode={editMode} />
              <AddReturnJourneyButton from={from} to={to} editMode={editMode} />
              <ToggleFavoriteButton
                from={from}
                to={to}
                editMode={editMode}
                isFavorite={isFavorite}
                onToggle={onToggleFavorite}
              />
            </IonGrid>
          </IonCardContent>
          <IonAlert
            isOpen={showRemoveFavoriteAlert}
            onDidDismiss={() => setShowRemoveFavoriteAlert(false)}
            header="Remove from Favorites"
            message={`Are you sure you want to remove \"${getStationNameFromCrs(from)}\" from your favorites?`}
            buttons={[
              {
                text: 'Cancel',
                role: 'cancel',
                handler: () => setShowRemoveFavoriteAlert(false)
              },
              {
                text: 'Remove',
                role: 'destructive',
                handler: () => {
                  handleRemoveFavorite();
                  setShowRemoveFavoriteAlert(false);
                }
              }
            ]}
          />
          <IonAlert
            isOpen={showAddFavoriteAlert}
            onDidDismiss={() => setShowAddFavoriteAlert(false)}
            header="Add to Favorites"
            message={`Are you sure you want to add \"${getStationNameFromCrs(from)}\" to your favorites?`}
            buttons={[
              {
                text: 'Cancel',
                role: 'cancel',
                handler: () => setShowAddFavoriteAlert(false)
              },
              {
                text: 'Add',
                handler: () => {
                  handleAddFavorite();
                  setShowAddFavoriteAlert(false);
                }
              }
            ]}
          />
          <IonAlert
            isOpen={!!showBothLegsAlert}
            onDidDismiss={() => setShowBothLegsAlert(null)}
            header={showBothLegsAlert === 'add' ? 'Add to Favorites' : 'Remove from Favorites'}
            message={`Would you like to ${showBothLegsAlert === 'add' ? 'add' : 'remove'} just this journey or both this journey (${getStationNameFromCrs(from)}${to ? ` to ${getStationNameFromCrs(to)}` : ''}) and its return leg (${getStationNameFromCrs(to)}${to ? ` to ${getStationNameFromCrs(from)}` : ''})?`}
            buttons={[
              {
                text: showBothLegsAlert === 'add' ? 'Add both journeys' : 'Remove both journeys',
                handler: () => {
                  if (showBothLegsAlert === 'add') handleAddFavorite(true);
                  else handleRemoveFavorite(true);
                  setShowBothLegsAlert(null);
                }
              },
              {
                text: showBothLegsAlert === 'add' ? 'Add this journey only' : 'Remove this journey only',
                handler: () => {
                  if (showBothLegsAlert === 'add') handleAddFavorite(false);
                  else handleRemoveFavorite(false);
                  setShowBothLegsAlert(null);
                }
              },
              {
                text: 'Cancel',
                role: 'cancel',
                handler: () => setShowBothLegsAlert(null)
              }
            ]}
          />
        </IonCard>
      )
    }
  }
  else {
    return (
      <NoDeparturesFound 
        from={from} 
        to={to} 
        editMode={editMode}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />
    )
  }
}

export default Departures;