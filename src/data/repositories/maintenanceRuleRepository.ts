import { and, eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

import type { MaintenanceRule, MaintenanceRuleUpdate, NewMaintenanceRule } from '../../domain/types';
import { db } from '../db';
import { maintenanceRules } from '../schema';

export interface MaintenanceRuleRepository {
  listByComponent(componentId: string, options?: { includeArchived?: boolean }): Promise<MaintenanceRule[]>;
  getById(id: string): Promise<MaintenanceRule | null>;
  create(input: NewMaintenanceRule): Promise<MaintenanceRule>;
  update(id: string, changes: MaintenanceRuleUpdate): Promise<MaintenanceRule>;
  archive(id: string): Promise<void>;
}

export const maintenanceRuleRepository: MaintenanceRuleRepository = {
  async listByComponent(componentId, options) {
    const includeArchived = options?.includeArchived ?? false;
    if (includeArchived) {
      return db.select().from(maintenanceRules).where(eq(maintenanceRules.componentId, componentId));
    }
    return db
      .select()
      .from(maintenanceRules)
      .where(and(eq(maintenanceRules.componentId, componentId), eq(maintenanceRules.isArchived, false)));
  },

  async getById(id) {
    const rows = await db.select().from(maintenanceRules).where(eq(maintenanceRules.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async create(input) {
    const now = new Date();
    const [created] = await db
      .insert(maintenanceRules)
      .values({
        id: Crypto.randomUUID(),
        componentId: input.componentId,
        action: input.action,
        intervalM: input.intervalM,
        lastPerformedAtOdometerM: input.lastPerformedAtOdometerM,
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created;
  },

  async update(id, changes) {
    const [updated] = await db
      .update(maintenanceRules)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(maintenanceRules.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Maintenance rule not found: ${id}`);
    }
    return updated;
  },

  async archive(id) {
    const [updated] = await db
      .update(maintenanceRules)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(maintenanceRules.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Maintenance rule not found: ${id}`);
    }
  },
};
