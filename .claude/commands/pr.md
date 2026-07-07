---
description: Create a PR with VeloLog conventions
---

Create a pull request following VeloLog conventions.

## Process

### 1. Gather Context
```bash
git status --short
git diff --stat
git log main..HEAD --oneline
git branch --show-current
```

### 2. Analyze Changes
Look at all commits since diverging from main (not just the latest).
Understand the full scope of changes.

### 3. Find Related Issue
```bash
gh issue list --state open --json number,title,milestone --limit 50
```
If a related issue exists, reference it (`Closes #N`) in the PR body.

### 4. Create PR
Use `gh pr create` with conventional-commit-style title:

```bash
gh pr create --title "<type>: <concise description>" --body "$(cat <<'EOF'
## Summary
- [Bullet point 1]
- [Bullet point 2]

## Changes
[Brief description of what changed and why]

## Test Plan
- [ ] Typecheck passes
- [ ] Unit tests pass (domain logic covered)
- [ ] Lint passes
- [ ] Manual verification of [key feature]

Closes #[issue number]

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

### 5. Output
Return the PR URL and suggest next steps (e.g. moving the linked issue).
