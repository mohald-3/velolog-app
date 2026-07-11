import { initialRecordingState, recordingReducer } from './recording';
import type { RecordingState } from './recording';

const BIKE_ID = 'bike-1';

describe('recordingReducer', () => {
  it('starts idle', () => {
    expect(initialRecordingState).toEqual({ status: 'idle' });
  });

  it('walks the full happy path: idle -> recording -> paused -> recording -> completed', () => {
    let state: RecordingState = initialRecordingState;

    state = recordingReducer(state, { type: 'START', bikeId: BIKE_ID, at: 0 });
    expect(state).toEqual({ status: 'recording', bikeId: BIKE_ID, startedAt: 0 });

    state = recordingReducer(state, { type: 'PAUSE', at: 1000 });
    expect(state).toEqual({ status: 'paused', bikeId: BIKE_ID, startedAt: 0, pausedAt: 1000 });

    state = recordingReducer(state, { type: 'RESUME', at: 2000 });
    expect(state).toEqual({ status: 'recording', bikeId: BIKE_ID, startedAt: 0 });

    state = recordingReducer(state, { type: 'STOP', at: 3000 });
    expect(state).toEqual({ status: 'completed', bikeId: BIKE_ID, startedAt: 0, endedAt: 3000 });
  });

  it('stops directly from recording (skipping pause) to completed', () => {
    let state: RecordingState = recordingReducer(initialRecordingState, {
      type: 'START',
      bikeId: BIKE_ID,
      at: 0,
    });
    state = recordingReducer(state, { type: 'STOP', at: 500 });
    expect(state).toEqual({ status: 'completed', bikeId: BIKE_ID, startedAt: 0, endedAt: 500 });
  });

  it('stops from paused to completed', () => {
    let state: RecordingState = recordingReducer(initialRecordingState, {
      type: 'START',
      bikeId: BIKE_ID,
      at: 0,
    });
    state = recordingReducer(state, { type: 'PAUSE', at: 100 });
    state = recordingReducer(state, { type: 'STOP', at: 200 });
    expect(state).toEqual({ status: 'completed', bikeId: BIKE_ID, startedAt: 0, endedAt: 200 });
  });

  it('discards from recording', () => {
    let state: RecordingState = recordingReducer(initialRecordingState, {
      type: 'START',
      bikeId: BIKE_ID,
      at: 0,
    });
    state = recordingReducer(state, { type: 'DISCARD', at: 400 });
    expect(state).toEqual({ status: 'discarded', bikeId: BIKE_ID, startedAt: 0 });
  });

  it('discards from paused', () => {
    let state: RecordingState = recordingReducer(initialRecordingState, {
      type: 'START',
      bikeId: BIKE_ID,
      at: 0,
    });
    state = recordingReducer(state, { type: 'PAUSE', at: 100 });
    state = recordingReducer(state, { type: 'DISCARD', at: 400 });
    expect(state).toEqual({ status: 'discarded', bikeId: BIKE_ID, startedAt: 0 });
  });

  describe('invalid transitions are no-ops', () => {
    it('ignores START unless idle', () => {
      const recording: RecordingState = { status: 'recording', bikeId: BIKE_ID, startedAt: 0 };
      expect(recordingReducer(recording, { type: 'START', bikeId: 'other-bike', at: 999 })).toBe(
        recording
      );
    });

    it('ignores PAUSE unless recording', () => {
      expect(recordingReducer(initialRecordingState, { type: 'PAUSE', at: 1 })).toBe(
        initialRecordingState
      );
      const completed: RecordingState = { status: 'completed', bikeId: BIKE_ID, startedAt: 0, endedAt: 10 };
      expect(recordingReducer(completed, { type: 'PAUSE', at: 20 })).toBe(completed);
    });

    it('ignores RESUME unless paused', () => {
      const recording: RecordingState = { status: 'recording', bikeId: BIKE_ID, startedAt: 0 };
      expect(recordingReducer(recording, { type: 'RESUME', at: 1 })).toBe(recording);
      expect(recordingReducer(initialRecordingState, { type: 'RESUME', at: 1 })).toBe(
        initialRecordingState
      );
    });

    it('ignores STOP unless recording or paused', () => {
      expect(recordingReducer(initialRecordingState, { type: 'STOP', at: 1 })).toBe(
        initialRecordingState
      );
      const discarded: RecordingState = { status: 'discarded', bikeId: BIKE_ID, startedAt: 0 };
      expect(recordingReducer(discarded, { type: 'STOP', at: 1 })).toBe(discarded);
    });

    it('ignores DISCARD unless recording or paused', () => {
      expect(recordingReducer(initialRecordingState, { type: 'DISCARD', at: 1 })).toBe(
        initialRecordingState
      );
      const completed: RecordingState = { status: 'completed', bikeId: BIKE_ID, startedAt: 0, endedAt: 10 };
      expect(recordingReducer(completed, { type: 'DISCARD', at: 1 })).toBe(completed);
    });

    it('is a terminal no-op machine once completed or discarded', () => {
      const completed: RecordingState = { status: 'completed', bikeId: BIKE_ID, startedAt: 0, endedAt: 10 };
      expect(recordingReducer(completed, { type: 'START', bikeId: BIKE_ID, at: 20 })).toBe(completed);

      const discarded: RecordingState = { status: 'discarded', bikeId: BIKE_ID, startedAt: 0 };
      expect(recordingReducer(discarded, { type: 'START', bikeId: BIKE_ID, at: 20 })).toBe(discarded);
    });
  });
});
