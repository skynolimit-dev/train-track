import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.skynolimit.traintrack',
  appName: 'TrainTrack',
  webDir: 'dist'
,
    android: {
       buildOptions: {
          keystorePath: '/Users/mwagstaff/Library/CloudStorage/GoogleDrive-mike.wagstaff@gmail.com/My Drive/Dev/android_app_keystore_traintrack',
          keystoreAlias: 'key0',
       }
    }
  };

export default config;
