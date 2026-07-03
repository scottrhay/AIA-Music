# 07 — Codebase Onboarding

Maps an unfamiliar codebase into a short, durable orientation doc: architecture,
entry points, conventions, danger zones, and a "first change" walkthrough.

- **Adapted from:** awesome-copilot's *acquire-codebase-knowledge* and
  *context-map* skills, plus *Gem Researcher*
- **SMB use case:** SMBs inherit codebases — from departed contractors, agency
  handoffs, acquisitions. Day-one orientation usually lives in one person's head.
- **Token tier:** 1 for the sweep. The payoff is Tier-0 forever after: the *map*
  becomes the context you feed future sessions instead of re-exploring
  (see playbook rule "summarize, then discard").

## Install

- Copilot: `copilot/onboarding.chatmode.md` → `.github/chatmodes/`
- Claude Code: `claude/agents/onboarder.md` → `.claude/agents/`

## Example session

> **You:** Map this repo — an inherited Laravel app we now maintain.
>
> **Agent:** → writes `docs/CODEBASE_MAP.md`:
> stack & versions (Laravel 9, PHP 8.1, MySQL, one queue worker) · request flow
> diagram in text · the 6 directories that matter and the 30 that don't ·
> conventions observed (form requests for validation — except 3 legacy
> controllers, flagged) · **danger zones**: `app/Services/SyncService.php`
> (600 lines, no tests, cron-invoked, touches billing) · how to run it locally
> (verified, one missing step found and documented) · suggested first change:
> a low-risk bug in an isolated module, with the files you'd touch.

Cheap habit: commit the map and *update it as part of PRs that invalidate it* —
a stale map costs more tokens than no map.
