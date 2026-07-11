import { eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

import type { NewRide, Ride, RideUpdate } from '../../domain/types';
import { db } from '../db';
import { rides } from '../schema';

export interface RideRepository {
  list(options?: { bikeId?: string }): Promise<Ride[]>;
  getById(id: string): Promise<Ride | null>;
  create(input: NewRide): Promise<Ride>;
  update(id: string, changes: RideUpdate): Promise<Ride>;
}

export const rideRepository: RideRepository = {
  async list(options) {
    if (options?.bikeId) {
      return db.select().from(rides).where(eq(rides.bikeId, options.bikeId));
    }
    return db.select().from(rides);
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
};
