# Pattern: Feature hook (TanStack Query)

**When:** a screen needs data or mutations. Hooks are the application layer — TanStack Query wrappers over repositories. No CQRS, no use-case classes, no DI framework.

**Location:** `src/features/<feature>/hooks/use<Entity>.ts` — one file per entity/concern, exporting several small hooks (query + mutations together).

## Rules

- Query keys declared as consts at the top of the file: a list key (`['things']`) and a per-id key factory (`(id) => ['things', id]`).
- Every mutation invalidates exactly the keys it affects in `onSuccess` — the list key, plus the per-id key when the mutation targets one row.
- Parameterized queries guard with `enabled: Boolean(param)` rather than throwing on undefined.
- Hooks call repositories only — never `db`/Drizzle, never other features' repositories (compose at the screen level instead).
- Cross-cutting side effects that must follow a mutation (e.g. maintenance notification check after ride save/delete) are wired here in `onSuccess`, not in screens.

## Skeleton

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NewThing, ThingUpdate } from '../../../domain/types';
import { thingRepository } from '../../../data/repositories/thingRepository';

const thingsKey = ['things'] as const;
const thingKey = (id: string) => ['things', id] as const;

export function useThings() {
  return useQuery({
    queryKey: thingsKey,
    queryFn: () => thingRepository.list(),
  });
}

export function useThing(id: string | undefined) {
  return useQuery({
    queryKey: thingKey(id ?? ''),
    queryFn: () => thingRepository.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateThing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewThing) => thingRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thingsKey });
    },
  });
}

export function useUpdateThing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: ThingUpdate }) =>
      thingRepository.update(id, changes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: thingsKey });
      queryClient.invalidateQueries({ queryKey: thingKey(updated.id) });
    },
  });
}
```

Existing exemplars: `useBikes.ts` (canonical), `useRides.ts` (mutation with cross-cutting notification side effect), `useComponents.ts` (multi-step mutation: replace component).
