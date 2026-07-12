// Registers the background location tasks as early as possible so they're
// defined even on headless (app-killed) background launches.
import './src/services/locationTask';
import './src/services/rideRecordingTask';

import 'expo-router/entry';
