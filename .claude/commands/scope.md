---
description: Load reference files for a specific area — /scope <area>
---

Load the right context files based on what you want to work on.

## Input
Area: $ARGUMENTS

## Process

### 1. Match Area to Files

Once `.claude/reference/` exists (seeded post-M1), prefer those files — they reflect the real codebase. Until then, fall back to the plan sections below.

| Area keyword | Reference file (if present) | Plan fallback (`docs/PROJECT_PLAN.md`) |
|---|---|---|
| `domain`, `logic` | `.claude/reference/domain-map.md` | Section 4 (Domain model), Section 5 (Architecture rules) |
| `gps`, `filtering` | `.claude/reference/gps-filter.md` | Section 6, M2 checklist + "Known risks" in Spike 0 |
| `data`, `repositories` | `.claude/reference/data-flow.md` | Section 5 (repository pattern), Section 3 (Drizzle/expo-sqlite) |
| `maintenance` | `.claude/reference/maintenance-flow.md` | Section 4 (MaintenanceRule/Record), M4 checklist |
| `screens`, `ui` | `.claude/reference/screens-map.md` | Section 5 (`src/features`, `src/app`) |
| `roadmap`, `plan` | — | Full `docs/PROJECT_PLAN.md` |
| `all` | All reference files | Full `docs/PROJECT_PLAN.md` + `CLAUDE.md` |

### 2. Read Files
Read the matched files (reference first, plan section as fallback/supplement) and confirm what was loaded.

### 3. If No Match
If $ARGUMENTS doesn't match any area:
```
Available scopes: domain, gps, data, maintenance, screens, roadmap, all

Usage: /scope <area>
Example: /scope gps
```
