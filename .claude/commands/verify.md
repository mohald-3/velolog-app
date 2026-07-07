---
description: Verify completed work — types, lint, tests
---

Verify that the completed work is correct, tested, and ready for PR.

## Process

### 1. Load Context
Read `.planning/STATE.md` to understand what was built.
Read `CLAUDE.md` for repo conventions.

### 2. Run Checks
```bash
npx tsc --noEmit 2>&1 | tail -20
npm run lint 2>&1 | tail -20
npm test -- --watchAll=false 2>&1 | tail -20
```

Note: until the M1 scaffold issue lands (Expo + TypeScript + Drizzle project setup), these scripts don't exist yet — say so plainly rather than reporting a false PASS.

### 3. Review Changes
```bash
git diff --stat
git diff
```

Check for:
- Unintended file changes
- Hardcoded secrets or URLs
- Domain logic (`src/domain/**`) added or changed without a matching unit test
- Any React/Expo/DB import leaking into `src/domain`
- UI code reaching into Drizzle directly instead of going through a repository
- Files that shouldn't be committed (.env, credentials)

### 4. Report

```
## Verification Report

### Checks
- [ ] Typecheck: PASS/FAIL
- [ ] Lint: PASS/FAIL
- [ ] Tests: PASS/FAIL (X tests)
- [ ] No secrets exposed: PASS/FAIL

### Changes Summary
[X files changed, Y insertions, Z deletions]

### Architecture Check
[Domain purity / repository pattern respected? Any violations?]

### Verdict
[Ready for PR / Issues found — fix before proceeding]
```

### 5. Route
- **All pass** → "Ready! Run `/pr` to create a pull request"
- **Issues found** → List them with fix suggestions
