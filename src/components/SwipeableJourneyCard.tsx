import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonAlert } from '@ionic/react';
import { trash } from 'ionicons/icons';
import { useState, useRef, useEffect } from 'react';
import { getStationNameFromCrs } from '../lib/stations';
import { hasReturnLeg } from '../lib/user';
import './SwipeableJourneyCard.css';

interface SwipeableJourneyCardProps {
  from: string;
  to: string;
  isFavorite?: boolean;
  children: React.ReactNode;
  onDelete: (deleteBoth: boolean) => void;
}

const SwipeableJourneyCard: React.FC<SwipeableJourneyCardProps> = ({ 
  from, 
  to, 
  isFavorite = false, 
  children, 
  onDelete 
}) => {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [returnLegExists, setReturnLegExists] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Check for return leg on mount
  useEffect(() => {
    (async () => {
      if (from && to) {
        setReturnLegExists(await hasReturnLeg(from, to));
      }
    })();
  }, [from, to]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = startX.current - currentX.current;
    
    // Only allow left swipe (positive deltaX)
    if (deltaX > 0) {
      const progress = Math.min(deltaX / 100, 1); // 100px = full swipe
      setSwipeProgress(progress);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    const deltaX = startX.current - currentX.current;
    
    // If swiped more than 50px to the left, trigger delete
    if (deltaX > 50) {
      setShowDeleteAlert(true);
    }
    
    // Reset swipe progress
    setSwipeProgress(0);
  };

  const handleDelete = (deleteBoth: boolean) => {
    onDelete(deleteBoth);
    setShowDeleteAlert(false);
  };

  const getCardStyle = () => {
    const translateX = -swipeProgress * 80; // Max 80px translation
    return {
      transform: `translateX(${translateX}px)`,
      transition: isDragging.current ? 'none' : 'transform 0.2s ease-out'
    };
  };

  const getDeleteButtonStyle = () => {
    const opacity = swipeProgress;
    const scale = 0.8 + (swipeProgress * 0.2);
    return {
      opacity,
      transform: `scale(${scale})`,
      transition: isDragging.current ? 'none' : 'all 0.2s ease-out'
    };
  };

  return (
    <div className="swipeable-card-container">
      {/* Delete button background */}
      <div 
        className="delete-button-background"
        style={getDeleteButtonStyle()}
      >
        <IonIcon icon={trash} color="danger" />
        <span>Delete</span>
      </div>
      
      {/* Main card */}
      <div
        ref={cardRef}
        className="swipeable-card"
        style={getCardStyle()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Delete confirmation alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Delete Journey"
        message={`Are you sure you want to delete "${getStationNameFromCrs(from)}${to ? ` to ${getStationNameFromCrs(to)}` : ''}"?${returnLegExists ? ' This journey has a return leg.' : ''}`}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => setShowDeleteAlert(false)
          },
          {
            text: 'Delete this journey only',
            handler: () => handleDelete(false)
          },
          ...(returnLegExists ? [{
            text: 'Delete both journeys',
            role: 'destructive',
            handler: () => handleDelete(true)
          }] : [])
        ]}
      />
    </div>
  );
};

export default SwipeableJourneyCard; 