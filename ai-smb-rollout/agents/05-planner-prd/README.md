# 05 — Planner / PRD

Turns a fuzzy feature idea into a one-page PRD, then breaks it into an
epic → story → task plan with acceptance criteria sized for a small team.

- **Adapted from:** awesome-copilot's *Create PRD* chatmode and the
  *breakdown-plan* / *breakdown-feature-prd* / *breakdown-epic-pm* skills
- **SMB use case:** the owner says "customers should be able to reorder" — someone
  has to turn that sentence into buildable, estimable work. Usually there's no PM.
- **Token tier:** 1. The interrogation loop is cheap; only very large/novel
  product bets justify Tier 2.

## Install

- Copilot: `copilot/planner-prd.chatmode.md` → `.github/chatmodes/`
- Claude Code: `claude/skills/prd/SKILL.md` → `.claude/skills/prd/`

## Example session

> **You:** /prd customers should be able to reorder past purchases
>
> **Agent:** Three questions before writing: (1) reorder = same cart restored, or
> straight to checkout? (2) out-of-stock items — drop silently or flag? (3) guests
> with order-lookup links included, or accounts only?
> **You:** restored cart; flag; accounts only.
> **Agent:** → One-page PRD (problem, non-goals: *no subscriptions, no guest
> reorder*, success metric: 15% of repeat orders via the button in 60 days) +
> breakdown: 1 epic, 4 stories with Given/When/Then acceptance criteria, ordered
> by dependency, each ≤ 2 dev-days, riskiest (stock reconciliation) first.

Cheap habit: non-goals are the highest-value tokens in the doc — every one is a
week someone doesn't accidentally build.
