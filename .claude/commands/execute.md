---
description: Execute the current phase from .planning/STATE.md
---

You are executing a planned phase. Stay lean — focus on the current phase only.

## Process

### 1. Load State
Read `.planning/STATE.md` to understand:
- What feature is being built
- Which phase you're on
- What tasks are in this phase
- Any decisions or context from previous phases

If `.planning/STATE.md` doesn't exist:
```
No active plan found. Run /plan to create one first.
```

### 2. Load Context
Read `CLAUDE.md` for repo conventions and architecture rules.
If relevant patterns exist yet, check `.claude/patterns/` before inventing a new shape for a component/hook/service.

### 3. Execute Tasks
For each task in the current phase:
1. Announce what you're doing
2. Implement it following `CLAUDE.md` conventions — pure domain logic in `src/domain`, repository pattern for data access, no shortcuts around the dependency direction
3. Mark it done in STATE.md

**Rules:**
- Follow existing patterns (check `.claude/patterns/` if present)
- Run typecheck/tests after implementation
- If a task is blocked or unclear, stop and ask — don't guess
- If you discover something that affects the plan, flag it

### 4. Phase Complete
When all tasks in the current phase are done:

Update `.planning/STATE.md`:
- Mark current phase as complete
- Add summary of what was done
- Set position to next phase
- Log any decisions made

```
Phase [N] complete. [Summary of what was done]

Next: Run /verify to check the work, or /execute for the next phase.
```

### 5. Output
End with:
- What was accomplished
- What's next
