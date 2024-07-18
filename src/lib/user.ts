import { getPreferenceJson } from "./preferences";


export async function getJourneys() {
    const journeys = await getPreferenceJson('journeys');
    // console.log('Journeys from storage', journeys);
    return journeys;
}