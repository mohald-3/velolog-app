---
description: Create a feature plan with phases, requirements, and roadmap
---

You are starting a planning session for a new feature or task.

## Input
Feature/task description: $ARGUMENTS

## Templates
Read these templates for the planning structure:
- `.claude/templates/planning/STATE.md` — State file format
- `.claude/templates/planning/PHASE.md` — Per-phase detail format
- `.claude/templates/planning/SUMMARY.md` — Completion summary format

## Process

### 1. Understand
Read `.claude/current-work.md` and `CLAUDE.md` silently for context.
If $ARGUMENTS is empty, ask the user what they want to build.

### 2. Investigate
Before planning, investigate the codebase to understand:
- What exists that's relevant to this feature
- What files/modules will be affected
- What patterns are already established (check `.claude/patterns/` if it exists yet — it's seeded post-M1)
- Which milestone (M0-M5, see `docs/PROJECT_PLAN.md`) this feature belongs to, and whether an issue already covers it

### 3. Requirements
Present a concise requirements summary:
```
## Requirements: [Feature Name]

**Goal**: [One sentence]
**Milestone**: [M0-M5 or "unplanned/v0.3 candidate"]
**Key changes**:
- [ ] Change 1
- [ ] Change 2
```

Ask the user to confirm or adjust.

### 4. Create Roadmap
Break the work into phases. Each phase should be completable in one session.
Keep phases small and focused — prefer 3 small phases over 1 large one.

```
## Roadmap

### Phase 1: [Name] — [small/medium/large]
- [ ] Task 1
- [ ] Task 2

### Phase 2: [Name] — [small/medium/large]
- [ ] Task 1
```

### 5. Save State
Create the planning directory and state file:

```bash
mkdir -p .planning
```

Write `.planning/STATE.md` using the template from `.claude/templates/planning/STATE.md`.
Fill in all placeholders with the actual feature details, requirements, and roadmap.

### 6. Link to Issue
Check if there's a related GitHub issue:
```bash
gh issue list --state open --json number,title,milestone --limit 50
```
If found, mention it and reference its number in STATE.md. If not, suggest creating one with `gh issue create`.

### 7. Output
End with:
- Summary of the plan
- Phase count and scope estimate
- Suggest: "Run `/execute` to start Phase 1, or `/progress` to review the plan"
