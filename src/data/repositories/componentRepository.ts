import { and, eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

import type { Component, ComponentUpdate, NewComponent } from '../../domain/types';
import { db } from '../db';
import { components } from '../schema';

export interface ComponentRepository {
  listByBike(bikeId: string, options?: { includeRetired?: boolean }): Promise<Component[]>;
  getById(id: string): Promise<Component | null>;
  create(input: NewComponent): Promise<Component>;
  update(id: string, changes: ComponentUpdate): Promise<Component>;
  retire(id: string): Promise<void>;
}

export const componentRepository: ComponentRepository = {
  async listByBike(bikeId, options) {
    const includeRetired = options?.includeRetired ?? false;
    if (includeRetired) {
      return db.select().from(components).where(eq(components.bikeId, bikeId));
    }
    return db
      .select()
      .from(components)
      .where(and(eq(components.bikeId, bikeId), eq(components.isRetired, false)));
  },

  async getById(id) {
    const rows = await db.select().from(components).where(eq(components.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async create(input) {
    const now = new Date();
    const [created] = await db
      .insert(components)
      .values({
        id: Crypto.randomUUID(),
        bikeId: input.bikeId,
        type: input.type,
        name: input.name,
        installedAtOdometerM: input.installedAtOdometerM,
        installedDate: input.installedDate,
        expectedLifetimeKm: input.expectedLifetimeKm ?? null,
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created;
  },

  async update(id, changes) {
    const [updated] = await db
      .update(components)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(components.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Component not found: ${id}`);
    }
    return updated;
  },

  async retire(id) {
    const [updated] = await db
      .update(components)
      .set({ isRetired: true, updatedAt: new Date() })
      .where(eq(components.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Component not found: ${id}`);
    }
  },
};
