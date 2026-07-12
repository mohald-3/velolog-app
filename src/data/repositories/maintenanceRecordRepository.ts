import { desc, eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

import type { MaintenanceRecord, NewMaintenanceRecord } from '../../domain/types';
import { db } from '../db';
import { maintenanceRecords } from '../schema';

export interface MaintenanceRecordRepository {
  listByComponent(componentId: string): Promise<MaintenanceRecord[]>;
  create(input: NewMaintenanceRecord): Promise<MaintenanceRecord>;
}

export const maintenanceRecordRepository: MaintenanceRecordRepository = {
  async listByComponent(componentId) {
    return db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.componentId, componentId))
      .orderBy(desc(maintenanceRecords.performedDate));
  },

  async create(input) {
    const now = new Date();
    const [created] = await db
      .insert(maintenanceRecords)
      .values({
        id: Crypto.randomUUID(),
        componentId: input.componentId,
        ruleId: input.ruleId ?? null,
        action: input.action,
        performedAtOdometerM: input.performedAtOdometerM,
        performedDate: input.performedDate,
        cost: input.cost ?? null,
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created;
  },
};
