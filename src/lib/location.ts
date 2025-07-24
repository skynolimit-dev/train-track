import { Geolocation } from '@capacitor/geolocation';

let lastLocationResult: any = null;
let lastLocationTimestamp: number = 0;
const LOCATION_DEBOUNCE_MS = 10000;
let locationPromise: Promise<any> | null = null;

export async function getCurrentLocation() {
    const now = Date.now();
    if (now - lastLocationTimestamp < LOCATION_DEBOUNCE_MS && lastLocationResult !== null) {
        return lastLocationResult;
    }
    if (locationPromise) {
        return locationPromise;
    }
    locationPromise = (async () => {
        try {
            let retryCount = 0;
            let location = null;
            while (retryCount < 3) {
                location = await Geolocation.getCurrentPosition({ timeout: 1000 });
                if (location) {
                    window.dispatchEvent(new CustomEvent('locationUnavailable', { detail: { unavailable: false } }));
                    lastLocationResult = location;
                    lastLocationTimestamp = Date.now();
                    locationPromise = null;
                    return location;
                }
                retryCount++;
            }
            window.dispatchEvent(new CustomEvent('locationUnavailable', { detail: { unavailable: true } }));
            lastLocationResult = null;
            lastLocationTimestamp = Date.now();
            locationPromise = null;
            return null;
        } catch (error) {
            console.warn('Error getting current location', error);
            window.dispatchEvent(new CustomEvent('locationUnavailable', { detail: { unavailable: true } }));
            lastLocationResult = null;
            lastLocationTimestamp = Date.now();
            locationPromise = null;
            return null;
        }
    })();
    return locationPromise;
}