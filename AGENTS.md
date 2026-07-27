# VeloLog Repository Instructions

These instructions apply to the entire repository. They adapt the project guidance in
`CLAUDE.md` and `.claude/` for any coding agent working on VeloLog.

## Start with current context

Before planning or changing code, read:

1. `.claude/current-work.md` for the living project summary and current focus.
2. `.planning/STATE.md` when it exists, for the active plan and current phase.
3. `docs/PROJECT_PLAN.md` when broader product or roadmap context is needed.
4. `docs/DEVELOPMENT.md` before starting, rebuilding, or troubleshooting the Android app.

Treat `.claude/current-work.md` and `.planning/STATE.md` as shared, tool-independent project
state despite their directory names. Do not restart completed work. Stay within the current phase
unless the user asks to change scope.

When making a commit at the user's request, update `.claude/current-work.md` in the same commit
with what changed, the current focus, and the next step. On feature or milestone completion,
archive detailed state under `.planning/archive/<name>/SUMMARY.md` and retain only a one-line
ledger entry in `current-work.md`. Do not turn the living summary into a chronological log.

Do not commit, create branches, push, open issues, or create pull requests unless the user asks.

## Product boundaries

VeloLog is an Android-first, local-first bike computer and maintenance tracker:
"Strava tracks you. VeloLog tracks your bike."

Core flows must work without connectivity, including ride recording, bike/history viewing, and
maintenance status. A future backend is a sync target, never a required dependency.

Permanent non-goals:

- Social features such as followers, likes, clubs, and leaderboards
- Subscriptions
- Turn-by-turn navigation

## Stack

- Expo SDK 57+, React Native, and TypeScript
- Expo Router
- expo-sqlite with Drizzle ORM and generated migrations
- expo-location and expo-task-manager for background GPS
- MapLibre with OpenFreeMap tiles
- TanStack Query for server/database state
- expo-notifications for local maintenance reminders
- i18next with English and Swedish resources
- EAS Build and a development client; background location does not use Expo Go

Use the versions in `package.json` as authoritative when documentation and code disagree.

For live Android development, use the EAS `development` client and start Metro with
`npm start -- --dev-client --host lan`. Do not use Expo Go or the standalone `preview` build.
See `docs/DEVELOPMENT.md` for installation, emulator connection, JAVA_HOME, and troubleshooting.

## Architecture

Follow disciplined one-way dependencies without importing server-side Clean Architecture
patterns:

```text
src/
  domain/        Pure TypeScript types and business calculations
  data/          Drizzle schema, database setup, and repositories
  services/      Location tasks, ride recording, and notifications
  features/      Feature-owned hooks and screens
  components/    Shared UI primitives
  theme/         Theme palette and useTheme()
  i18n/          Translation setup and en/sv resources
  app/           Logic-free Expo Router route stubs
```

The dependency direction is `features -> services/data -> domain`; `domain` depends on nothing
outside itself.

- Put all ride math and maintenance rules in pure functions under `src/domain`, with colocated
  unit tests. Never import React, Expo, Drizzle, repositories, or database code there.
- Screens never access Drizzle, `db`, or repositories. They consume feature hooks.
- Repositories are the persistence boundary and expose interfaces so a future synced
  implementation can replace the local one.
- TanStack Query hooks calling repositories are the application layer. Do not add CQRS,
  mediators, use-case classes, or a dependency-injection framework.
- Feature folders own their screens and hooks. Add shared UI to `src/components` when a pattern
  is genuinely reused, normally by the third screen.

## Domain invariants

- Completing a ride increments its bike's odometer by `ride.distanceM`.
- Component wear, maintenance due status, and other counters are derived from raw odometer data;
  never persist duplicate counters that can drift.
- Completed ride GPS tracks are append-only. Notes and bike assignment may be edited.
- Rides are soft-deleted with `deletedAt`, never hard-deleted.
- Ride deletion or bike reassignment must recompute affected odometers and maintenance status.

Preserve these invariants transactionally where a persistence operation affects multiple rows.

## Building features

Use this construction order:

1. Domain types and pure logic
2. Schema, migration, and repository
3. TanStack Query hooks
4. Feature screen
5. Logic-free route stub

Before creating one of these file types, read its matching template:

| Work | Template |
|---|---|
| Domain module and tests | `.claude/patterns/domain-module-template.md` |
| Schema, migration, repository | `.claude/patterns/repository-template.md` |
| Query hooks | `.claude/patterns/hook-template.md` |
| Screen and route | `.claude/patterns/screen-template.md` |

Follow existing neighboring code as the final authority if it has evolved beyond a template.

### Data and query conventions

- Domain types in `src/domain/types.ts` are the source of truth.
- Generate IDs with `Crypto.randomUUID()` in repositories.
- Repositories own `createdAt` and `updatedAt`; updates must bump `updatedAt`.
- Mutations by ID throw a descriptive not-found error when no row exists.
- Generate schema migrations with `npx drizzle-kit generate`; do not hand-edit migration
  metadata unless repairing a verified generation problem.
- Query hooks use the centralized keys in `src/features/queryKeys.ts`.
- Invalidate exactly the affected list/detail keys after successful mutations.
- Guard optional parameter queries with `enabled: Boolean(param)`.
- Put post-mutation cross-cutting effects in hook callbacks, not screens.

### Screen conventions

- Check `src/components` before hand-building cards, buttons, fields, chips, statistics, loading
  states, or menus.
- Translate every user-facing string with `t()`. Add matching keys to both `src/i18n/en.json`
  and `src/i18n/sv.json` in the same change.
- Use `useTheme()` and a memoized `createStyles(colors)` factory. Do not use raw hex colors or
  inline style objects.
- Account for safe-area bottom insets on scrollable content.
- Provide loading and empty states.
- Format user-visible distance and speed with the domain unit helpers and the selected unit
  system; do not display raw meters.
- Put page actions in header icons. If there are more than about two, place extras in a real
  anchored overflow dropdown. Do not use destructive bottom action buttons.
- Route files under `src/app` only import and render their feature screen.
- At roughly 200 lines per file, excluding `createStyles`, consider extracting a subcomponent or
  hook rather than continuing to grow the file.

## Planning and continuity

For multi-phase work, update `.planning/STATE.md` as tasks and phases are completed. Record
material decisions and deviations, but keep the plan focused rather than logging every command.
If a task is blocked or a discovery materially changes product scope, report it before changing
the plan.

The command documents in `.claude/commands/` describe the project's established workflows for
planning, execution, status, verification, pausing/resuming, scoping, and PR preparation. They
are references, not literal slash commands required from the user.

When preparing a PR at the user's request:

- Review all commits since divergence from `main`.
- Use a conventional-commit-style title and reference the related issue when appropriate.
- Include summary, changes, and test plan.
- Do not add an AI co-author trailer unless the user explicitly requests one.

## Verification

Run checks proportional to the change. Before declaring implementation work complete, normally
run:

```powershell
npm run typecheck
npm run lint
npm test -- --watchAll=false
```

For focused domain work, run the relevant test file during iteration, then the full suite before
handoff. All changed or added domain logic requires unit tests, including edge cases and
invariants.

Also review the final diff for:

- Unintended changes
- Secrets, credentials, or machine-local files
- Missing English/Swedish translation parity
- React, Expo, database, or repository imports leaking into `src/domain`
- Screens bypassing hooks/repositories
- Missing migrations for schema changes

Do not claim emulator, device, background-location, notification, or visual verification unless
it was actually performed. Clearly separate automated checks from manual checks that still need
a development build or physical device.

## Git hygiene

- Use conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, etc.).
- Preserve unrelated user changes in a dirty worktree.
- Do not rewrite history or discard changes without explicit approval.
- Never commit `.claude/settings.local.json`, credentials, environment secrets, generated logs,
  or other machine-local state.
