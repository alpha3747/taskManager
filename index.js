// index.js
import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('[BackgroundEvent]', type, detail);
});

AppRegistry.registerComponent(appName, () => App);
