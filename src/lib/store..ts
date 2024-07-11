import { Storage } from '@ionic/storage';

export async function getStore() {
    const store = new Storage();
    await store.create();
    return store;
}