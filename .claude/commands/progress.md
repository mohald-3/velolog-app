---
description: Show project state, progress, and route to next action
---

Show the current state of active work and suggest the next action.

## Process

### 1. Check for Active Plan
Read `.planning/STATE.md`. If it doesn't exist:
```
No active plan. Start with /plan to create one.
```

### 2. Show Status Dashboard

```
## Project: [Feature Name]

Phase [X] of [Y]: [Phase Name]
Status: [Planned / In Progress / Complete / Blocked]
Started: [date] | Last activity: [date]

### Progress
[░░░░░████████░░░░░░] X/Y phases complete

### Current Phase Tasks
- [x] Task 1 (done)
- [x] Task 2 (done)
- [ ] Task 3 (next)
- [ ] Task 4

### Decisions Made
- [Decision 1]
```

### 3. Route to Next Action
Based on the state, suggest:
- **All phases done** → "Run `/verify` to validate, then commit and PR"
- **Current phase done** → "Run `/execute` for Phase [N+1]"
- **Phase in progress** → "Run `/execute` to continue Phase [N]"
- **Blocked** → Show what's blocking and suggest resolution

### 4. Git Status
Also show:
```bash
git status --short
git log --oneline -3
```
