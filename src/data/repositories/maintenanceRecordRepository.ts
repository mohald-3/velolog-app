import { desc, eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

import type { MaintenanceRecord, MaintenanceRule, NewMaintenanceRecord } from '../../domain/types';
import { db } from '../db';
import { maintenanceRecords, maintenanceRules } from '../schema';

export interface MaintenanceRecordRepository {
  listByComponent(componentId: string): Promise<MaintenanceRecord[]>;
  listAll(): Promise<MaintenanceRecord[]>;
  create(input: NewMaintenanceRecord): Promise<MaintenanceRecord>;
  /** Logs a record for the rule's action and resets the rule's counter to the given odometer —
   * atomically, so a failure can't log the record without resetting the rule (or vice versa). */
  markRuleAsDone(input: {
    rule: MaintenanceRule;
    performedAtOdometerM: number;
    cost?: number | null;
    notes?: string | null;
  }): Promise<MaintenanceRule>;
}

export const maintenanceRecordRepository: MaintenanceRecordRepository = {
  async listByComponent(componentId) {
    return db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.componentId, componentId))
      .orderBy(desc(maintenanceRecords.performedDate));
  },

  async listAll() {
    return db.select().from(maintenanceRecords);
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

  async markRuleAsDone({ rule, performedAtOdometerM, cost, notes }) {
    const now = new Date();
    // The expo-sqlite driver is synchronous, so the transaction callback must run sync
    // statements (.run()/.get()) — an async callback would commit before the work finishes.
    return db.transaction((tx) => {
      tx.insert(maintenanceRecords)
        .values({
          id: Crypto.randomUUID(),
          componentId: rule.componentId,
          ruleId: rule.id,
          action: rule.action,
          performedAtOdometerM,
          performedDate: now,
          cost: cost ?? null,
          notes: notes ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      const updated = tx
        .update(maintenanceRules)
        .set({ lastPerformedAtOdometerM: performedAtOdometerM, updatedAt: now })
        .where(eq(maintenanceRules.id, rule.id))
        .returning()
        .get();
      if (!updated) {
        throw new Error(`Maintenance rule not found: ${rule.id}`);
      }
      return updated;
    });
  },
};
