import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, IonLabel, IonToast, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonList, IonSelect, IonSelectOption, IonButton, IonToggle, IonRange } from '@ionic/react';
import { useEffect, useState, useRef } from 'react';
import { informationCircle } from 'ionicons/icons';
import { getPreferenceNumber, setPreferenceNumber, getPreferenceBoolean, setPreferenceBoolean } from '../lib/preferences';
import LocationWarning from '../components/LocationWarning';
import './Preferences.css';

const PreferencesTab: React.FC = () => {

  const [currentMaxDepartures, setCurrentMaxDepartures] = useState(0);
  const [platformColourEnabled, setPlatformColourEnabled] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [highlightShortTrainLength, setHighlightShortTrainLength] = useState(4);
  const [highlightShortTrainsEnabled, setHighlightShortTrainsEnabled] = useState(true);
  const [maxStationDistanceMiles, setMaxStationDistanceMiles] = useState('3');
  const [stationFilteringEnabled, setStationFilteringEnabled] = useState(true);

  // Add local state for the three inputs
  const [shortTrainInput, setShortTrainInput] = useState('4');
  const [stationDistanceInput, setStationDistanceInput] = useState('3');

  // Debounce refs
  const shortTrainTimeout = useRef<NodeJS.Timeout | null>(null);

  // Loading state to prevent init/update overlap
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Sync state to input fields when preferences change
  useEffect(() => {
    setShortTrainInput(highlightShortTrainLength.toString());
  }, [highlightShortTrainLength]);
  useEffect(() => {
    setStationDistanceInput(maxStationDistanceMiles.toString());
  }, [maxStationDistanceMiles]);

  useEffect(() => {
    if (!updating) {
      init();
    }
    // eslint-disable-next-line
  }, []);

  async function init() {
    if (loading || updating) return;
    setLoading(true);
    let maxDepartures = await getPreferenceNumber('maxDepartures', 5);
    if (isNaN(maxDepartures) || maxDepartures < 1) {
      maxDepartures = 5;
      await setPreferenceNumber('maxDepartures', 5);
    }
    const platformColour = await getPreferenceBoolean('platformColourEnabled', true); // default enabled
    let highlightLength = await getPreferenceNumber('highlightShortTrainLength', 4);
    if (isNaN(highlightLength) || highlightLength < 1) {
      highlightLength = 4;
      await setPreferenceNumber('highlightShortTrainLength', 4);
    }
    const highlightEnabled = await getPreferenceBoolean('highlightShortTrainsEnabled', true);
    let maxDistance = await getPreferenceNumber('maxStationDistanceMiles', 3);
    if (isNaN(maxDistance) || maxDistance <= 0) {
      maxDistance = 3;
      await setPreferenceNumber('maxStationDistanceMiles', 3);
    }
    const filteringEnabled = await getPreferenceBoolean('stationFilteringEnabled', false); // default disabled
    setCurrentMaxDepartures(maxDepartures);
    setPlatformColourEnabled(platformColour);
    setHighlightShortTrainLength(highlightLength);
    setHighlightShortTrainsEnabled(highlightEnabled);
    setMaxStationDistanceMiles(maxDistance.toString());
    setStationFilteringEnabled(filteringEnabled);
    setLoading(false);
  }

  async function updateMaxDepartures(value: number) {
    if (loading) return;
    setUpdating(true);
    setCurrentMaxDepartures(value);
    await setPreferenceNumber('maxDepartures', value);
    setIsToastOpen(true);
    setUpdating(false);
    window.dispatchEvent(new CustomEvent('preferencesChanged'));
  }

  async function updatePlatformColour(enabled: boolean) {
    if (loading) return;
    setUpdating(true);
    setPlatformColourEnabled(enabled);
    await setPreferenceBoolean('platformColourEnabled', enabled);
    setIsToastOpen(true);
    setUpdating(false);
    window.dispatchEvent(new CustomEvent('preferencesChanged'));
  }

  async function updateHighlightShortTrainLength(value: number) {
    if (loading) return;
    setUpdating(true);
    setHighlightShortTrainLength(value);
    await setPreferenceNumber('highlightShortTrainLength', value);
    setIsToastOpen(true);
    setUpdating(false);
    window.dispatchEvent(new CustomEvent('preferencesChanged'));
  }

  async function updateHighlightShortTrainsEnabled(enabled: boolean) {
    if (loading) return;
    setUpdating(true);
    setHighlightShortTrainsEnabled(enabled);
    await setPreferenceBoolean('highlightShortTrainsEnabled', enabled);
    setIsToastOpen(true);
    setUpdating(false);
    window.dispatchEvent(new CustomEvent('preferencesChanged'));
  }

  async function updateMaxStationDistanceMiles(value: string) {
    if (loading) return;
    setUpdating(true);
    setMaxStationDistanceMiles(value);
    const num = Number(value);
    await setPreferenceNumber('maxStationDistanceMiles', isNaN(num) ? 0 : num);
    setIsToastOpen(true);
    setUpdating(false);
    window.dispatchEvent(new CustomEvent('preferencesChanged'));
  }

  async function updateStationFilteringEnabled(enabled: boolean) {
    if (loading) return;
    setUpdating(true);
    setStationFilteringEnabled(enabled);
    await setPreferenceBoolean('stationFilteringEnabled', enabled);
    setIsToastOpen(true);
    setUpdating(false);
    window.dispatchEvent(new CustomEvent('preferencesChanged'));
  }

  function goToFavouritesScreen() {
    window.location.href = '/favourites';
  }

  // Debounced validation and update for short train
  function handleShortTrainLengthInput(e: React.ChangeEvent<HTMLInputElement>) {
    setShortTrainInput(e.target.value);
    if (shortTrainTimeout.current) clearTimeout(shortTrainTimeout.current);
    shortTrainTimeout.current = setTimeout(() => {
      validateAndUpdateShortTrain(e.target.value);
    }, 2000);
  }
  function handleShortTrainBlur() {
    validateAndUpdateShortTrain(shortTrainInput);
  }
  function validateAndUpdateShortTrain(val: string) {
    let value = Math.floor(Number(val));
    if (isNaN(value) || value < 1) value = 1;
    setShortTrainInput(value.toString());
    updateHighlightShortTrainLength(value);
  }

  // useEffect(() => { // REMOVED
  //   init(); // REMOVED
  // }, [currentMaxDepartures, platformColourEnabled]); // REMOVED

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Preferences</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Preferences</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Location Warning */}
        <LocationWarning />

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Departures
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonLabel position="stacked">Number of departures to show</IonLabel>
                <IonRange
                  min={1}
                  max={10}
                  step={1}
                  value={currentMaxDepartures || 5}
                  onIonChange={e => updateMaxDepartures(Number(e.detail.value))}
                  snaps={true}
                  ticks={true}
                  style={{ width: '100%' }}
                />
              </IonItem>
             <div style={{ margin: '0.5em 0 0.5em 0', textAlign: 'center', fontSize: '1em' }}>
               A maximum of <b>{currentMaxDepartures || 5}</b> departure{(currentMaxDepartures || 5) === 1 ? '' : 's'} will be shown for each journey
             </div>
            </IonList>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Station Filtering
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonLabel>Enable station distance filtering</IonLabel>
                <IonToggle
                  slot="end"
                  checked={stationFilteringEnabled}
                  onIonChange={(e) => updateStationFilteringEnabled(e.detail.checked)}
                />
              </IonItem>
              {stationFilteringEnabled && (
                <IonItem lines="none">
                  <IonRange
                    min={1}
                    max={10}
                    step={1}
                    value={Number(stationDistanceInput) || 3}
                    onIonChange={e => {
                      setStationDistanceInput(e.detail.value.toString());
                      updateMaxStationDistanceMiles(e.detail.value.toString());
                    }}
                    snaps={true}
                    ticks={true}
                    style={{ width: '100%' }}
                  />
                </IonItem>
              )}
              {stationFilteringEnabled && (
                <div style={{ margin: '0.5em 0 0.5em 0', textAlign: 'center', fontSize: '1em' }}>
                  Only journeys where the departure station is less than <b>{stationDistanceInput}</b> mile{Number(stationDistanceInput) === 1 ? '' : 's'} away will be shown
                </div>
              )}
            </IonList>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Short Trains
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonLabel>Highlight short trains</IonLabel>
                <IonToggle
                  slot="end"
                  checked={highlightShortTrainsEnabled}
                  onIonChange={(e) => updateHighlightShortTrainsEnabled(e.detail.checked)}
                />
              </IonItem>
              {highlightShortTrainsEnabled && (
                <IonItem lines="none">
                  <IonRange
                    min={1}
                    max={10}
                    step={1}
                    value={Number(shortTrainInput) || 4}
                    onIonChange={e => {
                      setShortTrainInput(e.detail.value.toString());
                      updateHighlightShortTrainLength(Number(e.detail.value));
                    }}
                    snaps={true}
                    ticks={true}
                    style={{ width: '100%' }}
                  />
                </IonItem>
              )}
              {highlightShortTrainsEnabled && (
                <div style={{ margin: '0.5em 0 0.5em 0', textAlign: 'center', fontSize: '1em' }}>
                  Trains with <b>{shortTrainInput}</b> coach{Number(shortTrainInput) === 1 ? '' : 'es'} or fewer will be highlighted
                </div>
              )}
            </IonList>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Platform Display
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonLabel>Platform Colour Coding</IonLabel>
                <IonToggle
                  slot="end"
                  checked={platformColourEnabled}
                  onIonChange={(e) => updatePlatformColour(e.detail.checked)}
                />
              </IonItem>
              {platformColourEnabled && (
              <div style={{ margin: '0.5em 0 0.5em 0', textAlign: 'center', fontSize: '1em' }}>
                Each platform number will have a consistent background colour to help you quickly identify your platform.
              </div>
              )}
            </IonList>

          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={isToastOpen}
          message="Preferences updated"
          color="success"
          position="top"
          onDidDismiss={() => setIsToastOpen(false)}
          duration={3000}
          buttons={[
            {
              text: 'Dismiss',
              role: 'cancel',
              handler: () => {
                setIsToastOpen(false);
              },
            },
          ]}
        ></IonToast>

      </IonContent>
    </IonPage>
  );
};

export default PreferencesTab;

