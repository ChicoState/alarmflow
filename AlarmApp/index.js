/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { onBackgroundEvent } from './AlarmScheduler';

// Register the background handler BEFORE registerComponent.
// This lets Notifee wake the JS runtime and handle alarm events
// (dismiss, press) even when the app was force-closed.
notifee.onBackgroundEvent(onBackgroundEvent());

AppRegistry.registerComponent(appName, () => App);
