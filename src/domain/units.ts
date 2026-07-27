import type { UnitSystem } from './types';

const METERS_PER_MILE = 1609.344;

export function metersToKm(m: number): number {
  return m / 1000;
}

export function metersToMiles(m: number): number {
  return m / METERS_PER_MILE;
}

/** Converts meters to the given unit system's distance unit (km or mi). */
export function metersToDistanceUnit(m: number, unitSystem: UnitSystem): number {
  return unitSystem === 'imperial' ? metersToMiles(m) : metersToKm(m);
}

/** Converts meters to an editable distance value with no more than two decimal places. */
export function formatDistanceInput(m: number, unitSystem: UnitSystem): string {
  const value = metersToDistanceUnit(m, unitSystem);
  return String(Math.round((value + Number.EPSILON) * 100) / 100);
}

export function distanceUnitLabel(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'mi' : 'km';
}

/** Converts a value in the unit system's distance unit (km or mi) back to meters — the
 * inverse of metersToDistanceUnit, for reading form inputs entered in the display unit. */
export function distanceUnitToMeters(value: number, unitSystem: UnitSystem): number {
  return unitSystem === 'imperial' ? value * METERS_PER_MILE : value * 1000;
}

/** Formats a meters value as e.g. "12.3 km" or "7.6 mi" in the given unit system. */
export function formatDistance(m: number, unitSystem: UnitSystem, fractionDigits = 1): string {
  const value = metersToDistanceUnit(m, unitSystem);
  return `${value.toFixed(fractionDigits)} ${distanceUnitLabel(unitSystem)}`;
}

const KM_PER_MILE = 1.609344;

/** Converts a km/h speed value to the given unit system's speed unit (km/h or mph). */
export function convertSpeed(kmh: number, unitSystem: UnitSystem): number {
  return unitSystem === 'imperial' ? kmh / KM_PER_MILE : kmh;
}

export function speedUnitLabel(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'mph' : 'km/h';
}

/** Formats a km/h speed value as e.g. "18.5 km/h" or "11.5 mph" in the given unit system. */
export function formatSpeed(kmh: number, unitSystem: UnitSystem, fractionDigits = 1): string {
  const value = convertSpeed(kmh, unitSystem);
  return `${value.toFixed(fractionDigits)} ${speedUnitLabel(unitSystem)}`;
}
