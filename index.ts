// Registers the background location task as early as possible so it's
// defined even on headless (app-killed) background launches.
import './tasks/locationTask';

import 'expo-router/entry';
