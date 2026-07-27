import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

import { componentTypeValues } from '../domain/types';

export const bikes = sqliteTable('bikes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand'),
  model: text('model'),
  year: integer('year'),
  color: text('color'),
  frameSize: text('frame_size'),
  purchaseDate: integer('purchase_date', { mode: 'timestamp_ms' }),
  purchasePrice: real('purchase_price'),
  currency: text('currency'),
  photoUri: text('photo_uri'),
  notes: text('notes'),
  // Manually-entered baseline (people have existing bikes with existing km). The bike's
  // current odometer is always derived as startingOdometerM + sum(ride distances) once
  // rides exist (M2+) — never a separately stored/mutated counter.
  startingOdometerM: integer('starting_odometer_m').notNull().default(0),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const components = sqliteTable('components', {
  id: text('id').primaryKey(),
  bikeId: text('bike_id')
    .notNull()
    .references(() => bikes.id),
  type: text('type', { enum: componentTypeValues }).notNull(),
  name: text('name').notNull(),
  installedAtOdometerM: integer('installed_at_odometer_m').notNull(),
  installedDate: integer('installed_date', { mode: 'timestamp_ms' }).notNull(),
  expectedLifetimeM: integer('expected_lifetime_m'),
  notes: text('notes'),
  isRetired: integer('is_retired', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const maintenanceRules = sqliteTable('maintenance_rules', {
  id: text('id').primaryKey(),
  componentId: text('component_id')
    .notNull()
    .references(() => components.id),
  action: text('action').notNull(),
  intervalM: integer('interval_m').notNull(),
  lastPerformedAtOdometerM: integer('last_performed_at_odometer_m').notNull(),
  notes: text('notes'),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const maintenanceRecords = sqliteTable('maintenance_records', {
  id: text('id').primaryKey(),
  componentId: text('component_id')
    .notNull()
    .references(() => components.id),
  ruleId: text('rule_id').references(() => maintenanceRules.id),
  action: text('action').notNull(),
  performedAtOdometerM: integer('performed_at_odometer_m').notNull(),
  performedDate: integer('performed_date', { mode: 'timestamp_ms' }).notNull(),
  cost: real('cost'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const rides = sqliteTable('rides', {
  id: text('id').primaryKey(),
  bikeId: text('bike_id')
    .notNull()
    .references(() => bikes.id),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp_ms' }).notNull(),
  distanceM: real('distance_m').notNull(),
  movingTimeMs: integer('moving_time_ms').notNull(),
  pausedTimeMs: integer('paused_time_ms').notNull(),
  trackUri: text('track_uri').notNull(),
  notes: text('notes'),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

// Singleton row, id is always 'singleton' — see appSettingsRepository.
export const appSettings = sqliteTable('app_settings', {
  id: text('id').primaryKey(),
  unitSystem: text('unit_system', { enum: ['metric', 'imperial'] }).notNull().default('metric'),
  locale: text('locale', { enum: ['en', 'sv'] }).notNull().default('en'),
  themeMode: text('theme_mode', { enum: ['system', 'light', 'dark'] }).notNull().default('system'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});
