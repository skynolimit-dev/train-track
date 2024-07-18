import { Preferences } from '@capacitor/preferences';

export async function getPreferenceNumber(key: string, defaultValue: number) {
    const result = await Preferences.get({ key: key });
    if (result && result.value) {
        try {
            return parseInt(result.value, 10);
        } catch (error) {
            console.error(`${key} value is not a valid number`);
            return defaultValue;
        }
    } else {
        return defaultValue;
    }
}

export async function setPreferenceNumber(key: string, value: number) {
    await Preferences.set({ key: key, value: value.toString() });
}

export async function getPreferenceJson(key: string) {
    const result = await Preferences.get({ key: key });
    if (result && result.value) {
        try {
            console.log('Returning JSON preference', key, result.value);
            return JSON.parse(result.value);
        } catch (error) {
            console.error(`${key} value is not valid JSON`);
        }
    }
}

export async function setPreferenceJson(key: string, value: any) {
    console.log('Setting JSON preference', key, value);
    await Preferences.set({ key: key, value: JSON.stringify(value) });
}