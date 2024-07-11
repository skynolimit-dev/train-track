import { Storage } from '@ionic/storage';

const store = new Storage();


export async function getJourneys() {
    await store.create();
    const journeys = await store.get('journeys') || [];
    // console.log('Journeys from storage', journeys);
    return journeys;
}