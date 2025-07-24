import { IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { locationOutline, warningOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { getCurrentLocation } from '../lib/location';

// Generic warning banner
export const WarningBanner: React.FC<{ icon: string, color?: string, message: string, style?: React.CSSProperties }> = ({ icon, color = 'warning', message, style }) => (
  <IonCard color={color} style={{ margin: '8px', marginBottom: '16px', ...style }}>
    <IonCardContent style={{ padding: '8px 12px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: color === 'danger' ? '#fff' : '#856404',
      }}>
        <IonIcon icon={icon} style={{ fontSize: '16px' }} />
        <span style={{ fontWeight: 'bold' }}>{message}</span>
      </div>
    </IonCardContent>
  </IonCard>
);

// Location warning wrapper
const LocationWarning: React.FC = () => {
  const [locationAvailable, setLocationAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkLocation() {
      const location = await getCurrentLocation();
      const available = location !== null;
      setLocationAvailable(available);
      // Broadcast location status globally
      window.dispatchEvent(new CustomEvent('locationUnavailable', { detail: { unavailable: !available } }));
    }
    checkLocation();
    // Listen for global locationUnavailable events
    const handler = (e: any) => {
      setLocationAvailable(e.detail && e.detail.unavailable === false ? true : false);
    };
    window.addEventListener('locationUnavailable', handler);
    return () => window.removeEventListener('locationUnavailable', handler);
  }, []);

  if (locationAvailable === null || locationAvailable) {
    return null;
  }

  return (
    <WarningBanner icon={locationOutline} message="Location unavailable - showing all journeys" />
  );
};

export default LocationWarning; 