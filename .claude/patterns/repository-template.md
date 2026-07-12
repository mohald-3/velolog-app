# Pattern: Repository

**When:** a new entity needs persistence, or an existing entity needs a new query/mutation. UI and hooks never touch Drizzle directly — this is the only layer that imports `db`/`schema`, and the seam where Phase S cloud sync plugs in later.

**Location:** `src/data/repositories/<entity>Repository.ts`. Table in `src/data/schema.ts`, migration generated into `drizzle/`.

## Steps for a new entity

1. Add the table to `src/data/schema.ts`. Drizzle's inferred row type should match the domain type in `src/domain/types.ts` (the domain type is the source of truth — define it first).
2. Generate the migration: `npx drizzle-kit generate` (SQL lands in `drizzle/`, picked up automatically by the root layout's migration runner).
3. Create the repository: an exported **interface** plus an exported **object implementing it** (interface-first so a synced implementation can swap in later).

## Rules

- IDs: `Crypto.randomUUID()` from `expo-crypto`, generated in `create()`.
- `createdAt`/`updatedAt` set inside the repository (`new Date()`), never passed in by callers. Every `update()` bumps `updatedAt`.
- `update`/mutating-by-id methods throw `new Error(\`<Entity> not found: ${id}\`)` when the row doesn't exist.
- Soft deletion where the plan requires it (rides: `deletedAt`; bikes: `isArchived`) — `list()` excludes soft-deleted/archived rows by default, opt in via an options bag (`{ includeArchived?: boolean }`).
- Input types: `New<Entity>` for create, `<Entity>Update` for partial updates — both defined in `src/domain/types.ts`.

## Skeleton

```typescript
import { eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

import type { Thing, ThingUpdate, NewThing } from '../../domain/types';
import { db } from '../db';
import { things } from '../schema';

export interface ThingRepository {
  list(): Promise<Thing[]>;
  getById(id: string): Promise<Thing | null>;
  create(input: NewThing): Promise<Thing>;
  update(id: string, changes: ThingUpdate): Promise<Thing>;
}

export const thingRepository: ThingRepository = {
  async list() {
    return db.select().from(things);
  },

  async getById(id) {
    const rows = await db.select().from(things).where(eq(things.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async create(input) {
    const now = new Date();
    const [created] = await db
      .insert(things)
      .values({ id: Crypto.randomUUID(), ...input, createdAt: now, updatedAt: now })
      .returning();
    return created;
  },

  async update(id, changes) {
    const [updated] = await db
      .update(things)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(things.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Thing not found: ${id}`);
    }
    return updated;
  },
};
```

Existing exemplars: `bikeRepository.ts` (archive pattern), `rideRepository.ts` (soft delete), `appSettingsRepository.ts` (singleton row).
