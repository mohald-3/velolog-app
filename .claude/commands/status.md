---
description: Quick status — current work, git state, and active plan
---

Show a quick status overview.

## Process

### 1. Current Work
Read `.claude/current-work.md` silently.
Read `.planning/STATE.md` if it exists.

### 2. Git Status
```bash
git status --short
git log --oneline -3
git branch --show-current
```

### 3. Output

```
## Status

**Branch**: [current branch]

### Current Work
[Summary from current-work.md or "No active work tracked"]

### Active Plan
[From STATE.md: Phase X of Y — status, or "No active plan"]

### Git
[Uncommitted changes or "Clean"]
[Last 3 commits]
```
