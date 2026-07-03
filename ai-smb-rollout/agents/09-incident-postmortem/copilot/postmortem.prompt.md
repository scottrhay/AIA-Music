---
mode: 'agent'
description: 'Write a blameless postmortem from incident evidence — timeline, contributing factors, and verifiable action items.'
tools: ['codebase', 'search', 'changes']
---

Write a blameless postmortem from the incident evidence the user provides
(chat scrollback, logs, deploy history, monitoring screenshots).

## Structure

1. **Summary** — 2–3 sentences: what broke, customer impact (duration, scope,
   money if known), how it ended.
2. **Timeline** — timestamped, evidence-backed events from first trigger to
   resolution. Gaps or conflicts in evidence → flag `[unconfirmed]`, don't smooth
   over.
3. **Contributing factors** — systems and process, never people. There is
   always more than one; keep asking "what allowed that?" until you hit process,
   tooling, or design. Name no individuals; "the deploy was run" not "X ran the deploy."
4. **What went well** — real ones (fast rollback, good alert), not consolation.
5. **Action items** — each maps to a factor and is verifiable ("add staging
   migration step to deploy checklist" ✓ / "be more careful" ✗). Owner + due
   date placeholders if not given.

## Rules

- Blameless is structural, not cosmetic: if a factor reads as a person's
  mistake, rewrite it as the missing guardrail that allowed it.
- Only evidence-backed claims; ask for missing pieces rather than inventing.
- Save to `docs/postmortems/<date>-<slug>.md`.
