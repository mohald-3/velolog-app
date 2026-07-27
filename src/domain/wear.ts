/**
 * Component wear is always derived from odometer readings, never stored — a component
 * replacement (new installedAtOdometerM) resets wear without needing to touch a counter.
 */
export function computeComponentWearM(currentOdometerM: number, installedAtOdometerM: number): number {
  return Math.max(0, currentOdometerM - installedAtOdometerM);
}

/**
 * Returns lifetime consumption as a percentage. Values above 100 are retained so overdue wear
 * remains honest; invalid or non-positive lifetime values cannot produce meaningful progress.
 */
export function computeWearPercent(wearM: number, expectedLifetimeM: number): number {
  if (expectedLifetimeM <= 0) return 0;
  return Math.max(0, (wearM / expectedLifetimeM) * 100);
}
