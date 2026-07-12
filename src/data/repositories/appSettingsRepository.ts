import { eq } from 'drizzle-orm';

import type { AppSettings, AppSettingsUpdate } from '../../domain/types';
import { db } from '../db';
import { appSettings } from '../schema';

const SETTINGS_ID = 'singleton';

const DEFAULT_SETTINGS: AppSettings = {
  unitSystem: 'metric',
  locale: 'en',
};

export interface AppSettingsRepository {
  get(): Promise<AppSettings>;
  update(changes: AppSettingsUpdate): Promise<AppSettings>;
}

export const appSettingsRepository: AppSettingsRepository = {
  async get() {
    const rows = await db.select().from(appSettings).where(eq(appSettings.id, SETTINGS_ID)).limit(1);
    if (rows[0]) {
      return { unitSystem: rows[0].unitSystem, locale: rows[0].locale };
    }
    const [created] = await db
      .insert(appSettings)
      .values({ id: SETTINGS_ID, ...DEFAULT_SETTINGS, updatedAt: new Date() })
      .returning();
    return { unitSystem: created.unitSystem, locale: created.locale };
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
    return { unitSystem: updated.unitSystem, locale: updated.locale };
  },
};
