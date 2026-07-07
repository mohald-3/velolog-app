---
description: Save current state for session continuity before ending
---

Save all context so the next session can resume seamlessly.

## Process

### 1. Update State
Update `.planning/STATE.md` (if exists) with:
- Current position (which phase, which task)
- What was accomplished this session
- Any in-progress work
- Decisions made
- Blockers or questions

### 2. Update Current Work
Update `.claude/current-work.md` with:
- Active task/feature name
- What was done this session
- What's next
- Key decisions
- Last updated date

### 3. Git Status
```bash
git status --short
git diff --stat
```

Report uncommitted changes. If there are changes worth saving:
- Suggest committing with a descriptive message
- Or note that changes are uncommitted for next session

### 4. Output
```
## Session Paused

Saved to: .claude/current-work.md
[+ .planning/STATE.md if active plan]

### Uncommitted Changes
[list or "none"]

### To Resume
Start next session — state will be read automatically.
Or run /resume for a quick briefing.
```
