import { getPreferenceJson, setPreferenceJson } from "./preferences";

// Function to notify that journeys have changed
function notifyJourneyChange() {
  window.dispatchEvent(new CustomEvent('journeysChanged'));
}

// Migration function to ensure all journeys have the favorite property
async function migrateJourneys() {
    const journeys = await getPreferenceJson('journeys') || [];
    let needsMigration = false;
    
    const migratedJourneys = journeys.map((journey: any) => {
        if (journey.favorite === undefined) {
            needsMigration = true;
            return { ...journey, favorite: false };
        }
        return journey;
    });
    
    if (needsMigration) {
        await setPreferenceJson('journeys', migratedJourneys);
        notifyJourneyChange();
    }
    
    return migratedJourneys;
}

export async function getJourneys() {
    const journeys = await migrateJourneys();
    // console.log('Journeys from storage', journeys);
    return journeys || [];
}

export async function getFavoriteJourneys() {
    const journeys = await getJourneys();
    return journeys.filter((journey: any) => journey.favorite === true);
}

export async function getAllJourneys() {
    const journeys = await getJourneys();
    return journeys.filter((journey: any) => journey.favorite !== true);
}

export async function toggleJourneyFavorite(from: string, to: string) {
    const journeys = await getJourneys();
    const updatedJourneys = journeys.map((journey: any) => {
        if (journey.from === from && journey.to === to) {
            return { ...journey, favorite: !journey.favorite };
        }
        return journey;
    });
    await setPreferenceJson('journeys', updatedJourneys);
    notifyJourneyChange();
    return updatedJourneys;
}

export async function hasReturnLeg(from: string, to: string) {
    const journeys = await getJourneys();
    return journeys.some((journey: any) => journey.from === to && journey.to === from);
}

export async function toggleJourneyFavoriteBothWays(from: string, to: string) {
    const journeys = await getJourneys();
    const updatedJourneys = journeys.map((journey: any) => {
        if ((journey.from === from && journey.to === to) || (journey.from === to && journey.to === from)) {
            return { ...journey, favorite: !journey.favorite };
        }
        return journey;
    });
    await setPreferenceJson('journeys', updatedJourneys);
    notifyJourneyChange();
    return updatedJourneys;
}