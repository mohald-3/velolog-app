import { eq } from 'drizzle-orm';

import type { AppSettings, AppSettingsUpdate } from '../../domain/types';
import { db } from '../db';
import { appSettings } from '../schema';

const SETTINGS_ID = 'singleton';

const DEFAULT_SETTINGS: AppSettings = {
  unitSystem: 'metric',
  locale: 'en',
  themeMode: 'system',
};

function toAppSettings(row: { unitSystem: AppSettings['unitSystem']; locale: AppSettings['locale']; themeMode: AppSettings['themeMode'] }): AppSettings {
  return { unitSystem: row.unitSystem, locale: row.locale, themeMode: row.themeMode };
}

export interface AppSettingsRepository {
  get(): Promise<AppSettings>;
  update(changes: AppSettingsUpdate): Promise<AppSettings>;
}

export const appSettingsRepository: AppSettingsRepository = {
  async get() {
    const rows = await db.select().from(appSettings).where(eq(appSettings.id, SETTINGS_ID)).limit(1);
    if (rows[0]) {
      return toAppSettings(rows[0]);
    }
    const [created] = await db
      .insert(appSettings)
      .values({ id: SETTINGS_ID, ...DEFAULT_SETTINGS, updatedAt: new Date() })
      .returning();
    return toAppSettings(created);
  },

  async update(changes) {
    const current = await appSettingsRepository.get();
    const [updated] = await db
      .insert(appSettings)
      .values({ id: SETTINGS_ID, ...current, ...changes, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: appSettings.id,
        set: { ...changes, updatedAt: new Date() },
      })
      .returning();
    return toAppSettings(updated);
  },
};
