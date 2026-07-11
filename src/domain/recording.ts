/**
 * Pure reducer for the ride recording lifecycle: Idle -> Recording -> Paused -> Recording ->
 * Completed/Discarded. No React/Expo/DB imports — see CLAUDE.md architecture rules.
 *
 * This only governs the lifecycle transitions. Distance/duration/point accumulation is the
 * GPS filtering pipeline's job (src/domain/gps-filter.ts), fed by the location task.
 */

export type RecordingState =
  | { status: 'idle' }
  | { status: 'recording'; bikeId: string; startedAt: number }
  | { status: 'paused'; bikeId: string; startedAt: number; pausedAt: number }
  | { status: 'completed'; bikeId: string; startedAt: number; endedAt: number }
  | { status: 'discarded'; bikeId: string; startedAt: number };

export type RecordingEvent =
  | { type: 'START'; bikeId: string; at: number }
  | { type: 'PAUSE'; at: number }
  | { type: 'RESUME'; at: number }
  | { type: 'STOP'; at: number }
  | { type: 'DISCARD'; at: number };

export const initialRecordingState: RecordingState = { status: 'idle' };

/** Transitions not valid from the current state are no-ops (returns the same state), matching
 * standard reducer conventions — callers gate buttons on the current status, but the reducer
 * stays defensive rather than throwing. */
export function recordingReducer(state: RecordingState, event: RecordingEvent): RecordingState {
  switch (event.type) {
    case 'START':
      if (state.status !== 'idle') return state;
      return { status: 'recording', bikeId: event.bikeId, startedAt: event.at };

    case 'PAUSE':
      if (state.status !== 'recording') return state;
      return { status: 'paused', bikeId: state.bikeId, startedAt: state.startedAt, pausedAt: event.at };

    case 'RESUME':
      if (state.status !== 'paused') return state;
      return { status: 'recording', bikeId: state.bikeId, startedAt: state.startedAt };

    case 'STOP':
      if (state.status !== 'recording' && state.status !== 'paused') return state;
      return { status: 'completed', bikeId: state.bikeId, startedAt: state.startedAt, endedAt: event.at };

    case 'DISCARD':
      if (state.status !== 'recording' && state.status !== 'paused') return state;
      return { status: 'discarded', bikeId: state.bikeId, startedAt: state.startedAt };

    default:
      return state;
  }
}
