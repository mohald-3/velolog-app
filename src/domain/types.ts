export type ComponentType =
  | 'Chain'
  | 'Cassette'
  | 'BrakePadsFront'
  | 'BrakePadsRear'
  | 'TireFront'
  | 'TireRear'
  | 'Custom';

export interface Bike {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  frameSize: string | null;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  currency: string | null;
  photoUri: string | null;
  notes: string | null;
  /** Manually-entered baseline km (people have existing bikes with existing km). The bike's
   * current odometer is startingOdometerM + sum(ride distances) once rides exist (M2+) —
   * never a separately stored/mutated counter. */
  startingOdometerM: number;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewBike {
  name: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  frameSize?: string | null;
  purchaseDate?: Date | null;
  purchasePrice?: number | null;
  currency?: string | null;
  photoUri?: string | null;
  notes?: string | null;
  startingOdometerM?: number;
  isDefault?: boolean;
}

export interface BikeUpdate {
  name?: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  frameSize?: string | null;
  purchaseDate?: Date | null;
  purchasePrice?: number | null;
  currency?: string | null;
  photoUri?: string | null;
  notes?: string | null;
  startingOdometerM?: number;
  isDefault?: boolean;
  isArchived?: boolean;
}

export interface Component {
  id: string;
  bikeId: string;
  type: ComponentType;
  name: string;
  installedAtOdometerM: number;
  installedDate: Date;
  expectedLifetimeKm: number | null;
  notes: string | null;
  isRetired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewComponent {
  bikeId: string;
  type: ComponentType;
  name: string;
  installedAtOdometerM: number;
  installedDate: Date;
  expectedLifetimeKm?: number | null;
  notes?: string | null;
}

export interface ComponentUpdate {
  type?: ComponentType;
  name?: string;
  installedAtOdometerM?: number;
  installedDate?: Date;
  expectedLifetimeKm?: number | null;
  notes?: string | null;
  isRetired?: boolean;
}

/** A recurring service action on a component (e.g. "Lubricate" every 200 km). Due-status is
 * always *derived* from the bike's odometer vs. lastPerformedAtOdometerM + intervalM — never a
 * separately stored/mutated counter (see domain/maintenance.ts). */
export interface MaintenanceRule {
  id: string;
  componentId: string;
  action: string;
  intervalM: number;
  lastPerformedAtOdometerM: number;
  notes: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewMaintenanceRule {
  componentId: string;
  action: string;
  intervalM: number;
  lastPerformedAtOdometerM: number;
  notes?: string | null;
}

export interface MaintenanceRuleUpdate {
  action?: string;
  intervalM?: number;
  lastPerformedAtOdometerM?: number;
  notes?: string | null;
  isArchived?: boolean;
}

/** A ride is only persisted once completed — the in-progress track lives on disk during
 * recording (see tasks/locationTask.ts) and becomes a Ride row on save. Append-only after
 * that: everything but `bikeId` and `notes` is fixed, and the GPS track itself is never
 * edited (see CLAUDE.md domain invariants). */
export interface Ride {
  id: string;
  bikeId: string;
  startedAt: Date;
  endedAt: Date;
  distanceM: number;
  movingTimeMs: number;
  pausedTimeMs: number;
  /** file URI of the recorded NDJSON track log for this ride */
  trackUri: string;
  notes: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewRide {
  bikeId: string;
  startedAt: Date;
  endedAt: Date;
  distanceM: number;
  movingTimeMs: number;
  pausedTimeMs: number;
  trackUri: string;
  notes?: string | null;
}

export interface RideUpdate {
  bikeId?: string;
  notes?: string | null;
}
