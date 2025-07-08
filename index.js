// index.js
import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('[BackgroundEvent]', type, detail);
  // Optionally, handle user actions on notifications here
});

AppRegistry.registerComponent(appName, () => App);
