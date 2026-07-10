/**
 * Component wear is always derived from odometer readings, never stored — a component
 * replacement (new installedAtOdometerM) resets wear without needing to touch a counter.
 */
export function computeComponentWearM(currentOdometerM: number, installedAtOdometerM: number): number {
  return Math.max(0, currentOdometerM - installedAtOdometerM);
}
