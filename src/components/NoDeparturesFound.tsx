
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonAlert } from '@ionic/react';
import { star, starOutline } from 'ionicons/icons';
import { getStationNameFromCrs } from '../lib/stations';
import DeleteJourneyButton from './DeleteJourneyButton';
import AddReturnJourneyButton from './AddReturnJourneyButton';
import ToggleFavoriteButton from './ToggleFavoriteButton';
import { useState, useEffect } from 'react';
import { toggleJourneyFavorite, hasReturnLeg, toggleJourneyFavoriteBothWays } from '../lib/user';

import './Departures.css';


interface ContainerProps {
  from: string;
  to: string;
  editMode?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const NoDeparturesFound: React.FC<ContainerProps> = ({ from, to, editMode, isFavorite = false, onToggleFavorite }) => {
  const [showRemoveFavoriteAlert, setShowRemoveFavoriteAlert] = useState(false);
  const [showAddFavoriteAlert, setShowAddFavoriteAlert] = useState(false);
  const [showBothLegsAlert, setShowBothLegsAlert] = useState<null | 'add' | 'remove'>(null);
  const [returnLegExists, setReturnLegExists] = useState(false);

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

  // Check for return leg
  useEffect(() => {
    (async () => {
      if (from && to) {
        setReturnLegExists(await hasReturnLeg(from, to));
      } else {
        setReturnLegExists(false);
      }
    })();
  }, [from, to]);

  // For planned journeys, where a destination is specified
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
          <p>No direct trains found for the next 2 hours, but we'll keep on looking...</p>
          <p>Can't see a train you were expecting?</p>
          <ul>
            <li>Check the <a href='https://www.nationalrail.co.uk/status-and-disruptions/' target='_blank'>National Rail status and disruptions website</a></li>
            <li>Try a manual search on the <a href='https://www.nationalrail.co.uk' target='_blank'>National Rail Journey Planner website</a></li>
          </ul>
          {DeleteJourneyButton({ from, to, editMode })}
          {AddReturnJourneyButton({ from, to, editMode })}
          {ToggleFavoriteButton({ from, to, editMode, isFavorite, onToggle: onToggleFavorite })}
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
  // For nearby station departures, where no destination is specified
  else {
    return (
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
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
          <p>No departures found for the next 2 hours, but we'll keep on looking...</p>
          <ul>
            <li>Check the <a href='https://www.nationalrail.co.uk/status-and-disruptions/' target='_blank'>National Rail status and disruptions website</a></li>
            <li>Try a manual search on the <a href='' target='_blank'>National Rail Journey Planner website</a></li>
          </ul>
          {DeleteJourneyButton({ from, to, editMode })}
          {AddReturnJourneyButton({ from, to, editMode })}
          {ToggleFavoriteButton({ from, to, editMode, isFavorite, onToggle: onToggleFavorite })}
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

  export default NoDeparturesFound;
