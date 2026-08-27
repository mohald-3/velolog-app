import { and, eq, isNull } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

import type { NewRide, Ride, RideUpdate } from '../../domain/types';
import { db } from '../db';
import { rides } from '../schema';

export interface RideRepository {
  list(options?: { bikeId?: string; includeDeleted?: boolean }): Promise<Ride[]>;
  getById(id: string): Promise<Ride | null>;
  create(input: NewRide): Promise<Ride>;
  update(id: string, changes: RideUpdate): Promise<Ride>;
  softDelete(id: string): Promise<void>;
}

export const rideRepository: RideRepository = {
  async list(options) {
    const includeDeleted = options?.includeDeleted ?? false;
    const conditions = [
      ...(options?.bikeId ? [eq(rides.bikeId, options.bikeId)] : []),
      ...(includeDeleted ? [] : [isNull(rides.deletedAt)]),
    ];
    if (conditions.length === 0) {
      return db.select().from(rides);
    }
    return db.select().from(rides).where(and(...conditions));
  },

  async getById(id) {
    const rows = await db.select().from(rides).where(eq(rides.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async create(input) {
    const now = new Date();
    const [created] = await db
      .insert(rides)
      .values({
        id: Crypto.randomUUID(),
        bikeId: input.bikeId,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        distanceM: input.distanceM,
        movingTimeMs: input.movingTimeMs,
        pausedTimeMs: input.pausedTimeMs,
        trackUri: input.trackUri,
        elevationGainM: input.elevationGainM ?? null,
        source: input.source ?? 'recorded',
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created;
  },

  async update(id, changes) {
    const [updated] = await db
      .update(rides)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(rides.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Ride not found: ${id}`);
    }
    return updated;
  },

  async softDelete(id) {
    const [updated] = await db
      .update(rides)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(rides.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Ride not found: ${id}`);
    }
  },
};
