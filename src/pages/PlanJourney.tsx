import { getPreferenceJson, setPreferenceJson } from "../lib/preferences";
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonPage, IonTitle, IonToolbar, IonToggle } from "@ionic/react";
import { informationCircle, star, starOutline } from 'ionicons/icons';
import _, { get } from "lodash";
import { useEffect, useState } from "react";
import Departures from "../components/Departures";
import StationPicker from "../components/StationPicker";
import LocationWarning from "../components/LocationWarning";
import { getCurrentLocation } from "../lib/location";

import './PlanJourney.css';

const PlanJourney: React.FC = () => {

    const [departureStation, setDepartureStation] = useState<any>({});
    const [destinationStation, setDestinationStation] = useState<any>({});
    const [doesJourneyAlreadyExist, setDoesJourneyAlreadyExist] = useState(false);
    const [markAsFavorite, setMarkAsFavorite] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    // Fetch location once on mount
    useEffect(() => {
      (async () => {
        const locationResult = await getCurrentLocation();
        if (locationResult && locationResult.coords) {
          setUserLocation({
            latitude: locationResult.coords.latitude,
            longitude: locationResult.coords.longitude
          });
        } else {
          setUserLocation(null);
        }
      })();
    }, []);

    async function addJourney(addReturnJourney: boolean) {
        const journeys = await getPreferenceJson('journeys') || [];
        const fromCrs = _.get(departureStation, 'crs');
        const toCrs = _.get(destinationStation, 'crs');
        if (fromCrs && toCrs) {
            journeys.push({ from: fromCrs, to: toCrs, favorite: markAsFavorite });
            if (addReturnJourney) {
                journeys.push({ from: toCrs, to: fromCrs, favorite: markAsFavorite });
            }
            await setPreferenceJson('journeys', _.uniq(journeys));
            window.dispatchEvent(new CustomEvent('journeysChanged'));
        }
        // Redirect based on whether journey is marked as favorite
        if (markAsFavorite) {
            // Redirect to Favorites tab
            window.location.href = '/favourites';
        } else {
            // Redirect to My Journeys tab
            window.location.href = '/my_journeys';
        }
    }

    function selectDepartureStation(station: any) {
        setDepartureStation(station);
    }

    function selectDestinationStation(station: any) {
        setDestinationStation(station);
        checkJourneyExists(station);
        scrollToAddJourneyButton();
    }

    async function checkJourneyExists(station: any) {
        let journeyAlreadyExists = false;
        const from = _.get(departureStation, 'crs');
        const to = _.get(station, 'crs');
        if (from && to) {
            const journeys = await getPreferenceJson('journeys') || [];
            journeyAlreadyExists = journeys.some((journey: any) => journey.from === from && journey.to === to);
        }
        setDoesJourneyAlreadyExist(journeyAlreadyExists);
    }

    async function scrollToAddJourneyButton(retryCount = 0) {
        // Sleep for a bit to allow the button to render
        await new Promise(resolve => setTimeout(resolve, 100));
        // Scroll to the add journey button
        const button = document.getElementById('add-journey-button');
        if (button) {
            button.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
        } else {
            if (retryCount < 5) {
                setTimeout(() => {
                    scrollToAddJourneyButton(retryCount + 1);
                }, 100);
            }
        }
    }

    function clearDepartureStation() {
        setDepartureStation({});
    }

    function clearDestinationStation() {
        setDestinationStation({});
    }

    function clearJourneyInput() {
        setDepartureStation({});
        setDestinationStation({});
        setMarkAsFavorite(false);
    }

    function showDepartures() {
        if (!doesJourneyAlreadyExist) {
            const from = _.get(departureStation, 'crs');
            const to = _.get(destinationStation, 'crs');
            if (from && to) {
                return (
                    <Departures from={from} to={to} />
                );
            }
        }
        else {
            return (
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>Journey already exists</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        This journey has already been added to your home screen.
                    </IonCardContent>
                </IonCard>
            );
        }
    }

    function showSaveButton() {
        if (!doesJourneyAlreadyExist && departureStation && departureStation.crs && destinationStation && destinationStation.crs) {
            return (
                <div id='add-journey-button'>
                    <IonItem>
                        <IonIcon icon={markAsFavorite ? star : starOutline} slot="start" color={markAsFavorite ? "warning" : "medium"} />
                        <IonLabel>Mark as favourite</IonLabel>
                        <IonToggle 
                            slot="end" 
                            checked={markAsFavorite} 
                            onIonChange={(e) => setMarkAsFavorite(e.detail.checked)}
                        />
                    </IonItem>
                    <IonButton className='ion-margin-bottom' color='secondary' expand='block' onClick={() => addJourney(true)}>Save and add return journey</IonButton>
                    <IonButton className='ion-margin-bottom' expand='block' onClick={() => addJourney(false)}>Save this journey only</IonButton>
                    <IonButton className='ion-margin-bottom' color='medium' expand='block' onClick={clearJourneyInput}>Clear and start again</IonButton>
                </div>
            );
        }
    }

    function shouldFocusOnDepartureStation() {
        return !departureStation || !departureStation.crs;
    }

    function shouldFocusOnDestinationStation() {
        return departureStation && departureStation.crs && (!destinationStation || !destinationStation.crs);
    }

    function goToFavouritesScreen() {
        window.location.href = '/favourites';
    }

    function handleCancel() {
        clearJourneyInput();
        window.history.back();
    }

    useEffect(() => {
    }, [departureStation, destinationStation, doesJourneyAlreadyExist]);

    return (

        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Add Journey</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle size="large">Add Journey</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <LocationWarning />
                    <StationPicker shouldFocus={shouldFocusOnDepartureStation()} title='From' selectStation={selectDepartureStation} selectedStation={departureStation} clearSelection={clearDepartureStation} userLocation={userLocation} />
                    <StationPicker shouldFocus={shouldFocusOnDestinationStation()} title='To' selectStation={selectDestinationStation} selectedStation={destinationStation} clearSelection={clearDestinationStation} userLocation={userLocation} />
                    {showDepartures()}
                    {showSaveButton()}
                    <IonButton expand='block' color='medium' aria-label="Cancel" onClick={handleCancel} style={{ marginTop: 16 }}>Cancel</IonButton>
                    {/* Notes section */}
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <IonIcon icon={informationCircle} />
                            <span style={{ fontWeight: 500, fontSize: 14, color: '#666' }}>Notes:</span>
                        </div>
                        <div style={{ paddingLeft: 0, marginTop: 4 }}>
                            <ul style={{ fontSize: 12, color: '#888', margin: 0, paddingLeft: 20 }}>
                                <li>Data is sourced from National Rail (<a href='https://raildata.org.uk/dataProduct/P-d81d6eaf-8060-4467-a339-1c833e50cbbe/overview' target='_blank'>source</a>)</li>
                                <li>This is the same data used by station departure boards</li>
                                <li>Trains up to a maximum of 4 hours from now are shown</li>
                                <li>Only direct routes are supported</li>
                            </ul>
                        </div>
                    </div>
                </IonContent>
            </IonContent>
        </IonPage>
    );
};

export default PlanJourney;