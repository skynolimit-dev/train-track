import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { Storage } from "@ionic/storage";
import { informationCircle } from 'ionicons/icons';
import _ from "lodash";
import { useEffect, useState } from "react";
import Departures from "../components/Departures";
import StationPicker from "../components/StationPicker";

import './PlanJourney.css';

const store = new Storage();

const PlanJourney: React.FC = () => {

    const [departureStation, setDepartureStation] = useState<any>({});
    const [destinationStation, setDestinationStation] = useState<any>({});
    const [doesJourneyAlreadyExist, setDoesJourneyAlreadyExist] = useState(false);

    async function init() {
        await store.create();
    }

    async function addJourney(addReturnJourney: boolean) {
        const journeys = await store.get('journeys') || [];
        const fromCrs = _.get(departureStation, 'crs');
        const toCrs = _.get(destinationStation, 'crs');
        if (fromCrs && toCrs) {
            journeys.push({ from: fromCrs, to: toCrs });
            if (addReturnJourney) {
                journeys.push({ from: toCrs, to: fromCrs });
            }
            console.log('Saving journey', fromCrs, toCrs, journeys);
            await store.set('journeys', _.uniq(journeys));
        }
        // Redirect to home
        window.location.href = '/home';
    }

    function selectDepartureStation(station: any) {
        console.log('Choose departure station', station);
        setDepartureStation(station);
    }

    function selectDestinationStation(station: any) {
        console.log('Choose destination station', station);
        setDestinationStation(station);
        console.log('Destination station', station, destinationStation);
        checkJourneyExists(station);
        scrollToAddJourneyButton();
    }

    async function checkJourneyExists(station: any) {
        console.log('Checking if journey exists', departureStation, destinationStation);
        let journeyAlreadyExists = false;
        const from = _.get(departureStation, 'crs');
        const to = _.get(station, 'crs');
        if (from && to) {
            const journeys = await store.get('journeys') || [];
            journeyAlreadyExists = journeys.some((journey: any) => journey.from === from && journey.to === to);
            console.log('Checking if journey exists', from, to, journeyAlreadyExists, journeys);
        }
        setDoesJourneyAlreadyExist(journeyAlreadyExists);
    }

    async function scrollToAddJourneyButton(retryCount = 0) {
        // Sleep for a bit to allow the button to render
        await new Promise(resolve => setTimeout(resolve, 100));
        // Scroll to the add journey button
        const button = document.getElementById('add-journey-button');
        if (button) {
            console.log('Scrolling to button');
            button.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
        } else {
            if (retryCount < 5) {
                console.log('Retrying scroll to button');
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
                    <IonButton className='ion-margin-bottom' expand='block' onClick={() => addJourney(false)}>Save journey</IonButton>
                    <IonButton className='ion-margin-bottom' color='secondary' expand='block' onClick={() => addJourney(true)}>Save and add return journey</IonButton>
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

    function goToHomeScreen() {
        window.location.href = '/home';
    }

    useEffect(() => {
        // console.log('Use effect - add favourite');
        init();
    }, [departureStation, destinationStation, doesJourneyAlreadyExist]);

    return (

        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Plan Journey</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle size="large">Plan Journey</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <IonItem>
                        <IonIcon icon={informationCircle}></IonIcon>
                        <IonLabel className="ion-text-wrap ion-padding">
                            Note: Train Checker only supports direct journeys. If you need to change trains, please use multiple journeys.
                        </IonLabel>
                    </IonItem>
                    <StationPicker shouldFocus={shouldFocusOnDepartureStation()} title='From' selectStation={selectDepartureStation} selectedStation={departureStation} clearSelection={clearDepartureStation} />
                    <StationPicker shouldFocus={shouldFocusOnDestinationStation()} title='To' selectStation={selectDestinationStation} selectedStation={destinationStation} clearSelection={clearDestinationStation} />
                    {showDepartures()}
                    {showSaveButton()}
                    <div className="ion-padding-bottom">
                        <IonButton className='ion-margin-bottom ion-padding-bottom' expand='block' color='danger' onClick={goToHomeScreen}>Cancel</IonButton>
                    </div>
                </IonContent>
            </IonContent>
        </IonPage>
    );
};

export default PlanJourney;