import { formatDuration } from './format';

describe('formatDuration', () => {
  it('formats durations under an hour as minutes and seconds', () => {
    expect(formatDuration(5 * 60_000 + 9_000)).toBe('5:09');
  });

  it('formats durations of an hour or more with an hours segment', () => {
    expect(formatDuration(2 * 3_600_000)).toBe('2:00:00');
    expect(formatDuration(3_600_000 + 2 * 60_000 + 3_000)).toBe('1:02:03');
  });

  it('floors partial seconds', () => {
    expect(formatDuration(1_999)).toBe('0:01');
  });
});
