# Pattern: Domain module

**When:** any new calculation, derivation, or business rule (stats, wear, due-status, filtering, conversions). If it can be expressed as `(inputs) => output` with no I/O, it belongs here — not in a hook or screen.

**Location:** `src/domain/<name>.ts` + `src/domain/<name>.test.ts` (test file is mandatory).

## Rules

- Zero imports from React, Expo, Drizzle, or anything outside `src/domain/`. Plain TypeScript only.
- Derived values are computed on demand, never stored (odometer, wear, due-status). Functions take the raw inputs and return the derived value.
- Types shared across layers live in `src/domain/types.ts`.
- Approximations and magic constants get a doc comment explaining the assumption (see `journey.ts` CO₂/calorie factors).

## Skeleton

```typescript
/**
 * <one-line statement of the invariant or rule this module owns, e.g.
 * "Component wear is always derived from odometer readings, never stored.">
 */
export function computeThing(inputA: number, inputB: number): number {
  return Math.max(0, inputA - inputB);
}
```

```typescript
// <name>.test.ts
import { computeThing } from './thing';

describe('computeThing', () => {
  it('derives the value from its inputs', () => {
    expect(computeThing(500, 400)).toBe(100);
  });

  it('clamps at zero rather than going negative', () => {
    expect(computeThing(400, 500)).toBe(0);
  });
});
```

Existing exemplars: `wear.ts` (minimal), `gps-filter.ts` (pipeline of small functions), `maintenance.ts` (status derivation + notification predicate).
