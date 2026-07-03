# 09 — Incident Postmortem

Turns a messy incident (chat scrollback, logs, timeline fragments) into a
structured, blameless postmortem with contributing factors and tracked action items.

- **Adapted from:** awesome-copilot's *incident-postmortem* skill
- **SMB use case:** small teams have incidents and no process; the writeup either
  doesn't happen or takes the lead dev half a day. Blameless matters double when
  the "team" is four people who share an office.
- **Token tier:** 0–1 — it's structured summarization of material you already
  have. Perfect local-Hermes work; Tier 1 if the evidence pile is huge.

## Install

- Copilot: `copilot/postmortem.prompt.md` → `.github/prompts/` (run `/postmortem`)
- Claude Code: `claude/skills/postmortem/SKILL.md` → `.claude/skills/postmortem/`

## Example session

> **You:** /postmortem — here's the Slack thread and the deploy log from Tuesday's outage.
>
> **Agent:** → `docs/postmortems/2026-06-30-checkout-outage.md`:
> Summary (2 sentences, customer impact: 43 min, ~30 lost orders) · timeline
> reconstructed from evidence with two gaps **flagged for confirmation** ·
> contributing factors: migration ran before code deploy *and* no staging run
> *and* alert went to a muted channel — three factors, zero names · what went
> well (rollback in 6 min) · 4 action items, each with owner, due date, and the
> factor it addresses. Notes that "be more careful" was rejected as an action
> item — not verifiable.

Cheap habit: write it within 48 hours while logs and memory are fresh — the
agent makes the writing cheap, so the only excuse left is delay.
