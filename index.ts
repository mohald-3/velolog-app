// Registers the background location tasks as early as possible so they're
// defined even on headless (app-killed) background launches.
import './tasks/locationTask';
import './tasks/rideRecordingTask';

import 'expo-router/entry';
