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
