---
name: commit
description: Generate a Conventional Commits message from the staged diff, offering to split unrelated changes. Use when committing, e.g. "/commit".
---

# Conventional Commit

Generate a commit message for the currently staged changes.

## Method

1. Read the staged diff (`git diff --staged`). Nothing staged → say so and stop.
2. Classify: `feat` | `fix` | `docs` | `refactor` | `test` | `chore` | `perf` |
   `build` | `ci`. Derive scope from the dominant module/dir; omit if unclear.
3. Unrelated changes mixed together → propose a split into separate commits
   before writing anything.

## Format

```
<type>(<scope>): <imperative subject ≤ 50 chars>

<body: WHY the change was made, wrapped at 72 chars — the diff
already shows what. Omit body only for trivial changes.>

<footer: BREAKING CHANGE: / Refs: #issue, when applicable>
```

## Rules

- Subject: imperative mood ("add", not "added"/"adds"), no trailing period,
  lowercase after the colon.
- Body explains motivation and consequences, never restates the diff.
- Breaking API/schema/config changes → `!` after type and a `BREAKING CHANGE:` footer.
- Output the message in a fenced block, then ask before committing.
