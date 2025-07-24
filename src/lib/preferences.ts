import { Preferences } from '@capacitor/preferences';

const preferenceWriteTimestamps: Record<string, number> = {};
const PREFERENCE_WRITE_THROTTLE_MS = 2000;

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
  const now = Date.now();
  if (preferenceWriteTimestamps[key] && now - preferenceWriteTimestamps[key] < PREFERENCE_WRITE_THROTTLE_MS) {
    console.log(`[setPreferenceNumber] Throttled write for key: ${key}`);
    return;
  }
  preferenceWriteTimestamps[key] = now;
  console.log(`[setPreferenceNumber] key: ${key}, value: ${value}`);
  console.trace();
  await Preferences.set({ key: key, value: value.toString() });
}

export async function getPreferenceBoolean(key: string, defaultValue: boolean) {
    const result = await Preferences.get({ key: key });
    if (result && result.value) {
        try {
            return result.value === 'true';
        } catch (error) {
            console.error(`${key} value is not a valid boolean`);
            return defaultValue;
        }
    } else {
        return defaultValue;
    }
}

export async function setPreferenceBoolean(key: string, value: boolean) {
  const now = Date.now();
  if (preferenceWriteTimestamps[key] && now - preferenceWriteTimestamps[key] < PREFERENCE_WRITE_THROTTLE_MS) {
    console.log(`[setPreferenceBoolean] Throttled write for key: ${key}`);
    return;
  }
  preferenceWriteTimestamps[key] = now;
  console.log(`[setPreferenceBoolean] key: ${key}, value: ${value}`);
  console.trace();
  await Preferences.set({ key: key, value: value.toString() });
}

export async function getPreferenceJson(key: string) {
    const result = await Preferences.get({ key: key });
    if (result && result.value) {
        try {
            return JSON.parse(result.value);
        } catch (error) {
            console.error(`${key} value is not valid JSON`);
        }
    }
}

export async function setPreferenceJson(key: string, value: any) {
    await Preferences.set({ key: key, value: JSON.stringify(value) });
}