import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { compass, informationCircle, train, person } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

import { Storage } from '@ionic/storage';
import About from './pages/About';
import PlanJourney from './pages/PlanJourney';
import Home from './pages/Home';
import Preferences from './pages/Preferences';

const store = new Storage();

setupIonicReact();

const App: React.FC = () => {

  const [appInitialised, setAppInitialised] = useState(false);

  async function initApp() {
    console.log('Initialising app');
    await store.create();
    setAppInitialised(true);
  }

  useEffect(() => {
    if (!appInitialised) {
      initApp();
    }
  }, [appInitialised]);

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/home">
              <Home />
            </Route>
            <Route exact path="/plan_journey">
              <PlanJourney />
            </Route>
            <Route exact path="/preferences">
              <Preferences />
            </Route>
            <Route exact path="/about">
              <About />
            </Route>
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="home" href="/home">
              <IonIcon aria-hidden="true" icon={train} />
              <IonLabel>TrainTrack</IonLabel>
            </IonTabButton>
            <IonTabButton tab="plan_journey" href="/plan_journey">
              <IonIcon aria-hidden="true" icon={compass} />
              <IonLabel>Plan journey</IonLabel>
            </IonTabButton>
            <IonTabButton tab="preferences" href="/preferences">
              <IonIcon aria-hidden="true" icon={person} />
              <IonLabel>Preferences</IonLabel>
            </IonTabButton>
            <IonTabButton tab="about" href="/about">
              <IonIcon aria-hidden="true" icon={informationCircle} />
              <IonLabel>About</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  )

}

export default App;
