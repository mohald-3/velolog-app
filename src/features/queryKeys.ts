/**
 * Single source of truth for TanStack Query keys. Hooks must build and invalidate keys through
 * this object — the same key shape defined locally in several hooks is how invalidation
 * silently breaks when one copy drifts (issue #43, C2).
 */
export const queryKeys = {
  bikes: ['bikes'] as const,
  bike: (id: string) => ['bikes', id] as const,

  components: (bikeId: string) => ['bikes', bikeId, 'components'] as const,
  component: (id: string) => ['components', id] as const,

  rides: (bikeId: string) => ['bikes', bikeId, 'rides'] as const,
  ride: (id: string) => ['rides', id] as const,

  maintenanceRules: (componentId: string) => ['components', componentId, 'maintenanceRules'] as const,
  maintenanceRule: (id: string) => ['maintenanceRules', id] as const,
  maintenanceRecords: (componentId: string) => ['components', componentId, 'maintenanceRecords'] as const,

  appSettings: ['app-settings'] as const,

  /** Root prefix for the journey aggregates — invalidating this catches all three sub-keys.
   * Any mutation that changes rides, bikes (purchase price), or maintenance records (cost)
   * must invalidate it; the journey screen aggregates across the whole garage. */
  journey: ['journey'] as const,
  journeyBikes: ['journey', 'bikes'] as const,
  journeyRides: ['journey', 'rides'] as const,
  journeyRecords: ['journey', 'maintenanceRecords'] as const,
};
