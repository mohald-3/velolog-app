import type { MaintenanceRule } from './types';

export type DueStatus = 'OK' | 'DueSoon' | 'Overdue';

export interface DueInfo {
  dueAtOdometerM: number;
  dueInM: number;
  status: DueStatus;
}

/** DueSoon starts within 10% of the rule's interval, floored at 20 km so short intervals (e.g.
 * a 200 km chain lube) still get a meaningful heads-up window rather than a near-zero one. */
const DUE_SOON_MIN_BUFFER_M = 20_000;
const DUE_SOON_BUFFER_RATIO = 0.1;

/** A rule's due-status is always derived from the bike's current odometer — never a stored
 * counter that could drift out of sync with the rides that actually produced it. */
export function computeDueInfo(
  rule: Pick<MaintenanceRule, 'intervalM' | 'lastPerformedAtOdometerM'>,
  currentOdometerM: number
): DueInfo {
  const dueAtOdometerM = rule.lastPerformedAtOdometerM + rule.intervalM;
  const dueInM = dueAtOdometerM - currentOdometerM;
  const dueSoonBufferM = Math.max(DUE_SOON_MIN_BUFFER_M, rule.intervalM * DUE_SOON_BUFFER_RATIO);

  let status: DueStatus;
  if (dueInM <= 0) {
    status = 'Overdue';
  } else if (dueInM <= dueSoonBufferM) {
    status = 'DueSoon';
  } else {
    status = 'OK';
  }

  return { dueAtOdometerM, dueInM, status };
}

const STATUS_SEVERITY: Record<DueStatus, number> = { OK: 0, DueSoon: 1, Overdue: 2 };

/** Picks the most urgent status across a component's rules, for a single summary badge.
 * Returns null when there are no rules to summarize. */
export function worstDueStatus(statuses: DueStatus[]): DueStatus | null {
  if (statuses.length === 0) {
    return null;
  }
  return statuses.reduce((worst, status) => (STATUS_SEVERITY[status] > STATUS_SEVERITY[worst] ? status : worst));
}
