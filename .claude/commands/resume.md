---
description: Resume work from saved state — quick briefing and next action
---

Resume work from where the last session left off.

## Process

### 1. Load State
Read these files silently:
- `.claude/current-work.md`
- `.planning/STATE.md` (if exists)
- `CLAUDE.md` (for repo context)

### 2. Check Git
```bash
git status --short
git log --oneline -5
git branch --show-current
```

### 3. Brief the User

```
## Resuming: [Feature/Task Name]

**Last session** ([date]): [What was done]
**Current state**: Phase [X] of [Y] — [status]
**Uncommitted changes**: [yes/no — list if yes]
**Branch**: [branch name]

### What's Next
[Next task or action from STATE.md / current-work.md]
```

### 4. Route
Suggest the appropriate next command:
- Active plan with incomplete phase → "/execute to continue"
- Phase complete, next phase exists → "/execute for Phase N"
- All phases done → "/verify to validate"
- No active plan → "What would you like to work on?"
