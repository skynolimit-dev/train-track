import { Storage } from '@ionic/storage';
import { useEffect, useState } from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonGrid, IonIcon, IonRow, IonSpinner } from '@ionic/react';
import { bus } from 'ionicons/icons';
import { getStationNameFromCrs } from '../lib/stations';
import { getServiceInfo, getTrainTimes } from '../lib/trains';
import DeleteJourneyButton from './DeleteJourneyButton';
import AddReturnJourneyButton from './AddReturnJourneyButton';
import './Departures.css';
import NoDeparturesFound from './NoDeparturesFound';
import _ from 'lodash';
import moment from 'moment';

interface ContainerProps {
  from: string;
  to: string;
  editMode?: boolean;
}

// Set lastDeparturesUpdateTime to 5 minutes ago to force an update on first load
let lastDeparturesUpdateTime = moment().subtract(5, 'minutes');
let lastArrivalsUpdateTimes = {};

// Calculates the difference in minutes between the two times
// Note that the times are in the format "HH:MM"
function getDelayInMinutes(bookedTime: any, realTime: any) {
  // Use moment to calculate the difference in minutes
  bookedTime = moment(bookedTime, 'HH:mm');
  realTime = moment(realTime, 'HH:mm');
  const diff = realTime.diff(bookedTime, 'minutes');
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

const Departures: React.FC<ContainerProps> = ({ from, to, editMode }) => {

  const [initialised, setInitialised] = useState(false);
  const [departures, setDepartures] = useState([]);
  const [arrivals, setArrivals] = useState<{ gbttBookedArrival: string, realtimeArrival: string }[]>([]);
  const headerRowKey = `${from}-${to}-header`;

  let updateTimeout: any;

  async function init() {
    // console.log('Initialising departures screen', from, to);

    updateDepartures();
    setInitialised(true);
  }

  async function updateDepartures(retryCount = 0) {
    // If the last arrivals update is within the last 5 minutes, don't update again
    if (lastDeparturesUpdateTime && moment().diff(lastDeparturesUpdateTime, 'seconds') < 10) {
      console.log('Skipping departures update');
      return;
    }
    else {

      // console.log('Updating departures', from, to, retryCount);

      if (retryCount < 3) {
        // console.log(new Date().toUTCString(), 'Updating departures');
        const apiData = await getTrainTimes(from, to);
        const store = new Storage();
        await store.create();
        const maxDepartures = await store.get('maxDepartures') || 3;
        let departures = _.get(apiData, 'departures');
        if (!departures) {
          console.warn(`No departures found from ${from} to ${to} on retry count ${retryCount}`);
          updateDepartures(retryCount + 1);
        } else {
          departures = departures.slice(0, maxDepartures);
          updateArrivals(departures, from, to);
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

  // Updates the arrival times for the respective departures at the destination station ("toCrs")
  async function updateArrivals(departures: any, from: string, to: string) {
    // console.log('Updating arrivals', from, to);
    _.set(lastArrivalsUpdateTimes, `${from}-${to}`, moment());

    if (departures && departures.length > 0) {
      let arrivals = [];
      for (const departure of departures) {
        const serviceUid = _.get(departure, 'serviceUid');
        const runDate = _.get(departure, 'runDate', moment().format('YYYY-MM-DD'));
        console.log('Updating service', serviceUid, runDate);
        const serviceInfo = await getServiceInfo(serviceUid, runDate);
        const serviceCallingPoints = _.get(serviceInfo, 'locations', []);
        for (const callingPoint of serviceCallingPoints) {
          if (callingPoint.crs === to) {
            // console.log('Arrival time', callingPoint);
            arrivals.push({
              gbttBookedArrival: callingPoint.gbttBookedArrival,
              realtimeArrival: callingPoint.realtimeArrival
            });
          }
        }
      }
      setArrivals(arrivals);
    }

  }

  // Show the departures
  function showDepartures(departures: any[]) {
    if (departures && departures.length > 0) {
      return departures.map((departure: any, index: number) => (
        { ...showDeparture(departure, index) }
      ));
    }
  }

  // Get the arrival time for the specified departure by index
  function getArrival(index: number, arrivalDelayInMinutes: number = 0) {
    const arrival = _.get(arrivals[index], 'realtimeArrival');
    if (arrival) {
      return (
        <div className={getDelayClass(arrivalDelayInMinutes)}>
          {formatTime(arrival)}
        </div>
      );
    }
    else {
      return (
        <div className='loading'>
          <IonSpinner name='lines-sharp-small'></IonSpinner>
        </div>
      )
    }

  }

  function showDeparture(departure: any, index: number) {
    const realTimeDeparture = _.get(departure, 'locationDetail.realtimeDeparture');

    if (departure.locationDetail.cancelReasonCode) {
      return showDepartureCancelled(departure, index);
    }
    else if (realTimeDeparture) {
      return showDepartureRealTimeActivated(departure, index);
    }
    else {
      return showDepartureRealTimeUnavailable(departure, index);
    }
  }

  function showDepartureCancelled(departure: any, index: number) {
    const bookedDeparture = _.get(departure, 'locationDetail.gbttBookedDeparture');
    const rowKey = `${departure.serviceUid}-${departure.locationDetail.crs}-${bookedDeparture}-${index}`;
    const rowKeyInfo = `${rowKey}-info`;
    return (
      <>
        <IonRow key={rowKey}>
          <IonCol size='3' className='ion-text-center'>
            <div className='cancelled'>
              {formatTime(bookedDeparture)}
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
              Cancellation reason: {departure.locationDetail.cancelReasonLongText}
            </div>
          </IonCol>
        </IonRow>
      </>
    )
  }

  // Show the departure when real-time data is available
  function showDepartureRealTimeActivated(departure: any, index: number) {

    // console.log('Showing departure', departure, index);

    // Get scheduled and actual departure times
    const bookedDeparture = _.get(departure, 'locationDetail.gbttBookedDeparture');
    const realTimeDeparture = _.get(departure, 'locationDetail.realtimeDeparture', bookedDeparture);

    // Get scheduled and actual arrival times
    const bookedArrival = _.get(arrivals[index], 'gbttBookedArrival');
    const realTimeArrival = _.get(arrivals[index], 'realtimeArrival', bookedArrival);

    let platform = _.get(departure, 'locationDetail.platform');
    platform = platform && platform.length > 0 ? platform : 'TBC';

    const departureDelayInMinutes = getDelayInMinutes(bookedDeparture, realTimeDeparture);
    const arrivalDelayInMinutes = getDelayInMinutes(bookedArrival, realTimeArrival);

    const rowKey = `${departure.serviceUid}-${departure.locationDetail.crs}-${bookedDeparture}-${index}`;

    return (
      <IonRow key={rowKey}>
        <IonCol className='ion-text-center'>
          <div className={getDelayClass(departureDelayInMinutes)}>
            {formatTime(realTimeDeparture)}
          </div>
        </IonCol>
        <IonCol className="ion-text-center">
          <div className={getDelayClass(departureDelayInMinutes)}>
            {departureDelayInMinutes > 0 ? `+${departureDelayInMinutes}` : departureDelayInMinutes}
          </div>
        </IonCol>
        <IonCol className='ion-text-center'>
          {getArrival(index, arrivalDelayInMinutes)}
        </IonCol>
        <IonCol className='ion-text-center'>
          <div className='platform'>
            {platform}
          </div>
        </IonCol>
      </IonRow>
    )
  }

  // Show the departure when real-time data is unavailable, e.g. a replacement bus service is in operation
  function showDepartureRealTimeUnavailable(departure: any, index: number) {

    // console.log('Showing departure', departure, index);

    // Get the booked departure time
    const bookedDeparture = _.get(departure, 'locationDetail.gbttBookedDeparture');

    // Get the booked arrival time
    const bookedArrival = _.get(departure, 'locationDetail.destination[0].publicTime', 'No info');

    let platform = _.get(departure, 'locationDetail.platform');
    platform = platform && platform.length > 0 ? platform : getServiceTypeIcon(departure.serviceType);

    const rowKey = `${departure.serviceUid}-${departure.locationDetail.crs}-${bookedDeparture}-${index}`;

    return (
      <IonRow key={rowKey}>
        <IonCol className='ion-text-center'>
          <div className='mild-delay'>
            {formatTime(bookedDeparture)}
          </div>
        </IonCol>
        <IonCol className="ion-text-center">
          <div className='mild-delay'>
            Unknown
          </div>
        </IonCol>
        <IonCol className='ion-text-center'>
          <div className='mild-delay'>
            {formatTime(bookedArrival)}
          </div>
        </IonCol>
        <IonCol className='ion-text-center'>
          <div className={getServiceTypeClass(departure.serviceType)}>
            {platform}
          </div>
        </IonCol>
      </IonRow>
    )
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

  function formatTime(time: string) {
    // Return a 4 digit time string in the format HH:MM
    if (time && time.length === 4)
      return time.slice(0, 2) + ':' + time.slice(2);
    else
      return time;
  }

  useEffect(() => {
    if (!initialised) {
      init();
    }
  }, [departures, arrivals]);

  if (departures && departures.length > 0) {
    return (
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
            {getStationNameFromCrs(from)} to {getStationNameFromCrs(to)}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonGrid>
            <IonRow key={headerRowKey}>
              <IonCol className='ion-text-center'>
                Departing
              </IonCol>
              <IonCol className='ion-text-center'>
                Delay
              </IonCol>
              <IonCol className='ion-text-center'>
                Arrival
              </IonCol>
              <IonCol className='ion-text-center'>
                Platform
              </IonCol>
            </IonRow>
            {showDepartures(departures as any[])}
            <DeleteJourneyButton from={from} to={to} editMode={editMode} />
            <AddReturnJourneyButton from={from} to={to} editMode={editMode} />
          </IonGrid>
        </IonCardContent>
      </IonCard>
    );
  }
  else {
    return (
      <NoDeparturesFound from={from} to={to} editMode={editMode} />
    )
  }
}

export default Departures;
