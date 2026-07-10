import { eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

import type { Bike, BikeUpdate, NewBike } from '../../domain/types';
import { db } from '../db';
import { bikes } from '../schema';

export interface BikeRepository {
  list(options?: { includeArchived?: boolean }): Promise<Bike[]>;
  getById(id: string): Promise<Bike | null>;
  create(input: NewBike): Promise<Bike>;
  update(id: string, changes: BikeUpdate): Promise<Bike>;
  archive(id: string): Promise<void>;
}

export const bikeRepository: BikeRepository = {
  async list(options) {
    const includeArchived = options?.includeArchived ?? false;
    if (includeArchived) {
      return db.select().from(bikes);
    }
    return db.select().from(bikes).where(eq(bikes.isArchived, false));
  },

  async getById(id) {
    const rows = await db.select().from(bikes).where(eq(bikes.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async create(input) {
    const now = new Date();
    const [created] = await db
      .insert(bikes)
      .values({
        id: Crypto.randomUUID(),
        name: input.name,
        brand: input.brand ?? null,
        model: input.model ?? null,
        year: input.year ?? null,
        color: input.color ?? null,
        frameSize: input.frameSize ?? null,
        purchaseDate: input.purchaseDate ?? null,
        purchasePrice: input.purchasePrice ?? null,
        currency: input.currency ?? null,
        photoUri: input.photoUri ?? null,
        notes: input.notes ?? null,
        startingOdometerM: input.startingOdometerM ?? 0,
        isDefault: input.isDefault ?? false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created;
  },

  async update(id, changes) {
    const [updated] = await db
      .update(bikes)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(bikes.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Bike not found: ${id}`);
    }
    return updated;
  },

  async archive(id) {
    const [updated] = await db
      .update(bikes)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(bikes.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Bike not found: ${id}`);
    }
  },
};
