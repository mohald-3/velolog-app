import { computeDueInfo, shouldNotifyOnStatusChange, worstDueStatus } from './maintenance';

describe('computeDueInfo', () => {
  it('is OK when well under the interval', () => {
    const info = computeDueInfo({ intervalM: 200_000, lastPerformedAtOdometerM: 0 }, 100_000);
    expect(info.dueAtOdometerM).toBe(200_000);
    expect(info.dueInM).toBe(100_000);
    expect(info.status).toBe('OK');
  });

  it('is DueSoon within 10% of the interval (no floor needed)', () => {
    // 200km interval -> 10% = 20km buffer, matches the 20km floor exactly here
    const info = computeDueInfo({ intervalM: 200_000, lastPerformedAtOdometerM: 0 }, 185_000);
    expect(info.dueInM).toBe(15_000);
    expect(info.status).toBe('DueSoon');
  });

  it('applies the 20km floor for a short interval where 10% would be too small', () => {
    // 50km interval -> 10% = 5km, floored to 20km
    const info = computeDueInfo({ intervalM: 50_000, lastPerformedAtOdometerM: 0 }, 35_000);
    expect(info.dueInM).toBe(15_000);
    expect(info.status).toBe('DueSoon');
  });

  it('is not yet DueSoon just outside the buffer', () => {
    const info = computeDueInfo({ intervalM: 200_000, lastPerformedAtOdometerM: 0 }, 179_000);
    expect(info.dueInM).toBe(21_000);
    expect(info.status).toBe('OK');
  });

  it('is Overdue exactly at the interval', () => {
    const info = computeDueInfo({ intervalM: 200_000, lastPerformedAtOdometerM: 0 }, 200_000);
    expect(info.dueInM).toBe(0);
    expect(info.status).toBe('Overdue');
  });

  it('is Overdue past the interval', () => {
    const info = computeDueInfo({ intervalM: 200_000, lastPerformedAtOdometerM: 0 }, 250_000);
    expect(info.dueInM).toBe(-50_000);
    expect(info.status).toBe('Overdue');
  });

  it('accounts for a non-zero lastPerformedAtOdometerM (after a prior mark-as-done)', () => {
    const info = computeDueInfo({ intervalM: 200_000, lastPerformedAtOdometerM: 500_000 }, 650_000);
    expect(info.dueAtOdometerM).toBe(700_000);
    expect(info.dueInM).toBe(50_000);
    expect(info.status).toBe('OK');
  });
});

describe('worstDueStatus', () => {
  it('returns null for an empty list', () => {
    expect(worstDueStatus([])).toBeNull();
  });

  it('returns the single status for a one-rule list', () => {
    expect(worstDueStatus(['OK'])).toBe('OK');
  });

  it('picks Overdue over DueSoon and OK', () => {
    expect(worstDueStatus(['OK', 'DueSoon', 'Overdue'])).toBe('Overdue');
  });

  it('picks DueSoon over OK', () => {
    expect(worstDueStatus(['OK', 'DueSoon', 'OK'])).toBe('DueSoon');
  });

  it('returns OK when everything is OK', () => {
    expect(worstDueStatus(['OK', 'OK'])).toBe('OK');
  });
});

describe('shouldNotifyOnStatusChange', () => {
  it('notifies when crossing from OK to DueSoon', () => {
    expect(shouldNotifyOnStatusChange('OK', 'DueSoon')).toBe(true);
  });

  it('notifies when crossing from OK straight to Overdue', () => {
    expect(shouldNotifyOnStatusChange('OK', 'Overdue')).toBe(true);
  });

  it('notifies when crossing from DueSoon to Overdue', () => {
    expect(shouldNotifyOnStatusChange('DueSoon', 'Overdue')).toBe(true);
  });

  it('does not notify when status is unchanged', () => {
    expect(shouldNotifyOnStatusChange('OK', 'OK')).toBe(false);
    expect(shouldNotifyOnStatusChange('DueSoon', 'DueSoon')).toBe(false);
    expect(shouldNotifyOnStatusChange('Overdue', 'Overdue')).toBe(false);
  });

  it('does not notify when status improves', () => {
    expect(shouldNotifyOnStatusChange('Overdue', 'DueSoon')).toBe(false);
    expect(shouldNotifyOnStatusChange('DueSoon', 'OK')).toBe(false);
  });
});
