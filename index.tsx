import '@expo/metro-runtime'; // Necessary for Fast Refresh on Web
import './global.css';
// Side-effect import: calls TaskManager.defineTask at module level before any
// React component renders, which is required by expo-task-manager.
import './src/services/backgroundTaskService';
import { registerRootComponent } from 'expo';

import { App } from './src/App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
